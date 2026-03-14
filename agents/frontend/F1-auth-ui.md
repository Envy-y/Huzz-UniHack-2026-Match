# F1 — Auth UI

## Role
Build the login and signup pages using Supabase Auth client SDK. After signup, create the player DB row via `players.create` and capture the user's location via the browser Geolocation API. Includes a shared `Navbar` component with sign-out.

## Dependencies
- **B2** complete: `createSupabaseClient`, `usePlayer`, `captureGeolocation`, `players.create` procedure
- **B3** complete: `trpc` client available

## Full Feature Awareness
This agent implements the auth entry points for the entire app. All other pages assume the user is authenticated (middleware enforces this). The features downstream agents implement are:
- Home — recommended lobbies (F2)
- Advanced match with voice search (F3)
- Create lobby form (F4)
- Edit profile + match history (F5)
- Payment page (F6)

---

## Tasks

### 1. Login Page
`src/app/login/page.tsx`

```tsx
'use client'
import { createSupabaseClient } from '@/lib/supabase'
import { useRouter }            from 'next/navigation'
import { useForm }              from 'react-hook-form'
import { z }                    from 'zod'
import { zodResolver }          from '@hookform/resolvers/zod'

const schema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router  = useRouter()
  const supabase = createSupabaseClient()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    const { error } = await supabase.auth.signInWithPassword(data)
    if (!error) router.push('/')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-4 bg-white p-8 rounded-xl shadow">
        <h1 className="text-2xl font-bold">Sign in to Huzz</h1>
        <input {...register('email')}    type="email"    placeholder="Email"    className="input" />
        <input {...register('password')} type="password" placeholder="Password" className="input" />
        {errors.email    && <p className="text-red-500 text-sm">{errors.email.message}</p>}
        {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
        <button type="submit" className="btn-primary w-full">Sign in</button>
        <p className="text-center text-sm text-gray-500">
          No account? <a href="/signup" className="text-blue-600">Sign up</a>
        </p>
      </form>
    </main>
  )
}
```

### 2. Signup Page
`src/app/signup/page.tsx`

Fields: first name, last name, date of birth, gender, email, password, skill (1–5).

Flow:
1. `supabase.auth.signUp({ email, password })` — creates auth user
2. `trpc.players.create.mutate({ player_id: user.id, ...formData })` — creates `Player` row
3. `captureGeolocation()` → if coords returned, `trpc.players.update.mutate({ id, player_lat, player_long })`
4. `router.push('/')` on success

```tsx
'use client'
import { createSupabaseClient }  from '@/lib/supabase'
import { captureGeolocation }    from '@/lib/geolocation'
import { trpc }                  from '@/lib/trpc'
import { useRouter }             from 'next/navigation'
import { useForm }               from 'react-hook-form'
import { z }                     from 'zod'
import { zodResolver }           from '@hookform/resolvers/zod'

const schema = z.object({
  player_fname:  z.string().min(1),
  player_lname:  z.string().min(1),
  player_dob:    z.string(),
  player_gender: z.enum(['Male', 'Female', 'Non-binary', 'Prefer not to say']),
  player_skill:  z.number().int().min(1).max(5),
  email:         z.string().email(),
  password:      z.string().min(8),
})
type FormData = z.infer<typeof schema>

export default function SignupPage() {
  const router        = useRouter()
  const supabase      = createSupabaseClient()
  const createPlayer  = trpc.players.create.useMutation()
  const updatePlayer  = trpc.players.update.useMutation()

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { player_skill: 3 },
  })

  async function onSubmit(data: FormData) {
    const { data: authData, error } = await supabase.auth.signUp({
      email:    data.email,
      password: data.password,
    })
    if (error || !authData.user) return

    const playerId = authData.user.id

    await createPlayer.mutateAsync({
      player_id:     playerId,
      player_fname:  data.player_fname,
      player_lname:  data.player_lname,
      player_dob:    data.player_dob,
      player_gender: data.player_gender,
      player_skill:  data.player_skill,
    })

    // Non-blocking geolocation capture
    captureGeolocation().then((coords) => {
      if (coords) {
        updatePlayer.mutate({ id: playerId, player_lat: coords.lat, player_long: coords.lon })
      }
    })

    router.push('/')
  }

  const skill = watch('player_skill')

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md space-y-4 bg-white p-8 rounded-xl shadow">
        <h1 className="text-2xl font-bold">Create your Huzz account</h1>

        <div className="grid grid-cols-2 gap-4">
          <input {...register('player_fname')} placeholder="First name" className="input" />
          <input {...register('player_lname')} placeholder="Last name"  className="input" />
        </div>

        <input {...register('player_dob')} type="date" className="input" />

        <select {...register('player_gender')} className="input">
          <option value="">Gender</option>
          {['Male','Female','Non-binary','Prefer not to say'].map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        {/* Skill selector — 5 clickable dots */}
        <div>
          <label className="text-sm text-gray-600 mb-1 block">Skill level</label>
          <div className="flex gap-2">
            {[1,2,3,4,5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setValue('player_skill', s)}
                className={`w-8 h-8 rounded-full border-2 text-sm font-bold ${
                  s <= skill ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <input {...register('email')}    type="email"    placeholder="Email"    className="input" />
        <input {...register('password')} type="password" placeholder="Password (min 8 chars)" className="input" />

        <button type="submit" className="btn-primary w-full">Create account</button>
        <p className="text-center text-sm text-gray-500">
          Already have an account? <a href="/login" className="text-blue-600">Sign in</a>
        </p>
      </form>
    </main>
  )
}
```

### 3. Shared Navbar
`src/components/Navbar.tsx`

```tsx
'use client'
import Link                     from 'next/link'
import { useRouter }            from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'

export function Navbar() {
  const router   = useRouter()
  const supabase = createSupabaseClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-white border-b">
      <Link href="/" className="text-xl font-bold text-blue-600">Huzz 🏸</Link>
      <div className="flex gap-6 text-sm font-medium">
        <Link href="/">Home</Link>
        <Link href="/match">Find Match</Link>
        <Link href="/create">Create Lobby</Link>
        <Link href="/profile">Profile</Link>
        <button type="button" onClick={signOut} className="text-red-500">Sign out</button>
      </div>
    </nav>
  )
}
```

Add `<Navbar />` to `src/app/layout.tsx` (inside the `<body>` but outside `<TRPCProvider>` if server component, or inside if client).

### 4. Tailwind Utility Classes
Add reusable classes to `src/app/globals.css`:

```css
@layer components {
  .input {
    @apply w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500;
  }
  .btn-primary {
    @apply rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50;
  }
  .badge {
    @apply rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700;
  }
}
```

These classes are shared across F1–F6 — define them once here.

---

## Files Produced

```
src/
├── app/
│   ├── login/
│   │   └── page.tsx
│   └── signup/
│       └── page.tsx
├── components/
│   └── Navbar.tsx
└── app/
    └── globals.css         (utility classes appended)
```
