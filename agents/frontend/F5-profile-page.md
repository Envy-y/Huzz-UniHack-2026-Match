# F5 — Profile Page

## Role
Build the `/profile` page: display static player info (name, DOB, gender), allow editing of skill level and bio, and show a match history list with venue, date, and result for each past match.

## Style Reference
**All visual decisions must follow [`STYLEGUIDE.md`](../../STYLEGUIDE.md).** Key sections:
- §11 Skill selector — 5×2 grid, 1–10, mint-500 selected (same component as signup)
- §2 Links — `text-mint-600 hover:underline`
- §14 Buttons — `Button` shadcn component for all CTAs

## Dependencies
- **B4** complete: `players.get`, `players.update`, `players.matchHistory` procedures
- **B2** complete: `usePlayer` hook
- **B3** complete: `trpc` client

## Full Feature Awareness
All app pages for reference:
- `/` — home + recommendations (F2)
- `/match` — voice search (F3)
- `/create` — create lobby (F4)
- `/profile` — **this page** — player profile + history
- `/payment` — pay for confirmed match (F6)

---

## Tasks

### 1. Profile Page
`src/app/profile/page.tsx`

```tsx
'use client'
import { useState }          from 'react'
import { trpc }              from '@/lib/trpc'
import { usePlayer }         from '@/hooks/usePlayer'
import { PageShell }         from '@/components/PageShell'
import { captureGeolocation } from '@/lib/geolocation'

export default function ProfilePage() {
  const { playerId }  = usePlayer()

  const { data: player, refetch } = trpc.players.get.useQuery(
    { id: playerId! },
    { enabled: !!playerId }
  )

  const { data: history } = trpc.players.matchHistory.useQuery(
    { id: playerId! },
    { enabled: !!playerId }
  )

  const update = trpc.players.update.useMutation({ onSuccess: () => refetch() })

  const [skill, setSkill]   = useState<number | null>(null)
  const [bio,   setBio]     = useState<string | null>(null)
  const [saved, setSaved]   = useState(false)

  // Initialise local state from fetched player
  const currentSkill = skill ?? player?.player_skill ?? 3
  const currentBio   = bio   ?? player?.player_desc  ?? ''

  function handleSave() {
    if (!playerId) return
    update.mutate(
      { id: playerId, player_skill: currentSkill, player_desc: currentBio },
      { onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000) } }
    )
  }

  async function handleUpdateLocation() {
    if (!playerId) return
    const coords = await captureGeolocation()
    if (coords) {
      update.mutate({ id: playerId, player_lat: coords.lat, player_long: coords.lon })
    }
  }

  if (!player) {
    return (
      <PageShell>
        <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-gray-200 animate-pulse" />
          ))}
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Static info */}
        <section className="bg-white rounded-xl p-6 shadow-sm border">
          <h1 className="text-xl font-bold mb-4">
            {player.player_fname} {player.player_lname}
          </h1>
          <dl className="space-y-2 text-sm text-gray-600">
            <InfoRow label="Date of birth" value={new Date(player.player_dob).toLocaleDateString('en-AU')} />
            <InfoRow label="Gender"        value={player.player_gender} />
          </dl>
        </section>

        {/* Editable fields */}
        <section className="bg-white rounded-xl p-6 shadow-sm border space-y-5">
          <h2 className="text-lg font-semibold">Edit Profile</h2>

          {/* Skill */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Skill Level</label>
            {/* §11 Skill selector — 5×2 grid, 1–10, mint-500 selected */}
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSkill(s)}
                  className={`h-12 rounded-xl border-2 font-bold text-lg transition-all duration-200 ${
                    s === currentSkill
                      ? 'bg-mint-500 border-mint-500 text-white shadow-lg shadow-mint-500/30 scale-105'
                      : 'border-gray-300 text-gray-500 hover:border-mint-300 hover:text-mint-500'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              1 = Beginner · 5 = Intermediate · 10 = Top Player
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Bio</label>
            <textarea
              rows={3}
              value={currentBio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              placeholder="Tell other players about yourself..."
              className="input resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{currentBio.length}/500</p>
          </div>

          <Button
            type="button"
            onClick={handleSave}
            disabled={update.isPending}
            className="w-full"
          >
            {update.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </section>

        {/* Location */}
        <section className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold mb-2">Your Location</h2>
          <p className="text-sm text-gray-500 mb-3">
            {player.player_lat
              ? `Set (${player.player_lat.toFixed(3)}, ${player.player_long?.toFixed(3)})`
              : 'Not set — required for venue matching.'}
          </p>
          <button
            type="button"
            onClick={handleUpdateLocation}
            className="text-sm text-mint-600 hover:underline"
          >
            {player.player_lat ? 'Update location' : 'Set my location'}
          </button>
        </section>

        {/* Match History */}
        <section className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Match History</h2>
          {history && history.length > 0 ? (
            <ul className="space-y-3">
              {history.map((m) => (
                <li key={m.match_id} className="flex items-start justify-between text-sm">
                  <div>
                    <p className="font-medium">{m.location.location_name}</p>
                    <p className="text-gray-400">
                      {m.start_time
                        ? new Date(m.start_time).toLocaleDateString('en-AU', { dateStyle: 'medium' })
                        : 'Date TBC'}
                      {' · '}
                      {m.lobby.lobby_match_type === 'S' ? 'Singles' : 'Doubles'}
                      {' · '}
                      {m.lobby.lobby_game_type}
                    </p>
                  </div>
                  <MatchStatusBadge status={m.match_status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No matches yet — join or create a lobby to get started.</p>
          )}
        </section>

      </div>
    </PageShell>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-400">{label}</dt>
      <dd className="font-medium text-gray-800">{value}</dd>
    </div>
  )
}

function MatchStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Confirmed: 'bg-mint-50 text-mint-700',
    Played:    'bg-green-100 text-green-700',
    Cancelled: 'bg-red-50 text-red-700',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}
```

---

## Files Produced

```
src/app/profile/
└── page.tsx
```

## UX Notes
- Skill level and bio changes are local state until "Save Changes" is clicked — no auto-save
- "Saved!" confirmation shows for 2 seconds then reverts to "Save Changes"
- Location section appears even if coordinates are missing, prompting the player to set it (important for matchmaking)
- Match history is ordered most recent first (handled by B4's `orderBy: { created_at: 'desc' }`)
- Name, DOB, and gender are read-only — cannot be changed after signup
