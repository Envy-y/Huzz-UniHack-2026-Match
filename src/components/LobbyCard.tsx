'use client'
import type { Lobby, LobbyPlayer, Player, Match, Location } from '@prisma/client'
import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

export type LobbyWithPlayers = Lobby & {
  lobby_players: (LobbyPlayer & { player: Player })[]
  match?: (Match & { location: Location }) | null
}

type LobbyCardProps = {
  lobby: LobbyWithPlayers
  onClick?: () => void
  highlighted?: boolean
}

const typeBadgeClass: Record<string, string> = {
  Competitive: 'bg-red-50 text-red-700',
  Social:      'bg-mint-50 text-mint-700',
  Casual:      'bg-amber-50 text-amber-700',
}

const modeBadgeStyle: Record<string, { bg: string; color: string }> = {
  S: { bg: '#e8eeff', color: '#2d4db8' },
  D: { bg: '#f5e6ff', color: '#7b2fb8' },
}

const avatarPalette = ['#bf1a00', '#0a6e66', '#9a6000', '#2d4db8', '#7b2fb8', '#555555']

export function hashColor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h)
  return avatarPalette[Math.abs(h) % avatarPalette.length]
}

export function initials(fname: string, lname: string) {
  return `${fname[0] ?? ''}${lname[0] ?? ''}`.toUpperCase()
}

export function getAcceptedRange(hostLevel: number, gameType: string): [number, number] {
  if (gameType === 'Competitive') return [Math.max(1, hostLevel - 1), Math.min(10, hostLevel + 1)]
  if (gameType === 'Casual')      return [Math.max(1, hostLevel - 2), Math.min(10, hostLevel + 2)]
  return [1, 10]
}

export function LobbyCard({ lobby, onClick, highlighted }: LobbyCardProps) {
  const filled     = lobby.lobby_players.length
  const maxPlayers = lobby.lobby_max_players
  const pct        = filled / maxPlayers
  const isFull     = lobby.lobby_status === 'Full' || lobby.lobby_status === 'Matched'

  const [rangeMin, rangeMax] = getAcceptedRange(lobby.host_level, lobby.lobby_game_type)
  const gapLabel = lobby.lobby_game_type === 'Competitive' ? '±1'
                 : lobby.lobby_game_type === 'Casual'      ? '±2'
                 : 'Open'

  const hostPlayer  = lobby.lobby_players.find((lp) => lp.player_id === lobby.host_player_id)?.player
  const venueSuburb = lobby.match?.location?.location_address?.split(',')[0]?.trim()

  const slotStyle = isFull
    ? { bg: '#ffeaea', color: '#bf1a00', label: 'Full'        }
    : pct >= 0.5
    ? { bg: '#fff4dc', color: '#9a6000', label: 'Almost full' }
    : { bg: '#e6faf8', color: '#0a8a80', label: 'Open'        }

  const modeStyle = modeBadgeStyle[lobby.lobby_match_type]

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={cn(
        'bg-white border border-[rgba(48,213,200,0.20)] shadow-[0_2px_12px_rgba(48,213,200,0.08)] rounded-[18px] p-4 transition-transform active:scale-[0.97] cursor-pointer select-none',
        highlighted && 'border-[rgba(48,213,200,0.50)]'
      )}
    >
      {/* Row 1 — Badges + Slots */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide', typeBadgeClass[lobby.lobby_game_type] ?? 'bg-gray-100 text-gray-700')}>
            {lobby.lobby_game_type}
          </span>
          {modeStyle && (
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide"
              style={{ backgroundColor: modeStyle.bg, color: modeStyle.color }}
            >
              {lobby.lobby_match_type === 'S' ? 'Singles' : 'Doubles'}
            </span>
          )}
        </div>
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-extrabold"
          style={{ backgroundColor: slotStyle.bg, color: slotStyle.color }}
        >
          {filled}/{maxPlayers} {slotStyle.label}
        </span>
      </div>

      {/* Row 2 — Level bar */}
      <div className="flex items-center gap-2 bg-[#f0fafa] rounded-[10px] px-3 py-2 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex-shrink-0">
          Level
        </span>
        <div className="flex gap-[3px] flex-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((lvl) => {
            const isHost  = lvl === lobby.host_level
            const inRange = lvl >= rangeMin && lvl <= rangeMax && !isHost
            return (
              <div
                key={lvl}
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                style={{
                  backgroundColor: isHost ? '#0d3d3a' : inRange ? '#30d5c8' : '#e8f7f5',
                  color:           isHost || inRange ? 'white' : '#aaa',
                }}
              >
                {lvl}
              </div>
            )
          })}
        </div>
        <span className="text-[10px] font-bold text-[#30d5c8] flex-shrink-0">{gapLabel}</span>
      </div>

      {/* Row 3 — Host + venue */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {hostPlayer && (
            <>
              <div
                className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                style={{ backgroundColor: hashColor(hostPlayer.player_id) }}
              >
                {initials(hostPlayer.player_fname, hostPlayer.player_lname)}
              </div>
              <span className="text-[11px] text-[#888]">
                Host <span className="font-bold text-[#444]">{hostPlayer.player_fname}</span>
              </span>
            </>
          )}
        </div>
        {venueSuburb && (
          <div className="flex items-center gap-1 text-[11px] font-bold text-[#30d5c8]">
            <MapPin className="h-[11px] w-[11px] flex-shrink-0" />
            <span>{venueSuburb}</span>
          </div>
        )}
      </div>
    </div>
  )
}
