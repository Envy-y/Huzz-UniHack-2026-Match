'use client'
import { createSupabaseClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export function usePlayer() {
  const [playerId, setPlayerId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createSupabaseClient()
    supabase.auth.getUser().then(({ data }) => {
      setPlayerId(data.user?.id ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setPlayerId(session?.user?.id ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return { playerId }
}
