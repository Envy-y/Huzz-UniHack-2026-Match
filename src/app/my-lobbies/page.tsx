'use client'

import { trpc } from '@/lib/trpc'
import { usePlayer } from '@/hooks/usePlayer'
import { PageShell } from '@/components/PageShell'
import { LobbyCard } from '@/components/LobbyCard'
import { EmptyState } from '@/components/EmptyState'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Check, X } from 'lucide-react'
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

export default function MyLobbiesPage() {
  const router = useRouter()
  const { playerId } = usePlayer()
  const [editingId, setEditingId] = useState<string | null>(null)

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
              <div key={lobby.lobby_id} className="bg-white border border-[rgba(48,213,200,0.20)] shadow-[0_2px_12px_rgba(48,213,200,0.08)] rounded-[18px] p-4">
                <LobbyCard lobby={lobby as any} />
                {lobby.lobby_status === 'Open' && (
                  editingId === lobby.lobby_id ? (
                    <EditForm
                      lobbyId={lobby.lobby_id}
                      initialDays={lobby.lobby_days}
                      initialTime={lobby.lobby_time}
                      onDone={() => setEditingId(null)}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingId(lobby.lobby_id)}
                      className="mt-3 flex items-center gap-1.5 text-[12px] font-bold text-[#30d5c8]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit schedule
                    </button>
                  )
                )}
              </div>
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
    </PageShell>
  )
}
