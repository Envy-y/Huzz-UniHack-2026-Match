import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'

export async function createContext(_opts: FetchCreateContextFnOptions) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return {
    playerId: user?.id ?? null, // null = unauthenticated
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
