# B6 — Matchmaking Engine

## Role
Implement the core matchmaking logic: Haversine distance calculation, exact-match lobby scanning, skill-gap enforcement per objective, venue assignment, and the `queue.join` tRPC procedure. When a lobby fills, atomically insert a `Match` row with the optimal venue.

## Dependencies
- **B1** complete: `prisma`, all models, `MAX_VENUE_KM` from `src/types.ts`
- **B2** complete: `ctx.playerId`, `protectedProcedure`
- **B3** complete: `router`, procedure builders, `queue.ts` stub exists
- **B5** complete: `lobbies.ts` router exists (B6 adds `lobbies.join` to it)

## Blocks
- **B8** (Payment Backend) — `Match` rows are created here; B8 reads them to initiate payment

---

## Tasks

### 1. Haversine Distance Utility
Create `src/server/lib/haversine.ts`:

```ts
const R = 6371 // Earth radius in km

export function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}
```

### 2. Matchmaking Logic
Create `src/server/lib/matchmaker.ts`:

```ts
import { prisma }        from '@/lib/prisma'
import { haversineKm }  from './haversine'
import { MAX_VENUE_KM } from '@/types'
import type { Lobby, Player, Location } from '@prisma/client'

// Skill gap allowed per objective
const SKILL_GAP: Record<string, number> = {
  Competitive: 1,
  Casual:      2,
  Social:      Infinity,
}

type PlayerInput = {
  playerId:  string
  skill:     number
  game:      'S' | 'D'
  days:      string[]
  time:      string
  objective: string
  lat:       number
  lon:       number
}

// Returns the best matching open lobby, or null if none found
export async function findMatch(input: PlayerInput): Promise<Lobby | null> {
  const allowedGap = SKILL_GAP[input.objective] ?? Infinity

  const openLobbies = await prisma.lobby.findMany({
    where: {
      lobby_status:     'Open',
      lobby_match_type: input.game,
      lobby_time:       input.time,
      lobby_game_type:  input.objective,
      lobby_days:       { hasSome: input.days },
      // Exclude lobbies the player is already in
      lobby_players:    { none: { player_id: input.playerId } },
    },
    include: {
      lobby_players: { include: { player: true } },
    },
  })

  for (const lobby of openLobbies) {
    // Skill gap check against all existing players in lobby
    const skillsInLobby = lobby.lobby_players.map((lp) => lp.player.player_skill)
    const withinSkill = skillsInLobby.every(
      (s) => Math.abs(s - input.skill) <= allowedGap
    )
    if (!withinSkill) continue

    // Venue feasibility — shared courts within MAX_VENUE_KM for all players
    const playerCoords: { lat: number; lon: number }[] = [
      { lat: input.lat, lon: input.lon },
      ...lobby.lobby_players
        .filter((lp) => lp.player.player_lat && lp.player.player_long)
        .map((lp) => ({ lat: lp.player.player_lat!, lon: lp.player.player_long! })),
    ]

    const venues = await prisma.location.findMany()
    const feasible = venues.some((v) =>
      playerCoords.every((p) => haversineKm(p.lat, p.lon, v.lat, v.long) <= MAX_VENUE_KM)
    )
    if (!feasible) continue

    return lobby
  }

  return null
}

// Pick the venue that minimises total travel distance for all players
export async function assignVenue(
  playerCoords: { lat: number; lon: number }[]
): Promise<Location> {
  const venues = await prisma.location.findMany()

  const feasible = venues.filter((v) =>
    playerCoords.every((p) => haversineKm(p.lat, p.lon, v.lat, v.long) <= MAX_VENUE_KM)
  )

  if (feasible.length === 0) throw new Error('No venue within range for all players')

  return feasible.reduce((best, v) => {
    const totalBest = playerCoords.reduce((sum, p) => sum + haversineKm(p.lat, p.lon, best.lat, best.long), 0)
    const totalV    = playerCoords.reduce((sum, p) => sum + haversineKm(p.lat, p.lon, v.lat,    v.long),    0)
    return totalV < totalBest ? v : best
  })
}
```

### 3. `queue.join` Procedure
Replace the stub in `src/server/routers/queue.ts`:

```ts
import { z }                    from 'zod'
import { router, protectedProcedure } from '@/server/trpc'
import { prisma }               from '@/lib/prisma'
import { findMatch, assignVenue } from '@/server/lib/matchmaker'

export const queueRouter = router({
  join: protectedProcedure
    .input(z.object({
      skill:     z.number().int().min(1).max(5),
      game:      z.enum(['S','D']),
      days:      z.array(z.enum(['Mon','Tue','Wed','Thu','Fri','Sat','Sun'])).min(1),
      time:      z.enum(['M','A','N']),
      objective: z.enum(['Competitive','Social','Casual']),
    }))
    .mutation(async ({ input, ctx }) => {
      const player = await prisma.player.findUniqueOrThrow({
        where: { player_id: ctx.playerId },
      })

      if (!player.player_lat || !player.player_long) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Player location not set. Update your profile to enable matchmaking.',
        })
      }

      const playerInput = {
        playerId:  ctx.playerId,
        skill:     input.skill,
        game:      input.game,
        days:      input.days,
        time:      input.time,
        objective: input.objective,
        lat:       player.player_lat,
        lon:       player.player_long,
      }

      // Phase 1: find exact match
      const matchedLobby = await findMatch(playerInput)

      if (matchedLobby) {
        // Add player to matched lobby
        await prisma.lobbyPlayer.create({
          data: { lobby_id: matchedLobby.lobby_id, player_id: ctx.playerId },
        })

        // Check if lobby is now full
        const playerCount = await prisma.lobbyPlayer.count({
          where: { lobby_id: matchedLobby.lobby_id },
        })

        if (playerCount >= matchedLobby.lobby_max_players) {
          // Mark lobby full and create Match
          await prisma.lobby.update({
            where: { lobby_id: matchedLobby.lobby_id },
            data: { lobby_status: 'Full' },
          })

          const allPlayers = await prisma.lobbyPlayer.findMany({
            where: { lobby_id: matchedLobby.lobby_id },
            include: { player: true },
          })

          const coords = allPlayers
            .filter((lp) => lp.player.player_lat && lp.player.player_long)
            .map((lp) => ({ lat: lp.player.player_lat!, lon: lp.player.player_long! }))

          const venue = await assignVenue(coords)

          const match = await prisma.match.create({
            data: {
              lobby_id:    matchedLobby.lobby_id,
              location_id: venue.location_id,
              match_status: 'Confirmed',
            },
            include: { location: true, lobby: true },
          })

          return { status: 'matched', lobby: matchedLobby, match }
        }

        return { status: 'joined', lobby: matchedLobby, match: null }
      }

      // Phase 2: no match — create a new lobby
      const maxPlayers = input.game === 'S' ? 2 : 4

      const newLobby = await prisma.lobby.create({
        data: {
          host_player_id:    ctx.playerId,
          host_level:        input.skill,
          lobby_match_type:  input.game,
          lobby_game_type:   input.objective,
          lobby_days:        input.days,
          lobby_time:        input.time,
          lobby_max_players: maxPlayers,
          lobby_status:      'Open',
          lobby_players: { create: { player_id: ctx.playerId } },
        },
        include: { lobby_players: { include: { player: true } } },
      })

      return { status: 'created', lobby: newLobby, match: null }
    }),
})
```

### 4. `lobbies.join`
Add a direct join procedure to `src/server/routers/lobbies.ts` (B6 extends B5's router). This is called when a player clicks "Join" on a `LobbyCard` without going through matchmaking preferences.

```ts
// Add to lobbiesRouter in src/server/routers/lobbies.ts
join: protectedProcedure
  .input(z.object({ lobbyId: z.string().uuid() }))
  .mutation(async ({ input, ctx }) => {
    const lobby = await prisma.lobby.findUniqueOrThrow({
      where:   { lobby_id: input.lobbyId },
      include: { lobby_players: { include: { player: true } } },
    })

    if (lobby.lobby_status !== 'Open') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Lobby is not open.' })
    }

    await prisma.lobbyPlayer.create({
      data: { lobby_id: input.lobbyId, player_id: ctx.playerId },
    })

    const newCount = lobby.lobby_players.length + 1
    if (newCount >= lobby.lobby_max_players) {
      await prisma.lobby.update({
        where: { lobby_id: input.lobbyId },
        data:  { lobby_status: 'Full' },
      })

      const allPlayers = await prisma.lobbyPlayer.findMany({
        where:   { lobby_id: input.lobbyId },
        include: { player: true },
      })
      const coords = allPlayers
        .filter((lp) => lp.player.player_lat && lp.player.player_long)
        .map((lp) => ({ lat: lp.player.player_lat!, lon: lp.player.player_long! }))

      const venue = await assignVenue(coords)

      const match = await prisma.match.create({
        data: {
          lobby_id:    input.lobbyId,
          location_id: venue.location_id,
          match_status: 'Confirmed',
        },
        include: { location: true },
      })

      return { status: 'full', match }
    }

    return { status: 'joined', match: null }
  }),
```

---

## Files Produced / Modified

```
src/server/
├── lib/
│   ├── haversine.ts         (new)
│   └── matchmaker.ts        (new)
└── routers/
    ├── queue.ts             (replaces B3 stub)
    └── lobbies.ts           (extends B5 — adds .join)
```

## Contracts Exposed

| Procedure | Input | Output |
|-----------|-------|--------|
| `queue.join` | skill, game, days, time, objective | `{ status: 'matched'/'joined'/'created', lobby, match }` |
| `lobbies.join` | `{ lobbyId }` | `{ status: 'full'/'joined', match }` |

Frontend usage (all LobbyCard "Join" buttons):
```ts
const join = trpc.lobbies.join.useMutation({
  onSuccess: (data) => {
    if (data.status === 'full') router.push('/payment')
  }
})
```

Queue flow from the Advanced Match or Home page:
```ts
const queueJoin = trpc.queue.join.useMutation({
  onSuccess: (data) => {
    if (data.match) router.push('/payment')
  }
})
```
