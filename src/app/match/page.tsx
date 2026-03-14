'use client'

import { trpc }           from '@/lib/trpc'
import { usePlayer }      from '@/hooks/usePlayer'
import { PageShell }      from '@/components/PageShell'
import { LobbyCard }      from '@/components/LobbyCard'
import type { LobbyWithPlayers } from '@/components/LobbyCard'
import { LobbyDrawer }    from '@/components/LobbyDrawer'
import { EmptyState }     from '@/components/EmptyState'
import { useRouter }      from 'next/navigation'
import { useState }       from 'react'
import { cn }             from '@/lib/utils'
import type { Day }       from '@/types'

const ALL_DAYS: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function MatchPage() {
  const router       = useRouter()
  const { playerId } = usePlayer()

  // Filters
  const [matchType, setMatchType] = useState<'S' | 'D' | undefined>()
  const [gameType,  setGameType]  = useState<'Competitive' | 'Social' | 'Casual' | undefined>()
  const [days,      setDays]      = useState<Day[]>([])
  const [time,      setTime]      = useState<'M' | 'A' | 'N' | undefined>()

  // Drawer
  const [selectedLobby, setSelectedLobby] = useState<LobbyWithPlayers | null>(null)
  const [joiningId,     setJoiningId]     = useState<string | null>(null)

  const { data, isLoading, refetch } = trpc.lobbies.search.useQuery(
    {
      playerId: playerId!,
      filters: {
        ...(matchType && { matchType }),
        ...(gameType  && { gameType }),
        ...(days.length > 0 && { days }),
        ...(time && { time }),
      },
    },
    { enabled: !!playerId }
  )

  const lobbies = data?.exactMatches ?? []

  const joinMutation = trpc.lobbies.join.useMutation({
    onMutate:  (v)    => setJoiningId(v.lobbyId),
    onSuccess: (data) => {
      setJoiningId(null)
      setSelectedLobby(null)
      if (data.status === 'full' && data.match) {
        router.push(`/payment?matchId=${data.match.match_id}`)
      } else {
        refetch()
      }
    },
    onError: (err) => { setJoiningId(null); alert(err.message) },
  })

  function handleJoin(lobbyId: string) {
    if (!playerId) { router.push('/login'); return }
    joinMutation.mutate({ lobbyId })
  }

  function toggleDay(d: Day) {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    )
  }

  function toggleMatchType(v: 'S' | 'D') {
    setMatchType((prev) => (prev === v ? undefined : v))
  }

  function toggleGameType(v: 'Competitive' | 'Social' | 'Casual') {
    setGameType((prev) => (prev === v ? undefined : v))
  }

  function toggleTime(v: 'M' | 'A' | 'N') {
    setTime((prev) => (prev === v ? undefined : v))
  }

  const hasFilters = !!matchType || !!gameType || days.length > 0 || !!time

  return (
    <PageShell>
      <div className="max-w-lg mx-auto px-4 pt-5 pb-6 w-full flex flex-col gap-4">

        {/* Header */}
        <div>
          <h1 className="text-[22px] font-extrabold text-[#0d3d3a]">Find a Match</h1>
          <p className="text-[13px] text-[#888] mt-0.5">Filter lobbies to find your perfect game</p>
        </div>

        {/* Filters card */}
        <div className="bg-white rounded-[18px] border border-[rgba(48,213,200,0.20)] shadow-[0_2px_12px_rgba(48,213,200,0.08)] p-4 flex flex-col gap-4">

          {/* Match type */}
          <div>
            <p className="text-[10px] font-extrabold text-[#bbb] uppercase tracking-wider mb-1.5">Match type</p>
            <div className="flex gap-2">
              {[
                { v: 'S' as const, label: 'Singles' },
                { v: 'D' as const, label: 'Doubles' },
              ].map(({ v, label }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggleMatchType(v)}
                  className={cn(
                    'flex-1 rounded-xl py-2 text-[12px] font-extrabold border-2 transition-all duration-150',
                    matchType === v
                      ? 'border-[#30d5c8] bg-[#e6faf8] text-[#0a8a80]'
                      : 'border-[#eee] bg-white text-[#888] hover:border-[#30d5c8]/40'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Game type */}
          <div>
            <p className="text-[10px] font-extrabold text-[#bbb] uppercase tracking-wider mb-1.5">Objective</p>
            <div className="flex gap-2">
              {[
                { v: 'Competitive' as const, color: '#bf1a00', bg: '#fff0ee' },
                { v: 'Social'      as const, color: '#0a8a80', bg: '#e6faf8' },
                { v: 'Casual'      as const, color: '#9a6000', bg: '#fff4dc' },
              ].map(({ v, color, bg }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggleGameType(v)}
                  className="flex-1 rounded-xl py-2 text-[11px] font-extrabold uppercase tracking-wide border-2 transition-all duration-150"
                  style={
                    gameType === v
                      ? { backgroundColor: bg, color, borderColor: color }
                      : { backgroundColor: 'white', color: '#aaa', borderColor: '#eee' }
                  }
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Days */}
          <div>
            <p className="text-[10px] font-extrabold text-[#bbb] uppercase tracking-wider mb-1.5">Days</p>
            <div className="flex gap-1.5 flex-wrap">
              {ALL_DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={cn(
                    'w-9 h-9 rounded-full text-[11px] font-extrabold border-2 transition-all duration-150 flex-shrink-0',
                    days.includes(d)
                      ? 'bg-[#30d5c8] border-[#30d5c8] text-white'
                      : 'bg-white border-[#eee] text-[#888] hover:border-[#30d5c8]/50'
                  )}
                >
                  {d.slice(0, 2)}
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div>
            <p className="text-[10px] font-extrabold text-[#bbb] uppercase tracking-wider mb-1.5">Time slot</p>
            <div className="flex gap-2">
              {[
                { v: 'M' as const, label: 'Morning'   },
                { v: 'A' as const, label: 'Afternoon' },
                { v: 'N' as const, label: 'Night'     },
              ].map(({ v, label }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggleTime(v)}
                  className={cn(
                    'flex-1 rounded-xl py-2 text-[12px] font-extrabold border-2 transition-all duration-150',
                    time === v
                      ? 'border-[#30d5c8] bg-[#e6faf8] text-[#0a8a80]'
                      : 'border-[#eee] bg-white text-[#888] hover:border-[#30d5c8]/40'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear filters */}
          {hasFilters && (
            <button
              type="button"
              onClick={() => { setMatchType(undefined); setGameType(undefined); setDays([]); setTime(undefined) }}
              className="text-[12px] font-bold text-[#30d5c8] self-end"
            >
              Clear filters ✕
            </button>
          )}
        </div>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-extrabold text-[#bbb] uppercase tracking-wider">
              {isLoading || !playerId ? 'Searching...' : `${lobbies.length} ${hasFilters ? 'results' : 'recommended'}`}
            </p>
          </div>

          {isLoading || !playerId ? (
            <div className="flex flex-col gap-2.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[112px] rounded-[18px] bg-mint-50/60 animate-pulse border border-[rgba(48,213,200,0.10)]" />
              ))}
            </div>
          ) : lobbies.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {lobbies.map((lobby) => (
                <LobbyCard
                  key={lobby.lobby_id}
                  lobby={lobby}
                  onClick={() => setSelectedLobby(lobby)}
                  highlighted={lobby.lobby_status === 'Full' || lobby.lobby_status === 'Matched'}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No lobbies found"
              subtitle="Try adjusting your filters or create your own lobby."
              action={{ label: 'Create a lobby', href: '/create' }}
            />
          )}
        </div>
      </div>

      {selectedLobby && (
        <LobbyDrawer
          lobby={selectedLobby}
          onClose={() => setSelectedLobby(null)}
          onJoin={handleJoin}
          isJoining={joiningId === selectedLobby.lobby_id}
        />
      )}
    </PageShell>
  )
}
