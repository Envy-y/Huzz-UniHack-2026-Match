# B9 — Admin & Seeding

## Role
Implement the `admin` tRPC sub-router (reset + scrape), build the Axios + Cheerio court availability scraper, create `location.csv` with Melbourne badminton centers, and write the seed scripts that populate `Location` from CSV and generate fake `Player` rows linked to Supabase Auth accounts for end-to-end demo testing.

## Dependencies
- **B1** complete: `prisma` client, `Location` and `Player` models, `scripts/` stubs exist
- **B3** complete: `router`, procedure builders, `admin.ts` stub exists

## Blocks
None — this agent has no downstream dependents.

---

## Tasks

### 1. `admin.reset`
Replace stub in `src/server/routers/admin.ts`:

```ts
import { z } from 'zod'
import { router, publicProcedure } from '@/server/trpc'
import { prisma } from '@/lib/prisma'
import { scrapeAvailability } from '@/server/lib/scraper'

export const adminRouter = router({
  reset: publicProcedure.mutation(async () => {
    // Delete in dependency order (Match → LobbyPlayer → Lobby)
    await prisma.match.deleteMany()
    await prisma.lobbyPlayer.deleteMany()
    await prisma.lobby.deleteMany()
    return { success: true, message: 'All lobbies and matches cleared.' }
  }),

  scrape: publicProcedure
    .input(
      z.object({
        locationIds: z.array(z.string()),
        startDate: z.string(),
        numDays: z.number().int().min(1).max(14),
      })
    )
    .mutation(async ({ input }) => {
      const locations = await prisma.location.findMany({
        where: { location_id: { in: input.locationIds } },
      })

      const results = await Promise.allSettled(
        locations.map((loc) =>
          scrapeAvailability(loc, input.startDate, input.numDays)
        )
      )

      const summary = results.map((r, i) => ({
        locationId: locations[i].location_id,
        status: r.status,
        slots: r.status === 'fulfilled' ? r.value.length : 0,
        error: r.status === 'rejected' ? String(r.reason) : null,
      }))

      return { summary }
    }),
})
```

`admin.reset` and `admin.scrape` use `publicProcedure` intentionally — dev/demo-only endpoints.

### 2. Court Availability Scraper
Create `src/server/lib/scraper.ts`:

```ts
import axios from 'axios'
import * as cheerio from 'cheerio'
import type { Location } from '@prisma/client'

export type AvailabilitySlot = {
  locationId: string
  date: string
  courtNumber: number
  startTime: string
  endTime: string
  available: boolean
}

export async function scrapeAvailability(
  location: Location,
  startDate: string,
  _numDays: number
): Promise<AvailabilitySlot[]> {
  if (!location.location_scrape_link) return []

  let html: string
  try {
    const response = await axios.get(location.location_scrape_link, {
      timeout: 10_000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HuzzBot/1.0)' },
    })
    html = response.data
  } catch {
    console.warn(`Scrape failed for ${location.location_name}`)
    return []
  }

  const $ = cheerio.load(html)
  const slots: AvailabilitySlot[] = []

  // NOTE: Selector logic is site-specific — this is a generic placeholder.
  // Most Melbourne booking sites (CourtReserve, Bepoz, ClubSpark) use JS rendering,
  // so Axios+Cheerio will return empty. avl.csv is the authoritative fallback.
  $('[data-court]').each((_i, el) => {
    const courtNumber = Number($(el).attr('data-court'))
    const timeText = $(el).attr('data-time') ?? ''
    const [startTime, endTime] = timeText.split('-')
    const available = !$(el).hasClass('booked')

    slots.push({
      locationId: location.location_id,
      date: startDate,
      courtNumber,
      startTime: startTime?.trim() ?? '',
      endTime: endTime?.trim() ?? '',
      available,
    })
  })

  return slots
}
```

### 3. Melbourne Badminton Centers (`location.csv`)
Created at project root with 10 real Melbourne badminton venues:

```csv
id,name,lat,lon,address,scrape_url
loc-001,Melbourne Sports & Aquatic Centre,-37.8325,144.9525,"30 Aughtie Dr, Albert Park VIC 3206",
loc-002,MSAC Badminton Centre,-37.8330,144.9530,"30 Aughtie Dr, Albert Park VIC 3206",
loc-003,Box Hill Badminton Centre,-37.8190,145.1230,"1 Thurston St, Box Hill VIC 3128",
...
```

The `scrape_url` column is left empty — most venues use JS-rendered booking pages.

### 4. Seed Locations (`scripts/seedLocations.ts`)
Reads `location.csv` and upserts into the `Location` table:

```ts
import { PrismaClient } from '@prisma/client'
import { parse } from 'csv-parse/sync'
import fs from 'node:fs'
import path from 'node:path'

const prisma = new PrismaClient()

async function main() {
  const csvPath = path.resolve(process.cwd(), 'location.csv')
  const raw = fs.readFileSync(csvPath, 'utf8')
  const rows = parse(raw, { columns: true, skip_empty_lines: true })

  for (const row of rows) {
    await prisma.location.upsert({
      where: { location_id: row.id },
      update: { ... },
      create: { ... },
    })
  }
  console.log(`Seeded ${rows.length} locations.`)
}
```

### 5. Seed Fake Players with Supabase Auth (`scripts/seedPlayers.ts`)
Creates 50 fake players, each linked to a real Supabase Auth account for end-to-end demo testing:

```ts
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
```

For each player:
1. Creates a Supabase Auth user via `supabaseAdmin.auth.admin.createUser()`
2. Uses the returned `user.id` as `player_id` in the Player table
3. Distributes skill levels: 35% skill 3, 25% skill 2, 15% skill 1, 10% skill 4, 15% skill 5
4. Scatters lat/lon ±22km around Melbourne CBD

**Login credentials for demo:**
- Email pattern: `demo-<firstname>-<n>@huzz-test.local`
- Password: `DemoPass123!`

### 6. Run Seeds
```bash
# After B1 completes migration:
npx tsx scripts/seedLocations.ts
npx tsx scripts/seedPlayers.ts
```

---

## Files Produced / Modified

```
location.csv                        (new — 10 Melbourne venues)
src/server/
├── lib/
│   └── scraper.ts                  (new)
└── routers/
    └── admin.ts                    (replaces B3 stub)
scripts/
├── seedLocations.ts                (replaces stub)
└── seedPlayers.ts                  (replaces stub)
```

## Contracts Exposed

| Procedure | Input | Output |
|-----------|-------|--------|
| `admin.reset` | none | `{ success, message }` |
| `admin.scrape` | `{ locationIds, startDate, numDays }` | `{ summary: { locationId, status, slots, error }[] }` |

## Notes
- `admin.reset` and `admin.scrape` use `publicProcedure` — dev/demo only, not for production
- For the hackathon demo, run seed scripts before presenting
- The live scraper is a bonus feature — most sites use JS rendering and will return empty; `avl.csv` is the fallback
- Seeded players have real Supabase Auth accounts, so you can log in as any of them during the demo
- `csv-parse` is already installed in package.json
