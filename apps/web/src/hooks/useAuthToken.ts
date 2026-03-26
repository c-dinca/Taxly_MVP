'use client'

import { useSession } from 'next-auth/react'

/**
 * Returns the current access token from the session.
 * Uses useSession() so the token is always fresh (auto-refreshed by NextAuth).
 */
export function useAuthToken(): string | undefined {
  const { data: session } = useSession()
  return session?.accessToken as string | undefined
}
