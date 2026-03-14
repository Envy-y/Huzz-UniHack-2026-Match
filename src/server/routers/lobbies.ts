import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure, protectedProcedure } from '@/server/trpc'
import { prisma } from '@/lib/prisma'
import { assignVenue } from '@/server/lib/matchmaker'
import { getRecommendations } from '@/server/lib/recommendations'

const dayEnum = z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
const timeEnum = z.enum(['M', 'A', 'N'])
const matchTypeEnum = z.enum(['S', 'D'])
const gameTypeEnum = z.enum(['Competitive', 'Social', 'Casual'])

export const createLobbyInput = z.object({
  lobby_desc: z.string().max(300).optional(),
  lobby_match_type: matchTypeEnum,
  lobby_game_type: gameTypeEnum,
  lobby_days: z.array(dayEnum).min(1),
  lobby_time: timeEnum,
})

const listFiltersInput = z
  .object({
    game: matchTypeEnum.optional(),
    days: z.array(dayEnum).optional(),
    time: timeEnum.optional(),
    objective: gameTypeEnum.optional(),
    skillMin: z.number().int().min(1).max(5).optional(),
    skillMax: z.number().int().min(1).max(5).optional(),
  })
  .optional()

export const lobbiesRouter = router({
  list: publicProcedure.input(listFiltersInput).query(async ({ input }) => {
    return prisma.lobby.findMany({
      where: {
        lobby_status: 'Open',
        ...(input?.game && { lobby_match_type: input.game }),
        ...(input?.time && { lobby_time: input.time }),
        ...(input?.objective && { lobby_game_type: input.objective }),
        ...(input?.days && {
          lobby_days: { hasSome: input.days },
        }),
        ...(input?.skillMin !== undefined && {
          host_level: { gte: input.skillMin },
        }),
        ...(input?.skillMax !== undefined && {
          host_level: { lte: input.skillMax },
        }),
      },
      include: { lobby_players: { include: { player: true } } },
      orderBy: { created_at: 'desc' },
    })
  }),

  create: protectedProcedure
    .input(createLobbyInput)
    .mutation(async ({ input, ctx }) => {
      const player = await prisma.player.findUniqueOrThrow({
        where: { player_id: ctx.playerId },
      })

      const maxPlayers = input.lobby_match_type === 'S' ? 2 : 4

      const lobby = await prisma.lobby.create({
        data: {
          host_player_id: ctx.playerId,
          host_level: player.player_skill,
          lobby_desc: input.lobby_desc,
          lobby_match_type: input.lobby_match_type,
          lobby_game_type: input.lobby_game_type,
          lobby_days: input.lobby_days,
          lobby_time: input.lobby_time,
          lobby_max_players: maxPlayers,
          lobby_status: 'Open',
          lobby_players: {
            create: { player_id: ctx.playerId },
          },
        },
        include: { lobby_players: { include: { player: true } } },
      })

      return lobby
    }),

  recommendations: protectedProcedure
    .input(z.object({ playerId: z.string().uuid() }))
    .query(async ({ input }) => {
      return getRecommendations(input.playerId)
    }),

  search: protectedProcedure
    .input(
      z.object({
        playerId: z.string().uuid(),
        filters: z
          .object({
            matchType: matchTypeEnum.optional(),
            gameType: gameTypeEnum.optional(),
            days: z.array(dayEnum).optional(),
            time: timeEnum.optional(),
            skillMin: z.number().int().min(1).max(5).optional(),
            skillMax: z.number().int().min(1).max(5).optional(),
          })
          .optional(),
      })
    )
    .query(async ({ input }) => {
      let exactMatches = await prisma.lobby.findMany({
        where: {
          lobby_status: 'Open',
          ...(input.filters?.matchType && {
            lobby_match_type: input.filters.matchType,
          }),
          ...(input.filters?.gameType && {
            lobby_game_type: input.filters.gameType,
          }),
          ...(input.filters?.time && { lobby_time: input.filters.time }),
          ...(input.filters?.days?.length && {
            lobby_days: { hasSome: input.filters.days },
          }),
          ...(input.filters?.skillMin !== undefined && {
            host_level: { gte: input.filters.skillMin },
          }),
          ...(input.filters?.skillMax !== undefined && {
            host_level: { lte: input.filters.skillMax },
          }),
        },
        include: { lobby_players: { include: { player: true } } },
        orderBy: { created_at: 'desc' },
        take: 10,
      })

      // Pad to 4 with recommendations if needed
      if (exactMatches.length < 4) {
        const exactIds = new Set(exactMatches.map((l) => l.lobby_id))
        const recs = await getRecommendations(input.playerId)
        const padding = recs.filter((r) => !exactIds.has(r.lobby_id))
        exactMatches = [...exactMatches, ...padding].slice(0, 4)
      }

      return { exactMatches }
    }),

  join: protectedProcedure
    .input(z.object({ lobbyId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const lobby = await prisma.lobby.findUniqueOrThrow({
        where: { lobby_id: input.lobbyId },
        include: { lobby_players: { include: { player: true } } },
      })

      if (lobby.lobby_status !== 'Open') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Lobby is not open.',
        })
      }

      // Check if player is already in the lobby
      const alreadyIn = lobby.lobby_players.some(
        (lp) => lp.player_id === ctx.playerId
      )
      if (alreadyIn) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You are already in this lobby.',
        })
      }

      await prisma.lobbyPlayer.create({
        data: { lobby_id: input.lobbyId, player_id: ctx.playerId },
      })

      const newCount = lobby.lobby_players.length + 1
      if (newCount >= lobby.lobby_max_players) {
        await prisma.lobby.update({
          where: { lobby_id: input.lobbyId },
          data: { lobby_status: 'Full' },
        })

        const allPlayers = await prisma.lobbyPlayer.findMany({
          where: { lobby_id: input.lobbyId },
          include: { player: true },
        })
        const coords = allPlayers
          .filter((lp) => lp.player.player_lat && lp.player.player_long)
          .map((lp) => ({
            lat: lp.player.player_lat!,
            lon: lp.player.player_long!,
          }))

        const venue = await assignVenue(coords)

        const match = await prisma.match.create({
          data: {
            lobby_id: input.lobbyId,
            location_id: venue.location_id,
            match_status: 'Confirmed',
          },
          include: { location: true },
        })

        return { status: 'full' as const, match }
      }

      return { status: 'joined' as const, match: null }
    }),
})
