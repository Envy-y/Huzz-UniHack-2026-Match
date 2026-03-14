'use client'
import type { Lobby, LobbyPlayer, Player } from '@prisma/client'

export type LobbyWithPlayers = Lobby & {
  lobby_players: (LobbyPlayer & { player: Player })[]
}

type LobbyCardProps = {
  lobby: LobbyWithPlayers
  onJoin?: (lobbyId: string) => void
  highlighted?: boolean
}

const timeLabel: Record<string, string> = {
  M: 'Morning',
  A: 'Afternoon',
  N: 'Night',
}

export function LobbyCard({ lobby, onJoin, highlighted }: LobbyCardProps) {
  const filled = lobby.lobby_players.length
  const maxPlayers = lobby.lobby_max_players
  const pct = Math.round((filled / maxPlayers) * 100)
  const isHighlighted =
    highlighted || lobby.lobby_status === 'Full' || lobby.lobby_status === 'Matched'

  return (
    <div
      className={`rounded-xl border-2 p-4 ${isHighlighted ? 'border-green-500' : 'border-gray-200'}`}
    >
      {/* Skill dots */}
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={i < lobby.host_level ? 'text-yellow-400' : 'text-gray-300'}
          >
            ●
          </span>
        ))}
      </div>

      {/* Description */}
      {lobby.lobby_desc && (
        <p className="mt-2 text-sm text-gray-700">{lobby.lobby_desc}</p>
      )}

      {/* Badges */}
      <div className="mt-2 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-gray-100 px-2 py-0.5">
          {lobby.lobby_match_type === 'S' ? 'Singles' : 'Doubles'}
        </span>
        <span className="rounded-full bg-gray-100 px-2 py-0.5">
          {lobby.lobby_game_type}
        </span>
        <span className="rounded-full bg-gray-100 px-2 py-0.5">
          {timeLabel[lobby.lobby_time] ?? lobby.lobby_time}
        </span>
        {lobby.lobby_days.map((d) => (
          <span key={d} className="rounded-full bg-gray-100 px-2 py-0.5">
            {d}
          </span>
        ))}
      </div>

      {/* Fill bar */}
      <div className="mt-3">
        <div className="h-2 rounded bg-gray-200">
          <div
            className="h-2 rounded bg-blue-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {filled}/{maxPlayers} players
        </p>
      </div>

      {/* Join button */}
      {onJoin && lobby.lobby_status === 'Open' && (
        <button
          type="button"
          onClick={() => onJoin(lobby.lobby_id)}
          className="mt-3 w-full rounded bg-blue-600 py-2 text-sm text-white hover:bg-blue-700"
        >
          Join
        </button>
      )}
    </div>
  )
}
