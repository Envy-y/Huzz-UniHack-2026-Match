import { z } from 'zod'
import { router, publicProcedure } from '@/server/trpc'
import { prisma } from '@/lib/prisma'

export const lobbiesRouter = router({
  // Get up to 4 recommended lobbies for a player
  recommendations: publicProcedure
    .input(z.object({ playerId: z.string().uuid() }))
    .query(async ({ input }) => {
      // For now, return open lobbies sorted by creation date
      // TODO: Implement ranking by past co-players and skill proximity
      const lobbies = await prisma.lobby.findMany({
        where: {
          lobby_status: 'Open',
        },
        include: {
          lobby_players: {
            include: {
              player: true,
            },
          },
          match: {
            include: {
              location: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        take: 4,
      })

      return lobbies
    }),

  // Join a lobby
  join: publicProcedure
    .input(
      z.object({
        lobbyId: z.string().uuid(),
        playerId: z.string().uuid(),
      })
    )
    .mutation(async ({ input }) => {
      const { lobbyId, playerId } = input

      // Check if lobby exists and is open
      const lobby = await prisma.lobby.findUnique({
        where: { lobby_id: lobbyId },
        include: {
          lobby_players: true,
        },
      })

      if (!lobby) {
        throw new Error('Lobby not found')
      }

      if (lobby.lobby_status !== 'Open') {
        throw new Error('Lobby is not open for joining')
      }

      // Check if player is already in lobby
      const existingPlayer = lobby.lobby_players.find(
        (lp) => lp.player_id === playerId
      )

      if (existingPlayer) {
        return { status: 'already_joined', lobby }
      }

      // Add player to lobby
      await prisma.lobbyPlayer.create({
        data: {
          lobby_id: lobbyId,
          player_id: playerId,
        },
      })

      // Check if lobby is now full
      const playerCount = lobby.lobby_players.length + 1

      if (playerCount >= lobby.lobby_max_players) {
        // Update lobby status to Full
        await prisma.lobby.update({
          where: { lobby_id: lobbyId },
          data: { lobby_status: 'Full' },
        })

        // TODO: Create Match and assign venue (B6 dependency)
        // For now, return status as full
        return { status: 'full', lobby, match: null }
      }

      return { status: 'joined', lobby }
    }),

  // List all lobbies with optional filters
  list: publicProcedure
    .input(
      z
        .object({
          game: z.enum(['S', 'D']).optional(),
          days: z.array(z.string()).optional(),
          time: z.enum(['M', 'A', 'N']).optional(),
          objective: z.enum(['Competitive', 'Social', 'Casual']).optional(),
          skillMin: z.number().int().min(1).max(5).optional(),
          skillMax: z.number().int().min(1).max(5).optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const filters = input || {}

      const lobbies = await prisma.lobby.findMany({
        where: {
          lobby_status: 'Open',
          ...(filters.game && { lobby_match_type: filters.game }),
          ...(filters.time && { lobby_time: filters.time }),
          ...(filters.objective && { lobby_game_type: filters.objective }),
          ...(filters.skillMin && { host_level: { gte: filters.skillMin } }),
          ...(filters.skillMax && { host_level: { lte: filters.skillMax } }),
        },
        include: {
          lobby_players: {
            include: {
              player: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      })

      return lobbies
    }),

  // Create a new lobby
  create: publicProcedure
    .input(
      z.object({
        playerId: z.string().uuid(),
        lobby_desc: z.string().optional(),
        lobby_match_type: z.enum(['S', 'D']),
        lobby_game_type: z.enum(['Competitive', 'Social', 'Casual']),
        lobby_days: z.array(z.string()),
        lobby_time: z.enum(['M', 'A', 'N']),
      })
    )
    .mutation(async ({ input }) => {
      const { playerId, ...lobbyData } = input

      // Get player skill level
      const player = await prisma.player.findUnique({
        where: { player_id: playerId },
      })

      if (!player) {
        throw new Error('Player not found')
      }

      // Determine max players based on match type
      const lobby_max_players = lobbyData.lobby_match_type === 'S' ? 2 : 4

      // Create lobby
      const lobby = await prisma.lobby.create({
        data: {
          ...lobbyData,
          host_player_id: playerId,
          host_level: player.player_skill,
          lobby_max_players,
          lobby_status: 'Open',
        },
      })

      // Add creator as first player
      await prisma.lobbyPlayer.create({
        data: {
          lobby_id: lobby.lobby_id,
          player_id: playerId,
        },
      })

      return lobby
    }),
})
