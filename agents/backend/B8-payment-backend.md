# B8 — Payment Backend

## Role
Implement the `payment` tRPC sub-router using Stripe in test mode. When a lobby fills and a `Match` is created (by B6), this agent handles creating a Stripe Checkout Session for each player and exposing the session URL to the frontend payment page.

## Dependencies
- **B6** complete: `Match` rows are created by `queue.join` and `lobbies.join`; `match_status = 'Confirmed'` exists in DB

## Blocks
- **F6** (Payment Page) — calls `payment.createSession` to get a Stripe checkout URL

---

## Tasks

### 1. Stripe Server Client
Create `src/lib/stripe.ts`:

```ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})
```

### 2. Court Booking Fee Constant
Add to `src/types.ts` (append — do not overwrite B1's content):

```ts
// Court booking fee in AUD cents (e.g. 2000 = $20.00)
export const COURT_FEE_CENTS = 2000
```

### 3. `payment.createSession`
Replace stub in `src/server/routers/payment.ts`:

```ts
import { z }                          from 'zod'
import { router, protectedProcedure } from '@/server/trpc'
import { prisma }                     from '@/lib/prisma'
import { stripe }                     from '@/lib/stripe'
import { COURT_FEE_CENTS }            from '@/types'
import { TRPCError }                  from '@trpc/server'

export const paymentRouter = router({
  createSession: protectedProcedure
    .input(z.object({ matchId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const match = await prisma.match.findUniqueOrThrow({
        where:   { match_id: input.matchId },
        include: { lobby: { include: { lobby_players: true } }, location: true },
      })

      // Verify caller is a participant
      const isParticipant = match.lobby.lobby_players.some(
        (lp) => lp.player_id === ctx.playerId
      )
      if (!isParticipant) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a participant in this match.' })
      }

      const playerCount  = match.lobby.lobby_players.length
      const splitCents   = Math.ceil(COURT_FEE_CENTS / playerCount)

      const session = await stripe.checkout.sessions.create({
        mode:        'payment',
        line_items: [{
          quantity:   1,
          price_data: {
            currency:     'aud',
            unit_amount:  splitCents,
            product_data: {
              name:        `Court booking — ${match.location.location_name}`,
              description: `Your share: 1/${playerCount} of the court fee`,
            },
          },
        }],
        metadata: {
          matchId:  match.match_id,
          playerId: ctx.playerId,
        },
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?matchId=${match.match_id}`,
        cancel_url:  `${process.env.NEXT_PUBLIC_BASE_URL}/payment?matchId=${match.match_id}`,
      })

      return { url: session.url!, sessionId: session.id }
    }),

  getMatch: protectedProcedure
    .input(z.object({ matchId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const match = await prisma.match.findUniqueOrThrow({
        where:   { match_id: input.matchId },
        include: {
          location: true,
          lobby: { include: { lobby_players: { include: { player: true } } } },
        },
      })

      // Verify caller is a participant
      const isParticipant = match.lobby.lobby_players.some(
        (lp) => lp.player_id === ctx.playerId
      )
      if (!isParticipant) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const playerCount = match.lobby.lobby_players.length
      const splitCents  = Math.ceil(COURT_FEE_CENTS / playerCount)

      return {
        match,
        splitCents,
        totalCents: COURT_FEE_CENTS,
        playerCount,
      }
    }),
})
```

### 4. Add `NEXT_PUBLIC_BASE_URL` to `.env.example`
Append to `.env.example`:

```bash
NEXT_PUBLIC_BASE_URL=http://localhost:3000   # change for prod
```

### 5. Payment Success Page (stub for F6)
Create `src/app/payment/success/page.tsx` as a minimal stub:

```tsx
export default function PaymentSuccessPage() {
  return (
    <main className="p-8 text-center">
      <h1 className="text-2xl font-bold text-green-600">Payment confirmed!</h1>
      <p className="mt-2 text-gray-600">Your court is booked. See you on the court!</p>
    </main>
  )
}
```

F6 will expand the full payment page UI.

### 6. Stripe Test Card
Use test card `4242 4242 4242 4242` with any future expiry and any CVC. No real charges are made.

---

## Files Produced / Modified

```
src/
├── lib/
│   └── stripe.ts
├── server/routers/
│   └── payment.ts           (replaces B3 stub)
├── app/payment/
│   └── success/
│       └── page.tsx         (stub — F6 expands)
└── types.ts                 (COURT_FEE_CENTS appended)
.env.example                 (NEXT_PUBLIC_BASE_URL appended)
```

## Contracts Exposed

| Procedure | Input | Output |
|-----------|-------|--------|
| `payment.createSession` | `{ matchId }` | `{ url: string, sessionId: string }` |
| `payment.getMatch` | `{ matchId }` | `{ match, splitCents, totalCents, playerCount }` |

Frontend usage (F6):
```ts
// On payment page load, get match info
const { data } = trpc.payment.getMatch.useQuery({ matchId })

// When player clicks "Pay"
const session = trpc.payment.createSession.useMutation({
  onSuccess: ({ url }) => window.location.href = url  // redirect to Stripe Checkout
})
```

## Note for F6
- Each player must complete payment individually
- Stripe redirects back to `/payment/success?matchId=...` on success
- Use Stripe test mode — never real cards in the demo
- The `match_status` stays `'Confirmed'` regardless of payment for the demo; no webhook required
