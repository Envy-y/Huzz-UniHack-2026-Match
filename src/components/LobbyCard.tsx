'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Calendar, Clock, Trophy, MapPin, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Player = {
  player_id: string
  player_fname: string
  player_lname: string
  player_skill: number
}

type LobbyPlayer = {
  player: Player
}

type Location = {
  location_id: string
  location_name: string
  location_address: string
}

type Match = {
  match_id: string
  location: Location
}

type Lobby = {
  lobby_id: string
  lobby_desc?: string | null
  lobby_match_type: string
  lobby_game_type: string
  lobby_days: string[]
  lobby_time: string
  lobby_max_players: number
  lobby_status: string
  host_level: number
  lobby_players: LobbyPlayer[]
  match?: Match | null
}

type LobbyCardProps = {
  lobby: Lobby
  onJoin?: (lobbyId: string) => void
  highlighted?: boolean
  isJoining?: boolean
  disabled?: boolean
}

const timeLabels = {
  M: 'Morning',
  A: 'Afternoon',
  N: 'Night',
}

const gameTypeLabels = {
  S: 'Singles',
  D: 'Doubles',
}

export function LobbyCard({ lobby, onJoin, highlighted, isJoining, disabled }: LobbyCardProps) {
  const playerCount = lobby.lobby_players.length
  const fillPercentage = (playerCount / lobby.lobby_max_players) * 100
  const isFull = lobby.lobby_status === 'Full' || lobby.lobby_status === 'Matched'

  // Calculate average skill level of players
  const avgSkill =
    lobby.lobby_players.length > 0
      ? Math.round(
          lobby.lobby_players.reduce((sum, lp) => sum + lp.player.player_skill, 0) /
            lobby.lobby_players.length
        )
      : lobby.host_level

  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:shadow-2xl',
        highlighted && 'ring-2 ring-mint-500 bg-mint-50/50'
      )}
    >
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-gray-900">
                {gameTypeLabels[lobby.lobby_match_type as keyof typeof gameTypeLabels]}
              </h3>
              <span
                className={cn(
                  'badge text-xs',
                  lobby.lobby_game_type === 'Competitive' && 'bg-red-100 text-red-700',
                  lobby.lobby_game_type === 'Social' && 'bg-blue-100 text-blue-700',
                  lobby.lobby_game_type === 'Casual' && 'bg-mint-100 text-mint-700'
                )}
              >
                {lobby.lobby_game_type}
              </span>
            </div>
            {lobby.lobby_desc && (
              <p className="text-sm text-gray-600 line-clamp-1">{lobby.lobby_desc}</p>
            )}
          </div>

          {/* Status Badge */}
          {isFull && (
            <span className="badge bg-green-100 text-green-700">
              {lobby.lobby_status}
            </span>
          )}
        </div>

        {/* Players Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <div className="flex items-center gap-1.5 text-gray-600">
              <Users className="h-4 w-4" />
              <span className="font-medium">
                {playerCount} / {lobby.lobby_max_players} players
              </span>
            </div>
            {/* Skill dots */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full transition-colors',
                    level <= avgSkill ? 'bg-mint-500' : 'bg-gray-300'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-500 rounded-full',
                isFull ? 'bg-green-500' : 'bg-mint-500'
              )}
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Days */}
          <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg">
            <Calendar className="h-3.5 w-3.5" />
            <span>{lobby.lobby_days.join(', ')}</span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg">
            <Clock className="h-3.5 w-3.5" />
            <span>{timeLabels[lobby.lobby_time as keyof typeof timeLabels]}</span>
          </div>

          {/* Skill */}
          <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg">
            <Trophy className="h-3.5 w-3.5" />
            <span>Skill {avgSkill}</span>
          </div>
        </div>

        {/* Venue (if assigned) */}
        {lobby.match?.location && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-mint-50 border border-mint-200 mb-4">
            <MapPin className="h-4 w-4 text-mint-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-mint-900">
                {lobby.match.location.location_name}
              </p>
              <p className="text-xs text-mint-700 truncate">
                {lobby.match.location.location_address}
              </p>
            </div>
          </div>
        )}

        {/* Join Button */}
        {onJoin && !isFull && (
          <Button
            onClick={() => onJoin(lobby.lobby_id)}
            disabled={isJoining || disabled}
            className="w-full"
          >
            {isJoining ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              'Join Lobby'
            )}
          </Button>
        )}

        {isFull && !onJoin && (
          <div className="text-center text-sm text-green-600 font-medium">
            Lobby is full — match confirmed!
          </div>
        )}
      </CardContent>
    </Card>
  )
}
