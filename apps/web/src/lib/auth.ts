import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { LoginSchema } from '@taxly/schemas'

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Parolă', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials)
        if (!parsed.success) return null

        try {
          const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed.data),
          })

          if (!res.ok) return null

          const data = (await res.json()) as {
            accessToken: string
            refreshToken: string
            user: {
              id: string
              email: string
              name: string
              onboardingCompleted: boolean
              subscription: string
            }
          }

          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            onboardingCompleted: data.user.onboardingCompleted,
            subscription: data.user.subscription,
          }
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as Record<string, unknown>
        token.accessToken = u['accessToken'] as string | undefined
        token.refreshToken = u['refreshToken'] as string | undefined
        token.accessTokenExpires = Date.now() + 55 * 60 * 1000
        token.onboardingCompleted = u['onboardingCompleted'] as boolean | undefined
        token.subscription = u['subscription'] as string | undefined
        return token
      }

      if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number)) {
        return token
      }

      // Access token expired — try to refresh
      try {
        const res = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: token.refreshToken }),
        })
        if (!res.ok) throw new Error('Refresh failed')
        const data = (await res.json()) as { accessToken: string; refreshToken: string }
        token.accessToken = data.accessToken
        token.refreshToken = data.refreshToken
        token.accessTokenExpires = Date.now() + 55 * 60 * 1000
      } catch {
        token.accessToken = undefined
        token.refreshToken = undefined
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.sub ?? ''
      session.accessToken = (token.accessToken as string | undefined)
      session.onboardingCompleted = (token.onboardingCompleted as boolean | undefined)
      session.subscription = (token.subscription as string | undefined)
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt' },
})
