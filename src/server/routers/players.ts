import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '@/server/trpc'
import { prisma } from '@/lib/prisma'

const updateInput = z.object({
  id: z.string().uuid(),
  player_skill: z.number().int().min(1).max(5).optional(),
  player_desc: z.string().max(500).optional(),
  player_lat: z.number().optional(),
  player_long: z.number().optional(),
})

export const playersRouter = router({
  create: publicProcedure
    .input(
      z.object({
        player_id: z.string().uuid(),
        player_fname: z.string().min(1),
        player_lname: z.string().min(1),
        player_dob: z.string(), // ISO date string
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

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const player = await prisma.player.findUniqueOrThrow({
        where: { player_id: input.id },
      })
      return player
    }),

  update: protectedProcedure
    .input(updateInput)
    .mutation(async ({ input }) => {
      const { id, ...data } = input
      return prisma.player.update({
        where: { player_id: id },
        data,
      })
    }),

  matchHistory: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      // Find all lobby IDs the player is in
      const lobbyPlayers = await prisma.lobbyPlayer.findMany({
        where: { player_id: input.id },
        select: { lobby_id: true },
      })
      const lobbyIds = lobbyPlayers.map((lp) => lp.lobby_id)

      // Return matches for those lobbies with venue info
      return prisma.match.findMany({
        where: {
          lobby_id: { in: lobbyIds },
          match_status: { in: ['Confirmed', 'Played'] },
        },
        include: { location: true, lobby: true },
        orderBy: { created_at: 'desc' },
      })
    }),
})
