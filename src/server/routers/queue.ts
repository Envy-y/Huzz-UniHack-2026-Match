import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '@/server/trpc'
import { prisma } from '@/lib/prisma'
import { findMatch, assignVenue } from '@/server/lib/matchmaker'

export const queueRouter = router({
  join: protectedProcedure
    .input(
      z.object({
        skill: z.number().int().min(1).max(10),
        game: z.enum(['S', 'D']),
        days: z
          .array(z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']))
          .min(1),
        time: z.enum(['M', 'A', 'N']),
        objective: z.enum(['Competitive', 'Social', 'Casual']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const player = await prisma.player.findUniqueOrThrow({
        where: { player_id: ctx.playerId },
      })

      if (!player.player_lat || !player.player_long) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Player location not set. Update your profile to enable matchmaking.',
        })
      }

      const playerInput = {
        playerId: ctx.playerId,
        skill: input.skill,
        game: input.game,
        days: input.days,
        time: input.time,
        objective: input.objective,
        lat: player.player_lat,
        lon: player.player_long,
      }

      // Phase 1: find exact match
      const matchedLobby = await findMatch(playerInput)

      if (matchedLobby) {
        // Add player to matched lobby
        await prisma.lobbyPlayer.create({
          data: {
            lobby_id: matchedLobby.lobby_id,
            player_id: ctx.playerId,
          },
        })

        // Check if lobby is now full
        const allPlayers = await prisma.lobbyPlayer.findMany({
          where: { lobby_id: matchedLobby.lobby_id },
          include: { player: true },
        })

        if (allPlayers.length >= matchedLobby.lobby_max_players) {
          const coords = allPlayers
            .filter((lp) => lp.player.player_lat && lp.player.player_long)
            .map((lp) => ({
              lat: lp.player.player_lat!,
              lon: lp.player.player_long!,
            }))

          const venue = await assignVenue(coords)

          // Create match with snapshot fields from the lobby
          const match = await prisma.match.create({
            data: {
              location_id: venue.location_id,
              match_status: 'Confirmed',
              match_type: matchedLobby.lobby_match_type,
              game_type: matchedLobby.lobby_game_type,
              match_days: matchedLobby.lobby_days,
              match_time: matchedLobby.lobby_time,
              match_players: {
                create: allPlayers.map((lp) => ({
                  player_id: lp.player_id,
                })),
              },
            },
            include: { location: true, match_players: { include: { player: true } } },
          })

          // Delete the lobby (cascades LobbyPlayers + Notifications)
          await prisma.lobby.delete({
            where: { lobby_id: matchedLobby.lobby_id },
          })

          return { status: 'matched' as const, match }
        }

        return { status: 'joined' as const, lobby: matchedLobby, match: null }
      }

      // Phase 2: no match — create a new lobby
      const maxPlayers = input.game === 'S' ? 2 : 4

      const newLobby = await prisma.lobby.create({
        data: {
          host_player_id: ctx.playerId,
          host_level: input.skill,
          lobby_match_type: input.game,
          lobby_game_type: input.objective,
          lobby_days: input.days,
          lobby_time: input.time,
          lobby_max_players: maxPlayers,
          lobby_status: 'Open',
          lobby_players: { create: { player_id: ctx.playerId } },
        },
        include: { lobby_players: { include: { player: true } } },
      })

      return { status: 'created' as const, lobby: newLobby, match: null }
    }),
})
