import { initTRPC, TRPCError } from '@trpc/server'
import type { Context } from './context'

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure

// Throws UNAUTHORIZED if playerId is missing
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.playerId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { ...ctx, playerId: ctx.playerId } })
})
