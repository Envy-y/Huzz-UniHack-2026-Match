'use client'
import type { Player } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { MapPin, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type LobbyWithPlayers, hashColor, initials, getAcceptedRange } from './LobbyCard'

// ── helpers ──────────────────────────────────────────────────────────

const typeBadgeClass: Record<string, string> = {
  Competitive: 'bg-red-50 text-red-700',
  Social:      'bg-mint-50 text-mint-700',
  Casual:      'bg-amber-50 text-amber-700',
}

const modeBadgeStyle: Record<string, { bg: string; color: string }> = {
  S: { bg: '#e8eeff', color: '#2d4db8' },
  D: { bg: '#f5e6ff', color: '#7b2fb8' },
}

function getAge(dob: Date | string | null | undefined): string {
  if (!dob) return ''
  const years = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  return `${years} yrs`
}

function ShuttlecockDivider() {
  return (
    <div className="flex items-center gap-2.5 my-1 mb-4">
      <div className="flex-1 h-px bg-[#eee]" />
      <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
        <ellipse cx="16" cy="25" rx="4" ry="3" fill="#30d5c8" opacity="0.7" />
        <line x1="16" y1="22" x2="11" y2="10" stroke="#30d5c8" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="16" y1="22" x2="13.5" y2="9" stroke="#30d5c8" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="16" y1="22" x2="16" y2="8" stroke="#30d5c8" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="16" y1="22" x2="18.5" y2="9" stroke="#30d5c8" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="16" y1="22" x2="21" y2="10" stroke="#30d5c8" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M11 10 Q13.5 7.5 16 8.5 Q18.5 7.5 21 10" stroke="#30d5c8" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      </svg>
      <div className="flex-1 h-px bg-[#eee]" />
    </div>
  )
}

function PlayerCard({ player, isHost }: { player: Player; isHost: boolean }) {
  const age = getAge(player.player_dob)
  return (
    <div className="bg-[#fafafa] rounded-[14px] p-3 border border-[#f0f0f0]">
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-extrabold text-white flex-shrink-0"
          style={{ backgroundColor: hashColor(player.player_id) }}
        >
          {initials(player.player_fname, player.player_lname)}
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-[14px] font-extrabold text-[#0d3d3a]">
            {player.player_fname} {player.player_lname}
            {isHost && (
              <span className="text-[9px] bg-[#0d3d3a] text-white px-[7px] py-[1px] rounded-[10px] font-bold">
                Host
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#888] mt-0.5">
            {player.player_gender}{age ? ` · ${age}` : ''}
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap mb-1.5">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0fafa] text-[#30d5c8] border border-[#c0efec]/50">
          Lv {player.player_skill}
        </span>
      </div>

      {player.player_desc && (
        <p className="text-[12px] text-[#666] leading-[1.55]">{player.player_desc}</p>
      )}
    </div>
  )
}

// ── main component ───────────────────────────────────────────────────

type Props = {
  lobby:     LobbyWithPlayers
  onClose:   () => void
  onJoin:    (lobbyId: string) => void
  isJoining?: boolean
}

export function LobbyDrawer({ lobby, onClose, onJoin, isJoining }: Props) {
  const filled     = lobby.lobby_players.length
  const maxPlayers = lobby.lobby_max_players
  const pct        = filled / maxPlayers
  const isFull     = lobby.lobby_status === 'Full' || lobby.lobby_status === 'Matched'

  const gapLabel    = lobby.lobby_game_type === 'Competitive' ? '±1'
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
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/45"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-x-0 bottom-0 z-[110] max-h-[82vh] overflow-y-auto rounded-t-3xl bg-white shadow-xl animate-in slide-in-from-bottom-4 duration-300">
        {/* Drag handle */}
        <div className="mx-auto mt-3 h-1 w-9 rounded-full bg-[#e0e0e0]" />

        <div className="px-[18px] pb-10 pt-3.5">

          {/* Badges + suburb */}
          <div className="flex items-center gap-1.5 flex-wrap mb-5">
            <span className={cn('inline-flex items-center rounded-full px-2.5 py-[4px] text-[11px] font-extrabold uppercase tracking-wide', typeBadgeClass[lobby.lobby_game_type] ?? 'bg-gray-100 text-gray-700')}>
              {lobby.lobby_game_type}
            </span>
            {modeStyle && (
              <span
                className="inline-flex items-center rounded-full px-2.5 py-[4px] text-[11px] font-extrabold uppercase tracking-wide"
                style={{ backgroundColor: modeStyle.bg, color: modeStyle.color }}
              >
                {lobby.lobby_match_type === 'S' ? 'Singles' : 'Doubles'}
              </span>
            )}
            <span
              className="inline-flex items-center rounded-full px-2.5 py-[4px] text-[11px] font-extrabold"
              style={{ backgroundColor: slotStyle.bg, color: slotStyle.color }}
            >
              {filled}/{maxPlayers} {slotStyle.label}
            </span>
            {venueSuburb && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-[#30d5c8]">
                <MapPin className="h-[11px] w-[11px]" />
                {venueSuburb}
              </span>
            )}
          </div>

          {/* Host's note — shown even if lobby_desc is empty (skip if blank) */}
          {lobby.lobby_desc && (
            <div className="mb-5">
              <span className="text-[60px] leading-[0.55] text-[#30d5c8] font-serif font-black block mb-2">
                "
              </span>
              <p className="text-[14px] text-[#1a1a1a] leading-[1.75] italic px-1">
                {lobby.lobby_desc}
              </p>
              {hostPlayer && (
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex-1 h-px bg-[#e8e8e8]" />
                  <div
                    className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[9px] font-extrabold text-white flex-shrink-0"
                    style={{ backgroundColor: hashColor(hostPlayer.player_id) }}
                  >
                    {initials(hostPlayer.player_fname, hostPlayer.player_lname)}
                  </div>
                  <span className="text-[11px] font-extrabold text-[#444]">
                    {hostPlayer.player_fname} {hostPlayer.player_lname}
                  </span>
                  <div className="flex-1 h-px bg-[#e8e8e8]" />
                </div>
              )}
            </div>
          )}

          {/* Divider with shuttlecock */}
          <ShuttlecockDivider />

          {/* Players */}
          <p className="text-[11px] font-extrabold text-[#bbb] uppercase tracking-[0.5px] mb-2.5">
            Players · {lobby.lobby_players.length} joined
          </p>

          <div className="space-y-2.5 mb-4">
            {lobby.lobby_players.map((lp) => (
              <PlayerCard
                key={lp.player_id}
                player={lp.player}
                isHost={lp.player_id === lobby.host_player_id}
              />
            ))}
          </div>

          {/* CTA */}
          {isFull ? (
            <button
              type="button"
              disabled
              className="w-full bg-gray-200 text-gray-500 text-[15px] font-extrabold rounded-2xl py-[14px] cursor-not-allowed"
            >
              Lobby Full
            </button>
          ) : (
            <Button
              className="w-full text-[15px] font-extrabold rounded-2xl h-[52px]"
              onClick={() => onJoin(lobby.lobby_id)}
              disabled={isJoining}
            >
              {isJoining
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Joining...</>
                : 'Join Lobby'
              }
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
