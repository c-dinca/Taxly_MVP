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
        token.onboardingCompleted = u['onboardingCompleted'] as boolean | undefined
        token.subscription = u['subscription'] as string | undefined
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
