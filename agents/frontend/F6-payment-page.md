# F6 — Payment Page

## Role
Build the `/payment` page shown after a lobby fills and a `Match` is confirmed. Displays the venue, match details, and each player's fee share. Clicking "Pay" creates a Stripe Checkout Session and redirects the player to Stripe's hosted payment page. Also builds the `/payment/success` confirmation page.

## Dependencies
- **B8** complete: `payment.createSession` and `payment.getMatch` procedures, Stripe test mode configured
- **B2** complete: `usePlayer` hook
- **B3** complete: `trpc` client

## Full Feature Awareness
All app pages for reference:
- `/` — home + recommendations (F2)
- `/match` — voice search (F3)
- `/create` — create lobby (F4)
- `/profile` — player profile + history (F5)
- `/payment` — **this page** — pay for court booking

---

## Tasks

### 1. Payment Page
`src/app/payment/page.tsx`

The `matchId` is passed as a URL query param: `/payment?matchId=<uuid>`

```tsx
'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { trpc }                       from '@/lib/trpc'
import { usePlayer }                  from '@/hooks/usePlayer'
import { PageShell }                  from '@/components/PageShell'

export default function PaymentPage() {
  const params    = useSearchParams()
  const matchId   = params.get('matchId') ?? ''
  const router    = useRouter()
  const { playerId } = usePlayer()

  const { data, isLoading } = trpc.payment.getMatch.useQuery(
    { matchId },
    { enabled: !!matchId && !!playerId }
  )

  const createSession = trpc.payment.createSession.useMutation({
    onSuccess: ({ url }) => {
      window.location.href = url   // redirect to Stripe Checkout
    },
  })

  if (isLoading) {
    return (
      <PageShell>
        <div className="max-w-md mx-auto px-4 py-16 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-gray-200 animate-pulse" />
          ))}
        </div>
      </PageShell>
    )
  }

  if (!data) {
    return (
      <PageShell>
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <p className="text-gray-500">Match not found or access denied.</p>
          <button type="button" onClick={() => router.push('/')} className="mt-4 btn-primary">
            Go home
          </button>
        </div>
      </PageShell>
    )
  }

  const { match, splitCents, totalCents, playerCount } = data
  const splitDisplay = (splitCents / 100).toFixed(2)
  const totalDisplay = (totalCents / 100).toFixed(2)

  return (
    <PageShell>
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">

        <div className="text-center">
          <h1 className="text-2xl font-bold">You've been matched!</h1>
          <p className="text-gray-500 text-sm mt-1">Complete your payment to confirm the court booking</p>
        </div>

        {/* Match summary card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border space-y-4">
          <h2 className="font-semibold text-gray-800">Match Details</h2>

          <dl className="space-y-2 text-sm">
            <InfoRow label="Venue"     value={match.location.location_name} />
            <InfoRow label="Address"   value={match.location.location_address} />
            <InfoRow label="Match type"
              value={match.lobby.lobby_match_type === 'S' ? 'Singles' : 'Doubles'} />
            <InfoRow label="Objective" value={match.lobby.lobby_game_type} />
            {match.start_time && (
              <InfoRow
                label="Date & time"
                value={new Date(match.start_time).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}
              />
            )}
          </dl>
        </div>

        {/* Payment breakdown */}
        <div className="bg-white rounded-xl p-6 shadow-sm border space-y-3">
          <h2 className="font-semibold text-gray-800">Payment Breakdown</h2>

          <div className="flex justify-between text-sm text-gray-600">
            <span>Total court fee</span>
            <span>${totalDisplay} AUD</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Split between</span>
            <span>{playerCount} players</span>
          </div>
          <div className="border-t pt-3 flex justify-between font-semibold text-gray-900">
            <span>Your share</span>
            <span className="text-blue-600">${splitDisplay} AUD</span>
          </div>
        </div>

        {/* Players list */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="font-semibold text-gray-800 mb-3">Players</h2>
          <ul className="space-y-2">
            {match.lobby.lobby_players.map((lp) => (
              <li key={lp.player_id} className="flex items-center justify-between text-sm">
                <span>{lp.player.player_fname} {lp.player.player_lname}</span>
                <span className="text-gray-400">Skill {lp.player.player_skill}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={() => createSession.mutate({ matchId })}
          disabled={createSession.isPending || !playerId}
          className="btn-primary w-full text-base py-3"
        >
          {createSession.isPending ? 'Redirecting to payment...' : `Pay $${splitDisplay} AUD`}
        </button>

        <p className="text-center text-xs text-gray-400">
          Test mode — use card <code className="font-mono">4242 4242 4242 4242</code>, any expiry, any CVC
        </p>
      </div>
    </PageShell>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-400">{label}</dt>
      <dd className="text-gray-800 font-medium text-right">{value}</dd>
    </div>
  )
}
```

### 2. Payment Success Page
Replace B8's stub at `src/app/payment/success/page.tsx`:

```tsx
'use client'
import { useSearchParams } from 'next/navigation'
import Link                from 'next/link'
import { PageShell }       from '@/components/PageShell'

export default function PaymentSuccessPage() {
  const params  = useSearchParams()
  const matchId = params.get('matchId')

  return (
    <PageShell>
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="text-5xl">🏸</div>
        <h1 className="text-2xl font-bold text-green-600">Payment confirmed!</h1>
        <p className="text-gray-500">
          Your court is booked. Check your profile for match details.
        </p>
        <div className="flex gap-3 justify-center mt-6">
          <Link href="/profile" className="btn-primary">View Match History</Link>
          <Link href="/"        className="btn-primary bg-gray-200 text-gray-800 hover:bg-gray-300">Home</Link>
        </div>
      </div>
    </PageShell>
  )
}
```

---

## Files Produced

```
src/app/payment/
├── page.tsx
└── success/
    └── page.tsx
```

## UX Notes
- Payment page is reached from any "Join" button when a lobby fills — routed with `?matchId=<uuid>`
- Each player must complete payment individually; the page does not wait for other players
- Stripe Checkout is fully hosted — no card input on our pages
- After successful payment, Stripe redirects to `/payment/success?matchId=<uuid>` (configured in B8's `success_url`)
- After cancellation, Stripe redirects back to `/payment?matchId=<uuid>` so the player can retry
- `match_status` is not updated by payment for the demo — no Stripe webhook required
