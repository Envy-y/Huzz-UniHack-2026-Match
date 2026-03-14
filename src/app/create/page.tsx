'use client'

import { trpc }       from '@/lib/trpc'
import { usePlayer }  from '@/hooks/usePlayer'
import { PageShell }  from '@/components/PageShell'
import { useRouter }  from 'next/navigation'
import { useState }   from 'react'
import { Loader2 }    from 'lucide-react'
import { cn }         from '@/lib/utils'
import type { Day }   from '@/types'

const DAYS: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const TIME_OPTIONS = [
  { value: 'M' as const, label: 'Morning',   sub: '6am – 12pm' },
  { value: 'A' as const, label: 'Afternoon', sub: '12pm – 6pm' },
  { value: 'N' as const, label: 'Night',     sub: '6pm – 11pm' },
]

const GAME_TYPES = [
  { value: 'Competitive' as const, label: 'Competitive', color: '#bf1a00', bg: '#fff0ee' },
  { value: 'Social'      as const, label: 'Social',      color: '#0a8a80', bg: '#e6faf8' },
  { value: 'Casual'      as const, label: 'Casual',      color: '#9a6000', bg: '#fff4dc' },
]

export default function CreatePage() {
  const router       = useRouter()
  const { playerId } = usePlayer()

  const [desc,      setDesc]      = useState('')
  const [matchType, setMatchType] = useState<'S' | 'D'>('S')
  const [gameType,  setGameType]  = useState<'Competitive' | 'Social' | 'Casual'>('Social')
  const [days,      setDays]      = useState<Day[]>([])
  const [time,      setTime]      = useState<'M' | 'A' | 'N'>('A')
  const [error,     setError]     = useState<string | null>(null)

  const createMutation = trpc.lobbies.create.useMutation({
    onSuccess: () => router.push('/'),
    onError:   (e) => setError(e.message),
  })

  function toggleDay(d: Day) {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!playerId) { router.push('/login'); return }
    if (days.length === 0) { setError('Pick at least one day.'); return }
    createMutation.mutate({
      lobby_desc:       desc.trim() || undefined,
      lobby_match_type: matchType,
      lobby_game_type:  gameType,
      lobby_days:       days,
      lobby_time:       time,
    })
  }

  return (
    <PageShell>
      <div className="max-w-lg mx-auto px-4 py-6 w-full">

        {/* Page title */}
        <h1 className="text-[22px] font-extrabold text-[#0d3d3a] mb-5">Create a Lobby</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Match type */}
          <section>
            <p className="text-[11px] font-extrabold text-[#bbb] uppercase tracking-wider mb-2">Match type</p>
            <div className="flex gap-2">
              {[
                { v: 'S' as const, label: 'Singles', sub: '1 v 1' },
                { v: 'D' as const, label: 'Doubles', sub: '2 v 2' },
              ].map(({ v, label, sub }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setMatchType(v)}
                  className={cn(
                    'flex-1 rounded-2xl border-2 py-3 transition-all duration-150 text-center',
                    matchType === v
                      ? 'border-[#30d5c8] bg-[#e6faf8]'
                      : 'border-[#eee] bg-white hover:border-[#30d5c8]/40'
                  )}
                >
                  <p className={cn('text-[14px] font-extrabold', matchType === v ? 'text-[#0a8a80]' : 'text-[#0d3d3a]')}>{label}</p>
                  <p className="text-[11px] text-[#aaa] mt-0.5">{sub}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Game type */}
          <section>
            <p className="text-[11px] font-extrabold text-[#bbb] uppercase tracking-wider mb-2">Game objective</p>
            <div className="flex gap-2">
              {GAME_TYPES.map(({ value, label, color, bg }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGameType(value)}
                  className={cn(
                    'flex-1 rounded-xl border-2 py-2 text-[12px] font-extrabold uppercase tracking-wide transition-all duration-150',
                    gameType === value ? 'border-transparent' : 'border-[#eee] bg-white'
                  )}
                  style={gameType === value ? { backgroundColor: bg, color, borderColor: color } : {}}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Days */}
          <section>
            <p className="text-[11px] font-extrabold text-[#bbb] uppercase tracking-wider mb-2">Available days</p>
            <div className="flex gap-1.5 flex-wrap">
              {DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={cn(
                    'w-10 h-10 rounded-full text-[12px] font-extrabold border-2 transition-all duration-150 flex-shrink-0',
                    days.includes(d)
                      ? 'bg-[#30d5c8] border-[#30d5c8] text-white'
                      : 'bg-white border-[#eee] text-[#888] hover:border-[#30d5c8]/50'
                  )}
                >
                  {d.slice(0, 2)}
                </button>
              ))}
            </div>
          </section>

          {/* Time slot */}
          <section>
            <p className="text-[11px] font-extrabold text-[#bbb] uppercase tracking-wider mb-2">Preferred time</p>
            <div className="flex gap-2">
              {TIME_OPTIONS.map(({ value, label, sub }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTime(value)}
                  className={cn(
                    'flex-1 rounded-2xl border-2 py-3 transition-all duration-150 text-center',
                    time === value
                      ? 'border-[#30d5c8] bg-[#e6faf8]'
                      : 'border-[#eee] bg-white hover:border-[#30d5c8]/40'
                  )}
                >
                  <p className={cn('text-[13px] font-extrabold', time === value ? 'text-[#0a8a80]' : 'text-[#0d3d3a]')}>{label}</p>
                  <p className="text-[10px] text-[#aaa] mt-0.5">{sub}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Description */}
          <section>
            <p className="text-[11px] font-extrabold text-[#bbb] uppercase tracking-wider mb-2">Note to players <span className="normal-case font-normal">(optional)</span></p>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              maxLength={300}
              rows={3}
              placeholder="e.g. Friendly game, bring your own shuttlecocks 🏸"
              className="w-full rounded-xl border-2 border-[#eee] bg-white px-4 py-3 text-[14px] text-[#1a1a1a] placeholder:text-[#ccc] resize-none focus:border-[#30d5c8] focus:outline-none transition-colors"
            />
            <p className="text-[11px] text-[#ccc] text-right mt-1">{desc.length}/300</p>
          </section>

          {/* Error */}
          {error && (
            <p className="text-[13px] text-red-600 font-semibold bg-red-50 rounded-xl px-4 py-2">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full rounded-2xl py-[14px] text-[15px] font-extrabold text-white transition-all duration-150 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(90deg, #30d5c8 0%, #1ab5aa 100%)' }}
          >
            {createMutation.isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
              : '🏸 Create Lobby'
            }
          </button>

        </form>
      </div>
    </PageShell>
  )
}
