# B4 — Players API

## Role
Implement the full `players` tRPC sub-router: fetch profile, update editable fields, retrieve match history, and create a new player on signup. Extends the stub created by B2.

## Dependencies
- **B1** complete: `prisma` client, `Player` + `Match` + `Location` Prisma models
- **B2** complete: `protectedProcedure`, `ctx.playerId`, `players.ts` stub exists
- **B3** complete: `router`, procedure builders, root router compiles

## Blocks
- **F5** (Profile Page) — reads player data and match history via these procedures

---

## Tasks

### 1. Zod Input Schemas
Define at the top of `src/server/routers/players.ts`:

```ts
const updateInput = z.object({
  id:           z.string().uuid(),
  player_skill: z.number().int().min(1).max(10).optional(),
  player_desc:  z.string().max(500).optional(),
  player_lat:   z.number().optional(),
  player_long:  z.number().optional(),
})
```

### 2. `players.get`
Fetch a player's full profile.

```ts
get: protectedProcedure
  .input(z.object({ id: z.string().uuid() }))
  .query(async ({ input }) => {
    const player = await prisma.player.findUniqueOrThrow({
      where: { player_id: input.id },
    })
    return player
  }),
```

### 3. `players.update`
Update editable fields (skill, bio, lat/long). Only the fields provided are updated.

```ts
update: protectedProcedure
  .input(updateInput)
  .mutation(async ({ input }) => {
    const { id, ...data } = input
    return prisma.player.update({
      where: { player_id: id },
      data,
    })
  }),
```

### 4. `players.matchHistory`
Return all `Confirmed` and `Played` matches for a player, including venue details, ordered most recent first.

```ts
matchHistory: protectedProcedure
  .input(z.object({ id: z.string().uuid() }))
  .query(async ({ input }) => {
    // Find all lobby IDs the player is in
    const lobbyPlayers = await prisma.lobbyPlayer.findMany({
      where: { player_id: input.id },
      select: { lobby_id: true },
    })
    const lobbyIds = lobbyPlayers.map((lp) => lp.lobby_id)

    // Return matches for those lobbies with venue info
    return prisma.match.findMany({
      where: {
        lobby_id: { in: lobbyIds },
        match_status: { in: ['Confirmed', 'Played'] },
      },
      include: { location: true, lobby: true },
      orderBy: { created_at: 'desc' },
    })
  }),
```

### 5. `players.create` (extend B2 stub)
B2 created this procedure. Verify it is correct — no changes needed unless the signup form fields differ from the stub's input schema.

### 6. Complete Router Export
The final `src/server/routers/players.ts` must export:

```ts
export const playersRouter = router({
  create:       publicProcedure   /* ... */,
  get:          protectedProcedure /* ... */,
  update:       protectedProcedure /* ... */,
  matchHistory: protectedProcedure /* ... */,
})
```

---

## Files Modified

```
src/server/routers/players.ts    ← extend B2 stub with .get .update .matchHistory
```

## Contracts Exposed

| Procedure | Input | Output |
|-----------|-------|--------|
| `players.create` | `{ player_id, player_fname, player_lname, player_dob, player_gender, player_skill }` | `Player` |
| `players.get` | `{ id: string }` | `Player` |
| `players.update` | `{ id, player_skill?, player_desc?, player_lat?, player_long? }` | `Player` |
| `players.matchHistory` | `{ id: string }` | `(Match & { location: Location, lobby: Lobby })[]` |

Frontend usage (F5):
```ts
const { data: player }  = trpc.players.get.useQuery({ id: playerId })
const { data: history } = trpc.players.matchHistory.useQuery({ id: playerId })
const update            = trpc.players.update.useMutation()
```
