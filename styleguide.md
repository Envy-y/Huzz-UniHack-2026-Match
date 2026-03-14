# Huzz — Style Guide

> Unified design system and implementation reference for the Huzz badminton matchmaking app.
> Covers visual spec (hex values, spacing, component structure) and developer implementation (Tailwind classes, code snippets, component patterns).

---

## Conflict Resolutions (QA Review 2026-03-14)

Conflicts between the original style guide and app spec were identified and resolved. These decisions are final and supersede any older documents.

| # | Topic | Resolution |
|---|---|---|
| 1 | Skill gap rules | **Competitive=±1, Casual=±2, Social=no restriction** |
| 2 | Home feed sort | **Recommendations-first (past co-players → skill proximity)** |
| 3 | Join flow | **Direct join — no host approval, no request state** |
| 4 | Terminology | **"Lobby" throughout — not "room"** |
| 5 | Lobby identity on cards | **Colour-coded tags (Competitive/Social/Casual + Singles/Doubles). `lobby_desc` is host's free-text note shown separately, not a title** |
| 6 | Location/suburb display | **Venue suburb only, from `Location.location_address`. No player suburb. No reverse geocoding.** |

---

## 1. Brand & Purpose

**App name:** Huzz
**Tagline:** Find your game, find your people
**Icon:** 🏸
**Theme:** Clean, modern, sporty
**Platform:** Web (Next.js 15) — mobile-first responsive
**Target audience:** Badminton players in Melbourne seeking social/competitive matches

---

## 2. Colour Palette

### Primary — Mint/Teal

The signature colour. Energetic, fresh, and sports-oriented.

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| `primary` | `#30d5c8` | `mint-400` | Brand accent, badges, icons, active borders |
| `primary-dark` | `#14b8a6` | `mint-500` | **Primary CTAs, buttons, links, active states** |
| `primary-hover` | `#0d9488` | `mint-600` | Hover states, gradient ends |
| `primary-deep` | `#0d3d3a` | `mint-900` | Dark text, host level dot bg, headings |
| `primary-light` | `#e6faf8` | `mint-50` | Active nav bg, tinted backgrounds |
| `primary-faint` | `#f0fafa` | `mint-50/60` | Page background, card inner rows |

```css
/* Tailwind custom tokens (configured in globals.css) */
--mint-50:  #f0fdfa
--mint-100: #ccfbf1
--mint-200: #99f6e4
--mint-300: #5de2e7
--mint-400: #2dd4bf   /* brand accent */
--mint-500: #14b8a6   /* primary CTA */
--mint-600: #0d9488   /* hover */
--mint-700: #0f766e
--mint-800: #115e59
--mint-900: #134e4a
```

**Tailwind usage:**
- Buttons: `bg-mint-500 hover:bg-mint-600`
- Links: `text-mint-600`
- Active states: `bg-mint-50 text-mint-700`
- Focus rings: `ring-mint-500`
- Gradients: `from-mint-600 to-mint-800`

### Semantic

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| `danger` | `#bf1a00` | `red-700` | Competitive badge, full lobby, errors |
| `danger-light` | `#ffeaea` | `red-50` | Competitive badge bg, full lobby bg |
| `success` | `#0a8a80` | `mint-700` | Open slots text |
| `success-light` | `#e6faf8` | `mint-50` | Open slots bg |
| `warning` | `#9a6000` | `amber-700` | Casual badge, almost-full slots |
| `warning-light` | `#fff4dc` | `amber-50` | Casual badge bg |

### Mode Colours — Singles vs Doubles (always visually distinct)

| Mode | Background | Text |
|---|---|---|
| Singles | `#e8eeff` | `#2d4db8` |
| Doubles | `#f5e6ff` | `#7b2fb8` |

### Neutrals

| Token | Hex | Usage |
|---|---|---|
| `text-primary` | `#0d3d3a` | Headings, bold labels — **never use pure black** |
| `text-secondary` | `#444444` | Body text, names |
| `text-muted` | `#888888` | Supporting info, labels |
| `text-hint` | `#aaaaaa` | Inactive dots |
| `border-light` | `rgba(48,213,200,0.20)` | Card borders |
| `border-default` | `#eeeeee` | Dividers, nav border |
| `surface` | `#ffffff` | Cards, nav bar |
| `page-bg` | `#f0fafa` | Screen background |

---

## 3. Typography

**Primary font:** Geist Sans (Next.js Google Font)
**Monospace:** Geist Mono (data/code display)
**Logo font:** Georgia, serif — only for "Huzz." wordmark

```tsx
import { Geist, Geist_Mono } from 'next/font/google'
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })
```

### Type Scale

| Role | Size | Weight | Colour | Tailwind |
|---|---|---|---|---|
| Logo / wordmark | 28px | 900 | white (on header) | `text-2xl font-black` |
| Page title | 24–32px | 800 | `text-primary` | `text-3xl font-bold` |
| Card badge | 11px | 800 | badge-specific | `text-xs font-extrabold uppercase tracking-wide` |
| Card body | 13–14px | 700 | `text-secondary` | `text-sm font-semibold` |
| Supporting label | 11px | 400–700 | `text-muted` | `text-xs text-gray-500` |
| Micro label | 10px | 700 | `#999`, uppercase | `text-[10px] font-bold uppercase tracking-wider` |
| Sheet body | 13px | 400 | `#444` | `text-sm text-gray-600 leading-relaxed` |
| Player name | 14px | 800 | `text-primary` | `text-sm font-extrabold` |
| Bio text | 12px | 400 | `#666` | `text-xs text-gray-500 leading-snug` |
| Form label | 14px | 500 | default | `text-sm font-medium` |

**Rules:**
- Never use weights below 400 or above 900
- Never use pure black — `#0d3d3a` is the darkest tone
- Badge text is always uppercase with `tracking-wide` or `tracking-wider`
- Max 3 font weights per screen (400, 700, 800)

### Brand Gradient Text

```tsx
<h1 className="bg-gradient-to-br from-mint-600 to-mint-800 bg-clip-text text-transparent">
  Huzz
</h1>
```

Use for: page titles, hero sections, logo on auth pages.

---

## 4. Spacing & Layout

**Screen horizontal padding:** 16px (`px-4`)
**Card internal padding:** 13–14px (`p-3.5` or `p-4`)
**Gap between cards:** 10px (`gap-2.5`)
**Gap between badges:** 6px (`gap-1.5`)

### Border Radius

| Element | Value | Tailwind |
|---|---|---|
| Lobby cards | 18px | `rounded-[18px]` |
| Modal / bottom drawer | 24px top corners | `rounded-t-3xl` |
| Badges / pills | fully rounded | `rounded-full` |
| Level bar | 10px | `rounded-[10px]` |
| Level dots | circle | `rounded-full` |
| Player cards (in sheet) | 14px | `rounded-xl` |
| CTA button | 14px | `rounded-xl` |
| Inputs | 12px | `rounded-xl` |
| Header icon buttons | circle | `rounded-full` |
| Host's note box | 14px | `rounded-xl` |

### Shadows

```
shadow-lg                  Large shadow — elevated cards
shadow-xl                  Extra large — modals, major cards
shadow-mint-500/20         Coloured shadow — mint buttons
shadow-[0_2px_12px_rgba(48,213,200,0.08)]  Lobby card shadow
shadow-gray-200/50         Subtle card shadow
```

### Page Container

```tsx
<div className="container mx-auto px-4 py-8">
  <div className="max-w-4xl mx-auto">
    {/* Content */}
  </div>
</div>
```

**Max widths:** `max-w-md` (auth forms) · `max-w-2xl` (wide forms) · `max-w-4xl` (main content)

---

## 5. Header

- **Background:** `#30d5c8` with subtle gradient to `#1ab5aa`
- **Left:** shuttlecock SVG + "Huzz." wordmark (Georgia, 28px, 900, white)
- **Right:** search icon + notification bell — 36×36px circles, `rgba(255,255,255,0.20)` bg, white stroke
- **Notification dot:** 7×7px, `#ff3b30`, top-right of bell
- **Sub-strip (on primary bg):** `"🏸 N lobbies open"` left · `"Sorted by recommendations"` pill right (`rgba(255,255,255,0.25)` bg)

---

## 6. Lobby Cards

Self-contained summary of one matchmaking lobby.

### Structure (top → bottom)

**Row 1 — Badges + Slots**
- Left: type badge (Competitive / Social / Casual) + mode badge (Singles / Doubles)
- Right: slots pill (e.g. `2 / 4`, `4 / 4 Full`)

**Row 2 — Level bar** (`#f0fafa` bg, `rounded-[10px]`)
- `"LEVEL"` micro label left
- 10 level dots (20×20px) — see §11
- `±1` / `±2` / `Open` rule label right

**Row 3 — Host's note** (hidden when `lobby_desc` empty)
- `"HOST'S NOTE"` micro label, `#f0fafa` bg, `3px solid #30d5c8` left border

**Row 4 — Host + venue**
- Left: host avatar (22×22px) + `"Host [Name]"`
- Right: pin icon + venue suburb (only when venue assigned)

### Card Style

```tsx
<div className="bg-white border border-[rgba(48,213,200,0.20)] shadow-[0_2px_12px_rgba(48,213,200,0.08)] rounded-[18px] p-4 transition-transform hover:scale-[0.97] cursor-pointer">
```

### Badge Colours

**Type badges:**
| Type | Background | Text | Tailwind |
|---|---|---|---|
| Competitive | `#ffeaea` | `#bf1a00` | `bg-red-50 text-red-700` |
| Social | `#e6f9f7` | `#0a6e66` | `bg-mint-50 text-mint-700` |
| Casual | `#fff4dc` | `#9a6000` | `bg-amber-50 text-amber-700` |

**Mode badges:**
| Mode | Background | Text |
|---|---|---|
| Singles | `#e8eeff` | `#2d4db8` |
| Doubles | `#f5e6ff` | `#7b2fb8` |

**Slots pill:**
| State | Background | Text | Condition |
|---|---|---|---|
| Open | `#e6faf8` | `#0a8a80` | < 50% filled |
| Almost full | `#fff4dc` | `#9a6000` | ≥ 50%, not full |
| Full | `#ffeaea` | `#bf1a00` | 100% filled |

---

## 7. Lobby Detail Modal (Drawer)

Triggered by tapping a lobby card. Implemented as a bottom-anchored drawer on web.

### Structure

- **Drag handle:** 36×4px pill, `#ddd`, centered, `mt-3`
- **Badges row:** type badge + mode badge + slots pill + venue suburb (when assigned)
- **Host's note:** `#f0fafa` bg, `border-l-[3px] border-[#30d5c8]`, `rounded-xl`. Hidden when `lobby_desc` empty.
- **Divider:** `border-t border-[#eee]`
- **`"PLAYERS IN THIS LOBBY"`** — 11px 800 `#999` uppercase
- **Player cards** (`rounded-xl`): avatar 40×40px · name + Host pill · gender · age · skill pill · bio
- **CTA:** `"Join Lobby"` full width, `bg-mint-500`, white, `rounded-xl`. Direct join, no approval. If full: `bg-gray-300` disabled `"Lobby Full"`.

### Implementation

```tsx
{/* Backdrop */}
<div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
{/* Drawer */}
<div className="fixed inset-x-0 bottom-0 z-50 max-h-[78vh] overflow-y-auto rounded-t-3xl bg-white shadow-xl">
  <div className="mx-auto mt-3 h-1 w-9 rounded-full bg-gray-300" />
  {/* Content */}
</div>
```

---

## 8. Navigation

### Desktop Navbar

```tsx
<nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-lg">
  <div className="container mx-auto px-4 flex h-16 items-center justify-between">
    <Link href="/" className="flex items-center gap-2">
      <span>🏸</span>
      <span className="font-serif font-black text-xl bg-gradient-to-br from-mint-600 to-mint-800 bg-clip-text text-transparent">
        Huzz.
      </span>
    </Link>
    <div className="hidden md:flex items-center gap-1">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <Button variant="ghost" className={cn('gap-2', isActive && 'bg-mint-50 text-mint-700 font-semibold')}>
            <item.Icon className="h-4 w-4" />
            {item.label}
          </Button>
        </Link>
      ))}
    </div>
  </div>
</nav>
```

### Mobile Bottom Tab Bar

Icon-only. 4 tabs: Home · Advanced Match · Create Lobby · Profile.

```tsx
<div className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-lg">
  <div className="grid grid-cols-4 h-[72px] pb-2">
    {navItems.map((item) => {
      const active = pathname === item.href
      return (
        <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center gap-1">
          <item.Icon
            className={cn('h-[26px] w-[26px]', active ? 'text-mint-500' : 'text-gray-300')}
            strokeWidth={1.8}
          />
          {active && <span className="w-1 h-1 rounded-full bg-mint-500" />}
        </Link>
      )
    })}
  </div>
</div>
```

**Specs:** 26×26px icons · strokeWidth 1.8 · active = `text-mint-500` + 4×4px dot below · inactive = `#cccccc` · no labels, no icon containers

### Layout Wrapper (hide nav on auth pages)

```tsx
export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login' || pathname === '/signup'
  return (
    <>
      {!isAuthPage && <Navbar />}
      <div className={!isAuthPage ? 'pb-20 md:pb-0' : ''}>{children}</div>
    </>
  )
}
```

---

## 9. Page Background

**Colour:** `#f0fafa` — apply as `bg-[#f0fafa]` or `bg-mint-50/60` on the page root.
Header bleeds to top edge. Cards sit on this surface with white backgrounds.

---

## 10. Section Headers

```tsx
<div className="flex items-center justify-between mb-3">
  <h2 className="text-base font-extrabold text-[#0d3d3a]">Open Lobbies</h2>
  <Link href="/lobbies" className="text-xs font-bold text-mint-600">See All →</Link>
</div>
```

---

## 11. Skill Level System

**Range:** 1–10 (integer). **1 = Beginner, 10 = Top Player.**

### Level dot states (on lobby cards)

| State | Background | Text | Condition |
|---|---|---|---|
| `inactive` | `#e8f7f5` | `#aaa` | Outside accepted range |
| `in-range` | `#30d5c8` | white | Within accepted range |
| `host` | `#0d3d3a` | white | Host's own level |

### Match rules

| Game type | Accepted range | Label |
|---|---|---|
| Competitive | Host ±1 | `"±1"` |
| Casual | Host ±2 | `"±2"` |
| Social | All levels | `"Open"` |

### Skill selector (signup / profile) — 5×2 grid

```tsx
<div className="grid grid-cols-5 gap-2">
  {skillLevels.map(({ level }) => (
    <button
      key={level}
      type="button"
      onClick={() => setValue('player_skill', level)}
      className={cn(
        'h-12 rounded-xl border-2 font-bold text-lg transition-all duration-200',
        skill === level
          ? 'bg-mint-500 border-mint-500 text-white shadow-lg scale-105'
          : 'border-gray-300 text-gray-500 hover:border-mint-300 hover:text-mint-500'
      )}
    >
      {level}
    </button>
  ))}
</div>
{/* Selected level description */}
<div className="rounded-lg bg-mint-50 border border-mint-200 p-3 space-y-1">
  <p className="font-semibold text-mint-800">{selected.name}</p>
  <p className="text-xs text-mint-600 leading-relaxed">{selected.desc}</p>
</div>
```

---

## 12. Lobby Identity on Cards

Visual identity = colour-coded **type badge + mode badge** derived from stored parameters. Never free text.

`lobby_desc` is the host's optional free-text note. Renders as the "HOST'S NOTE" section below the level bar — **not** a title.

| Example | Badges shown |
|---|---|
| Competitive Singles | Red `Competitive` + Blue `Singles` |
| Social Doubles | Teal `Social` + Purple `Doubles` |
| Casual Singles | Amber `Casual` + Blue `Singles` |

---

## 13. Host Avatar System

Initials-based circle. Colour is consistent per user across the app.

| Context | Size | Font | Tailwind |
|---|---|---|---|
| Lobby card host row | 22×22px | 9px | `w-[22px] h-[22px] text-[9px]` |
| Sheet player card | 40×40px | 14px | `w-10 h-10 text-sm` |

**Suggested colour palette:** `#bf1a00` · `#0a6e66` · `#9a6000` · `#2d4db8` · `#7b2fb8` · `#555555`

---

## 14. Component Patterns

### Buttons

```tsx
import { Button } from '@/components/ui/button'

<Button>Join Lobby</Button>                    // Primary — mint-500 bg, white text
<Button variant="outline">Cancel</Button>      // Mint border, transparent bg
<Button variant="ghost">Profile</Button>       // No border, hover bg-mint-50
<Button variant="destructive">Remove</Button>  // Red bg
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon className="h-4 w-4" /></Button>

// Loading state
<Button disabled={isLoading}>
  {isLoading
    ? <><Loader2 className="h-4 w-4 animate-spin" /> Loading...</>
    : 'Submit'
  }
</Button>
```

**Specs:** `rounded-xl` · `active:scale-95` · focus: `ring-2 ring-mint-500 ring-offset-2` · `transition-all duration-200` · min 44px height

### Inputs

```tsx
import { Input } from '@/components/ui/input'
<Input type="email" placeholder="you@example.com" {...register('email')} />
```

**Specs:** `border-2 border-gray-200` · focus: `border-mint-500 ring-4 ring-mint-500/10` · `h-11` (44px) · `px-4 py-2.5` · `rounded-xl`

**Password toggle:**
```tsx
<div className="relative">
  <Input type={showPassword ? 'text' : 'password'} className="pr-10" />
  <button type="button" onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
  </button>
</div>
```

### Form Field

```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" {...register('email')} disabled={isLoading} />
  {errors.email && (
    <p className="text-sm text-red-500 animate-in fade-in-50 slide-in-from-top-1">
      {errors.email.message}
    </p>
  )}
</div>
```

### Cards (shadcn)

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
```

**Specs:** `rounded-2xl` · `border border-gray-100` · `shadow-xl shadow-gray-200/50` · `bg-white`

### Select

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

<Select value={value} onValueChange={(val) => setValue('field', val)}>
  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
  <SelectContent>
    <SelectItem value="Competitive">Competitive</SelectItem>
    <SelectItem value="Social">Social</SelectItem>
    <SelectItem value="Casual">Casual</SelectItem>
  </SelectContent>
</Select>
```

### Alerts

```tsx
// Error
<div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-in fade-in-50 slide-in-from-top-2">
  {error}
</div>

// Info (mint)
<div className="p-3 rounded-xl bg-mint-50 border border-mint-200 text-mint-700 text-sm flex items-start gap-2">
  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
  <p>Message</p>
</div>
```

### Badges

```tsx
<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide bg-red-50 text-red-700">
  Competitive
</span>
```

---

## 15. Layout Patterns

### Auth Page Layout

```tsx
<main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mint-50 via-white to-mint-100/50 p-4 py-12">
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute -top-20 -right-20 w-72 h-72 bg-mint-200/30 rounded-full blur-3xl animate-float" />
    <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-mint-300/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
  </div>
  <Card className="w-full max-w-2xl relative z-10 animate-in fade-in-50 slide-in-from-bottom-10 duration-500">
    {/* Form content */}
  </Card>
</main>
```

### Two-Column Form Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div className="space-y-2">{/* Field 1 */}</div>
  <div className="space-y-2">{/* Field 2 */}</div>
</div>
```

### Divider with Text

```tsx
<div className="relative my-6">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-gray-200" />
  </div>
  <div className="relative flex justify-center text-xs uppercase">
    <span className="bg-white px-2 text-gray-500">Already have an account?</span>
  </div>
</div>
```

---

## 16. Animations

### Keyframes (globals.css)

```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-10px); }
}
.animate-float { animation: float 3s ease-in-out infinite; }

@keyframes shimmer {
  0%   { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}
.animate-shimmer {
  animation: shimmer 2s infinite linear;
  background: linear-gradient(to right, transparent 0%, var(--mint-100) 50%, transparent 100%);
  background-size: 1000px 100%;
}
```

### Tailwind Utilities

```tsx
<Card className="animate-in fade-in-50 slide-in-from-bottom-10 duration-500"> // Page entrance
<p className="animate-in fade-in-50 slide-in-from-top-1">                     // Error entrance
<Button className="active:scale-95 transition-all duration-200">              // Button press
<div className="hover:scale-[0.97] transition-transform duration-150">        // Card hover
<Loader2 className="h-4 w-4 animate-spin" />                                  // Spinner
```

**Philosophy:** Entrance = fade + slide. Interaction = scale press. Decorative = float. Duration 150–500ms. Never over-animate.

---

## 17. Responsive Design

Mobile-first. All base styles apply to mobile. Override with `md:` for desktop.

```tsx
<div className="flex flex-col sm:flex-row gap-4">        // Stack → row
<div className="grid grid-cols-1 md:grid-cols-2 gap-4"> // 1 col → 2 col
<div className="hidden md:flex">                         // Desktop only
<div className="md:hidden">                              // Mobile only
<h1 className="text-2xl md:text-4xl">                   // Responsive text
```

**Breakpoints:** `sm` 640px · `md` 768px · `lg` 1024px · `xl` 1280px

**Touch targets:** Minimum 44×44px — use `h-11` on inputs and buttons.

---

## 18. Iconography

**Library:** `lucide-react` (stroke-based SVG)

```tsx
import { Eye, EyeOff, Loader2, MapPin, Home, Search, Plus, User, LogOut } from 'lucide-react'
```

**Sizes:** `h-4 w-4` inline/buttons · `h-5 w-5` mobile tab · `h-6 w-6` actions

| Icon | Location |
|---|---|
| Shuttlecock (custom SVG) | Header wordmark |
| Search | Header right |
| Bell | Header right |
| MapPin | Venue suburb labels |
| House (filled when active) | Nav — Home |
| Two people + diamond | Nav — Advanced Match |
| Plus | Nav — Create Lobby |
| Person silhouette | Nav — Profile |

Nav icon specs: 26×26px · `strokeWidth={1.8}` · `strokeLinecap="round"` · `strokeLinejoin="round"`

---

## 19. Accessibility

- All badge text ≥ 4.5:1 contrast against its background
- All interactive elements ≥ 44×44px (`h-11`)
- All inputs have `<Label htmlFor>` association
- Focus rings: `focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2`
- Use `type="button"` on non-submit buttons
- Font sizes no smaller than 9px (avatar initials only)

---

## 20. Form Validation

```tsx
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type FormData = z.infer<typeof schema>

const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { /* ... */ },
})
```

---

## 21. Code Conventions

### Component structure

```tsx
'use client'  // Only if using hooks or browser APIs

import { /* shadcn */ } from '@/components/ui/...'
import { /* icons */ } from 'lucide-react'
import { trpc } from '@/lib/trpc'

export default function PageName() {
  // 1. Hooks (router, pathname)
  // 2. tRPC queries/mutations
  // 3. Local state (useState)
  // 4. Handlers (async functions)
  // 5. JSX return
}
```

### Conditional classes — always use `cn()`

```tsx
import { cn } from '@/lib/utils'
<div className={cn('base', isActive && 'active', variant === 'x' && 'variant-x')}>
```

### Async state pattern

```tsx
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

async function handleAction() {
  setIsLoading(true)
  setError(null)
  try {
    await doSomething()
  } catch {
    setError('Something went wrong')
  } finally {
    setIsLoading(false)
  }
}
```

### New page quick-start template

```tsx
'use client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function NewPage() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold bg-gradient-to-br from-mint-600 to-mint-800 bg-clip-text text-transparent mb-6">
          Page Title
        </h1>
        <Card>
          <CardHeader><CardTitle>Section</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Button disabled={isLoading}>
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Loading...</> : 'Submit'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

---

## 22. Do's and Don'ts

**Do:**
- Use `#30d5c8` / `mint-500` as the dominant brand colour on every screen
- Keep Singles (blue) and Doubles (purple) visually distinct at all times
- Show the skill level dot row on every lobby card — it's the core differentiator
- Use colour-coded type + mode badges as lobby identity; `lobby_desc` = host note only
- Sort home feed by recommendations (past co-players → skill proximity)
- Display venue suburb only when assigned — from `Location.location_address`
- Use `cn()` for all conditional class logic
- Add loading + disabled states to every async action
- Test on mobile viewport — mobile is the primary experience
- Minimum 44px touch targets on all interactive elements

**Don't:**
- Don't use pure black — `#0d3d3a` is the darkest tone
- Don't use gradients except on the header (`#30d5c8 → #1ab5aa`)
- Don't show player suburb — venue suburb only, and only when assigned
- Don't reverse-geocode player coordinates
- Don't implement join request/approval — joins are always direct
- Don't add borders or background containers to nav tab icons
- Don't use more than 3 font weights per screen (400, 700, 800)
- Don't mix inline styles with Tailwind classes
- Don't hardcode hex colours — use Tailwind tokens or CSS variables

---

*Version 2.0 — March 2026 — Huzz Development Team*
