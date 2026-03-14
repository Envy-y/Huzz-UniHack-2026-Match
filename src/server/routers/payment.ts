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

      if (!stripe) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Stripe is not configured. Add STRIPE_SECRET_KEY to .env',
        })
      }

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
