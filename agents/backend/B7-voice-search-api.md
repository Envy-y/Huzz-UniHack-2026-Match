# B7 — Voice Search API (Vapi Tool Endpoint)

## Role
Expose a **Vapi-callable tool endpoint** that the Vapi voice assistant invokes when a user speaks a lobby search query. Vapi handles the entire voice pipeline (STT → LLM reasoning → tool call → TTS). This agent builds the backend that Vapi's tool call hits, plus the tRPC wrapper for the frontend to consume results.

## How Vapi Actually Works

Vapi is a **real-time voice agent platform**, not a transcription service. The pipeline is:

```
User speaks into mic
      ↓
Vapi STT (speech-to-text)
      ↓
Vapi LLM (reasons about the query)
      ↓
Vapi calls YOUR tool endpoint with structured params
      ↓
Your backend queries the database
      ↓
Results returned to Vapi
      ↓
Vapi TTS reads results aloud to user
```

**Key insight:** Vapi's built-in LLM extracts structured parameters (sport, day, time, type, etc.) from natural language. There is **no need for NL-to-SQL** — your backend receives clean, typed parameters and builds a standard Prisma query.

## Dependencies
- **B3** complete: `router`, procedure builders, `lobbies.ts` stub exists
- **B5** complete: `lobbies.ts` router and `recommendations` procedure exist

## Blocks
- **F3** (Advanced Match Page) — mic button triggers Vapi, results displayed as LobbyCards

---

## Architecture

```
Frontend (F3)
   │
   │  mic button → vapi.start(assistantId)
   ▼
Vapi Client SDK (@vapi-ai/web)
   │
   │  audio stream
   ▼
Vapi Servers
   ├── STT: speech → text
   ├── LLM: reasons + extracts params
   └── Tool call: searchLobbies({ sport, day, time, ... })
         │
         ▼
   POST /api/vapi-tools   ← Next.js API route (this agent builds this)
         │
         ▼
   Prisma query (structured, no raw SQL)
         │
         ▼
   Return lobbies → Vapi reads aloud
         │
         ▼
   Frontend also calls lobbies.search tRPC
   to display results as LobbyCards
```

---

## Tasks

### 1. Vapi Dashboard Setup

Create a Vapi assistant at `https://dashboard.vapi.ai` with:

**System prompt:**
```
You are a badminton matchmaking assistant for a sports app.

When a user asks to find games, lobbies, or matches, call the searchLobbies tool.

Extract these parameters from the user's speech:
- matchType: 'S' for Singles, 'D' for Doubles
- gameType: 'Competitive', 'Social', or 'Casual'
- days: array of abbreviated days — 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
- time: 'M' for Morning, 'A' for Afternoon, 'N' for Night
- skillMin: minimum skill level (1–5)
- skillMax: maximum skill level (1–5)

If the user doesn't specify a parameter, omit it from the tool call.

Examples:
- "casual doubles on Saturday night" → { matchType: "D", gameType: "Casual", days: ["Sat"], time: "N" }
- "competitive singles tomorrow morning" → { matchType: "S", gameType: "Competitive", days: [<tomorrow's day>], time: "M" }
- "any games this weekend" → { days: ["Sat", "Sun"] }

After receiving results, tell the user how many lobbies were found and briefly describe each one.
```

**Tool definition (in Vapi dashboard):**

```json
{
  "type": "function",
  "function": {
    "name": "searchLobbies",
    "description": "Search for open badminton lobbies matching the user's criteria",
    "parameters": {
      "type": "object",
      "properties": {
        "matchType": {
          "type": "string",
          "enum": ["S", "D"],
          "description": "S for Singles, D for Doubles"
        },
        "gameType": {
          "type": "string",
          "enum": ["Competitive", "Social", "Casual"],
          "description": "The play objective"
        },
        "days": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
          },
          "description": "Days the user wants to play"
        },
        "time": {
          "type": "string",
          "enum": ["M", "A", "N"],
          "description": "M=Morning, A=Afternoon, N=Night"
        },
        "skillMin": {
          "type": "integer",
          "minimum": 1,
          "maximum": 5,
          "description": "Minimum skill level"
        },
        "skillMax": {
          "type": "integer",
          "minimum": 1,
          "maximum": 5,
          "description": "Maximum skill level"
        }
      }
    }
  },
  "server": {
    "url": "<YOUR_DEPLOYED_URL>/api/vapi-tools"
  }
}
```

### 2. Vapi Tool Webhook Endpoint

Create `src/app/api/vapi-tools/route.ts`:

This is the endpoint Vapi calls when its LLM decides to invoke the `searchLobbies` tool.

```ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Vapi sends tool calls in this structure
  const toolCall = body.message?.toolCalls?.[0]
  if (!toolCall || toolCall.function.name !== 'searchLobbies') {
    return NextResponse.json({ error: 'Unknown tool' }, { status: 400 })
  }

  const args = JSON.parse(toolCall.function.arguments)

  // Build Prisma where clause from structured params
  const where: Prisma.LobbyWhereInput = {
    lobby_status: 'Open',
    ...(args.matchType && { lobby_match_type: args.matchType }),
    ...(args.gameType && { lobby_game_type: args.gameType }),
    ...(args.time && { lobby_time: args.time }),
    ...(args.days?.length && { lobby_days: { hasSome: args.days } }),
    ...(args.skillMin !== undefined && {
      host_level: { gte: args.skillMin },
    }),
    ...(args.skillMax !== undefined && {
      host_level: { lte: args.skillMax },
    }),
  }

  const lobbies = await prisma.lobby.findMany({
    where,
    include: { lobby_players: { include: { player: true } } },
    orderBy: { created_at: 'desc' },
    take: 10,
  })

  // Format results for Vapi to read aloud
  const results = lobbies.map((l) => ({
    lobby_id: l.lobby_id,
    matchType: l.lobby_match_type === 'S' ? 'Singles' : 'Doubles',
    gameType: l.lobby_game_type,
    days: l.lobby_days,
    time:
      l.lobby_time === 'M'
        ? 'Morning'
        : l.lobby_time === 'A'
          ? 'Afternoon'
          : 'Night',
    skillLevel: l.host_level,
    players: l.lobby_players.length,
    maxPlayers: l.lobby_max_players,
    description: l.lobby_desc,
  }))

  // Vapi expects tool result in this format
  return NextResponse.json({
    results: [
      {
        toolCallId: toolCall.id,
        result: JSON.stringify({
          count: results.length,
          lobbies: results,
        }),
      },
    ],
  })
}
```

### 3. `getRecommendations` Helper

Extract the recommendations DB query from `lobbies.recommendations` into a shared function so both `lobbies.recommendations` and `lobbies.search` can call it.

Create `src/server/lib/recommendations.ts`:

```ts
import { prisma } from '@/lib/prisma'

export async function getRecommendations(playerId: string, limit = 4) {
  const player = await prisma.player.findUniqueOrThrow({
    where: { player_id: playerId },
  })

  // Past co-player IDs
  const pastLobbyIds = (
    await prisma.lobbyPlayer.findMany({
      where: { player_id: playerId },
      select: { lobby_id: true },
    })
  ).map((lp) => lp.lobby_id)

  const pastCoPlayerIds = new Set(
    (
      await prisma.lobbyPlayer.findMany({
        where: {
          lobby_id: { in: pastLobbyIds },
          player_id: { not: playerId },
        },
        select: { player_id: true },
      })
    ).map((lp) => lp.player_id)
  )

  // Open lobbies the player is NOT in
  const openLobbies = await prisma.lobby.findMany({
    where: {
      lobby_status: 'Open',
      lobby_players: { none: { player_id: playerId } },
    },
    include: { lobby_players: { include: { player: true } } },
  })

  // Score and sort: co-players first, then skill proximity
  const scored = openLobbies.map((lobby) => {
    const coPlayerScore = lobby.lobby_players.filter((lp) =>
      pastCoPlayerIds.has(lp.player_id)
    ).length
    const skillGap = Math.abs(lobby.host_level - player.player_skill)
    return { lobby, coPlayerScore, skillGap }
  })

  scored.sort(
    (a, b) => b.coPlayerScore - a.coPlayerScore || a.skillGap - b.skillGap
  )

  return scored.slice(0, limit).map((s) => s.lobby)
}
```

Update B5's `lobbies.recommendations` to call this helper instead of inlining the logic.

### 4. `lobbies.search` tRPC Procedure

Add to `src/server/routers/lobbies.ts` (extends B5's router).

This procedure is called by the **frontend** to get displayable results after a Vapi voice session ends. The frontend listens for Vapi's tool call results and also queries this endpoint for full Prisma-typed lobby data with recommendation padding.

```ts
import { getRecommendations } from '@/server/lib/recommendations'

// Inside lobbiesRouter:
search: protectedProcedure
  .input(
    z.object({
      playerId: z.string().uuid(),
      filters: z
        .object({
          matchType: matchTypeEnum.optional(),
          gameType: gameTypeEnum.optional(),
          days: z.array(dayEnum).optional(),
          time: timeEnum.optional(),
          skillMin: z.number().int().min(1).max(5).optional(),
          skillMax: z.number().int().min(1).max(5).optional(),
        })
        .optional(),
    })
  )
  .query(async ({ input }) => {
    let exactMatches = await prisma.lobby.findMany({
      where: {
        lobby_status: 'Open',
        ...(input.filters?.matchType && {
          lobby_match_type: input.filters.matchType,
        }),
        ...(input.filters?.gameType && {
          lobby_game_type: input.filters.gameType,
        }),
        ...(input.filters?.time && { lobby_time: input.filters.time }),
        ...(input.filters?.days?.length && {
          lobby_days: { hasSome: input.filters.days },
        }),
        ...(input.filters?.skillMin !== undefined && {
          host_level: { gte: input.filters.skillMin },
        }),
        ...(input.filters?.skillMax !== undefined && {
          host_level: { lte: input.filters.skillMax },
        }),
      },
      include: { lobby_players: { include: { player: true } } },
      orderBy: { created_at: 'desc' },
      take: 10,
    })

    // Pad to 4 with recommendations if needed
    if (exactMatches.length < 4) {
      const exactIds = new Set(exactMatches.map((l) => l.lobby_id))
      const recs = await getRecommendations(input.playerId)
      const padding = recs.filter((r) => !exactIds.has(r.lobby_id))
      exactMatches = [...exactMatches, ...padding].slice(0, 4)
    }

    return { exactMatches }
  }),
```

---

## Flow: What Happens When User Presses Mic

```
1. User taps mic button on /match page
2. Frontend calls vapi.start(assistantId)
3. User speaks: "Find casual doubles on Saturday night"
4. Vapi STT converts speech to text
5. Vapi LLM extracts: { matchType: "D", gameType: "Casual", days: ["Sat"], time: "N" }
6. Vapi calls POST /api/vapi-tools with searchLobbies tool call
7. Your endpoint queries Prisma with structured filters
8. Results returned to Vapi → Vapi reads: "I found 3 lobbies..."
9. Frontend receives tool call results via vapi.on('message')
10. Frontend calls lobbies.search tRPC with same filters for full typed data
11. LobbyCards rendered with exact matches + recommendation padding
```

---

## Files Produced / Modified

```
src/
├── app/
│   └── api/
│       └── vapi-tools/
│           └── route.ts              (new — Vapi tool webhook endpoint)
├── server/
│   ├── lib/
│   │   └── recommendations.ts       (new — extracted from B5)
│   └── routers/
│       └── lobbies.ts               (extends B5 — adds .search)
```

**Removed from old B7 (no longer needed):**
- ~~`src/server/lib/nlToSql.ts`~~ — Vapi's LLM handles NL extraction
- ~~`src/server/lib/validateSql.ts`~~ — No raw SQL generation; uses Prisma with structured params

## Contracts Exposed

| Endpoint | Type | Input | Output |
|----------|------|-------|--------|
| `POST /api/vapi-tools` | Next.js route | Vapi tool call payload | Vapi tool result (lobby list) |
| `lobbies.search` | tRPC query | `{ playerId, filters? }` | `{ exactMatches: Lobby[] }` (padded to 4 with recommendations) |

### Vapi Tool Webhook Contract

**Receives from Vapi:**
```json
{
  "message": {
    "toolCalls": [{
      "id": "call_abc123",
      "function": {
        "name": "searchLobbies",
        "arguments": "{\"matchType\":\"D\",\"gameType\":\"Casual\",\"days\":[\"Sat\"],\"time\":\"N\"}"
      }
    }]
  }
}
```

**Returns to Vapi:**
```json
{
  "results": [{
    "toolCallId": "call_abc123",
    "result": "{\"count\":3,\"lobbies\":[...]}"
  }]
}
```

### Frontend Usage (F3)

```ts
// 1. Start Vapi voice session
import Vapi from '@vapi-ai/web'
const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!)

vapi.start('your-assistant-id')

// 2. Listen for tool call results to extract filters
vapi.on('message', (msg) => {
  if (msg.type === 'tool-calls') {
    const args = JSON.parse(msg.toolCalls[0].function.arguments)
    setFilters(args) // Store the extracted filters
  }
})

// 3. Query tRPC for full typed results with recommendation padding
const { data } = trpc.lobbies.search.useQuery({
  playerId,
  filters, // Same filters Vapi extracted
})
```

## Important Notes

- **No NL-to-SQL.** Vapi's LLM extracts structured parameters. The backend receives clean typed filters and builds a standard Prisma query. No `$queryRawUnsafe`, no SQL injection risk.
- **No OpenAI dependency for B7.** The old approach required `OPENAI_API_KEY` for GPT-4o-mini NL-to-SQL. Now Vapi's built-in LLM handles all natural language understanding.
- **Partial queries work naturally.** If the user says "games tomorrow" without specifying type or skill, Vapi simply omits those parameters. The Prisma query filters only on what was provided — no special handling needed.
- **`lobbies.search` is a query (not mutation)** because it only reads data with deterministic filters. The old mutation design was needed because each call triggered an OpenAI API call.
- **Vapi tool webhook is unauthenticated.** In production, validate the request using Vapi's webhook secret. For the hackathon, this is acceptable.
- **Dual response path:** Vapi reads results aloud (via the webhook response), AND the frontend queries tRPC for displayable LobbyCard data. Both use the same filters.
