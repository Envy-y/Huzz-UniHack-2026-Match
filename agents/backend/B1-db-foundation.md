# B1 — DB Foundation

## Role
Scaffold the entire project, install all dependencies, define the Prisma schema, create the Supabase connection, and export shared types. Every other agent waits for this to be complete.

## Dependencies
None — run first.

## Blocks
All other agents (B2–B9, F1–F6).

---

## Tasks

### 1. Project Scaffold

```bash
npx create-next-app@15 . --typescript --app --tailwind --no-eslint --src-dir
```

### 2. Install All Dependencies

```bash
# ORM + DB
npm install @prisma/client prisma
npm install @supabase/supabase-js @supabase/ssr

# tRPC + React Query
npm install @trpc/server @trpc/client @trpc/react-query @trpc/next
npm install @tanstack/react-query

# Validation + Forms
npm install zod react-hook-form @hookform/resolvers

# UI
npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-checkbox
npm install class-variance-authority clsx tailwind-merge lucide-react

# AI + Voice
npm install openai @vapi-ai/web

# Payment
npm install stripe @stripe/stripe-js @stripe/react-stripe-js

# Scraping
npm install axios cheerio
npm install -D @types/cheerio

# Dev tooling
npm install -D @biomejs/biome tsx
```

### 3. Biome Config
Create `biome.json`:

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": { "recommended": true }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  }
}
```

### 4. Environment Variables
Create `.env.example`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=       # pgBouncer pooled — used by Prisma at runtime
DIRECT_URL=         # direct connection — used by Prisma migrate

# OpenAI
OPENAI_API_KEY=

# Vapi.ai
NEXT_PUBLIC_VAPI_PUBLIC_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
```

Copy to `.env.local` and populate before running.

### 5. Prisma Schema
Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Player {
  player_id     String        @id @default(uuid())
  player_fname  String
  player_lname  String
  player_dob    DateTime      @db.Date
  player_gender String
  player_skill  Int
  player_desc   String?
  player_lat    Float?
  player_long   Float?

  lobby_players LobbyPlayer[]
}

model Location {
  location_id          String   @id @default(uuid())
  lat                  Float
  long                 Float
  location_name        String
  location_address     String
  location_scrape_link String?

  matches Match[]
}

model Lobby {
  lobby_id          String        @id @default(uuid())
  host_player_id    String
  host_level        Int
  lobby_desc        String?
  lobby_match_type  String        // 'S' | 'D'
  lobby_game_type   String        // 'Competitive' | 'Social' | 'Casual'
  lobby_days        String[]      // e.g. ['Mon', 'Wed', 'Sat']
  lobby_time        String        // 'M' | 'A' | 'N'
  lobby_max_players Int
  lobby_status      String        @default("Open")
  created_at        DateTime      @default(now())

  lobby_players LobbyPlayer[]
  match         Match?
}

model LobbyPlayer {
  lobby_id  String
  player_id String

  lobby  Lobby  @relation(fields: [lobby_id],  references: [lobby_id])
  player Player @relation(fields: [player_id], references: [player_id])

  @@id([lobby_id, player_id])
}

model Match {
  match_id     String    @id @default(uuid())
  lobby_id     String    @unique
  location_id  String
  court_number Int?
  start_time   DateTime?
  end_time     DateTime?
  match_status String    @default("Confirmed")
  created_at   DateTime  @default(now())

  lobby    Lobby    @relation(fields: [lobby_id],    references: [lobby_id])
  location Location @relation(fields: [location_id], references: [location_id])
}
```

Run:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 6. Prisma Client Singleton
Create `src/lib/prisma.ts`:

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['query'] : [] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 7. Shared Domain Types
Create `src/types.ts`:

```ts
// Primitive domain types — all agents import from here, never redefine locally

export type Day        = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
export type TimeSlot   = 'M' | 'A' | 'N'
export type GameType   = 'S' | 'D'
export type Objective  = 'Competitive' | 'Social' | 'Casual'
export type LobbyStatus = 'Open' | 'Full' | 'Matched' | 'Cancelled'
export type MatchStatus = 'Confirmed' | 'Played' | 'Cancelled'

export const DAYS: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const MAX_VENUE_KM = 20
export const SKILL_MIN = 1
export const SKILL_MAX = 5
```

### 8. `next.config.ts` Adjustments

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    // Required for tRPC server actions
  },
}

export default nextConfig
```

### 9. `tsconfig.json` Path Alias
Ensure `@/*` maps to `./src/*`:

```json
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### 10. Seed Script Stubs
Create empty stubs so Agent B9 can fill them:

`scripts/seedLocations.ts` — will read `location.csv` and upsert into `Location` table.
`scripts/seedPlayers.ts` — will generate fake players and insert into `Player` table.

---

## Files Produced

```
prisma/
└── schema.prisma
src/
├── lib/
│   └── prisma.ts
└── types.ts
scripts/
├── seedLocations.ts    (stub)
└── seedPlayers.ts      (stub)
.env.example
biome.json
package.json
tsconfig.json
next.config.ts
```

## Contracts Exposed

| Export | Used By |
|--------|---------|
| `src/lib/prisma.ts` → `prisma` | All backend agents for DB queries |
| `src/types.ts` → domain types | All agents |
| `prisma/schema.prisma` → Prisma models | All backend agents via `import type { Player, Lobby, Match, Location } from '@prisma/client'` |
