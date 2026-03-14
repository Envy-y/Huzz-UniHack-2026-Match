// Stub — B4 will own this file and add .get, .update, .matchHistory
import { z } from 'zod'
import { router, publicProcedure } from '@/server/trpc'
import { prisma } from '@/lib/prisma'

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

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        player_skill: z.number().int().min(1).max(5).optional(),
        player_desc: z.string().optional(),
        player_lat: z.number().optional(),
        player_long: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input
      return prisma.player.update({
        where: { player_id: id },
        data,
      })
    }),
})
