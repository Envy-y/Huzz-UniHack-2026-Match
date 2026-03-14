'use client'

import { trpc }      from '@/lib/trpc'
import { usePlayer } from '@/hooks/usePlayer'
import { PageShell } from '@/components/PageShell'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2, CheckCircle, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { hashColor, initials } from '@/components/LobbyCard'
import { createSupabaseClient } from '@/lib/supabase'

const SKILL_LEVELS = [1, 2, 3, 4, 5] as const
const SKILL_LABELS: Record<number, string> = {
  1: 'Beginner',
  2: 'Novice',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
}

function getAge(dob: Date | string | null | undefined): string {
  if (!dob) return ''
  const years = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  return `${years} years old`
}

function formatDOB(dob: Date | string | null | undefined): string {
  if (!dob) return ''
  return new Date(dob).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ProfilePage() {
  const router       = useRouter()
  const { playerId } = usePlayer()

  const { data: player, isLoading } = trpc.players.me.useQuery(
    undefined,
    { enabled: !!playerId }
  )

  const [skill,   setSkill]   = useState<number>(3)
  const [bio,     setBio]     = useState('')
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (player) {
      setSkill(player.player_skill ?? 3)
      setBio(player.player_desc ?? '')
    }
  }, [player])

  const updateMutation = trpc.players.update.useMutation({
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2500) },
    onError:   (e) => setError(e.message),
  })

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    if (!playerId) { router.push('/login'); return }
    updateMutation.mutate({ id: playerId, player_skill: skill, player_desc: bio })
  }

  const avatarColor = player ? hashColor(player.player_id) : '#30d5c8'
  const avatarText  = player ? initials(player.player_fname, player.player_lname) : '?'

  return (
    <PageShell>
      <div className="max-w-lg mx-auto px-4 py-6 w-full">

        {isLoading || !playerId ? (
          <div className="flex flex-col gap-4">
            {[80, 120, 160].map((h) => (
              <div key={h} className="rounded-[18px] bg-mint-50/60 animate-pulse border border-[rgba(48,213,200,0.10)]" style={{ height: h }} />
            ))}
          </div>
        ) : !player ? (
          <p className="text-[14px] text-[#888] text-center py-10">Player profile not found.</p>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-5">

            {/* Avatar + identity */}
            <div className="bg-white rounded-[18px] border border-[rgba(48,213,200,0.20)] shadow-[0_2px_12px_rgba(48,213,200,0.08)] p-5 flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-[22px] font-extrabold text-white flex-shrink-0"
                style={{ backgroundColor: avatarColor }}
              >
                {avatarText}
              </div>
              <div>
                <p className="text-[18px] font-extrabold text-[#0d3d3a]">
                  {player.player_fname} {player.player_lname}
                </p>
                <p className="text-[12px] text-[#888] mt-0.5">
                  {player.player_gender}
                  {player.player_dob ? ` · ${getAge(player.player_dob)} · Born ${formatDOB(player.player_dob)}` : ''}
                </p>
              </div>
            </div>

            {/* Skill level */}
            <section className="bg-white rounded-[18px] border border-[rgba(48,213,200,0.20)] shadow-[0_2px_12px_rgba(48,213,200,0.08)] p-5">
              <p className="text-[11px] font-extrabold text-[#bbb] uppercase tracking-wider mb-3">Skill level</p>
              <div className="flex items-center gap-2 mb-2">
                {SKILL_LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSkill(lvl)}
                    className={cn(
                      'flex-1 h-10 rounded-xl text-[13px] font-extrabold transition-all duration-150 border-2',
                      skill === lvl
                        ? 'border-transparent text-white'
                        : 'border-[#eee] bg-white text-[#aaa] hover:border-[#30d5c8]/40'
                    )}
                    style={skill === lvl ? { background: 'linear-gradient(90deg, #30d5c8 0%, #1ab5aa 100%)', borderColor: 'transparent' } : {}}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              <p className="text-[13px] font-bold text-[#30d5c8] text-center">{SKILL_LABELS[skill]}</p>
            </section>

            {/* Bio */}
            <section className="bg-white rounded-[18px] border border-[rgba(48,213,200,0.20)] shadow-[0_2px_12px_rgba(48,213,200,0.08)] p-5">
              <p className="text-[11px] font-extrabold text-[#bbb] uppercase tracking-wider mb-2">Bio <span className="normal-case font-normal">(optional)</span></p>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Tell others about your playing style..."
                className="w-full rounded-xl border-2 border-[#eee] bg-[#fafafa] px-4 py-3 text-[14px] text-[#1a1a1a] placeholder:text-[#ccc] resize-none focus:border-[#30d5c8] focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-[#ccc] text-right mt-1">{bio.length}/500</p>
            </section>

            {/* Error */}
            {error && (
              <p className="text-[13px] text-red-600 font-semibold bg-red-50 rounded-xl px-4 py-2">{error}</p>
            )}

            {/* Save */}
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className={cn(
                'w-full rounded-2xl py-[14px] text-[15px] font-extrabold text-white transition-all duration-150 active:scale-[0.97] disabled:opacity-60 flex items-center justify-center gap-2',
                saved ? 'bg-[#0a8a80]' : ''
              )}
              style={!saved ? { background: 'linear-gradient(90deg, #30d5c8 0%, #1ab5aa 100%)' } : {}}
            >
              {updateMutation.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                : saved
                ? <><CheckCircle className="h-4 w-4" /> Saved!</>
                : 'Save Profile'
              }
            </button>

            {/* Log out */}
            <button
              type="button"
              onClick={async () => {
                const supabase = createSupabaseClient()
                await supabase.auth.signOut()
                router.push('/login')
              }}
              className="w-full rounded-2xl py-[14px] text-[15px] font-extrabold text-[#bf1a00] bg-[#ffeaea] transition-all duration-150 active:scale-[0.97] flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>

          </form>
        )}
      </div>
    </PageShell>
  )
}
