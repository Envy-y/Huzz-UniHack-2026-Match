import { prisma } from '@/lib/prisma'

export async function getRecommendations(playerId: string, limit = 4) {
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
  })
  if (!player) return []

  // Past co-player IDs
  const pastLobbyIds = (
    await prisma.lobbyPlayer.findMany({
      where: { player_id: playerId },
      select: { lobby_id: true },
    })
  ).map((lp) => lp.lobby_id)

  const pastCoPlayerIds = new Set(
    (
      await prisma.lobbyPlayer.findMany({
        where: {
          lobby_id: { in: pastLobbyIds },
          player_id: { not: playerId },
        },
        select: { player_id: true },
      })
    ).map((lp) => lp.player_id)
  )

  // All open lobbies (exclude the player's own)
  const openLobbies = await prisma.lobby.findMany({
    where: {
      lobby_status: 'Open',
      host_player_id: { not: playerId },
    },
    include: { lobby_players: { include: { player: true } } },
  })

  // Score and sort: co-players first, then skill proximity
  const scored = openLobbies.map((lobby) => {
    const coPlayerScore = lobby.lobby_players.filter((lp) =>
      pastCoPlayerIds.has(lp.player_id)
    ).length
    const skillGap = Math.abs(lobby.host_level - player.player_skill)
    return { lobby, coPlayerScore, skillGap }
  })

  scored.sort(
    (a, b) => b.coPlayerScore - a.coPlayerScore || a.skillGap - b.skillGap
  )

  return scored.slice(0, limit).map((s) => s.lobby)
}
