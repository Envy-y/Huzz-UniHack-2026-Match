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
      try {
        return await prisma.player.create({
          data: {
            ...input,
            player_dob: new Date(input.player_dob),
          },
        })
      } catch (err) {
        console.error('[players.create] Prisma error:', err)
        throw err
      }
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
})
