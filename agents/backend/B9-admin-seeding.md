# B9 — Admin & Seeding

## Role
Implement the `admin` tRPC sub-router (reset + scrape), build the Axios + Cheerio court availability scraper, and write the seed scripts that populate `Location` from `location.csv` and generate fake `Player` rows for dev/demo.

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
import { z }                  from 'zod'
import { router, publicProcedure } from '@/server/trpc'  // public for dev use
import { prisma }             from '@/lib/prisma'
import { scrapeAvailability } from '@/server/lib/scraper'

export const adminRouter = router({
  reset: publicProcedure
    .mutation(async () => {
      // Delete in dependency order (Match → LobbyPlayer → Lobby)
      await prisma.match.deleteMany()
      await prisma.lobbyPlayer.deleteMany()
      await prisma.lobby.deleteMany()
      return { success: true, message: 'All lobbies and matches cleared.' }
    }),

  scrape: publicProcedure
    .input(z.object({
      locationIds: z.array(z.string().uuid()),
      startDate:   z.string(),   // 'YYYY-MM-DD'
      numDays:     z.number().int().min(1).max(14),
    }))
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
        status:     r.status,
        slots:      r.status === 'fulfilled' ? r.value.length : 0,
        error:      r.status === 'rejected'  ? String(r.reason) : null,
      }))

      return { summary }
    }),
})
```

### 2. Court Availability Scraper
Create `src/server/lib/scraper.ts`:

```ts
import axios   from 'axios'
import cheerio from 'cheerio'
import type { Location } from '@prisma/client'

export type AvailabilitySlot = {
  locationId: string
  date:       string    // 'YYYY-MM-DD'
  courtNumber: number
  startTime:  string    // 'HH:MM'
  endTime:    string
  available:  boolean
}

export async function scrapeAvailability(
  location: Location,
  startDate: string,
  numDays: number
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
    // Site unreachable or JS-rendered — caller falls back to avl.csv
    console.warn(`Scrape failed for ${location.location_name}`)
    return []
  }

  const $ = cheerio.load(html)
  const slots: AvailabilitySlot[] = []

  // NOTE: Selector logic is site-specific and must be adapted per venue.
  // The structure below is a generic placeholder — update per actual site HTML.
  $('[data-court]').each((_i, el) => {
    const courtNumber = Number($(el).attr('data-court'))
    const timeText    = $(el).attr('data-time') ?? ''
    const [startTime, endTime] = timeText.split('-')
    const available   = !$(el).hasClass('booked')

    slots.push({
      locationId:  location.location_id,
      date:        startDate,
      courtNumber,
      startTime:   startTime?.trim() ?? '',
      endTime:     endTime?.trim()   ?? '',
      available,
    })
  })

  return slots
}
```

**Important:** Most Melbourne court booking sites (CourtReserve, Bepoz, ClubSpark) use JavaScript rendering. If `slots` returns empty, the scrape silently failed. The `avl.csv` file is the authoritative fallback.

### 3. Seed Locations (`scripts/seedLocations.ts`)
Reads `location.csv` and upserts into the `Location` table:

```ts
import { PrismaClient } from '@prisma/client'
import { parse }        from 'csv-parse/sync'
import fs               from 'node:fs'
import path             from 'node:path'

const prisma = new PrismaClient()

async function main() {
  const csvPath = path.resolve(process.cwd(), 'location.csv')
  const raw     = fs.readFileSync(csvPath, 'utf8')

  const rows = parse(raw, { columns: true, skip_empty_lines: true }) as {
    id: string
    name: string
    lat: string
    lon: string
    scrape_url: string
    address: string
  }[]

  for (const row of rows) {
    await prisma.location.upsert({
      where:  { location_id: row.id },
      update: {},
      create: {
        location_id:          row.id,
        location_name:        row.name,
        location_address:     row.address,
        lat:                  parseFloat(row.lat),
        long:                 parseFloat(row.lon),
        location_scrape_link: row.scrape_url || null,
      },
    })
  }

  console.log(`Seeded ${rows.length} locations.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
```

Install csv-parse: `npm install csv-parse`

### 4. Seed Fake Players (`scripts/seedPlayers.ts`)

```ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Skill distribution: 35% skill 3, 25% skill 2, 15% skill 1, 10% skill 4, 15% skill 5
const SKILL_WEIGHTS = [
  { skill: 1, weight: 15 }, { skill: 2, weight: 25 }, { skill: 3, weight: 35 },
  { skill: 4, weight: 10 }, { skill: 5, weight: 15 },
]

function weightedSkill(): number {
  const roll = Math.random() * 100
  let acc = 0
  for (const { skill, weight } of SKILL_WEIGHTS) {
    acc += weight
    if (roll < acc) return skill
  }
  return 3
}

// Random lat/lon around Melbourne CBD (±0.2 degrees ≈ ±22 km)
function melbourneCoordsJitter() {
  const CBD_LAT = -37.8136
  const CBD_LON = 144.9631
  return {
    lat:  CBD_LAT  + (Math.random() - 0.5) * 0.4,
    long: CBD_LON  + (Math.random() - 0.5) * 0.4,
  }
}

const FIRST_NAMES = ['Alex','Jamie','Sam','Taylor','Jordan','Morgan','Casey','Riley','Drew','Quinn']
const LAST_NAMES  = ['Smith','Nguyen','Chen','Patel','Jones','Williams','Brown','Davis','Lee','Wilson']
const GENDERS     = ['Male','Female','Non-binary']

async function main() {
  const COUNT = 50

  for (let i = 0; i < COUNT; i++) {
    const { lat, long } = melbourneCoordsJitter()
    const dob = new Date(
      1980 + Math.floor(Math.random() * 25),
      Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 28) + 1
    )

    await prisma.player.create({
      data: {
        player_fname:  FIRST_NAMES[i % FIRST_NAMES.length],
        player_lname:  LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)],
        player_dob:    dob,
        player_gender: GENDERS[Math.floor(Math.random() * GENDERS.length)],
        player_skill:  weightedSkill(),
        player_lat:    lat,
        player_long:   long,
      },
    })
  }

  console.log(`Seeded ${COUNT} fake players.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
```

### 5. Run Seeds
```bash
# After B1 completes migration:
npx tsx scripts/seedLocations.ts
npx tsx scripts/seedPlayers.ts
```

---

## Files Produced / Modified

```
src/server/
├── lib/
│   └── scraper.ts
└── routers/
    └── admin.ts            (replaces B3 stub)
scripts/
├── seedLocations.ts        (fills B1 stub)
└── seedPlayers.ts          (fills B1 stub)
```

## Notes
- `admin.reset` and `admin.scrape` use `publicProcedure` intentionally — they are dev/demo-only endpoints, not exposed in production
- For the hackathon demo, run seed scripts before presenting; the live scraper is a bonus feature
- `avl.csv` should be loaded manually if live scraping fails consistently
