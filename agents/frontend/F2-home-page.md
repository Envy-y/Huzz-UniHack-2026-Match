# F2 — Home Page

## Role
Build the `/` home page. On load it auto-fetches up to 4 recommended lobbies for the logged-in player and displays them as `LobbyCard`s. Joining a lobby routes to `/payment` if the lobby becomes full, or stays with a success message otherwise.

## Style Reference
**All visual decisions must follow [`STYLEGUIDE.md`](../../STYLEGUIDE.md).** Key sections:
- §2 Colour palette — page bg `#f0fafa`, mint-500 CTAs
- §6 Lobby Cards — badge colours, level dots, host note, slots pill
- §8 Navigation — Navbar already provided by LayoutWrapper
- §9 Page background — `bg-[#f0fafa]`
- §10 Section headers — `text-[#0d3d3a] font-extrabold`

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
import { PageShell }   from '@/components/PageShell'
import { LoadingGrid } from '@/components/LoadingGrid'
import { EmptyState }  from '@/components/EmptyState'
import { useRouter }   from 'next/navigation'
import { useState }    from 'react'

export default function HomePage() {
  const router             = useRouter()
  const { playerId }       = usePlayer()
  const [joiningLobbyId, setJoiningLobbyId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const { data: lobbies, isLoading, refetch } = trpc.lobbies.recommendations.useQuery(
    { playerId: playerId! },
    { enabled: !!playerId }
  )

  const joinMutation = trpc.lobbies.join.useMutation({
    onMutate: (variables) => { setJoiningLobbyId(variables.lobbyId); setSuccessMessage(null) },
    onSuccess: (data) => {
      if (data.status === 'full' && data.match) {
        router.push(`/payment?matchId=${data.match.match_id}`)
      } else if (data.status === 'joined') {
        setSuccessMessage("You've joined! Waiting for more players.")
        refetch()
      } else if (data.status === 'already_joined') {
        setSuccessMessage("You're already in this lobby!")
      }
      setJoiningLobbyId(null)
    },
    onError: (error) => {
      setSuccessMessage(null)
      setJoiningLobbyId(null)
      alert(error.message)
    },
  })

  const handleJoin = (lobbyId: string) => {
    if (!playerId) { router.push('/login'); return }
    joinMutation.mutate({ lobbyId, playerId })
  }

  if (isLoading || !playerId) {
    return <PageShell><LoadingGrid /></PageShell>
  }

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Section header — §10 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-br from-mint-600 to-mint-800 bg-clip-text text-transparent mb-2">
            Good match today?
          </h1>
          <p className="text-gray-600">Recommended lobbies just for you</p>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-mint-50 border border-mint-200 text-mint-700 text-sm animate-in fade-in-50 slide-in-from-top-2">
            {successMessage}
          </div>
        )}

        {lobbies && lobbies.length > 0 ? (
          <div className="grid gap-2.5">
            {lobbies.map((lobby) => (
              <LobbyCard
                key={lobby.lobby_id}
                lobby={lobby}
                onJoin={handleJoin}
                highlighted={lobby.lobby_status === 'Full' || lobby.lobby_status === 'Matched'}
                isJoining={joiningLobbyId === lobby.lobby_id}
                disabled={!!joiningLobbyId}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No lobbies yet"
            subtitle="Be the first — create one or find a match with advanced search."
            action={{ label: 'Create a lobby', href: '/create' }}
          />
        )}
      </div>
    </PageShell>
  )
}
```

### 2. `PageShell` Layout Wrapper
`src/components/PageShell.tsx` — wraps all pages with consistent page background. Navbar is injected by LayoutWrapper in layout.tsx.

```tsx
import { ReactNode } from 'react'

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f0fafa]">
      <main>{children}</main>
    </div>
  )
}
```

### 3. `LoadingGrid` Skeleton
`src/components/LoadingGrid.tsx` — four skeleton cards shown while data loads. Use mint tint instead of gray.

```tsx
export function LoadingGrid() {
  return (
    <div className="grid gap-2.5 max-w-2xl mx-auto px-4 py-8">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-48 rounded-[18px] bg-mint-50/60 animate-pulse border border-[rgba(48,213,200,0.10)]"
        />
      ))}
    </div>
  )
}
```

### 4. `EmptyState` Component
`src/components/EmptyState.tsx`:

```tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Props = {
  title:    string
  subtitle: string
  action?:  { label: string; href: string }
}

export function EmptyState({ title, subtitle, action }: Props) {
  return (
    <div className="text-center py-16 px-4">
      <div className="text-6xl mb-4">🏸</div>
      <h3 className="text-lg font-semibold text-[#0d3d3a] mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">{subtitle}</p>
      {action && (
        <Link href={action.href}>
          <Button>{action.label}</Button>
        </Link>
      )}
    </div>
  )
}
```

### 5. Join Feedback
When `joinMutation` is pending, disable the clicked LobbyCard's Join button and show a spinner inside it. When `status === 'joined'`, show a mint info banner (§14 info alert).

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
- Card gap: `gap-2.5` (10px) per STYLEGUIDE §4
