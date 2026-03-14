# Hackathon Project — Badminton Matchmaking App

## What This App Does

A **badminton matchmaking system** that pairs solo players or friend groups into lobbies based on skill level, availability, location, and play objectives. Players join a queue, the system finds compatible matches, and a new lobby is created if no match exists. Matched lobbies are assigned an optimal nearby court venue.

The app targets **Melbourne, Australia** (badminton centers loaded from `location.csv`).

---

## Tech Stack

| Layer            | Technology                                                                         |
|------------------|------------------------------------------------------------------------------------|
| Framework        | Next.js 15 (App Router, full-stack monorepo)                                       |
| API Layer        | tRPC 11 with TanStack React Query (type-safe RPC, no REST)                         |
| Database         | Supabase (PostgreSQL) with Prisma ORM                                              |
| Auth             | Supabase Auth (email/password) — `playerId` stored in session cookie               |
| UI               | Tailwind CSS v4 + shadcn/ui (Radix Primitives)                                     |
| Validation       | Zod — schemas shared between client and server                                     |
| Forms            | React Hook Form + @hookform/resolvers                                              |
| Code Quality     | Biome (linting + formatting, replaces ESLint/Prettier)                             |
| AI / NL-to-SQL   | `openai` npm package — GPT-4o-mini generates SQL from voice-transcribed query      |
| Voice Input      | Vapi.ai SDK (`@vapi-ai/web`) — captures spoken lobby search query, returns transcript |
| Payment          | Stripe — mock checkout that splits court booking fee equally between players       |
| Scraping         | Axios + Cheerio (fallback to `avl.csv` if site renders via JS)                     |

---

## Project Structure

```
hackathon/
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── page.tsx                # Home — recommended lobbies
│   │   ├── match/
│   │   │   └── page.tsx            # Advanced Match — voice search
│   │   ├── create/
│   │   │   └── page.tsx            # Create Lobby form
│   │   ├── profile/
│   │   │   └── page.tsx            # Edit Profile + match history
│   │   ├── payment/
│   │   │   └── page.tsx            # Mock payment page (post-match)
│   │   └── api/
│   │       └── trpc/
│   │           └── [trpc]/
│   │               └── route.ts    # tRPC HTTP adapter (Next.js route handler)
│   ├── server/
│   │   ├── trpc.ts                 # tRPC init, context, middleware
│   │   ├── routers/
│   │   │   ├── _app.ts             # Root router (merges all sub-routers)
│   │   │   ├── queue.ts            # queue.join
│   │   │   ├── lobbies.ts          # lobbies.list, .create, .recommendations, .search
│   │   │   ├── players.ts          # players.get, .update, .matchHistory
│   │   │   └── admin.ts            # admin.reset, .scrape
│   │   └── lib/
│   │       ├── matchmaker.ts       # Core matchmaking logic
│   │       ├── haversine.ts        # Geographic distance calculation
│   │       ├── scraper.ts          # Court availability scraper
│   │       └── nlToSql.ts          # OpenAI schema-aware NL→SQL prompt
│   ├── components/
│   │   ├── LobbyCard.tsx           # Lobby display card
│   │   ├── CompromiseModal.tsx     # (Reserved — currently descoped)
│   │   └── VoiceSearchButton.tsx   # Vapi.ai mic button component
│   ├── lib/
│   │   ├── trpc.ts                 # tRPC client + React Query provider
│   │   └── supabase.ts             # Supabase browser client
│   └── types.ts                    # Shared TypeScript types
├── prisma/
│   └── schema.prisma               # Prisma data model
├── location.csv                    # Badminton centers (id, name, lat, lon, scrape URL)
├── avl.csv                         # Court availability fallback data
├── scripts/
│   ├── seedLocations.ts            # Seeds Location table from location.csv
│   └── seedPlayers.ts              # Seeds fake Player rows for dev/demo
├── .env.local                      # Local environment variables (not committed)
├── .env.example                    # Template — all required env vars listed
├── package.json
├── tsconfig.json
└── biome.json
```

---

## Environment Variables

Document all required vars in `.env.example`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=           # Supabase pooled connection (for Prisma)
DIRECT_URL=             # Supabase direct connection (for Prisma migrations)

# OpenAI
OPENAI_API_KEY=

# Vapi.ai
NEXT_PUBLIC_VAPI_PUBLIC_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
```

---

## Database Schema

### Tables

**Player**
| Column | Type | Notes |
|---|---|---|
| player_id | PK | Matches Supabase Auth `user.id` |
| player_fname | varchar | |
| player_lname | varchar | |
| player_dob | date | |
| player_gender | varchar | |
| player_skill | int (1–10) | 1=Beginner → 10=Top Player (see skill guide below) |
| player_desc | varchar | Optional bio/description set on profile page |

### Skill Level Guide
| Level | Grade | Name | Description |
|---|---|---|---|
| 1 | Beginner | No or little prior experience of playing badminton. |
| 2 | Novice | Learning fundamental strokes (serve, smash, drops) and can participate in a rally. |
| 3 | Good Social Player | Executes and receives all basic shots with basic control and rudimentary tactics. |
| 4 | Strong Social Player | 1+ year experience, basic shots and rallies, still working on control/power/footwork. |
| 5 | Lower Intermediate | Executes all shots with good control and some tactics, but can be inconsistent and inaccurate. |
| 6 | Intermediate | Sound players, good fight but smashes lack power, backhands weak, shots inconsistent. |
| 7 | Upper Intermediate | Good players with competitive edge, good tactics. Backhand and court position are potential weaknesses. |
| 8 | Advanced | Mastery of all shots, exceptional technical ability, advanced tactics, creates openings to finish points. |
| 9 | Expert | Strong players — steep smashes, strong backhands, deception, good footwork and court awareness. |
| 10 | Top Player | Top players in all aspects with no discernible weaknesses. High consistency, very few unforced errors. |
| player_lat | float | Captured via browser Geolocation API on first login |
| player_long | float | Captured via browser Geolocation API on first login |

**Location**
| Column | Type | Notes |
|---|---|---|
| location_id | PK | |
| lat | float | |
| long | float | |
| location_name | varchar | |
| location_address | varchar | |
| location_scrape_link | varchar | URL for court availability scraper |

**Lobby**
| Column | Type | Notes |
|---|---|---|
| lobby_id | PK | |
| host_level | int | Skill level of lobby creator |
| lobby_desc | varchar | |
| lobby_match_type | ENUM('S','D') | Singles or Doubles |
| lobby_game_type | ENUM('Competitive','Social','Casual') | |
| lobby_days | TEXT[] | PostgreSQL array — e.g. `{'Mon','Wed','Sat'}` |
| lobby_time | ENUM('M','A','N') | Morning / Afternoon / Night |
| lobby_max_players | int | Derived from match type (S=2, D=4) but stored explicitly |
| lobby_status | ENUM('Open','Full','Matched','Cancelled') | Tracks lifecycle state |
| created_at | timestamp | |

**Lobby_players** *(junction table)*
| Column | Type | Notes |
|---|---|---|
| lobby_id | PK, FK → Lobby | |
| player_id | PK, FK → Player | |

**Match** *(only created when lobby reaches max_players)*
| Column | Type | Notes |
|---|---|---|
| match_id | PK | |
| lobby_id | FK → Lobby, UNIQUE | Enforces 1:1 with Lobby |
| location_id | FK → Location | Assigned at match creation, not before |
| court_number | int | Specific court at the venue |
| start_time | datetime | Exact confirmed time |
| end_time | datetime | |
| match_status | ENUM('Confirmed','Played','Cancelled') | |
| created_at | timestamp | |

### Key Relationships
- `Lobby` → `Match`: one-to-one optional (a lobby may or may not have a match yet)
- `Lobby` ↔ `Player`: many-to-many via `Lobby_players`
- `Match` → `Location`: many-to-one (many matches can be at the same venue)

### Querying `lobby_days` (PostgreSQL array)
```sql
-- Lobbies available on Wednesday
WHERE 'Wed' = ANY(lobby_days)

-- Lobbies available on Wednesday OR Saturday
WHERE lobby_days && ARRAY['Wed','Sat']
```

In Prisma schema:
```prisma
lobby_days  String[]
```

### Lobby Lifecycle
```
Player joins → Lobby (status=Open)
Lobby fills  → Lobby (status=Full) → INSERT Match (venue assigned) → Payment page shown
Payment done → Match (status=Confirmed)
Match played → Match (status=Played), Lobby (status=Matched)
```

---

## Data Models (TypeScript)

### Player
```ts
{
  id: string
  skill: number          // 1–10 (1=Beginner, 10=Top Player)
  location: { lat: number, lon: number }
  tags: {
    game: 'Singles' | 'Doubles'
    days: ('Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun')[]
    time: 'Morning' | 'Afternoon' | 'Night'
    objective: 'Competitive' | 'Casual' | 'Social'
  }
}
```

### Lobby
```ts
{
  id: string
  players: Player[]
  gameType: 'Singles' | 'Doubles'
  maxPlayers: number     // 2 for Singles, 4 for Doubles
  venue?: Center         // Assigned when lobby is full
}
```

### Center (Court Venue)
```ts
{
  id: string
  name: string
  lat: number
  lon: number
}
```

---

## Backend API

All endpoints are implemented as **tRPC procedures** (not REST). The client calls them via TanStack React Query hooks auto-generated by tRPC. Zod schemas are defined once and shared for both input validation and TypeScript inference.

tRPC router root: `src/server/routers/_app.ts`

### `queue.join`
Join the matchmaking queue.

**Input:**
```ts
{
  playerId: string
  skill: number          // 1–10 (1=Beginner, 10=Top Player)
  game: 'Singles' | 'Doubles'
  days: ('Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun')[]
  time: 'Morning' | 'Afternoon' | 'Night'
  objective: 'Competitive' | 'Casual' | 'Social'
}
```

**Response (matched):** Lobby details including assigned venue
**Response (no match):** Newly created lobby for this player

> **Note:** Compromise (near-miss) flow is descoped. If no exact match is found, a new lobby is created immediately.

### `lobbies.list`
Returns all open lobbies. Accepts optional filter input (game, days, time, objective, skillMin, skillMax).

### `lobbies.create`
Create a new lobby.

**Input:**
```ts
{
  playerId: string
  lobby_desc: string
  lobby_match_type: 'S' | 'D'
  lobby_game_type: 'Competitive' | 'Social' | 'Casual'
  lobby_days: ('Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun')[]
  lobby_time: 'M' | 'A' | 'N'
}
```

### `lobbies.recommendations`
Returns up to 4 recommended open lobbies for a player, ranked by:
1. Past co-players (lobbies containing players from previous matches)
2. Skill proximity (closest average skill gap)

**Input:** `{ playerId: string }`

### `lobbies.search`
Voice-to-lobby search. Accepts a transcript from Vapi.ai and returns matching lobbies.

**Input:** `{ playerId: string, transcript: string }`

**Logic:**
1. Receive `transcript` (already converted from voice to text by Vapi.ai on the client)
2. Send transcript + Lobby schema to OpenAI GPT-4o-mini → receive a `SELECT` SQL query
3. Validate the generated SQL (whitelist: only `SELECT`, no DDL/DML)
4. Execute via Prisma `$queryRawUnsafe` against the lobbies table → exact matches
5. If fewer than 4 results, fetch recommendations to pad up to 4
6. Return merged list (exact matches first, then recommendations)

### `players.get`
Returns a player's profile. **Input:** `{ id: string }`

### `players.update`
Update editable player fields.

**Input (all optional):**
```ts
{ id: string, player_skill?: number, player_desc?: string, player_lat?: number, player_long?: number }
```

### `players.matchHistory`
Returns confirmed + played matches for a player. **Input:** `{ id: string }`

### `admin.reset`
Clears all lobbies and pending state (dev/demo use).

### `admin.scrape`
Triggers live court availability scrape. Falls back to `avl.csv` data if the target site uses JavaScript rendering (Axios + Cheerio cannot execute JS).

**Input:**
```ts
{ locationIds: string[], startDate: string, numDays: number }
```

---

## NL-to-SQL via OpenAI (`src/server/lib/nlToSql.ts`)

The Vapi.ai SDK handles voice capture and transcription **on the client**. The transcript string is then sent to the `lobbies.search` tRPC procedure, which calls OpenAI to generate SQL.

```ts
// System prompt includes the Lobby schema and allowed columns
// User message is the raw transcript
// Model: gpt-4o-mini
// Response must be a single SELECT statement only

const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: LOBBY_SCHEMA_PROMPT },
    { role: 'user', content: transcript }
  ]
})
// Validate: strip anything that isn't a SELECT before executing
```

---

## Voice Search with Vapi.ai (`src/components/VoiceSearchButton.tsx`)

Uses `@vapi-ai/web` browser SDK. The mic button on `/match` page:

1. On click → `vapi.start(assistantId)` — opens mic, user speaks query
2. Vapi transcribes speech in real time
3. On `vapi.on('call-end')` → transcript available via `vapi.on('message')`
4. Transcript passed to `lobbies.search` tRPC mutation
5. Results rendered as `LobbyCard` list

```ts
import Vapi from '@vapi-ai/web'

const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!)

vapi.on('message', (msg) => {
  if (msg.type === 'transcript' && msg.transcriptType === 'final') {
    setTranscript(msg.transcript)
  }
})
```

---

## Matchmaking Algorithm (`src/server/lib/matchmaker.ts`)

### Phase 1 — Exact Match
For each incoming player, scan existing `Open` lobbies checking:
1. **Game type** — must match (Singles or Doubles)
2. **Schedule** — must share at least one day AND same time slot
3. **Skill gap** — enforced by objective:
   - Competitive: ±1 skill level
   - Casual: ±2 skill levels
   - Social: no restriction
4. **Venue feasibility** — all players must be within 20km of at least one court (Haversine)

If a match is found, player is added to the lobby. When `Lobby_players` count reaches `lobby_max_players`:
- `lobby_status` → `Full`
- Best venue assigned (minimises total Haversine distance for all players)
- `Match` row inserted with `status=Confirmed`
- Payment page triggered

### Phase 2 — No Match Found
If no exact match exists, **create a new lobby** for this player with their preferences. No compromise flow.

### Venue Assignment
Haversine great-circle distance finds the court minimising total travel for all players. Courts where any player would travel >20km are excluded.

---

## Payment Flow (`src/app/payment/page.tsx`)

Triggered after a lobby fills and a `Match` row is created.

- Displays court name, date/time, and fee split (total fee ÷ player count)
- Uses Stripe mock checkout (Stripe test mode, no real charges)
- On successful mock payment → `Match.status` stays `Confirmed`
- Each player must complete payment independently; the page polls match status

> For the demo, use Stripe test card `4242 4242 4242 4242`.

---

## Auth & Player Identity

- Supabase Auth handles sign-up / login (email + password)
- On first login, prompt the browser Geolocation API to capture `player_lat` / `player_long`
- `player_id` in the `Player` table equals the Supabase Auth `user.id` (UUID)
- tRPC context extracts the session from the request cookie and attaches `playerId` to every procedure call

---

## Frontend Pages

**Home (`/`)** — `src/app/page.tsx`
- On load, fetches and displays up to 4 recommended lobbies for the logged-in player
- Recommendations ranked by: past co-players first, then skill proximity
- Each recommendation shown as a `LobbyCard` with a "Join" button

**Advanced Match (`/match`)** — `src/app/match/page.tsx`
- `VoiceSearchButton` — tap mic, speak query (e.g. "casual doubles on Saturday morning")
- Vapi transcribes → transcript sent to `lobbies.search`
- Results: exact SQL matches first, padded with recommendations to 4
- Each result shown as a `LobbyCard` with a "Join" button

**Create Lobby (`/create`)** — `src/app/create/page.tsx`
- Form: description, match type, objective, days (multi-select), time slot
- On submit, calls `lobbies.create` and redirects to home

**Edit Profile (`/profile`)** — `src/app/profile/page.tsx`
- Displays name, DOB, gender (read-only)
- Editable: skill level (1–10, with grade labels A+ to D), bio
- Save calls `players.update`
- Match history section (venue, date, result)

**Payment (`/payment`)** — `src/app/payment/page.tsx`
- Shown when a lobby fills and the player needs to confirm their share
- Stripe mock checkout in test mode

### Shared Components

**LobbyCard.tsx**
- Lobby ID, game type, player count, fill progress bar
- Player skill ratings (grade label A+ to D, 1–10)
- Tags: days, time, objective
- Venue name if assigned
- Green highlight for Full/Matched status
- "Join" button

**VoiceSearchButton.tsx**
- Mic button using Vapi.ai SDK
- Shows recording state (pulsing indicator)
- Emits `onTranscript(text: string)` callback when speech ends

---

## Running Locally

```bash
npm install
npm run dev       # starts on http://localhost:3000
```

To seed dev data:
```bash
npx tsx scripts/seedLocations.ts   # load location.csv into DB
npx tsx scripts/seedPlayers.ts     # generate fake players
```

> **Note:** The project lives on OneDrive. Ensure all files are fully synced ("Always keep on this device") before running, or you will get `UNKNOWN: unknown error, read` errors.

---

## Key Constraints & Design Decisions

- **No REST** — all client-server communication goes through tRPC procedures; Zod schemas are the single source of truth for input shapes and TypeScript types
- **Next.js 15 full-stack** — single monorepo; tRPC runs in Next.js Route Handlers; no separate Express server or Vite frontend
- **`lobby_days` as PostgreSQL TEXT[]** — native Postgres array; query with `'Wed' = ANY(lobby_days)`; Prisma type is `String[]`; no MySQL SET or FIND_IN_SET
- **Voice-first NL search** — Vapi.ai SDK captures and transcribes speech on the client; OpenAI GPT-4o-mini converts transcript to SQL on the server
- **AI-generated SQL safety** — validate that generated SQL is a `SELECT` only (no DDL/DML) before passing to `$queryRawUnsafe`
- **Database** — Supabase (PostgreSQL) with Prisma ORM; `player_id` equals Supabase Auth `user.id`
- **Player lat/long** — captured via browser `navigator.geolocation` on first login; required for Haversine venue assignment
- **Match only created on full lobby** — `Match` row inserted atomically when `Lobby_players` count hits `lobby_max_players`
- **`lobby_id UNIQUE` on Match** — enforced at DB level (Prisma `@unique`) to guarantee 1:1 Lobby → Match
- **No compromise flow** — descoped for hackathon; if no exact match, create a new lobby immediately
- **Stripe test mode** — payment page uses Stripe mock checkout; no real charges; test card `4242 4242 4242 4242`
- **Scraper fallback** — Axios + Cheerio hits real booking sites; if the site uses JS rendering, fall back to `avl.csv` static data
- **Melbourne-centric** — court locations seeded from `location.csv`; fake players distributed around Melbourne CBD
- **Skill distribution for fake players** — concentrated around levels 5–8 (B to C range) to simulate a realistic social badminton player base
