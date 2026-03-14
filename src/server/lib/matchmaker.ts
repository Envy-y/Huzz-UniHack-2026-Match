import { prisma } from '@/lib/prisma'
import { haversineKm } from './haversine'
import { MAX_VENUE_KM } from '@/types'
import type { Lobby, Location } from '@prisma/client'

// Skill gap allowed per objective
const SKILL_GAP: Record<string, number> = {
  Competitive: 1,
  Casual: 2,
  Social: Infinity,
}

export type PlayerInput = {
  playerId: string
  skill: number
  game: 'S' | 'D'
  days: string[]
  time: string
  objective: string
  lat: number
  lon: number
}

// Returns the best matching open lobby, or null if none found
export async function findMatch(input: PlayerInput): Promise<Lobby | null> {
  const allowedGap = SKILL_GAP[input.objective] ?? Infinity

  const openLobbies = await prisma.lobby.findMany({
    where: {
      lobby_status: 'Open',
      lobby_match_type: input.game,
      lobby_time: input.time,
      lobby_game_type: input.objective,
      lobby_days: { hasSome: input.days },
      lobby_players: { none: { player_id: input.playerId } },
    },
    include: {
      lobby_players: { include: { player: true } },
    },
  })

  for (const lobby of openLobbies) {
    // Skill gap check against all existing players in lobby
    const skillsInLobby = lobby.lobby_players.map(
      (lp) => lp.player.player_skill
    )
    const withinSkill = skillsInLobby.every(
      (s) => Math.abs(s - input.skill) <= allowedGap
    )
    if (!withinSkill) continue

    // Venue feasibility — shared courts within MAX_VENUE_KM for all players
    const playerCoords: { lat: number; lon: number }[] = [
      { lat: input.lat, lon: input.lon },
      ...lobby.lobby_players
        .filter((lp) => lp.player.player_lat && lp.player.player_long)
        .map((lp) => ({
          lat: lp.player.player_lat!,
          lon: lp.player.player_long!,
        })),
    ]

    const venues = await prisma.location.findMany()
    const feasible = venues.some((v) =>
      playerCoords.every(
        (p) => haversineKm(p.lat, p.lon, v.lat, v.long) <= MAX_VENUE_KM
      )
    )
    if (!feasible) continue

    return lobby
  }

  return null
}

// Pick the venue that minimises total travel distance for all players
export async function assignVenue(
  playerCoords: { lat: number; lon: number }[]
): Promise<Location> {
  const venues = await prisma.location.findMany()

  const feasible = venues.filter((v) =>
    playerCoords.every(
      (p) => haversineKm(p.lat, p.lon, v.lat, v.long) <= MAX_VENUE_KM
    )
  )

  if (feasible.length === 0)
    throw new Error('No venue within range for all players')

  return feasible.reduce((best, v) => {
    const totalBest = playerCoords.reduce(
      (sum, p) => sum + haversineKm(p.lat, p.lon, best.lat, best.long),
      0
    )
    const totalV = playerCoords.reduce(
      (sum, p) => sum + haversineKm(p.lat, p.lon, v.lat, v.long),
      0
    )
    return totalV < totalBest ? v : best
  })
}
