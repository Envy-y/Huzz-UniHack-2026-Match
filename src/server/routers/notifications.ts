import { z } from 'zod'
import { router, protectedProcedure } from '@/server/trpc'
import { prisma } from '@/lib/prisma'
import { TRPCError } from '@trpc/server'

export const notificationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return prisma.notification.findMany({
      where: { player_id: ctx.playerId },
      include: { lobby: { include: { match: true } } },
      orderBy: { created_at: 'desc' },
      take: 30,
    })
  }),

  respond: protectedProcedure
    .input(z.object({
      notificationId: z.string().uuid(),
      action: z.enum(['stay', 'leave']),
    }))
    .mutation(async ({ input, ctx }) => {
      const notification = await prisma.notification.findUniqueOrThrow({
        where: { notification_id: input.notificationId },
      })

      if (notification.player_id !== ctx.playerId) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      if (input.action === 'leave') {
        await prisma.lobbyPlayer.deleteMany({
          where: { lobby_id: notification.lobby_id, player_id: ctx.playerId },
        })
        // Delete the match and reopen the lobby so it can be re-filled
        await prisma.match.deleteMany({
          where: { lobby_id: notification.lobby_id },
        })
        await prisma.lobby.update({
          where: { lobby_id: notification.lobby_id },
          data: { lobby_status: 'Open' },
        })
      }

      await prisma.notification.update({
        where: { notification_id: input.notificationId },
        data: { is_read: true },
      })

      return { ok: true }
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await prisma.notification.updateMany({
      where: { player_id: ctx.playerId, is_read: false },
      data: { is_read: true },
    })
    return { ok: true }
  }),
})
