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
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 6h18M3 12h18M3 18h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Taxly</h1>
          <p className="mt-1 text-sm text-stone-500">Contabilitate simplă pentru PFA-uri</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-stone-900">Intră în cont</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-stone-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-taxly-700 focus:outline-none focus:ring-2 focus:ring-taxly-700/20"
                placeholder="ion@exemplu.ro"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-stone-700">
                Parolă
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-taxly-700 focus:outline-none focus:ring-2 focus:ring-taxly-700/20"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-taxly-700 py-2.5 text-sm font-semibold text-white transition hover:bg-taxly-800 disabled:opacity-60"
            >
              {loading ? 'Se încarcă...' : 'Intră în cont'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500">
            Nu ai cont?{' '}
            <Link href="/register" className="font-medium text-taxly-700 underline-offset-2 hover:text-taxly-800 hover:underline">
              Creează cont gratuit
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
