import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '@/server/trpc'
import { prisma } from '@/lib/prisma'

const updateInput = z.object({
  id: z.string().uuid(),
  player_skill: z.number().int().min(1).max(10).optional(),
  player_desc: z.string().max(500).optional(),
  player_lat: z.number().optional(),
  player_long: z.number().optional(),
})

export const playersRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    return prisma.player.findUnique({
      where: { player_id: ctx.playerId },
    })
  }),

  create: publicProcedure
    .input(
      z.object({
        player_id: z.string().uuid(),
        player_fname: z.string().min(1),
        player_lname: z.string().min(1),
        player_dob: z.string(), // ISO date string
        player_gender: z.string(),
        player_skill: z.number().int().min(1).max(10),
      })
    )
    .mutation(async ({ input }) => {
      // Use raw SQL to bypass Prisma's FK validation on the pooled connection.
      // The player_auth_fk constraint is checked at DB level — if the trigger
      // created the row, this becomes an update; if not, the raw INSERT
      // with ON CONFLICT handles both cases.
      const result = await prisma.$queryRaw<Array<Record<string, unknown>>>`
        INSERT INTO "Player" (
          player_id, player_fname, player_lname,
          player_dob, player_gender, player_skill
        ) VALUES (
          ${input.player_id}::uuid,
          ${input.player_fname},
          ${input.player_lname},
          ${input.player_dob}::date,
          ${input.player_gender},
          ${input.player_skill}
        )
        ON CONFLICT (player_id) DO UPDATE SET
          player_fname  = EXCLUDED.player_fname,
          player_lname  = EXCLUDED.player_lname,
          player_dob    = EXCLUDED.player_dob,
          player_gender = EXCLUDED.player_gender,
          player_skill  = EXCLUDED.player_skill
        RETURNING *
      `
      return result[0]
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
