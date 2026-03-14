import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Vapi sends tool calls in this structure
  const toolCall = body.message?.toolCalls?.[0]
  if (!toolCall || toolCall.function.name !== 'searchLobbies') {
    return NextResponse.json({ error: 'Unknown tool' }, { status: 400 })
  }

  const args = JSON.parse(toolCall.function.arguments)

  // Build Prisma where clause from structured params
  const where: Prisma.LobbyWhereInput = {
    lobby_status: 'Open',
    ...(args.matchType && { lobby_match_type: args.matchType }),
    ...(args.gameType && { lobby_game_type: args.gameType }),
    ...(args.time && { lobby_time: args.time }),
    ...(args.days?.length && { lobby_days: { hasSome: args.days } }),
    ...(args.skillMin !== undefined && {
      host_level: { gte: args.skillMin },
    }),
    ...(args.skillMax !== undefined && {
      host_level: { lte: args.skillMax },
    }),
  }

  const lobbies = await prisma.lobby.findMany({
    where,
    include: { lobby_players: { include: { player: true } } },
    orderBy: { created_at: 'desc' },
    take: 10,
  })

  // Format results for Vapi to read aloud
  const results = lobbies.map((l) => ({
    lobby_id: l.lobby_id,
    matchType: l.lobby_match_type === 'S' ? 'Singles' : 'Doubles',
    gameType: l.lobby_game_type,
    days: l.lobby_days,
    time:
      l.lobby_time === 'M'
        ? 'Morning'
        : l.lobby_time === 'A'
          ? 'Afternoon'
          : 'Night',
    skillLevel: l.host_level,
    players: l.lobby_players.length,
    maxPlayers: l.lobby_max_players,
    description: l.lobby_desc,
  }))

  // Vapi expects tool result in this format
  return NextResponse.json({
    results: [
      {
        toolCallId: toolCall.id,
        result: JSON.stringify({
          count: results.length,
          lobbies: results,
        }),
      },
    ],
  })
}
