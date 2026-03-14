# F3 — Advanced Match Page

## Role
Build the `/match` page with a Vapi.ai-powered voice search. The user taps a mic button, speaks their lobby query, Vapi transcribes it, and the transcript is sent to `lobbies.search` which returns exact SQL matches padded with recommendations. Results are displayed as `LobbyCard`s.

## Style Reference
**All visual decisions must follow [`STYLEGUIDE.md`](../../STYLEGUIDE.md).** Key sections:
- §2 Colour palette — mic button idle: `bg-mint-500`, recording: `bg-red-500 animate-pulse`
- §6 Lobby Cards — `LobbyCard` component handles all badge/level rendering
- §9 Page background — `bg-[#f0fafa]` via `PageShell`

## Dependencies
- **B7** complete: `lobbies.search` procedure accepts `{ playerId, transcript }`, returns `Lobby[]`
- **B5** complete: `LobbyCard` component, `lobbies.join` procedure
- **B6** complete: `lobbies.join` triggers match creation when lobby fills
- **B2** complete: `usePlayer` hook
- **B3** complete: `trpc` client

## Full Feature Awareness
All app pages for reference:
- `/` — home + recommendations (F2)
- `/match` — **this page** — voice search
- `/create` — create lobby (F4)
- `/profile` — player profile + history (F5)
- `/payment` — pay for confirmed match (F6)

---

## Tasks

### 1. `VoiceSearchButton` Component
`src/components/VoiceSearchButton.tsx`

Uses `@vapi-ai/web`. The button toggles the Vapi call. On call end, the final transcript is emitted via the `onTranscript` callback.

```tsx
'use client'
import Vapi from '@vapi-ai/web'
import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff } from 'lucide-react'

const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!

type Props = {
  onTranscript: (text: string) => void
  disabled?: boolean
}

export function VoiceSearchButton({ onTranscript, disabled }: Props) {
  const vapiRef    = useRef<Vapi | null>(null)
  const [active, setActive]     = useState(false)
  const [status, setStatus]     = useState<string>('Tap to speak')

  useEffect(() => {
    const vapi = new Vapi(VAPI_PUBLIC_KEY)
    vapiRef.current = vapi

    vapi.on('call-start', () => {
      setActive(true)
      setStatus('Listening...')
    })

    vapi.on('call-end', () => {
      setActive(false)
      setStatus('Tap to speak')
    })

    vapi.on('message', (msg) => {
      // Capture the final transcript when the call ends
      if (msg.type === 'transcript' && msg.transcriptType === 'final') {
        onTranscript(msg.transcript)
      }
    })

    vapi.on('error', (e) => {
      console.error('Vapi error:', e)
      setActive(false)
      setStatus('Error — try again')
    })

    return () => { vapi.stop() }
  }, [onTranscript])

  function toggle() {
    if (!vapiRef.current) return
    if (active) {
      vapiRef.current.stop()
    } else {
      // Use a passthrough assistant — no system prompt needed,
      // Vapi just transcribes and forwards the speech
      vapiRef.current.start({
        transcriber: { provider: 'deepgram', model: 'nova-2', language: 'en-AU' },
        model:       { provider: 'openai', model: 'gpt-4o-mini', messages: [] },
        voice:       { provider: '11labs', voiceId: 'rachel' },
      })
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
          active
            ? 'bg-red-500 shadow-lg shadow-red-300 animate-pulse'
            : 'bg-mint-500 hover:bg-mint-600'
        } disabled:opacity-40`}
      >
        {active ? (
          <MicOff className="w-7 h-7 text-white" />
        ) : (
          <Mic className="w-7 h-7 text-white" />
        )}
      </button>
      <span className="text-xs text-gray-500">{status}</span>
    </div>
  )
}
```

### 2. Advanced Match Page
`src/app/match/page.tsx`

```tsx
'use client'
import { useState }              from 'react'
import { useRouter }             from 'next/navigation'
import { trpc }                  from '@/lib/trpc'
import { usePlayer }             from '@/hooks/usePlayer'
import { LobbyCard }             from '@/components/LobbyCard'
import { VoiceSearchButton }     from '@/components/VoiceSearchButton'
import { PageShell }             from '@/components/PageShell'
import { LoadingGrid }           from '@/components/LoadingGrid'
import { EmptyState }            from '@/components/EmptyState'

export default function AdvancedMatchPage() {
  const router               = useRouter()
  const { playerId }         = usePlayer()
  const [transcript, setTranscript] = useState<string>('')
  const [lobbies, setLobbies]       = useState<unknown[]>([])
  const [searched, setSearched]     = useState(false)

  const searchMutation = trpc.lobbies.search.useMutation({
    onSuccess: (data) => {
      setLobbies(data)
      setSearched(true)
    },
  })

  const joinMutation = trpc.lobbies.join.useMutation({
    onSuccess: (data) => {
      if (data.status === 'full' && data.match) {
        router.push(`/payment?matchId=${data.match.match_id}`)
      }
    },
  })

  function handleTranscript(text: string) {
    setTranscript(text)
    if (playerId) {
      searchMutation.mutate({ playerId, transcript: text })
    }
  }

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Find Your Match</h1>
        <p className="text-gray-500 text-sm mb-8">
          Tap the mic and describe what you're looking for — e.g. "casual doubles on Saturday morning"
        </p>

        {/* Voice search */}
        <div className="flex flex-col items-center gap-4 bg-white rounded-2xl p-8 shadow-sm border mb-8">
          <VoiceSearchButton
            onTranscript={handleTranscript}
            disabled={!playerId || searchMutation.isPending}
          />

          {transcript && (
            <div className="w-full mt-2 rounded-lg bg-gray-50 border px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">You said:</p>
              <p className="text-sm text-gray-700 italic">"{transcript}"</p>
            </div>
          )}
        </div>

        {/* Results */}
        {searchMutation.isPending && <LoadingGrid />}

        {!searchMutation.isPending && searched && (
          <>
            {lobbies.length > 0 ? (
              <>
                <p className="text-xs text-gray-400 mb-3">
                  {lobbies.length} result{lobbies.length !== 1 ? 's' : ''} found
                </p>
                <div className="grid gap-4">
                  {(lobbies as Parameters<typeof LobbyCard>[0]['lobby'][]).map((lobby) => (
                    <LobbyCard
                      key={lobby.lobby_id}
                      lobby={lobby}
                      onJoin={(id) => joinMutation.mutate({ lobbyId: id })}
                    />
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                title="No matching lobbies"
                subtitle="Try a different description, or create your own lobby."
                action={{ label: 'Create a lobby', href: '/create' }}
              />
            )}
          </>
        )}

        {!searched && !searchMutation.isPending && (
          <p className="text-center text-sm text-gray-400 mt-4">
            Your results will appear here after you speak
          </p>
        )}
      </div>
    </PageShell>
  )
}
```

### 3. Vapi Assistant Config Note
The `vapi.start()` call above uses a passthrough configuration — the assistant's only job is to listen and transcribe. No system prompt, no AI voice response required. If your Vapi account requires a pre-configured assistant ID, replace the object with:

```ts
vapiRef.current.start('YOUR_ASSISTANT_ID')
```

And configure the assistant in the Vapi dashboard as a "transcription-only" assistant.

---

## Files Produced

```
src/
├── app/match/
│   └── page.tsx
└── components/
    └── VoiceSearchButton.tsx
```

## UX Notes
- The mic button pulses red while recording to give clear visual feedback
- Transcript is shown below the mic button immediately after speech ends
- Search fires automatically when the transcript is received — no submit button needed
- If Vapi fails (network, mic permissions denied), show a text input fallback:
  ```tsx
  <input
    value={transcript}
    onChange={(e) => setTranscript(e.target.value)}
    placeholder="Or type your search here..."
    className="input"
    onKeyDown={(e) => e.key === 'Enter' && handleTranscript(transcript)}
  />
  ```
- `searchMutation` is a mutation (not query) so results don't cache across re-renders
