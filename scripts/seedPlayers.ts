import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Skill distribution: 35% skill 3, 25% skill 2, 15% skill 1, 10% skill 4, 15% skill 5
const SKILL_WEIGHTS = [
  { skill: 1, weight: 15 },
  { skill: 2, weight: 25 },
  { skill: 3, weight: 35 },
  { skill: 4, weight: 10 },
  { skill: 5, weight: 15 },
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

// Random lat/lon around Melbourne CBD (±0.2 degrees ~ ±22 km)
function melbourneCoordsJitter() {
  const CBD_LAT = -37.8136
  const CBD_LON = 144.9631
  return {
    lat: CBD_LAT + (Math.random() - 0.5) * 0.4,
    long: CBD_LON + (Math.random() - 0.5) * 0.4,
  }
}

const FIRST_NAMES = [
  'Alex',
  'Jamie',
  'Sam',
  'Taylor',
  'Jordan',
  'Morgan',
  'Casey',
  'Riley',
  'Drew',
  'Quinn',
]
const LAST_NAMES = [
  'Smith',
  'Nguyen',
  'Chen',
  'Patel',
  'Jones',
  'Williams',
  'Brown',
  'Davis',
  'Lee',
  'Wilson',
]
const GENDERS = ['Male', 'Female', 'Non-binary']

async function main() {
  const COUNT = 50
  let created = 0
  let skipped = 0

  for (let i = 0; i < COUNT; i++) {
    const fname = FIRST_NAMES[i % FIRST_NAMES.length]
    const lname = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
    const email = `demo-${fname.toLowerCase()}-${i}@huzz-test.local`
    const password = 'DemoPass123!'

    // Create Supabase Auth user
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

    if (authError || !authData.user) {
      console.warn(`Skipping player ${i} (${email}): ${authError?.message}`)
      skipped++
      continue
    }

    const { lat, long } = melbourneCoordsJitter()
    const dob = new Date(
      1980 + Math.floor(Math.random() * 25),
      Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 28) + 1
    )

    await prisma.player.create({
      data: {
        player_id: authData.user.id, // Links to Supabase Auth user
        player_fname: fname,
        player_lname: lname,
        player_dob: dob,
        player_gender: GENDERS[Math.floor(Math.random() * GENDERS.length)],
        player_skill: weightedSkill(),
        player_lat: lat,
        player_long: long,
      },
    })

    created++
  }

  console.log(
    `Seeded ${created} players with Supabase Auth accounts. Skipped ${skipped}.`
  )
  console.log('Login credentials: email = demo-<name>-<n>@huzz-test.local, password = DemoPass123!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
