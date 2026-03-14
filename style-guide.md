# Match App — Frontend Style Guide

> Design system and UI conventions for the Match badminton matchmaking app

---

## 🎨 Brand Identity

**App Name**: Match
**Icon**: 🏸 (Badminton shuttlecock)
**Theme**: Clean, modern, sporty
**Target Audience**: Badminton players in Melbourne seeking social/competitive matches

---

## Color Palette

### Primary: Mint Blue (Teal)

Our signature color — energetic, fresh, and sports-oriented.

```css
--mint-50:  #f0fdfa  /* Lightest - backgrounds, hover states */
--mint-100: #ccfbf1  /* Very light - badges, alerts */
--mint-200: #99f6e4  /* Light - decorative elements */
--mint-300: #5de2e7  /* Medium light */
--mint-400: #2dd4bf  /* Medium */
--mint-500: #14b8a6  /* PRIMARY - buttons, links, active states */
--mint-600: #0d9488  /* Dark - hover states, gradients */
--mint-700: #0f766e  /* Darker - text on light backgrounds */
--mint-800: #115e59  /* Very dark - gradient ends */
--mint-900: #134e4a  /* Darkest */
```

**Usage**:
- **Buttons**: `bg-mint-500` with `hover:bg-mint-600`
- **Links**: `text-mint-600`
- **Active states**: `bg-mint-50 text-mint-700`
- **Focus rings**: `ring-mint-500`
- **Gradients**: `from-mint-600 to-mint-800`

### Neutrals

```css
--background: #fafafa  /* Page background (warm white) */
--foreground: #0f172a  /* Primary text (slate-900) */

/* Grays (Tailwind defaults) */
gray-50:  Light backgrounds
gray-100: Borders, card borders
gray-200: Input borders, dividers
gray-300: Disabled states
gray-400: Placeholder text
gray-500: Secondary text
gray-600: Body text
gray-700: Labels, darker text
```

### Semantic Colors

```css
/* Success (use sparingly) */
green-50:  #f0fdf4
green-600: #16a34a

/* Error/Destructive */
red-50:   #fef2f2
red-200:  #fecaca
red-500:  #ef4444
red-600:  #dc2626
red-700:  #b91c1c

/* Warning (future use) */
amber-50:  #fffbeb
amber-500: #f59e0b
```

---

## Typography

### Fonts

```tsx
// Next.js font setup
import { Geist, Geist_Mono } from "next/font/google"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})
```

**Primary**: `Geist Sans` (modern, clean, geometric)
**Monospace**: `Geist Mono` (for code/data)

### Type Scale

```tsx
// Headings
<h1 className="text-4xl font-bold">         // Hero/page titles
<h1 className="text-3xl font-bold">         // Section titles
<h2 className="text-2xl font-bold">         // Card titles
<h2 className="text-xl font-bold">          // Subsection titles
<h3 className="text-lg font-semibold">      // Small headings

// Body
<p className="text-base">                   // Default body (16px)
<p className="text-sm">                     // Smaller body (14px)
<p className="text-xs">                     // Caption/meta (12px)

// Labels
<Label className="text-sm font-medium">    // Form labels
```

### Text Gradients (Brand Emphasis)

Use for prominent headings and branding:

```tsx
<h1 className="bg-gradient-to-br from-mint-600 to-mint-800 bg-clip-text text-transparent">
  Welcome to Match
</h1>
```

**When to use**:
- Page titles
- Brand name in logo
- Hero sections
- CTA headings

---

## Component Patterns

### 1. Buttons

**File**: `src/components/ui/button.tsx`

```tsx
import { Button } from '@/components/ui/button'

// Primary (default)
<Button>Create Lobby</Button>
// → Mint-500 background, white text, shadow, hover scale

// Outline
<Button variant="outline">Cancel</Button>
// → Mint border, transparent bg, hover fill

// Ghost (nav items)
<Button variant="ghost">Profile</Button>
// → No border, hover bg-mint-50

// Destructive
<Button variant="destructive">Delete</Button>
// → Red background

// Link
<Button variant="link">Learn more</Button>
// → Text-only with underline on hover

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">
  <Icon className="h-4 w-4" />
</Button>
```

**Loading State Pattern**:

```tsx
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="h-4 w-4 animate-spin" />
      Signing in...
    </>
  ) : (
    'Sign in'
  )}
</Button>
```

**Design Details**:
- Border radius: `rounded-xl` (12px)
- Active state: `active:scale-95`
- Focus ring: `ring-2 ring-mint-500 ring-offset-2`
- Transition: `transition-all duration-200`

---

### 2. Inputs

**File**: `src/components/ui/input.tsx`

```tsx
import { Input } from '@/components/ui/input'

<Input
  type="email"
  placeholder="you@example.com"
  {...register('email')}
/>
```

**Design Details**:
- Border: `border-2 border-gray-200`
- Focus: `border-mint-500 ring-4 ring-mint-500/10`
- Height: `h-11` (44px for touch targets)
- Padding: `px-4 py-2.5`
- Border radius: `rounded-xl`
- Transition: `transition-all duration-200`

**Password Input Pattern**:

```tsx
const [showPassword, setShowPassword] = useState(false)

<div className="relative">
  <Input
    type={showPassword ? 'text' : 'password'}
    placeholder="Password"
    className="pr-10"  // Space for icon
  />
  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
  >
    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
  </button>
</div>
```

---

### 3. Form Fields

**Standard Field Pattern**:

```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="you@example.com"
    {...register('email')}
    disabled={isLoading}
  />
  {errors.email && (
    <p className="text-sm text-red-500 animate-in fade-in-50 slide-in-from-top-1">
      {errors.email.message}
    </p>
  )}
</div>
```

**Grid Layouts** (2-column on desktop):

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label htmlFor="fname">First name</Label>
    <Input id="fname" {...register('player_fname')} />
  </div>
  <div className="space-y-2">
    <Label htmlFor="lname">Last name</Label>
    <Input id="lname" {...register('player_lname')} />
  </div>
</div>
```

---

### 4. Cards

**File**: `src/components/ui/card.tsx`

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Optional subtitle</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

**Design Details**:
- Border radius: `rounded-2xl` (16px)
- Border: `border border-gray-100`
- Shadow: `shadow-xl shadow-gray-200/50`
- Background: `bg-white`

**Utility Class**:

```tsx
<div className="card p-6">
  {/* Quick card without imports */}
</div>
```

---

### 5. Select Dropdowns

**File**: `src/components/ui/select.tsx`

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

<Select value={gender} onValueChange={(val) => setValue('gender', val)}>
  <SelectTrigger>
    <SelectValue placeholder="Select gender" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="Male">Male</SelectItem>
    <SelectItem value="Female">Female</SelectItem>
    <SelectItem value="Non-binary">Non-binary</SelectItem>
    <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
  </SelectContent>
</Select>
```

**Design Details**:
- Radix UI primitive for accessibility
- Matches input styling (rounded-xl, border-2, focus states)
- Animated dropdown with fade + scale
- Checkmark on selected item

---

### 6. Custom Interactive Components

#### Skill Level Selector

```tsx
const [skill, setSkill] = useState(3)

<div className="space-y-2">
  <Label>Skill level</Label>
  <div className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50/50 space-y-3">
    <div className="flex justify-between items-center gap-2">
      {[1, 2, 3, 4, 5].map((level) => (
        <button
          key={level}
          type="button"
          onClick={() => setSkill(level)}
          className={`flex-1 h-12 rounded-xl border-2 font-bold text-sm transition-all duration-200 ${
            level <= skill
              ? 'bg-mint-500 border-mint-500 text-white shadow-lg shadow-mint-500/30 scale-105'
              : 'border-gray-300 text-gray-400 hover:border-mint-300 hover:text-mint-500'
          }`}
        >
          {level}
        </button>
      ))}
    </div>
    <div className="text-center">
      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-mint-100 text-mint-700 text-sm font-medium">
        {skillLabels[skill]}
      </span>
    </div>
  </div>
</div>
```

**Design Pattern**:
- Visual feedback (selected items scale up)
- Clear active state (mint background)
- Label below shows text equivalent
- Smooth transitions

---

### 7. Alerts & Messages

#### Error Alert

```tsx
{error && (
  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-in fade-in-50 slide-in-from-top-2">
    {error}
  </div>
)}
```

#### Info Alert (Mint)

```tsx
<div className="p-3 rounded-xl bg-mint-50 border border-mint-200 text-mint-700 text-sm flex items-start gap-2">
  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
  <p>We'll request your location after signup...</p>
</div>
```

**Pattern**:
- Use semantic background colors (red-50, mint-50)
- Border slightly darker than background
- Icons for context
- Animated entrance

---

### 8. Badges

```tsx
// Utility class (global)
<span className="badge">New</span>
// → rounded-full bg-mint-100 text-mint-700

// Custom
<span className="inline-flex items-center rounded-full bg-mint-100 px-3 py-1 text-xs font-medium text-mint-700">
  Intermediate
</span>
```

---

## Layout Patterns

### Page Container

```tsx
<div className="container mx-auto px-4 py-8">
  <div className="max-w-4xl mx-auto">
    {/* Content */}
  </div>
</div>
```

**Breakpoints**:
- `container`: Responsive max-width (default Tailwind breakpoints)
- `max-w-md`: 448px (auth forms)
- `max-w-2xl`: 672px (wide auth forms)
- `max-w-4xl`: 896px (main content)

### Centered Auth Layout

```tsx
<main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mint-50 via-white to-mint-100/50 p-4">
  {/* Floating decorations */}
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute -top-20 -right-20 w-72 h-72 bg-mint-200/30 rounded-full blur-3xl animate-float" />
    <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-mint-300/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
  </div>

  <Card className="w-full max-w-md relative z-10 animate-in fade-in-50 slide-in-from-bottom-10 duration-500">
    {/* Form */}
  </Card>
</main>
```

**Key Details**:
- Gradient background (subtle mint tones)
- Floating blurred circles (parallax-like depth)
- Card elevated above decorations (`z-10`)
- Entrance animation

---

## Navigation

### Desktop Navbar

**File**: `src/components/Navbar.tsx`

```tsx
<nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-lg supports-[backdrop-filter]:bg-white/60">
  <div className="container mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex h-16 items-center justify-between">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 text-xl font-bold group">
        <span className="text-2xl group-hover:animate-float">🏸</span>
        <span className="bg-gradient-to-br from-mint-600 to-mint-800 bg-clip-text text-transparent">
          Match
        </span>
      </Link>

      {/* Nav items */}
      <div className="hidden md:flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  'gap-2',
                  isActive ? 'bg-mint-50 text-mint-700 font-semibold' : 'text-gray-600'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          )
        })}
      </div>
    </div>
  </div>
</nav>
```

**Design Details**:
- Sticky top positioning
- Backdrop blur (glassmorphism)
- Active state: mint background
- Icon + text labels
- Logo hover animation

### Mobile Bottom Tab Bar

```tsx
<div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-lg shadow-lg">
  <div className="grid grid-cols-4 gap-1 p-2">
    {navItems.map((item) => {
      const isActive = pathname === item.href
      return (
        <Link key={item.href} href={item.href}>
          <button className={cn(
            'flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all w-full',
            isActive ? 'bg-mint-50 text-mint-700' : 'text-gray-600'
          )}>
            <Icon className="h-5 w-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        </Link>
      )
    })}
  </div>
</div>
```

**Mobile Considerations**:
- Fixed bottom position
- Grid layout (4 equal columns)
- Larger touch targets
- Stacked icon + label
- Hidden on desktop (`md:hidden`)

### Conditional Navbar Wrapper

```tsx
// src/components/LayoutWrapper.tsx
export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login' || pathname === '/signup'

  return (
    <>
      {!isAuthPage && <Navbar />}
      <div className={!isAuthPage ? 'pb-20 md:pb-0' : ''}>
        {children}
      </div>
    </>
  )
}
```

**Pattern**: Hide navbar on auth pages, add bottom padding on mobile for tab bar

---

## Animations

### Keyframes (globals.css)

```css
@keyframes shimmer {
  0%   { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50%      { transform: translateY(-10px); }
}

.animate-shimmer {
  animation: shimmer 2s infinite linear;
  background: linear-gradient(to right, transparent 0%, var(--mint-100) 50%, transparent 100%);
  background-size: 1000px 100%;
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
```

### Tailwind Animation Utilities

```tsx
// Page entrance
<Card className="animate-in fade-in-50 slide-in-from-bottom-10 duration-500">

// Error message entrance
<p className="animate-in fade-in-50 slide-in-from-top-1">

// Button active state
<Button className="active:scale-95">

// Loading spinner
<Loader2 className="h-4 w-4 animate-spin" />
```

**Animation Philosophy**:
- **Entrance**: Fade + slide (subtle, not distracting)
- **Interaction**: Scale on press (tactile feedback)
- **Decorative**: Float animation for depth
- **Duration**: 200-500ms (fast, responsive)

---

## Spacing System

### Component Spacing

```tsx
// Form vertical spacing
<form className="space-y-4">        // 16px between fields
<form className="space-y-5">        // 20px (wider forms)

// Field internal spacing
<div className="space-y-2">         // 8px (label → input → error)

// Card content
<CardContent className="p-6">       // 24px padding
<div className="p-4">               // 16px padding (tighter)

// Section spacing
<div className="mb-8">              // 32px margin-bottom
<div className="py-8">              // 32px vertical padding
```

### Grid Gaps

```tsx
<div className="gap-1">   // 4px - tight grids (mobile nav)
<div className="gap-2">   // 8px - buttons, small items
<div className="gap-4">   // 16px - form fields
<div className="gap-6">   // 24px - cards, sections
```

---

## Icons

**Library**: `lucide-react`

```tsx
import { Eye, EyeOff, Loader2, MapPin, Home, Search, PlusCircle, User, LogOut } from 'lucide-react'
```

**Sizing Convention**:
- `h-4 w-4` (16px) - Inline with text, buttons
- `h-5 w-5` (20px) - Mobile tab icons
- `h-6 w-6` (24px) - Larger actions
- `h-8 w-8` (32px) - Hero icons

**Usage**:

```tsx
<Button>
  <Icon className="h-4 w-4" />
  Label
</Button>
```

---

## Responsive Design Strategy

### Breakpoints (Tailwind Default)

```
sm:  640px  - Small tablets
md:  768px  - Tablets, desktop threshold
lg:  1024px - Desktop
xl:  1280px - Large desktop
2xl: 1536px - Extra large
```

### Mobile-First Patterns

```tsx
// Stack on mobile, row on desktop
<div className="flex flex-col sm:flex-row gap-4">

// 1 col mobile, 2 cols desktop
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// Hide on mobile
<div className="hidden md:flex">

// Hide on desktop
<div className="md:hidden">

// Responsive text
<h1 className="text-2xl md:text-4xl">
```

### Touch Targets

Minimum height for interactive elements: **44px** (`h-11`)

```tsx
<Button className="h-11">      // 44px
<Input className="h-11">       // 44px
```

---

## Accessibility

### Focus States

All interactive elements have visible focus rings:

```tsx
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-mint-500
focus-visible:ring-offset-2
```

### ARIA & Semantic HTML

```tsx
// Proper label association
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />

// Button types
<button type="button">       // Non-submit actions
<button type="submit">       // Form submission

// Disabled states
<Button disabled={isLoading}>
```

### Screen Reader Considerations

```tsx
// Lucide icons are decorative by default (aria-hidden)
// Add text labels for context
<Button>
  <Icon className="h-4 w-4" />
  Sign out  {/* Screen reader reads this */}
</Button>
```

---

## Code Conventions

### Component Structure

```tsx
'use client'  // If uses hooks

import { /* shadcn */ } from '@/components/ui/...'
import { /* icons */ } from 'lucide-react'
import { /* Next.js */ } from 'next/...'
import { /* libs */ } from '...'

export default function ComponentName() {
  // 1. Hooks
  const router = useRouter()
  const [state, setState] = useState()

  // 2. Form setup
  const { register, handleSubmit } = useForm()

  // 3. Handlers
  async function onSubmit(data) {
    // ...
  }

  // 4. JSX
  return (
    <main className="...">
      {/* ... */}
    </main>
  )
}
```

### ClassName Utilities

Always use the `cn()` helper for conditional classes:

```tsx
import { cn } from '@/lib/utils'

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  variant === 'primary' && 'primary-classes'
)}>
```

### State Management Pattern

```tsx
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

async function handleAction() {
  setIsLoading(true)
  setError(null)

  try {
    await doSomething()
  } catch (err) {
    setError(err.message)
  } finally {
    setIsLoading(false)
  }
}
```

---

## Form Validation

**Library**: Zod + React Hook Form + @hookform/resolvers

```tsx
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type FormData = z.infer<typeof schema>

const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { /* ... */ },
})
```

**Error Display**:

```tsx
{errors.email && (
  <p className="text-sm text-red-500 animate-in fade-in-50">
    {errors.email.message}
  </p>
)}
```

---

## Loading States

### Spinners

```tsx
import { Loader2 } from 'lucide-react'

<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading...
    </>
  ) : (
    'Submit'
  )}
</Button>
```

### Skeleton Screens (Future)

For data loading, use skeleton placeholders instead of spinners:

```tsx
<div className="animate-pulse space-y-3">
  <div className="h-4 bg-gray-200 rounded w-3/4" />
  <div className="h-4 bg-gray-200 rounded w-1/2" />
</div>
```

---

## Utility Classes (Global)

Defined in `globals.css`:

```css
.input {
  /* Styled input matching Input component */
}

.btn-primary {
  /* Styled button matching Button component */
}

.badge {
  /* Mint badge pill */
}

.card {
  /* Card container without imports */
}
```

**When to use**:
- Quick prototypes without component imports
- Non-form contexts where shadcn component is overkill
- Maintaining consistency in mixed codebases

---

## Design Tokens Reference

### Border Radius

```
rounded-lg:   8px  - Small elements
rounded-xl:   12px - Inputs, buttons (PRIMARY)
rounded-2xl:  16px - Cards
rounded-full: 9999px - Badges, avatars
```

### Shadows

```
shadow-lg:  Large shadow for elevated cards
shadow-xl:  Extra large for modals, major cards
shadow-mint-500/20:  Colored shadow for mint buttons
shadow-mint-500/30:  Stronger colored shadow
shadow-gray-200/50:  Subtle card shadow
```

### Transitions

Default duration: `duration-200` (200ms)
Longer animations: `duration-500` (500ms)

```tsx
transition-all duration-200  // Most interactions
transition-colors            // Color-only changes
```

---

## Common Patterns Cheat Sheet

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
    <span className="bg-white px-2 text-gray-500">Or continue with</span>
  </div>
</div>
```

### Inline Icon + Text

```tsx
<div className="flex items-center gap-2">
  <Icon className="h-4 w-4" />
  <span>Text</span>
</div>
```

### Conditional Rendering

```tsx
{condition && <Component />}
{condition ? <A /> : <B />}
```

---

## File Organization

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── layout.tsx            # Root layout with providers
│   ├── page.tsx              # Home
│   └── globals.css           # Global styles + theme
├── components/
│   ├── ui/                   # shadcn components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── Navbar.tsx            # Shared layout components
│   ├── LayoutWrapper.tsx
│   └── ...
└── lib/
    └── utils.ts              # cn() helper
```

---

## Best Practices Summary

### ✅ DO

- Use `cn()` for conditional classes
- Add loading states to async actions
- Provide clear error messages
- Use semantic HTML (`button`, `label`, `main`, etc.)
- Add transitions to interactions (`duration-200`)
- Make touch targets at least 44px
- Use mint-500 as primary action color
- Keep animations subtle and fast
- Test on mobile viewport
- Use consistent spacing (space-y-4, gap-4)

### ❌ DON'T

- Mix inline styles with Tailwind
- Use generic error messages ("Error occurred")
- Forget disabled states on loading
- Use raw colors (use CSS variables)
- Over-animate (keep it professional)
- Ignore focus states
- Use tiny touch targets on mobile
- Hardcode colors (use theme tokens)
- Forget responsive breakpoints
- Mix spacing scales inconsistently

---

## Quick Start Template

```tsx
'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function NewPage() {
  const [isLoading, setIsLoading] = useState(false)

  async function handleAction() {
    setIsLoading(true)
    try {
      // Your logic
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold bg-gradient-to-br from-mint-600 to-mint-800 bg-clip-text text-transparent mb-6">
          Page Title
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Section Title</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="field">Field Label</Label>
              <Input id="field" placeholder="Enter value" />
            </div>

            <Button onClick={handleAction} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

---

**Version**: 1.0
**Last Updated**: March 2026
**Maintainer**: Match Development Team

🏸 Happy coding!
