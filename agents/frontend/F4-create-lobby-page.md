# F4 — Create Lobby Page

## Role
Build the `/create` page: a form for creating a new lobby with full tag control (match type, objective, days, time, description). On submit, calls `lobbies.create` and redirects to the home page.

## Dependencies
- **B5** complete: `lobbies.create` procedure, Zod `createLobbyInput` schema
- **B2** complete: `usePlayer` hook
- **B3** complete: `trpc` client

## Full Feature Awareness
All app pages for reference:
- `/` — home + recommendations (F2)
- `/match` — voice search (F3)
- `/create` — **this page** — create lobby
- `/profile` — player profile + history (F5)
- `/payment` — pay for confirmed match (F6)

---

## Tasks

### 1. Create Lobby Page
`src/app/create/page.tsx`

```tsx
'use client'
import { useRouter }       from 'next/navigation'
import { useForm }         from 'react-hook-form'
import { z }               from 'zod'
import { zodResolver }     from '@hookform/resolvers/zod'
import { trpc }            from '@/lib/trpc'
import { usePlayer }       from '@/hooks/usePlayer'
import { PageShell }       from '@/components/PageShell'
import type { Day }        from '@/types'

const DAYS: Day[]    = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const DAY_LABELS: Record<Day, string> = {
  Mon: 'Mon', Tue: 'Tue', Wed: 'Wed', Thu: 'Thu', Fri: 'Fri', Sat: 'Sat', Sun: 'Sun',
}

const schema = z.object({
  lobby_desc:       z.string().max(300).optional(),
  lobby_match_type: z.enum(['S','D']),
  lobby_game_type:  z.enum(['Competitive','Social','Casual']),
  lobby_days:       z.array(z.enum(['Mon','Tue','Wed','Thu','Fri','Sat','Sun'])).min(1, 'Select at least one day'),
  lobby_time:       z.enum(['M','A','N']),
})
type FormData = z.infer<typeof schema>

export default function CreateLobbyPage() {
  const router     = useRouter()
  const { playerId } = usePlayer()
  const create     = trpc.lobbies.create.useMutation({
    onSuccess: () => router.push('/'),
  })

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      lobby_match_type: 'D',
      lobby_game_type:  'Casual',
      lobby_days:       [],
      lobby_time:       'A',
    },
  })

  const selectedDays = watch('lobby_days')

  function toggleDay(day: Day) {
    if (selectedDays.includes(day)) {
      setValue('lobby_days', selectedDays.filter((d) => d !== day))
    } else {
      setValue('lobby_days', [...selectedDays, day])
    }
  }

  function onSubmit(data: FormData) {
    if (!playerId) return
    create.mutate(data)
  }

  return (
    <PageShell>
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Create a Lobby</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white rounded-xl p-6 shadow-sm border">

          {/* Match Type */}
          <ToggleGroup
            label="Match Type"
            options={[{ value: 'S', label: 'Singles' }, { value: 'D', label: 'Doubles' }]}
            value={watch('lobby_match_type')}
            onChange={(v) => setValue('lobby_match_type', v as 'S' | 'D')}
          />

          {/* Objective */}
          <ToggleGroup
            label="Objective"
            options={[
              { value: 'Competitive', label: 'Competitive' },
              { value: 'Social',      label: 'Social' },
              { value: 'Casual',      label: 'Casual' },
            ]}
            value={watch('lobby_game_type')}
            onChange={(v) => setValue('lobby_game_type', v as 'Competitive' | 'Social' | 'Casual')}
          />

          {/* Days */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Available Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    selectedDays.includes(day)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {DAY_LABELS[day]}
                </button>
              ))}
            </div>
            {errors.lobby_days && (
              <p className="text-red-500 text-xs mt-1">{errors.lobby_days.message}</p>
            )}
          </div>

          {/* Time Slot */}
          <ToggleGroup
            label="Preferred Time"
            options={[
              { value: 'M', label: 'Morning' },
              { value: 'A', label: 'Afternoon' },
              { value: 'N', label: 'Night' },
            ]}
            value={watch('lobby_time')}
            onChange={(v) => setValue('lobby_time', v as 'M' | 'A' | 'N')}
          />

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              {...register('lobby_desc')}
              rows={3}
              placeholder="Tell others what you're looking for..."
              className="input resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={create.isPending || !playerId}
            className="btn-primary w-full"
          >
            {create.isPending ? 'Creating...' : 'Create Lobby'}
          </button>

          {create.isError && (
            <p className="text-red-500 text-sm text-center">Something went wrong. Please try again.</p>
          )}
        </form>
      </div>
    </PageShell>
  )
}
```

### 2. `ToggleGroup` Component
`src/components/ToggleGroup.tsx` — reusable pill selector used in this page and optionally in F2's join flow.

```tsx
type Option = { value: string; label: string }

type Props = {
  label:    string
  options:  Option[]
  value:    string
  onChange: (value: string) => void
}

export function ToggleGroup({ label, options, value, onChange }: Props) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-2">{label}</label>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
              value === opt.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

---

## Files Produced

```
src/
├── app/create/
│   └── page.tsx
└── components/
    └── ToggleGroup.tsx
```

## UX Notes
- Form defaults: Doubles, Casual, Afternoon — the most common combination
- Days use toggle pills, not a dropdown, for fast multi-select
- After successful create, redirect to `/` where the new lobby will appear in the list
- The `maxPlayers` field is not shown to the user — it is derived server-side from `lobby_match_type` (S=2, D=4)
