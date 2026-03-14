# F2 — Home Page

## Role
Build the `/` home page. On load it auto-fetches up to 4 recommended lobbies for the logged-in player and displays them as `LobbyCard`s. Joining a lobby routes to `/payment` if the lobby becomes full, or stays with a success message otherwise.

## Dependencies
- **B5** complete: `lobbies.recommendations`, `lobbies.join`, `LobbyCard` component
- **B6** complete: `lobbies.join` triggers match + venue assignment when lobby fills
- **B2** complete: `usePlayer` hook provides `playerId`
- **B3** complete: `trpc` client

## Full Feature Awareness
All app pages for reference:
- `/` — this page (recommendations)
- `/match` — voice search (F3)
- `/create` — create lobby (F4)
- `/profile` — player profile + history (F5)
- `/payment` — pay for confirmed match (F6)

---

## Tasks

### 1. Home Page
`src/app/page.tsx`

```tsx
'use client'
import { trpc }        from '@/lib/trpc'
import { usePlayer }   from '@/hooks/usePlayer'
import { LobbyCard }   from '@/components/LobbyCard'
import { useRouter }   from 'next/navigation'

export default function HomePage() {
  const router             = useRouter()
  const { playerId }       = usePlayer()

  const { data: lobbies, isLoading } = trpc.lobbies.recommendations.useQuery(
    { playerId: playerId! },
    { enabled: !!playerId }
  )

  const joinMutation = trpc.lobbies.join.useMutation({
    onSuccess: (data) => {
      if (data.status === 'full' && data.match) {
        router.push(`/payment?matchId=${data.match.match_id}`)
      }
    },
  })

  if (isLoading) return <PageShell><LoadingGrid /></PageShell>

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Good match today?</h1>
        <p className="text-gray-500 text-sm mb-6">Recommended lobbies just for you</p>

        {lobbies && lobbies.length > 0 ? (
          <div className="grid gap-4">
            {lobbies.map((lobby) => (
              <LobbyCard
                key={lobby.lobby_id}
                lobby={lobby}
                onJoin={(id) => joinMutation.mutate({ lobbyId: id })}
                highlighted={lobby.lobby_status === 'Full' || lobby.lobby_status === 'Matched'}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No lobbies yet"
            subtitle="Be the first — create one or find a match."
            action={{ label: 'Create a lobby', href: '/create' }}
          />
        )}
      </div>
    </PageShell>
  )
}
```

### 2. `PageShell` Layout Wrapper
Create `src/components/PageShell.tsx` — wraps all pages with the Navbar and consistent padding. Used by F2–F6.

```tsx
import { Navbar } from './Navbar'

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
    </div>
  )
}
```

### 3. `LoadingGrid` Skeleton
`src/components/LoadingGrid.tsx` — four skeleton cards shown while data loads:

```tsx
export function LoadingGrid() {
  return (
    <div className="grid gap-4 max-w-2xl mx-auto px-4 py-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-36 rounded-xl bg-gray-200 animate-pulse" />
      ))}
    </div>
  )
}
```

### 4. `EmptyState` Component
`src/components/EmptyState.tsx`:

```tsx
import Link from 'next/link'

type Props = {
  title:    string
  subtitle: string
  action?:  { label: string; href: string }
}

export function EmptyState({ title, subtitle, action }: Props) {
  return (
    <div className="text-center py-16">
      <p className="text-lg font-semibold text-gray-700">{title}</p>
      <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
      {action && (
        <Link href={action.href} className="mt-4 inline-block btn-primary">
          {action.label}
        </Link>
      )}
    </div>
  )
}
```

### 5. Join Feedback
When `joinMutation` is pending, disable the clicked LobbyCard's Join button and show a spinner inside it. When `status === 'joined'`, show a brief toast/banner: "You've joined! Waiting for more players."

---

## Files Produced

```
src/
├── app/
│   └── page.tsx
└── components/
    ├── PageShell.tsx
    ├── LoadingGrid.tsx
    └── EmptyState.tsx
```

## UX Notes
- Recommendations re-fetch automatically on window focus (`staleTime: 0` default in React Query)
- If `playerId` is null (session not yet loaded), show `<LoadingGrid />`
- Do not show a "Quick Match" form on this page — recommendations are surfaced automatically per spec
