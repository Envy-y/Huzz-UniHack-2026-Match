import { z } from 'zod'
import { router, publicProcedure } from '@/server/trpc'
import { prisma } from '@/lib/prisma'
import { scrapeAvailability } from '@/server/lib/scraper'

export const adminRouter = router({
  reset: publicProcedure.mutation(async () => {
    // Delete in dependency order
    await prisma.matchPlayer.deleteMany()
    await prisma.match.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.lobbyPlayer.deleteMany()
    await prisma.lobby.deleteMany()
    return { success: true, message: 'All lobbies, matches, and notifications cleared.' }
  }),

  scrape: publicProcedure
    .input(
      z.object({
        locationIds: z.array(z.string()),
        startDate: z.string(),
        numDays: z.number().int().min(1).max(14),
      })
    )
    .mutation(async ({ input }) => {
      const locations = await prisma.location.findMany({
        where: { location_id: { in: input.locationIds } },
      })

      const results = await Promise.allSettled(
        locations.map((loc) =>
          scrapeAvailability(loc, input.startDate, input.numDays)
        )
      )

      const summary = results.map((r, i) => ({
        locationId: locations[i].location_id,
        status: r.status,
        slots: r.status === 'fulfilled' ? r.value.length : 0,
        error: r.status === 'rejected' ? String(r.reason) : null,
      }))

      return { summary }
    }),
})
