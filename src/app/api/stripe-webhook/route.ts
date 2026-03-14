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
      // Update lobby status to 'Matched' indicating payment is done
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
