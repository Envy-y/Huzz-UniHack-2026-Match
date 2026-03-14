import { router } from '@/server/trpc'
import { playersRouter } from './players'
import { lobbiesRouter } from './lobbies'
import { queueRouter } from './queue'
import { paymentRouter } from './payment'
import { adminRouter } from './admin'

export const appRouter = router({
  players: playersRouter,
  lobbies: lobbiesRouter,
  queue: queueRouter,
  payment: paymentRouter,
  admin: adminRouter,
})

export type AppRouter = typeof appRouter
