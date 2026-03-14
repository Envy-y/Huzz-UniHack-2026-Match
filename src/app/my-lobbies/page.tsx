'use client'

import { trpc } from '@/lib/trpc'
import { usePlayer } from '@/hooks/usePlayer'
import { PageShell } from '@/components/PageShell'
import { LobbyCard, hashColor, initials } from '@/components/LobbyCard'
import type { LobbyWithPlayers } from '@/components/LobbyCard'
import { EmptyState } from '@/components/EmptyState'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Check, X, MapPin } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const DAY_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const TIME_OPTIONS = [
  { value: 'M', label: 'Morning' },
  { value: 'A', label: 'Afternoon' },
  { value: 'N', label: 'Night' },
] as const

type Day = typeof DAY_OPTIONS[number]
type Time = 'M' | 'A' | 'N'

function EditForm({ lobbyId, initialDays, initialTime, onDone }: {
  lobbyId: string
  initialDays: string[]
  initialTime: string
  onDone: () => void
}) {
  const utils = trpc.useUtils()
  const [days, setDays] = useState<Day[]>(initialDays as Day[])
  const [time, setTime] = useState<Time>(initialTime as Time)

  const update = trpc.lobbies.update.useMutation({
    onSuccess: () => {
      utils.lobbies.mine.invalidate()
      onDone()
    },
  })

  function toggleDay(d: Day) {
    setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d])
  }

  return (
    <div className="mt-3 pt-3 border-t border-[rgba(48,213,200,0.15)] flex flex-col gap-3">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#aaa] mb-2">Days</p>
        <div className="flex flex-wrap gap-1.5">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(d)}
              className={cn(
                'px-3 py-1 rounded-full text-[11px] font-bold transition-all',
                days.includes(d) ? 'bg-[#30d5c8] text-white' : 'bg-[#f0fafa] text-[#888]'
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#aaa] mb-2">Time</p>
        <div className="flex gap-1.5">
          {TIME_OPTIONS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTime(t.value)}
              className={cn(
                'px-3 py-1 rounded-full text-[11px] font-bold transition-all',
                time === t.value ? 'bg-[#30d5c8] text-white' : 'bg-[#f0fafa] text-[#888]'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={update.isPending || days.length === 0}
          onClick={() => update.mutate({ lobbyId, lobby_days: days, lobby_time: time })}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#30d5c8] text-white text-[13px] font-bold disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
          {update.isPending ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f0fafa] text-[#888] text-[13px] font-bold"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </button>
      </div>
      {update.isError && (
        <p className="text-[12px] text-red-600">{update.error.message}</p>
      )}
    </div>
  )
}

function formatTime(t: string) {
  if (t === 'M') return 'Morning (6am – 12pm)'
  if (t === 'A') return 'Afternoon (12pm – 6pm)'
  return 'Night (6pm – 11pm)'
}

function HostDrawer({ lobby, onClose }: { lobby: LobbyWithPlayers; onClose: () => void }) {
  const utils = trpc.useUtils()
  const [editing, setEditing] = useState(false)

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/45" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-[110] max-h-[82vh] overflow-y-auto rounded-t-3xl bg-white shadow-xl animate-in slide-in-from-bottom-4 duration-300">
        <div className="mx-auto mt-3 h-1 w-9 rounded-full bg-[#e0e0e0]" />
        <div className="px-[18px] pb-10 pt-3.5">

          {/* Status row */}
          <div className="flex items-center gap-2 mb-4">
            <span className={cn(
              'inline-flex items-center rounded-full px-2.5 py-[4px] text-[11px] font-extrabold',
              lobby.lobby_status === 'Open' ? 'bg-[#e6faf8] text-[#0a8a80]' : 'bg-[#ffeaea] text-[#bf1a00]'
            )}>
              {lobby.lobby_players.length}/{lobby.lobby_max_players} · {lobby.lobby_status}
            </span>
            {lobby.lobby_match_type === 'S'
              ? <span className="inline-flex items-center rounded-full px-2.5 py-[4px] text-[11px] font-extrabold" style={{ background: '#e8eeff', color: '#2d4db8' }}>Singles</span>
              : <span className="inline-flex items-center rounded-full px-2.5 py-[4px] text-[11px] font-extrabold" style={{ background: '#f5e6ff', color: '#7b2fb8' }}>Doubles</span>
            }
            <span className={cn('inline-flex items-center rounded-full px-2.5 py-[4px] text-[11px] font-extrabold',
              lobby.lobby_game_type === 'Competitive' ? 'bg-red-50 text-red-700' :
              lobby.lobby_game_type === 'Social' ? 'bg-[#f0fafa] text-[#30d5c8]' : 'bg-amber-50 text-amber-700'
            )}>
              {lobby.lobby_game_type}
            </span>
          </div>

          {/* Schedule */}
          <div className="bg-[#f8fffe] rounded-[14px] border border-[rgba(48,213,200,0.15)] px-4 py-3 mb-4">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#aaa] mb-2">Schedule</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {lobby.lobby_days.map((d) => (
                <span key={d} className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#e6faf8] text-[#30d5c8]">{d}</span>
              ))}
            </div>
            <p className="text-[12px] text-[#666]">{formatTime(lobby.lobby_time)}</p>
          </div>

          {/* Venue */}
          {lobby.match?.location && (
            <div className="flex items-center gap-2 mb-4 px-1">
              <MapPin className="h-4 w-4 text-[#30d5c8] flex-shrink-0" />
              <div>
                <p className="text-[13px] font-extrabold text-[#0d3d3a]">{lobby.match.location.location_name}</p>
                <p className="text-[11px] text-[#888]">{lobby.match.location.location_address}</p>
              </div>
            </div>
          )}

          {/* Members */}
          <p className="text-[11px] font-extrabold text-[#bbb] uppercase tracking-[0.5px] mb-2.5">
            Players · {lobby.lobby_players.length} joined
          </p>
          <div className="space-y-2 mb-5">
            {lobby.lobby_players.map((lp) => (
              <div key={lp.player_id} className="flex items-center gap-2.5 bg-[#fafafa] rounded-[12px] px-3 py-2.5 border border-[#f0f0f0]">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-extrabold text-white flex-shrink-0"
                  style={{ backgroundColor: hashColor(lp.player_id) }}
                >
                  {initials(lp.player.player_fname, lp.player.player_lname)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-extrabold text-[#0d3d3a] truncate">
                    {lp.player.player_fname} {lp.player.player_lname}
                    {lp.player_id === lobby.host_player_id && (
                      <span className="ml-1.5 text-[9px] bg-[#0d3d3a] text-white px-[7px] py-[1px] rounded-[10px]">Host</span>
                    )}
                  </p>
                  <p className="text-[11px] text-[#888]">Level {lp.player.player_skill}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Edit schedule (Open lobbies only) */}
          {lobby.lobby_status === 'Open' && (
            editing ? (
              <EditForm
                lobbyId={lobby.lobby_id}
                initialDays={lobby.lobby_days}
                initialTime={lobby.lobby_time}
                onDone={() => { setEditing(false); utils.lobbies.mine.invalidate(); onClose() }}
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="w-full flex items-center justify-center gap-2 py-[14px] rounded-2xl text-[15px] font-extrabold text-white"
                style={{ background: 'linear-gradient(90deg, #30d5c8 0%, #1ab5aa 100%)' }}
              >
                <Pencil className="h-4 w-4" />
                Edit Schedule
              </button>
            )
          )}
        </div>
      </div>
    </>
  )
}

export default function MyLobbiesPage() {
  const router = useRouter()
  const { playerId } = usePlayer()
  const [selectedLobby, setSelectedLobby] = useState<LobbyWithPlayers | null>(null)

  const { data: lobbies, isLoading } = trpc.lobbies.mine.useQuery(
    undefined,
    { enabled: !!playerId }
  )

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto px-4 py-4 w-full pb-24">
        <div className="flex items-center gap-3 mb-5">
          <button type="button" onClick={() => router.back()} className="w-9 h-9 rounded-full bg-white border border-[rgba(48,213,200,0.2)] flex items-center justify-center shadow-sm">
            <ArrowLeft className="h-4 w-4 text-[#0d3d3a]" />
          </button>
          <h1 className="text-[20px] font-extrabold text-[#0d3d3a]">My Lobbies</h1>
        </div>

        {isLoading || !playerId ? (
          <div className="flex flex-col gap-2.5">
            {[1, 2].map((i) => (
              <div key={i} className="h-[120px] rounded-[18px] bg-white animate-pulse border border-[rgba(48,213,200,0.10)]" />
            ))}
          </div>
        ) : lobbies && lobbies.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {lobbies.map((lobby) => (
              <LobbyCard
                key={lobby.lobby_id}
                lobby={lobby as any}
                onClick={() => setSelectedLobby(lobby as any)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No lobbies yet"
            subtitle="Create your first lobby and start matching."
            action={{ label: 'Create a lobby', href: '/create' }}
          />
        )}
      </div>

      {selectedLobby && (
        <HostDrawer lobby={selectedLobby} onClose={() => setSelectedLobby(null)} />
      )}
    </PageShell>
  )
}
