'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LoginSchema } from '@taxly/schemas'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const data = { email: form.get('email') as string, password: form.get('password') as string }

    const parsed = LoginSchema.safeParse(data)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Date invalide')
      setLoading(false)
      return
    }

    const result = await signIn('credentials', { ...parsed.data, redirect: false })

    if (result?.error) {
      setError('Email sau parolă incorectă')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf7f4] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-taxly-700">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="#FFDBBB" strokeWidth="2.2" strokeLinecap="round"/>
              <circle cx="18" cy="18" r="3" fill="#FFDBBB"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-taxly-900">Taxly</h1>
          <p className="mt-1 text-sm text-taxly-500">Contabilitate simplă pentru PFA-uri</p>
        </div>

        <div className="rounded-2xl border border-taxly-300/40 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-taxly-900">Intră în cont</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-taxly-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-lg border border-taxly-300/60 bg-taxly-50 px-3 py-2.5 text-sm text-taxly-900 placeholder:text-taxly-400 focus:border-taxly-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-taxly-500/20"
                placeholder="ion@exemplu.ro"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-taxly-700">
                Parolă
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-taxly-300/60 bg-taxly-50 px-3 py-2.5 text-sm text-taxly-900 placeholder:text-taxly-400 focus:border-taxly-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-taxly-500/20"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-taxly-700 py-2.5 text-sm font-semibold text-taxly-100 transition hover:bg-taxly-800 disabled:opacity-60"
            >
              {loading ? 'Se încarcă...' : 'Intră în cont'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-taxly-500">
            Nu ai cont?{' '}
            <Link href="/register" className="font-medium text-taxly-700 hover:text-taxly-800 underline underline-offset-2">
              Creează cont gratuit
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
