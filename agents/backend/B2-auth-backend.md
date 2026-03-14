# B2 — Auth Backend

## Role
Set up Supabase Auth, server-side session management, Next.js middleware for route protection, and inject `playerId` into every tRPC procedure context. This is the identity layer the rest of the backend builds on.

## Dependencies
- **B1** complete: `src/lib/prisma.ts`, `src/types.ts`, Prisma `Player` model available.

## Blocks
- **B3** needs the `Context` type to wire into the tRPC handler
- **B4, B5, B6** use `ctx.playerId` in every protected procedure
- **F1** builds the UI on top of the auth primitives created here

---

## Tasks

### 1. Supabase Browser Client
Create `src/lib/supabase.ts`:

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### 2. Supabase Server Client
Create `src/lib/supabase-server.ts`:

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) =>
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  )
}
```

### 3. tRPC Context
Create `src/server/context.ts`:

```ts
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'

export async function createContext(_opts: FetchCreateContextFnOptions) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return {
    playerId: user?.id ?? null,   // null = unauthenticated
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
```

**Rule:** `ctx.playerId` is `string | null`. Protected procedures must throw `UNAUTHORIZED` if it is null (B3 provides a `protectedProcedure` helper for this).

### 4. Next.js Middleware
Create `src/middleware.ts`:

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup')

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  // Exclude Next.js internals and static files; include all app routes
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/trpc).*)'],
}
```

### 5. `players.create` Stub
Agent F1 (signup page) needs to insert a `Player` row immediately after Supabase creates the auth user. Create a minimal stub in `src/server/routers/players.ts` that Agent B4 will expand:

```ts
// Stub — B4 will own this file and add all other procedures
import { z } from 'zod'
import { router, publicProcedure } from '@/server/trpc'
import { prisma } from '@/lib/prisma'

export const playersRouter = router({
  create: publicProcedure
    .input(
      z.object({
        player_id:    z.string().uuid(),
        player_fname: z.string().min(1),
        player_lname: z.string().min(1),
        player_dob:   z.string(),          // ISO date string
        player_gender: z.string(),
        player_skill: z.number().int().min(1).max(5),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.player.create({
        data: {
          ...input,
          player_dob: new Date(input.player_dob),
        },
      })
    }),
})
```

**Note:** B4 will take over ownership of `src/server/routers/players.ts` and add `.get`, `.update`, `.matchHistory`. Do not overwrite B2's stub — extend it.

### 6. usePlayer Hook (consumed by F1)
Create `src/hooks/usePlayer.ts`:

```ts
'use client'
import { createSupabaseClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export function usePlayer() {
  const [playerId, setPlayerId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createSupabaseClient()
    supabase.auth.getUser().then(({ data }) => {
      setPlayerId(data.user?.id ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setPlayerId(session?.user?.id ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return { playerId }
}
```

### 7. Geolocation Helper
Create `src/lib/geolocation.ts`:

```ts
// Call this after signup to capture player coordinates
export function captureGeolocation(): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      ()    => resolve(null),
      { timeout: 8000 }
    )
  })
}
```

F1 calls this after signup and passes the result to `players.update` to populate `player_lat` / `player_long`.

---

## Files Produced

```
src/
├── lib/
│   ├── supabase.ts
│   ├── supabase-server.ts
│   └── geolocation.ts
├── server/
│   ├── context.ts
│   └── routers/
│       └── players.ts    (stub with .create only)
├── middleware.ts
└── hooks/
    └── usePlayer.ts
```

## Contracts Exposed

| Export | Used By |
|--------|---------|
| `src/server/context.ts` → `createContext`, `Context` | B3 wires into tRPC handler |
| `ctx.playerId: string \| null` | B4, B5, B6 in every protected procedure |
| `src/lib/supabase.ts` → `createSupabaseClient` | F1 for login/signup/logout |
| `src/lib/supabase-server.ts` → `createSupabaseServerClient` | B3, any server component needing session |
| `src/lib/geolocation.ts` → `captureGeolocation` | F1 after signup |
| `src/hooks/usePlayer.ts` → `usePlayer` | F1, F2, F3, F4, F5 — any client component needing `playerId` |
| `src/server/routers/players.ts` → `playersRouter` stub | B3 merges into root router; B4 extends |
