# B3 — tRPC Infrastructure

## Role
Wire up the tRPC server inside Next.js App Router (route handler), define the procedure builders (`publicProcedure`, `protectedProcedure`), merge all sub-routers into the root app router, and set up the tRPC client + React Query provider for the frontend. This is the communication backbone — all feature APIs plug into it.

## Dependencies
- **B1** complete: `src/lib/prisma.ts`, `src/types.ts`
- **B2** complete: `src/server/context.ts` exports `createContext` and `Context`

## Blocks
B4, B5, B6, B7, B9 — all feature routers register with the root router here.
F1–F6 — all frontend agents use the tRPC client created here.

---

## Tasks

### 1. tRPC Server Init
Create `src/server/trpc.ts`:

```ts
import { initTRPC, TRPCError } from '@trpc/server'
import type { Context } from './context'

const t = initTRPC.context<Context>().create()

export const router            = t.router
export const publicProcedure   = t.procedure

// Throws UNAUTHORIZED if playerId is missing
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.playerId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { ...ctx, playerId: ctx.playerId } })
})
```

### 2. Root App Router
Create `src/server/routers/_app.ts`:

```ts
import { router } from '@/server/trpc'
import { playersRouter } from './players'
import { lobbiesRouter } from './lobbies'
import { queueRouter }   from './queue'
import { paymentRouter } from './payment'
import { adminRouter }   from './admin'

export const appRouter = router({
  players: playersRouter,
  lobbies: lobbiesRouter,
  queue:   queueRouter,
  payment: paymentRouter,
  admin:   adminRouter,
})

export type AppRouter = typeof appRouter
```

**Note:** Sub-router files (`lobbies.ts`, `queue.ts`, `payment.ts`, `admin.ts`) don't exist yet — B3 creates empty stubs so the root router compiles. Each feature agent (B4–B9) replaces the stub with its implementation.

Create stubs for each:

```ts
// src/server/routers/lobbies.ts (stub)
import { router } from '@/server/trpc'
export const lobbiesRouter = router({})

// src/server/routers/queue.ts (stub)
import { router } from '@/server/trpc'
export const queueRouter = router({})

// src/server/routers/payment.ts (stub)
import { router } from '@/server/trpc'
export const paymentRouter = router({})

// src/server/routers/admin.ts (stub)
import { router } from '@/server/trpc'
export const adminRouter = router({})
```

`players.ts` stub was already created by B2 — do not overwrite it.

### 3. Next.js Route Handler
Create `src/app/api/trpc/[trpc]/route.ts`:

```ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter }           from '@/server/routers/_app'
import { createContext }       from '@/server/context'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint:   '/api/trpc',
    req,
    router:     appRouter,
    createContext,
  })

export { handler as GET, handler as POST }
```

### 4. tRPC Client (Browser)
Create `src/lib/trpc.ts`:

```ts
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter }  from '@/server/routers/_app'

export const trpc = createTRPCReact<AppRouter>()
```

### 5. tRPC + React Query Provider
Create `src/components/TRPCProvider.tsx`:

```tsx
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { useState } from 'react'
import { trpc } from '@/lib/trpc'

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient]  = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({ url: '/api/trpc' }),
      ],
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  )
}
```

### 6. Root Layout
Update `src/app/layout.tsx` to wrap the app with `TRPCProvider`:

```tsx
import { TRPCProvider } from '@/components/TRPCProvider'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = { title: 'Huzz — Badminton Matchmaking' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  )
}
```

### 7. Verify Build Compiles
After creating all stubs, run:
```bash
npm run build
```
Fix any TypeScript errors before marking this agent complete. The build must succeed with empty stub routers before feature agents add their procedures.

---

## Files Produced

```
src/
├── server/
│   ├── trpc.ts                          # procedure builders
│   ├── context.ts                       # (owned by B2, just verified here)
│   └── routers/
│       ├── _app.ts                      # root router
│       ├── lobbies.ts                   # stub → B5 fills
│       ├── queue.ts                     # stub → B6 fills
│       ├── payment.ts                   # stub → B8 fills
│       └── admin.ts                     # stub → B9 fills
├── lib/
│   └── trpc.ts                          # tRPC React client
├── components/
│   └── TRPCProvider.tsx
└── app/
    ├── api/
    │   └── trpc/
    │       └── [trpc]/
    │           └── route.ts
    └── layout.tsx
```

## Contracts Exposed

| Export | Used By |
|--------|---------|
| `src/server/trpc.ts` → `router`, `publicProcedure`, `protectedProcedure` | B4, B5, B6, B7, B8, B9 — all router files |
| `src/server/routers/_app.ts` → `AppRouter` type | `src/lib/trpc.ts` client; all frontend agents for type inference |
| `src/lib/trpc.ts` → `trpc` client | All frontend agents: `trpc.lobbies.list.useQuery()` etc. |
| `src/components/TRPCProvider.tsx` | `src/app/layout.tsx` (set up here) |
