# B7 — Voice Search API

## Role
Implement the `lobbies.search` tRPC procedure: receive a voice transcript from the client (produced by Vapi.ai), send it to OpenAI GPT-4o-mini with the Lobby schema as context, validate the returned SQL, execute it against Supabase, and pad results with recommendations if fewer than 4 are returned.

## Dependencies
- **B3** complete: `router`, procedure builders, `lobbies.ts` stub exists
- **B5** complete: `lobbies.ts` router and `recommendations` procedure exist

## Blocks
- **F3** (Advanced Match Page) — calls `lobbies.search` with the transcript

---

## Tasks

### 1. NL-to-SQL Utility
Create `src/server/lib/nlToSql.ts`:

```ts
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Lobby schema description fed to the model as context
const SCHEMA_CONTEXT = `
You are a SQL generator for a PostgreSQL database.
Table: "Lobby"
Columns:
  lobby_id          TEXT PRIMARY KEY
  host_level        INTEGER          -- skill level 1–5
  lobby_desc        TEXT
  lobby_match_type  TEXT             -- 'S' (Singles) or 'D' (Doubles)
  lobby_game_type   TEXT             -- 'Competitive', 'Social', or 'Casual'
  lobby_days        TEXT[]           -- array of days, e.g. {'Mon','Sat'}
  lobby_time        TEXT             -- 'M' (Morning), 'A' (Afternoon), 'N' (Night)
  lobby_max_players INTEGER
  lobby_status      TEXT             -- only query rows WHERE lobby_status = 'Open'
  created_at        TIMESTAMPTZ

Rules:
- Always include WHERE lobby_status = 'Open'
- Use 'S' for Singles, 'D' for Doubles
- Use 'M', 'A', 'N' for Morning, Afternoon, Night
- For day queries use: 'Mon' = ANY(lobby_days)
- Return ONLY a single SELECT statement. No explanation, no markdown, no semicolons.
- Limit results to 10 rows maximum.
`.trim()

// Returns a raw SQL SELECT string, or null if generation fails
export async function transcriptToSql(transcript: string): Promise<string | null> {
  try {
    const response = await openai.chat.completions.create({
      model:       'gpt-4o-mini',
      temperature: 0,
      messages: [
        { role: 'system', content: SCHEMA_CONTEXT },
        { role: 'user',   content: transcript },
      ],
    })

    const sql = response.choices[0]?.message?.content?.trim() ?? null
    return sql
  } catch {
    return null
  }
}
```

### 2. SQL Validator
Create `src/server/lib/validateSql.ts`:

```ts
// Reject any generated SQL that isn't a plain SELECT (no DDL or DML)
export function isSafeSelect(sql: string): boolean {
  const normalised = sql.trim().toUpperCase()

  if (!normalised.startsWith('SELECT')) return false

  // Block any statement-terminating keywords that indicate multi-statement injection
  const blocked = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 'CREATE', '--', ';']
  return !blocked.some((kw) => normalised.includes(kw))
}
```

### 3. `lobbies.search` Procedure
Add to `src/server/routers/lobbies.ts` (extends B5's router):

```ts
import { transcriptToSql } from '@/server/lib/nlToSql'
import { isSafeSelect }    from '@/server/lib/validateSql'
import { prisma }          from '@/lib/prisma'

// Inside lobbiesRouter:
search: protectedProcedure
  .input(z.object({
    playerId:   z.string().uuid(),
    transcript: z.string().min(1).max(500),
  }))
  .mutation(async ({ input }) => {
    let exactMatches: unknown[] = []

    const sql = await transcriptToSql(input.transcript)

    if (sql && isSafeSelect(sql)) {
      try {
        exactMatches = await prisma.$queryRawUnsafe(sql)
      } catch {
        // SQL failed — fall through to recommendations only
        exactMatches = []
      }
    }

    // Pad to 4 with recommendations if needed
    let results = exactMatches as { lobby_id: string }[]

    if (results.length < 4) {
      const exactIds = new Set(results.map((r) => r.lobby_id))

      // Re-use the recommendations logic via a direct DB call (avoid tRPC self-call)
      const recs = await getRecommendations(input.playerId)
      const padding = recs.filter((r) => !exactIds.has(r.lobby_id))

      results = [...results, ...padding].slice(0, 4) as typeof results
    }

    return results
  }),
```

`getRecommendations` is a plain async function that replicates the `lobbies.recommendations` DB logic (import and call directly — do not call tRPC procedures from within tRPC procedures).

### 4. `getRecommendations` Helper
Extract the recommendations DB query from `lobbies.recommendations` into a shared function in `src/server/lib/recommendations.ts` so both `lobbies.recommendations` and `lobbies.search` can call it without duplication:

```ts
// src/server/lib/recommendations.ts
import { prisma } from '@/lib/prisma'

export async function getRecommendations(playerId: string, limit = 4) {
  // ... (same logic as lobbies.recommendations, extracted to avoid duplication)
}
```

Update B5's `lobbies.recommendations` to call this helper instead of inlining the logic.

---

## Files Produced / Modified

```
src/server/
├── lib/
│   ├── nlToSql.ts             (new)
│   ├── validateSql.ts         (new)
│   └── recommendations.ts     (new — extracted from B5)
└── routers/
    └── lobbies.ts             (extends B5 — adds .search)
```

## Contracts Exposed

| Procedure | Input | Output |
|-----------|-------|--------|
| `lobbies.search` | `{ playerId, transcript }` | `Lobby[]` (exact SQL matches + recommendation padding, max 4) |

Frontend usage (F3):
```ts
const search = trpc.lobbies.search.useMutation()

// Called after Vapi.ai returns a transcript:
search.mutate({ playerId, transcript })
```

## Important Notes for Frontend (F3)

- **This procedure receives a transcript string, not raw audio.** The Vapi.ai SDK runs entirely on the client and produces the transcript. F3 is responsible for integrating Vapi and passing the transcript to this endpoint.
- If the AI cannot generate valid SQL (e.g. the query is too vague), `exactMatches` will be empty and only recommendations are returned. The frontend should handle this gracefully.
- Mutation (not query) because it triggers an OpenAI API call on each invocation — idempotency not guaranteed.
