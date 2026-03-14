'use client'

import { trpc }       from '@/lib/trpc'
import { usePlayer }  from '@/hooks/usePlayer'
import { PageShell }  from '@/components/PageShell'
import { useSearchParams } from 'next/navigation'
import { Loader2, MapPin, Users, CreditCard } from 'lucide-react'
import { Suspense } from 'react'

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function formatMatchType(t: string) {
  return t === 'S' ? 'Singles' : 'Doubles'
}

function formatTime(t: string) {
  if (t === 'M') return 'Morning (6am – 12pm)'
  if (t === 'A') return 'Afternoon (12pm – 6pm)'
  return 'Night (6pm – 11pm)'
}

function PaymentContent() {
  const { playerId } = usePlayer()
  const params       = useSearchParams()
  const matchId      = params.get('matchId') ?? ''

  const { data, isLoading, error } = trpc.payment.getMatch.useQuery(
    { matchId },
    { enabled: !!playerId && !!matchId }
  )

  const checkoutMutation = trpc.payment.createSession.useMutation({
    onSuccess: ({ url }) => { window.location.href = url },
  })

  if (!matchId) {
    return (
      <div className="text-center py-16 text-[#888]">
        <p className="text-[16px] font-bold">No match ID provided.</p>
      </div>
    )
  }

  if (isLoading || !playerId) {
    return (
      <div className="flex flex-col gap-4">
        {[100, 140, 80].map((h) => (
          <div key={h} className="rounded-[18px] bg-mint-50/60 animate-pulse border border-[rgba(48,213,200,0.10)]" style={{ height: h }} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-[14px] text-red-600 font-semibold bg-red-50 rounded-xl px-4 py-3">
        {error.message}
      </p>
    )
  }

  if (!data) return null

  const { match, splitCents, totalCents, playerCount } = data
  const lobby = match.lobby

  return (
    <div className="flex flex-col gap-4">

      {/* Match confirmed banner */}
      <div
        className="rounded-[18px] p-5 text-white"
        style={{ background: 'linear-gradient(135deg, #30d5c8 0%, #0d9488 100%)' }}
      >
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">🏸</span>
          <div>
            <p className="text-[18px] font-extrabold tracking-tight">Lobby Full!</p>
            <p className="text-white/80 text-[13px]">Your court is reserved — pay to confirm your spot.</p>
          </div>
        </div>
      </div>

      {/* Match details */}
      <div className="bg-white rounded-[18px] border border-[rgba(48,213,200,0.20)] shadow-[0_2px_12px_rgba(48,213,200,0.08)] p-5 flex flex-col gap-3">
        <p className="text-[11px] font-extrabold text-[#bbb] uppercase tracking-wider">Match details</p>

        <div className="flex items-start gap-3">
          <MapPin className="h-4 w-4 text-[#30d5c8] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[14px] font-extrabold text-[#0d3d3a]">{match.location.location_name}</p>
            <p className="text-[12px] text-[#888] mt-0.5">{match.location.location_address}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Users className="h-4 w-4 text-[#30d5c8] flex-shrink-0" />
          <p className="text-[13px] text-[#444] font-semibold">
            {formatMatchType(lobby.lobby_match_type)} · {lobby.lobby_game_type} · {formatTime(lobby.lobby_time)}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {lobby.lobby_days.map((d) => (
            <span
              key={d}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0fafa] text-[#30d5c8] border border-[#c0efec]/50"
            >
              {d}
            </span>
          ))}
        </div>
      </div>

      {/* Payment split */}
      <div className="bg-white rounded-[18px] border border-[rgba(48,213,200,0.20)] shadow-[0_2px_12px_rgba(48,213,200,0.08)] p-5">
        <p className="text-[11px] font-extrabold text-[#bbb] uppercase tracking-wider mb-3">Fee breakdown</p>

        <div className="flex justify-between items-center mb-2">
          <p className="text-[13px] text-[#888]">Total court booking</p>
          <p className="text-[13px] font-bold text-[#0d3d3a]">{formatCents(totalCents)}</p>
        </div>
        <div className="flex justify-between items-center mb-3">
          <p className="text-[13px] text-[#888]">Split between {playerCount} players</p>
          <p className="text-[13px] font-bold text-[#888]">÷ {playerCount}</p>
        </div>

        <div className="h-px bg-[#eee] mb-3" />

        <div className="flex justify-between items-center">
          <p className="text-[15px] font-extrabold text-[#0d3d3a]">Your share</p>
          <p className="text-[22px] font-extrabold text-[#30d5c8]">{formatCents(splitCents)}</p>
        </div>
      </div>

      {/* Test card hint */}
      <div className="bg-[#fffbea] rounded-[14px] border border-[#ffe58f] px-4 py-3">
        <p className="text-[11px] font-bold text-[#9a6000]">
          Test mode — use card <span className="font-mono tracking-wider">4242 4242 4242 4242</span>
        </p>
      </div>

      {/* Error */}
      {checkoutMutation.isError && (
        <p className="text-[13px] text-red-600 font-semibold bg-red-50 rounded-xl px-4 py-2">
          {checkoutMutation.error.message}
        </p>
      )}

      {/* CTA */}
      <button
        type="button"
        onClick={() => checkoutMutation.mutate({ matchId })}
        disabled={checkoutMutation.isPending}
        className="w-full rounded-2xl py-[14px] text-[15px] font-extrabold text-white transition-all duration-150 active:scale-[0.97] disabled:opacity-60 flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(90deg, #30d5c8 0%, #1ab5aa 100%)' }}
      >
        {checkoutMutation.isPending
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting...</>
          : <><CreditCard className="h-4 w-4" /> Pay {formatCents(splitCents)} Now</>
        }
      </button>

      <p className="text-center text-[11px] text-[#bbb]">
        Powered by Stripe · Secure payment
      </p>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <PageShell>
      <div className="max-w-lg mx-auto px-4 py-6 w-full">
        <h1 className="text-[22px] font-extrabold text-[#0d3d3a] mb-5">Complete Payment</h1>
        <Suspense fallback={
          <div className="flex flex-col gap-4">
            {[100, 140, 80].map((h) => (
              <div key={h} className="rounded-[18px] bg-mint-50/60 animate-pulse border border-[rgba(48,213,200,0.10)]" style={{ height: h }} />
            ))}
          </div>
        }>
          <PaymentContent />
        </Suspense>
      </div>
    </PageShell>
  )
}
