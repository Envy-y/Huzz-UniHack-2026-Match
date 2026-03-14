'use client'

import { trpc }          from '@/lib/trpc'
import { usePlayer }     from '@/hooks/usePlayer'
import { LobbyCard }     from '@/components/LobbyCard'
import type { LobbyWithPlayers } from '@/components/LobbyCard'
import { LobbyDrawer }   from '@/components/LobbyDrawer'
import { PageShell }     from '@/components/PageShell'
import { EmptyState }    from '@/components/EmptyState'
import { useRouter }     from 'next/navigation'
import { useMemo, useState } from 'react'
import { cn }            from '@/lib/utils'

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const FUN_FACTS = [
  "Badminton is named after Badminton House in Gloucestershire, England, where it was first played in the 19th century.",
  "Badminton evolved from an Indian game called \"Poona\" — British officers brought it back to England, where it became the sport we know today.",
  "Badminton became an official Olympic sport in 1992 at the Barcelona Games, instantly captivating audiences worldwide.",
  "The fastest recorded badminton smash exceeded 330 km/h (205 mph) — one of the fastest-moving objects in any sport.",
  "A traditional shuttlecock is made from exactly 16 left-wing goose feathers, each chosen to ensure a balanced and consistent flight.",
  "Badminton is the world's second most popular sport, with over 220 million players spanning every continent.",
  "China dominates world badminton with countless Olympic titles, while Denmark leads Europe as its fiercest challenger.",
  "A full badminton court is 44 feet long — singles use a 17-foot-wide court, while doubles widens to 20 feet.",
  "To win a game you need 21 points — but if it reaches 20-all, you must pull 2 points ahead to claim the win.",
  "In a single match, players can cover over 1 km on court, blending explosive speed, agility, and precision under pressure.",
]

function LoadingFact() {
  const [fact] = useState(() => FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)])
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col items-center gap-6 w-full">
      {/* Animated shuttlecock SVG — mint on white bg */}
      <div className="relative flex items-center justify-center w-24 h-24">
        <div className="absolute inset-0 rounded-full bg-[#30d5c8]/15 animate-ping" style={{ animationDuration: '1.5s' }} />
        <div className="absolute inset-2 rounded-full bg-[#30d5c8]/10 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
        <div className="animate-float relative z-10">
          <svg width="56" height="56" viewBox="0 0 32 32" fill="none">
            <ellipse cx="16" cy="25" rx="5" ry="4" fill="#14b8a6" opacity="0.9" />
            <ellipse cx="16" cy="23.5" rx="4" ry="2.5" fill="#30d5c8" opacity="0.7" />
            <line x1="16" y1="22" x2="10" y2="8"  stroke="#0d9488" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="16" y1="22" x2="13" y2="7"  stroke="#0d9488" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="16" y1="22" x2="16" y2="6"  stroke="#0d9488" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="16" y1="22" x2="19" y2="7"  stroke="#0d9488" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="16" y1="22" x2="22" y2="8"  stroke="#0d9488" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M10 8 Q13 5 16 6 Q19 5 22 8" stroke="#14b8a6" strokeWidth="1.4" fill="rgba(48,213,200,0.18)" strokeLinecap="round" />
            <path d="M11.5 13 Q13.5 11 16 12 Q18.5 11 20.5 13" stroke="#30d5c8" strokeWidth="1" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <p className="text-[13px] font-semibold text-[#0d3d3a]/50 tracking-wide">Finding your match...</p>

      {/* Fun fact card */}
      <div className="w-full bg-white rounded-[18px] border border-[rgba(48,213,200,0.20)] shadow-[0_2px_12px_rgba(48,213,200,0.08)] p-5">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#30d5c8] mb-2.5">
          🏸 Did you know?
        </p>
        <p className="text-[14px] text-[#444] leading-relaxed">{fact}</p>
      </div>
    </div>
  )
}

function HeaderStrip({ count, loading }: { count: number; loading: boolean }) {
  return (
    <div
      style={{ background: 'linear-gradient(90deg, #30d5c8 0%, #1ab5aa 100%)' }}
      className="px-4 py-3 flex items-center justify-between flex-shrink-0"
    >
      {loading ? (
        <div className="h-4 w-44 bg-white/30 rounded-full animate-pulse" />
      ) : (
        <p className="text-white/90 text-[13px] font-semibold">
          🏸 {count} lobbies near you
        </p>
      )}
      <span className="text-[11px] font-bold text-white/70 bg-white/20 rounded-full px-3 py-1 flex-shrink-0 ml-3">
        Sorted by recommendations
      </span>
    </div>
  )
}

function DateBar({ selected, onSelect, dates }: {
  selected: number
  onSelect: (i: number) => void
  dates: Date[]
}) {
  return (
    <div className="bg-white border-b border-[#eef] overflow-x-auto scrollbar-none flex-shrink-0 snap-x snap-mandatory">
      <div className="flex gap-1.5 px-2 py-2">
        {dates.map((d, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            style={{ width: 'calc(33.333vw - 8px)', flexShrink: 0 }}
            className={cn(
              'snap-start flex flex-col items-center px-2 py-1.5 rounded-xl transition-all duration-150',
              selected === i ? 'bg-[#30d5c8]' : 'hover:bg-[#f0fafa]'
            )}
          >
            <span className={cn('text-[10px] font-bold uppercase tracking-[0.4px] mb-0.5', selected === i ? 'text-white' : 'text-[#aaa]')}>
              {DAYS[d.getDay()]}
            </span>
            <span className={cn('text-[15px] font-extrabold', selected === i ? 'text-white' : 'text-[#0d3d3a]')}>
              {d.getDate()} {MONTHS[d.getMonth()]}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}


export default function HomePage() {
  const router       = useRouter()
  const { playerId } = usePlayer()

  const [selectedDate,  setSelectedDate]  = useState(0)
  const [selectedLobby, setSelectedLobby] = useState<LobbyWithPlayers | null>(null)
  const [joiningId,     setJoiningId]     = useState<string | null>(null)

  const dates = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      return d
    })
  }, [])

  const { data: lobbies, isLoading, refetch } = trpc.lobbies.recommendations.useQuery(
    { playerId: playerId! },
    { enabled: !!playerId }
  )

  const joinMutation = trpc.lobbies.join.useMutation({
    onMutate:  (v)  => setJoiningId(v.lobbyId),
    onSuccess: (data) => {
      setJoiningId(null)
      setSelectedLobby(null)
      if (data.status === 'full' && data.match) {
        router.push(`/payment?matchId=${data.match.match_id}`)
      } else {
        refetch()
      }
    },
    onError: (err) => {
      setJoiningId(null)
      alert(err.message)
    },
  })

  const handleJoin = (lobbyId: string) => {
    if (!playerId) { router.push('/login'); return }
    joinMutation.mutate({ lobbyId })
  }

  const loading = isLoading || !playerId

  return (
    <PageShell>
      {/* Mint header strip — always visible */}
      <HeaderStrip count={lobbies?.length ?? 0} loading={loading} />

      {/* Date bar — always visible */}
      <DateBar selected={selectedDate} onSelect={setSelectedDate} dates={dates} />

      {/* Content */}
      {loading ? (
        <LoadingFact />
      ) : (
        <div className="max-w-2xl mx-auto px-4 py-3.5 w-full">
          {/* Section header */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-[#0d3d3a]">Lobbies Near You</h2>
            <button type="button" className="text-xs font-bold text-[#30d5c8]">
              See All →
            </button>
          </div>

          {lobbies && lobbies.length > 0 ? (
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
              title="No lobbies yet"
              subtitle="Be the first — create one or find a match with advanced search."
              action={{ label: 'Create a lobby', href: '/create' }}
            />
          )}
        </div>
      )}

      {/* Bottom sheet drawer */}
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
