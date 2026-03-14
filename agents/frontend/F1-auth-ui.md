# F1 — Auth UI

## Role
Build the login and signup pages using Supabase Auth client SDK. After signup, create the player DB row via `players.create` and capture the user's location via the browser Geolocation API. Includes a shared `Navbar` component with sign-out.

## Style Reference
**All visual decisions must follow [`STYLEGUIDE.md`](../../STYLEGUIDE.md).** Key sections:
- §2 Colour palette — mint-500 CTAs, mint gradients, never pure black
- §8 Navigation — desktop sticky navbar + mobile icon-only bottom tab bar
- §11 Skill selector — 5×2 grid, 1–10, mint-500 selected state
- §14 Component patterns — Button, Input, Label, Card (shadcn)
- §15 Auth page layout — floating mint decorations, Card on gradient bg
- §16 Animations — fade-in entrance, animate-float decorations

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

Auth page layout: gradient bg, floating mint blobs, shadcn Card, mint gradient title.

```tsx
'use client'
import { createSupabaseClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const schema = z.object({
  email:    z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router   = useRouter()
  const supabase = createSupabaseClient()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [isLoading, setIsLoading]       = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    setError(null)
    const { error: authError } = await supabase.auth.signInWithPassword(data)
    if (authError) {
      setError(authError.message)
      setIsLoading(false)
      return
    }
    router.push('/')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mint-50 via-white to-mint-100/50 p-4">
      {/* Floating decoration — §16 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-mint-200/30 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-mint-300/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <Card className="w-full max-w-md relative z-10 animate-in fade-in-50 slide-in-from-bottom-10 duration-500">
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="mx-auto mb-2 text-5xl">🏸</div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-br from-mint-600 to-mint-800 bg-clip-text text-transparent">
            Welcome back
          </CardTitle>
          <CardDescription className="text-base">
            Sign in to find your next badminton match
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-in fade-in-50 slide-in-from-top-2">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register('email')} disabled={isLoading} />
              {errors.email && <p className="text-sm text-red-500 animate-in fade-in-50 slide-in-from-top-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs text-mint-600 hover:text-mint-700 hover:underline transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" {...register('password')} disabled={isLoading} className="pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" disabled={isLoading}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-500 animate-in fade-in-50 slide-in-from-top-1">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</> : 'Sign in'}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">New to Match?</span>
              </div>
            </div>

            <Link href="/signup">
              <Button variant="outline" className="w-full">Create an account</Button>
            </Link>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
```

### 2. Signup Page
`src/app/signup/page.tsx`

Fields: first name, last name, date of birth, gender, email, password, skill (1–10).

Flow:
1. `supabase.auth.signUp({ email, password })` — creates auth user
2. `trpc.players.create.mutate({ player_id: user.id, ...formData })` — creates `Player` row
3. `captureGeolocation()` → if coords returned, `trpc.players.update.mutate({ id, player_lat, player_long })`
4. `router.push('/')` on success

Skill selector: 5×2 grid of numbered buttons (§11). Selected = `bg-mint-500 border-mint-500 text-white scale-105`. Default: 2 (Novice).

```tsx
'use client'
import { createSupabaseClient } from '@/lib/supabase'
import { captureGeolocation }   from '@/lib/geolocation'
import { trpc }                 from '@/lib/trpc'
import { useRouter }            from 'next/navigation'
import { useForm }              from 'react-hook-form'
import { z }                    from 'zod'
import { zodResolver }          from '@hookform/resolvers/zod'
import { Button }               from '@/components/ui/button'
import { Input }                from '@/components/ui/input'
import { Label }                from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Eye, EyeOff, Loader2, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const schema = z.object({
  player_fname:  z.string().min(1, 'First name is required'),
  player_lname:  z.string().min(1, 'Last name is required'),
  player_dob:    z.string().min(1, 'Date of birth is required'),
  player_gender: z.enum(['Male', 'Female', 'Non-binary', 'Prefer not to say'], { error: 'Please select a gender' }),
  player_skill:  z.number().int().min(1).max(10),
  email:         z.string().email('Please enter a valid email address'),
  password:      z.string().min(8, 'Password must be at least 8 characters'),
})
type FormData = z.infer<typeof schema>

// §11 Skill level descriptions — 1=Beginner → 10=Top Player
const skillLevels = [
  { level: 1,  name: 'Beginner',           desc: 'No or little prior experience of playing badminton.' },
  { level: 2,  name: 'Novice',             desc: 'Learning to execute fundamental strokes and can participate in a competitive rally.' },
  { level: 3,  name: 'Good Social Player', desc: 'Ability to execute and receive all basic shots with basic control and rudimentary tactics.' },
  { level: 4,  name: 'Strong Social',      desc: 'Typically 1+ year of experience. Able to execute basic shots and sustain rallies.' },
  { level: 5,  name: 'Lower Intermediate', desc: 'Ability to execute and receive all badminton shots. Good control but can be inconsistent.' },
  { level: 6,  name: 'Intermediate',       desc: 'Sound players able to put up a good fight and return most shots.' },
  { level: 7,  name: 'Upper Intermediate', desc: 'Good players with competitive edge, able to rally and employ good tactics.' },
  { level: 8,  name: 'Advanced',           desc: 'Mastery of all shots, exceptional technical ability with advanced tactics.' },
  { level: 9,  name: 'Expert',             desc: 'Strong players able to play steep smashes, strong backhands, and deceptive shots.' },
  { level: 10, name: 'Top Player',         desc: 'Top players with no discernible weaknesses. Very few unforced errors.' },
]

export default function SignupPage() {
  const router       = useRouter()
  const supabase     = createSupabaseClient()
  const createPlayer = trpc.players.create.useMutation()
  const updatePlayer = trpc.players.update.useMutation()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [isLoading, setIsLoading]       = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { player_skill: 2 },
  })

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    setError(null)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email, password: data.password,
    })
    if (authError || !authData.user) {
      setError(authError?.message || 'Failed to create account')
      setIsLoading(false)
      return
    }
    const playerId = authData.user.id
    try {
      await createPlayer.mutateAsync({
        player_id: playerId, player_fname: data.player_fname, player_lname: data.player_lname,
        player_dob: data.player_dob, player_gender: data.player_gender, player_skill: data.player_skill,
      })
      captureGeolocation().then((coords) => {
        if (coords) updatePlayer.mutate({ id: playerId, player_lat: coords.lat, player_long: coords.lon })
      })
      router.push('/')
    } catch {
      setError('Failed to create player profile')
      setIsLoading(false)
    }
  }

  const skill  = watch('player_skill')
  const gender = watch('player_gender')

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mint-50 via-white to-mint-100/50 p-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-mint-200/30 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-mint-300/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <Card className="w-full max-w-2xl relative z-10 animate-in fade-in-50 slide-in-from-bottom-10 duration-500">
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="mx-auto mb-2 text-5xl">🏸</div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-br from-mint-600 to-mint-800 bg-clip-text text-transparent">
            Join Match
          </CardTitle>
          <CardDescription className="text-base">
            Create your profile and start finding badminton partners
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-in fade-in-50 slide-in-from-top-2">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fname">First name</Label>
                <Input id="fname" placeholder="John" {...register('player_fname')} disabled={isLoading} />
                {errors.player_fname && <p className="text-sm text-red-500 animate-in fade-in-50 slide-in-from-top-1">{errors.player_fname.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lname">Last name</Label>
                <Input id="lname" placeholder="Doe" {...register('player_lname')} disabled={isLoading} />
                {errors.player_lname && <p className="text-sm text-red-500 animate-in fade-in-50 slide-in-from-top-1">{errors.player_lname.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dob">Date of birth</Label>
                <Input id="dob" type="date" {...register('player_dob')} disabled={isLoading} />
                {errors.player_dob && <p className="text-sm text-red-500 animate-in fade-in-50 slide-in-from-top-1">{errors.player_dob.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={gender} onValueChange={(v) => setValue('player_gender', v as any)} disabled={isLoading}>
                  <SelectTrigger id="gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Non-binary">Non-binary</SelectItem>
                    <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
                {errors.player_gender && <p className="text-sm text-red-500 animate-in fade-in-50 slide-in-from-top-1">{errors.player_gender.message}</p>}
              </div>
            </div>

            {/* Skill selector — §11: 5×2 grid, mint-500 selected */}
            <div className="space-y-2">
              <Label>Skill level</Label>
              <div className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50/50 space-y-3">
                <div className="grid grid-cols-5 gap-2">
                  {skillLevels.map(({ level }) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setValue('player_skill', level)}
                      disabled={isLoading}
                      className={`h-12 rounded-xl border-2 font-bold text-lg transition-all duration-200 ${
                        skill === level
                          ? 'bg-mint-500 border-mint-500 text-white shadow-lg shadow-mint-500/30 scale-105'
                          : 'border-gray-300 text-gray-500 hover:border-mint-300 hover:text-mint-500'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                {(() => {
                  const selected = skillLevels.find((s) => s.level === skill)
                  return selected ? (
                    <div className="rounded-lg bg-mint-50 border border-mint-200 p-3 space-y-1">
                      <span className="font-semibold text-mint-800">{selected.name}</span>
                      <p className="text-xs text-mint-600 leading-relaxed">{selected.desc}</p>
                    </div>
                  ) : null
                })()}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register('email')} disabled={isLoading} />
              {errors.email && <p className="text-sm text-red-500 animate-in fade-in-50 slide-in-from-top-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Create a strong password" {...register('password')} disabled={isLoading} className="pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" disabled={isLoading}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-500 animate-in fade-in-50 slide-in-from-top-1">{errors.password.message}</p>}
            </div>

            {/* Location info — §14 info alert */}
            <div className="p-3 rounded-xl bg-mint-50 border border-mint-200 text-mint-700 text-sm flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>We'll request your location after signup to help find nearby courts and matches.</p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating your account...</> : 'Create account'}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Already have an account?</span>
              </div>
            </div>

            <Link href="/login">
              <Button variant="outline" className="w-full">Sign in instead</Button>
            </Link>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
```

### 3. Shared Navbar
`src/components/Navbar.tsx`

Desktop sticky navbar + mobile icon-only bottom tab bar per STYLEGUIDE §8.

- Desktop: logo (🏸 + "Huzz." serif gradient) + ghost nav buttons + sign out
- Mobile top: logo + sign out icon only
- Mobile bottom: 4-tab icon-only bar, 26×26px icons, strokeWidth 1.8, active = mint-500 + 4px dot below, inactive = gray-300, no labels, no containers

```tsx
'use client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Home, Search, PlusCircle, User, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/',        label: 'Home',          icon: Home       },
  { href: '/match',   label: 'Find Match',    icon: Search     },
  { href: '/create',  label: 'Create',        icon: PlusCircle },
  { href: '/profile', label: 'Profile',       icon: User       },
]

export function Navbar() {
  const router   = useRouter()
  const pathname = usePathname()
  const supabase = createSupabaseClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-lg supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 transition-all duration-200 hover:scale-105 group">
            <span className="text-2xl group-hover:animate-float">🏸</span>
            <span className="font-serif font-black text-xl bg-gradient-to-br from-mint-600 to-mint-800 bg-clip-text text-transparent">
              Huzz.
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button variant="ghost" className={cn('gap-2 transition-all duration-200', isActive ? 'bg-mint-50 text-mint-700 font-semibold' : 'text-gray-600 hover:text-mint-600')}>
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
            <div className="ml-2 pl-2 border-l border-gray-200">
              <Button variant="ghost" onClick={signOut} className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>

          {/* Mobile top — sign out only */}
          <div className="flex md:hidden">
            <Button variant="ghost" onClick={signOut} className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50" size="sm">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar — §8: icon-only, 26×26px, strokeWidth 1.8, active dot */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-lg supports-[backdrop-filter]:bg-white/80 shadow-lg">
        <div className="grid grid-cols-4 h-[72px] pb-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center gap-1">
                <Icon
                  className={cn('h-[26px] w-[26px] transition-colors duration-200', isActive ? 'text-mint-500' : 'text-gray-300')}
                  strokeWidth={1.8}
                />
                {isActive && <span className="w-1 h-1 rounded-full bg-mint-500" />}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
```

### 4. Layout Wrapper (hide nav on auth pages)
`src/components/LayoutWrapper.tsx` — already implemented, no changes needed. Hides `<Navbar>` on `/login` and `/signup`, adds `pb-20 md:pb-0` on non-auth pages for mobile bottom bar.

---

## Files Produced

```
src/
├── app/
│   ├── login/
│   │   └── page.tsx
│   └── signup/
│       └── page.tsx
└── components/
    ├── Navbar.tsx
    └── LayoutWrapper.tsx
```
