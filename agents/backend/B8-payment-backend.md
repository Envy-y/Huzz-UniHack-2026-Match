# B8 — Payment Backend

## Role
Implement the `payment` tRPC sub-router using Stripe in test mode. When a lobby fills and a `Match` is created (by B6), this agent handles creating a Stripe Checkout Session for each player, exposing the session URL to the frontend payment page, and processing payment confirmations via a Stripe webhook.

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

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
```

Uses the Stripe SDK's default API version (matches the installed `stripe` npm package version).

### 2. Court Booking Fee Constant
Already exists in `src/types.ts`:

```ts
export const COURT_FEE_CENTS = 2000 // $20.00 AUD per booking
```

No changes needed — value matches spec.

### 3. `payment.createSession` and `payment.getMatch`
Replace stub in `src/server/routers/payment.ts`:

```ts
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '@/server/trpc'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { COURT_FEE_CENTS } from '@/types'

export const paymentRouter = router({
  createSession: protectedProcedure
    .input(z.object({ matchId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const match = await prisma.match.findUniqueOrThrow({
        where: { match_id: input.matchId },
        include: {
          lobby: { include: { lobby_players: true } },
          location: true,
        },
      })

      // Verify caller is a participant
      const isParticipant = match.lobby.lobby_players.some(
        (lp) => lp.player_id === ctx.playerId
      )
      if (!isParticipant) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not a participant in this match.',
        })
      }

      const playerCount = match.lobby.lobby_players.length
      const splitCents = Math.ceil(COURT_FEE_CENTS / playerCount)

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'aud',
              unit_amount: splitCents,
              product_data: {
                name: `Court booking — ${match.location.location_name}`,
                description: `Your share: 1/${playerCount} of the court fee`,
              },
            },
          },
        ],
        metadata: {
          matchId: match.match_id,
          playerId: ctx.playerId,
        },
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?matchId=${match.match_id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment?matchId=${match.match_id}`,
      })

      return { url: session.url!, sessionId: session.id }
    }),

  getMatch: protectedProcedure
    .input(z.object({ matchId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const match = await prisma.match.findUniqueOrThrow({
        where: { match_id: input.matchId },
        include: {
          location: true,
          lobby: {
            include: { lobby_players: { include: { player: true } } },
          },
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
      const splitCents = Math.ceil(COURT_FEE_CENTS / playerCount)

      return {
        match,
        splitCents,
        totalCents: COURT_FEE_CENTS,
        playerCount,
      }
    }),
})
```

### 4. Stripe Webhook Endpoint
Create `src/app/api/stripe-webhook/route.ts`:

When Stripe completes a checkout session, this webhook updates the lobby status to `'Matched'`.

```ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    )
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const matchId = session.metadata?.matchId

    if (matchId) {
      const match = await prisma.match.findUnique({
        where: { match_id: matchId },
      })

      if (match) {
        await prisma.lobby.update({
          where: { lobby_id: match.lobby_id },
          data: { lobby_status: 'Matched' },
        })
      }
    }
  }

  return NextResponse.json({ received: true })
}
```

**Local testing with Stripe CLI:**
```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
```
This prints a webhook signing secret — set it as `STRIPE_WEBHOOK_SECRET` in `.env`.

### 5. Environment Variables
Create `.env.example` with all required vars (no secrets):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=

# OpenAI
OPENAI_API_KEY=

# Vapi.ai
NEXT_PUBLIC_VAPI_PUBLIC_KEY=

# Stripe (use TEST keys only)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# App base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Add `STRIPE_WEBHOOK_SECRET` and uncomment `NEXT_PUBLIC_BASE_URL` in `.env`.

### 6. Payment Success Page (stub for F6)
Create `src/app/payment/success/page.tsx` as a minimal stub:

```tsx
export default function PaymentSuccessPage() {
  return (
    <main className="p-8 text-center">
      <h1 className="text-2xl font-bold text-green-600">Payment confirmed!</h1>
      <p className="mt-2 text-gray-600">
        Your court is booked. See you on the court!
      </p>
    </main>
  )
}
```

F6 will expand the full payment page UI.

### 7. Stripe Test Card
Use test card `4242 4242 4242 4242` with any future expiry and any CVC. No real charges are made.

---

## Files Produced / Modified

```
src/
├── lib/
│   └── stripe.ts                    (new)
├── server/routers/
│   └── payment.ts                   (replaces B3 stub)
├── app/
│   ├── api/stripe-webhook/
│   │   └── route.ts                 (new — Stripe webhook)
│   └── payment/success/
│       └── page.tsx                 (new stub — F6 expands)
.env                                 (STRIPE_WEBHOOK_SECRET added, BASE_URL uncommented)
.env.example                         (new — all env vars documented)
```

## Contracts Exposed

| Endpoint | Type | Input | Output |
|----------|------|-------|--------|
| `payment.createSession` | tRPC mutation | `{ matchId }` | `{ url: string, sessionId: string }` |
| `payment.getMatch` | tRPC query | `{ matchId }` | `{ match, splitCents, totalCents, playerCount }` |
| `POST /api/stripe-webhook` | Next.js route | Stripe event payload | `{ received: true }` |

Frontend usage (F6):
```ts
// On payment page load, get match info
const { data } = trpc.payment.getMatch.useQuery({ matchId })

// When player clicks "Pay"
const session = trpc.payment.createSession.useMutation({
  onSuccess: ({ url }) => window.location.href = url  // redirect to Stripe Checkout
})
```

## Payment Flow

```
Lobby fills (B6)
      ↓
Match created (status=Confirmed)
      ↓
Player navigates to /payment?matchId=...
      ↓
F6 calls payment.getMatch → displays court, fee split
      ↓
Player clicks "Pay" → payment.createSession
      ↓
Redirect to Stripe Checkout (test mode)
      ↓
Player pays with test card 4242 4242 4242 4242
      ↓
Stripe redirects to /payment/success?matchId=...
      ↓
Stripe webhook fires → POST /api/stripe-webhook
      ↓
lobby_status updated to 'Matched'
```

## Notes for F6
- Each player must complete payment individually
- Stripe redirects back to `/payment/success?matchId=...` on success
- Use Stripe test mode — never real cards in the demo
- On webhook `checkout.session.completed`, lobby status transitions from `'Full'` → `'Matched'`
- For local testing, run `stripe listen --forward-to localhost:3000/api/stripe-webhook` to receive webhook events
