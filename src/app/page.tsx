'use client'

import { trpc } from '@/lib/trpc'
import { usePlayer } from '@/hooks/usePlayer'
import { LobbyCard } from '@/components/LobbyCard'
import { PageShell } from '@/components/PageShell'
import { LoadingGrid } from '@/components/LoadingGrid'
import { EmptyState } from '@/components/EmptyState'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function HomePage() {
  const router = useRouter()
  const { playerId } = usePlayer()
  const [joiningLobbyId, setJoiningLobbyId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    data: lobbies,
    isLoading,
    refetch,
  } = trpc.lobbies.recommendations.useQuery(
    { playerId: playerId! },
    { enabled: !!playerId }
  )

  const joinMutation = trpc.lobbies.join.useMutation({
    onMutate: (variables) => {
      setJoiningLobbyId(variables.lobbyId)
      setSuccessMessage(null)
    },
    onSuccess: (data) => {
      if (data.status === 'full' && data.match) {
        router.push(`/payment?matchId=${data.match.match_id}`)
      } else if (data.status === 'joined') {
        setSuccessMessage("You've joined! Waiting for more players.")
        refetch()
      } else if (data.status === 'already_joined') {
        setSuccessMessage("You're already in this lobby!")
      }
      setJoiningLobbyId(null)
    },
    onError: (error) => {
      setSuccessMessage(null)
      setJoiningLobbyId(null)
      alert(error.message)
    },
  })

  const handleJoin = (lobbyId: string) => {
    if (!playerId) {
      router.push('/login')
      return
    }
    joinMutation.mutate({ lobbyId, playerId })
  }

  if (isLoading || !playerId) {
    return (
      <PageShell>
        <LoadingGrid />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-br from-mint-600 to-mint-800 bg-clip-text text-transparent mb-2">
            Good match today?
          </h1>
          <p className="text-gray-600">Recommended lobbies just for you</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm animate-in fade-in-50 slide-in-from-top-2">
            {successMessage}
          </div>
        )}

        {/* Lobbies Grid */}
        {lobbies && lobbies.length > 0 ? (
          <div className="grid gap-4">
            {lobbies.map((lobby) => (
              <LobbyCard
                key={lobby.lobby_id}
                lobby={lobby}
                onJoin={handleJoin}
                highlighted={
                  lobby.lobby_status === 'Full' || lobby.lobby_status === 'Matched'
                }
                isJoining={joiningLobbyId === lobby.lobby_id}
                disabled={!!joiningLobbyId}
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
    </PageShell>
  )
}
