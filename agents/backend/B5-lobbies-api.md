# B5 — Lobbies API

## Role
Implement the `lobbies` tRPC sub-router: list with filters, create, and recommendations. Also produce the shared `LobbyCard` UI component consumed by three frontend pages. This is the most-depended-on backend agent — B6 and B7 both extend it.

## Dependencies
- **B1** complete: `prisma`, `Lobby`, `LobbyPlayer`, `Player`, `Location` models, `src/types.ts`
- **B2** complete: `protectedProcedure`, `ctx.playerId`
- **B3** complete: `router`, procedure builders, `lobbies.ts` stub exists

## Blocks
- **B6** (Matchmaking Engine) — adds `lobbies.join` and builds on the filter logic
- **B7** (Voice Search API) — adds `lobbies.search` to this router
- **F2** (Home Page) — uses `lobbies.recommendations`
- **F4** (Create Lobby Page) — uses `lobbies.create`

---

## Tasks

### 1. Zod Schemas

```ts
import { z } from 'zod'
import type { Day, TimeSlot, GameType, Objective } from '@/types'

const dayEnum       = z.enum(['Mon','Tue','Wed','Thu','Fri','Sat','Sun'])
const timeEnum      = z.enum(['M','A','N'])
const matchTypeEnum = z.enum(['S','D'])
const gameTypeEnum  = z.enum(['Competitive','Social','Casual'])

export const createLobbyInput = z.object({
  lobby_desc:       z.string().max(300).optional(),
  lobby_match_type: matchTypeEnum,
  lobby_game_type:  gameTypeEnum,
  lobby_days:       z.array(dayEnum).min(1),
  lobby_time:       timeEnum,
})

const listFiltersInput = z.object({
  game:      matchTypeEnum.optional(),
  days:      z.array(dayEnum).optional(),
  time:      timeEnum.optional(),
  objective: gameTypeEnum.optional(),
  skillMin:  z.number().int().min(1).max(5).optional(),
  skillMax:  z.number().int().min(1).max(5).optional(),
}).optional()
```

### 2. `lobbies.list`
Returns all `Open` lobbies with optional filters. Days filter uses PostgreSQL array overlap.

```ts
list: publicProcedure
  .input(listFiltersInput)
  .query(async ({ input }) => {
    return prisma.lobby.findMany({
      where: {
        lobby_status:     'Open',
        ...(input?.game      && { lobby_match_type: input.game }),
        ...(input?.time      && { lobby_time: input.time }),
        ...(input?.objective && { lobby_game_type: input.objective }),
        ...(input?.days      && {
          // Postgres: lobby_days && ARRAY['Mon','Sat']
          lobby_days: { hasSome: input.days },
        }),
        ...(input?.skillMin !== undefined && {
          host_level: { gte: input.skillMin },
        }),
        ...(input?.skillMax !== undefined && {
          host_level: { lte: input.skillMax },
        }),
      },
      include: { lobby_players: { include: { player: true } } },
      orderBy: { created_at: 'desc' },
    })
  }),
```

### 3. `lobbies.create`
Create a new lobby with the calling player as host and first member.

```ts
create: protectedProcedure
  .input(createLobbyInput)
  .mutation(async ({ input, ctx }) => {
    const player = await prisma.player.findUniqueOrThrow({
      where: { player_id: ctx.playerId },
    })

    const maxPlayers = input.lobby_match_type === 'S' ? 2 : 4

    const lobby = await prisma.lobby.create({
      data: {
        host_player_id:   ctx.playerId,
        host_level:       player.player_skill,
        lobby_desc:       input.lobby_desc,
        lobby_match_type: input.lobby_match_type,
        lobby_game_type:  input.lobby_game_type,
        lobby_days:       input.lobby_days,
        lobby_time:       input.lobby_time,
        lobby_max_players: maxPlayers,
        lobby_status:     'Open',
        lobby_players: {
          create: { player_id: ctx.playerId },
        },
      },
      include: { lobby_players: { include: { player: true } } },
    })

    return lobby
  }),
```

### 4. `lobbies.recommendations`
Return up to 4 open lobbies ranked by:
1. Lobbies containing players the caller has played with before (co-player score)
2. Skill gap (closest `host_level` to caller's skill)

```ts
recommendations: protectedProcedure
  .input(z.object({ playerId: z.string().uuid() }))
  .query(async ({ input }) => {
    const player = await prisma.player.findUniqueOrThrow({
      where: { player_id: input.playerId },
    })

    // Step 1: find past co-player IDs
    const pastLobbyIds = (await prisma.lobbyPlayer.findMany({
      where: { player_id: input.playerId },
      select: { lobby_id: true },
    })).map((lp) => lp.lobby_id)

    const pastCoPlayerIds = new Set(
      (await prisma.lobbyPlayer.findMany({
        where: {
          lobby_id:  { in: pastLobbyIds },
          player_id: { not: input.playerId },
        },
        select: { player_id: true },
      })).map((lp) => lp.player_id)
    )

    // Step 2: fetch all Open lobbies (exclude ones the player is already in)
    const openLobbies = await prisma.lobby.findMany({
      where: {
        lobby_status: 'Open',
        lobby_players: { none: { player_id: input.playerId } },
      },
      include: { lobby_players: { include: { player: true } } },
    })

    // Step 3: score and sort
    const scored = openLobbies.map((lobby) => {
      const coPlayerScore = lobby.lobby_players.filter((lp) =>
        pastCoPlayerIds.has(lp.player_id)
      ).length

      const skillGap = Math.abs(lobby.host_level - player.player_skill)

      return { lobby, coPlayerScore, skillGap }
    })

    scored.sort((a, b) =>
      b.coPlayerScore - a.coPlayerScore || a.skillGap - b.skillGap
    )

    return scored.slice(0, 4).map((s) => s.lobby)
  }),
```

### 5. `LobbyCard` Shared Component
Create `src/components/LobbyCard.tsx`. This is a **client component** used by F2, F3, F4.

Props:
```ts
type LobbyCardProps = {
  lobby: LobbyWithPlayers      // Lobby + lobby_players + player
  onJoin?: (lobbyId: string) => void
  highlighted?: boolean        // green border when Full/Matched
}
```

Display:
- Lobby `host_level` as skill dots (●●●○○)
- Match type badge (Singles / Doubles)
- Objective badge (Competitive / Social / Casual)
- Days tags
- Time slot label (Morning / Afternoon / Night)
- Fill progress bar: `current / max_players`
- Venue name if `match` is present
- "Join" button → calls `onJoin(lobby.lobby_id)`
- Green border highlight if `lobby_status === 'Full'` or `'Matched'`

```tsx
'use client'
import type { Lobby, LobbyPlayer, Player } from '@prisma/client'

type LobbyWithPlayers = Lobby & {
  lobby_players: (LobbyPlayer & { player: Player })[]
}

export function LobbyCard({ lobby, onJoin, highlighted }: LobbyCardProps) {
  const filled  = lobby.lobby_players.length
  const maxPlayers = lobby.lobby_max_players
  const pct     = Math.round((filled / maxPlayers) * 100)

  return (
    <div className={`rounded-xl border-2 p-4 ${highlighted ? 'border-green-500' : 'border-gray-200'}`}>
      {/* Skill dots */}
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < lobby.host_level ? 'text-yellow-400' : 'text-gray-300'}>●</span>
        ))}
      </div>

      {/* Badges */}
      <div className="mt-2 flex gap-2 flex-wrap text-sm">
        <span className="badge">{lobby.lobby_match_type === 'S' ? 'Singles' : 'Doubles'}</span>
        <span className="badge">{lobby.lobby_game_type}</span>
        <span className="badge">{lobby.lobby_time === 'M' ? 'Morning' : lobby.lobby_time === 'A' ? 'Afternoon' : 'Night'}</span>
        {lobby.lobby_days.map((d) => <span key={d} className="badge">{d}</span>)}
      </div>

      {/* Fill bar */}
      <div className="mt-3">
        <div className="h-2 bg-gray-200 rounded">
          <div className="h-2 bg-blue-500 rounded" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-gray-500 mt-1">{filled}/{maxPlayers} players</p>
      </div>

      {/* Join button */}
      {onJoin && lobby.lobby_status === 'Open' && (
        <button
          type="button"
          onClick={() => onJoin(lobby.lobby_id)}
          className="mt-3 w-full rounded bg-blue-600 py-2 text-white text-sm hover:bg-blue-700"
        >
          Join
        </button>
      )}
    </div>
  )
}
```

---

## Files Produced

```
src/
├── server/routers/
│   └── lobbies.ts        ← replaces B3 stub with .list .create .recommendations
└── components/
    └── LobbyCard.tsx
```

## Contracts Exposed

| Procedure | Input | Output |
|-----------|-------|--------|
| `lobbies.list` | optional filters | `LobbyWithPlayers[]` |
| `lobbies.create` | `createLobbyInput` | `LobbyWithPlayers` |
| `lobbies.recommendations` | `{ playerId }` | `LobbyWithPlayers[]` (max 4) |

B6 adds `lobbies.join` to this router — do not conflict.
B7 adds `lobbies.search` to this router — do not conflict.

Frontend usage:
```ts
// F2 Home page
const { data } = trpc.lobbies.recommendations.useQuery({ playerId })

// F4 Create Lobby
const create = trpc.lobbies.create.useMutation()

// F3 search results padding
const { data } = trpc.lobbies.recommendations.useQuery({ playerId })
```
