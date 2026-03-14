import { PrismaClient } from '@prisma/client'
import { parse } from 'csv-parse/sync'
import fs from 'node:fs'
import path from 'node:path'

const prisma = new PrismaClient()

async function main() {
  const csvPath = path.resolve(process.cwd(), 'location.csv')
  const raw = fs.readFileSync(csvPath, 'utf8')

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
      where: { location_id: row.id },
      update: {
        location_name: row.name,
        location_address: row.address,
        lat: parseFloat(row.lat),
        long: parseFloat(row.lon),
        location_scrape_link: row.scrape_url || null,
      },
      create: {
        location_id: row.id,
        location_name: row.name,
        location_address: row.address,
        lat: parseFloat(row.lat),
        long: parseFloat(row.lon),
        location_scrape_link: row.scrape_url || null,
      },
    })
  }

  console.log(`Seeded ${rows.length} locations.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
