'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { RegisterSchema } from '@taxly/schemas'

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const data = {
      name: form.get('name') as string,
      email: form.get('email') as string,
      password: form.get('password') as string,
    }

    const parsed = RegisterSchema.safeParse(data)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Date invalide')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })

      const json = (await res.json()) as { message?: string }

      if (!res.ok) {
        setError(json.message ?? 'Eroare la înregistrare')
        setLoading(false)
        return
      }

      // Auto-login după register
      await signIn('credentials', {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      })

      router.push('/onboarding')
    } catch {
      setError('Eroare de conexiune. Încearcă din nou.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf7f4] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-taxly-700">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="#FFDBBB" strokeWidth="2.2" strokeLinecap="round"/>
              <circle cx="18" cy="18" r="3" fill="#FFDBBB"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-taxly-900">Taxly</h1>
          <p className="mt-1 text-sm text-taxly-500">30 de zile gratuit, fără card</p>
        </div>

        <div className="rounded-2xl border border-taxly-300/40 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-taxly-900">Creează cont gratuit</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-taxly-700">
                Nume complet
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="w-full rounded-lg border border-taxly-300/60 bg-taxly-50 px-3 py-2.5 text-sm text-taxly-900 placeholder:text-taxly-400 focus:border-taxly-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-taxly-500/20"
                placeholder="Ion Popescu"
              />
            </div>

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
                autoComplete="new-password"
                required
                className="w-full rounded-lg border border-taxly-300/60 bg-taxly-50 px-3 py-2.5 text-sm text-taxly-900 placeholder:text-taxly-400 focus:border-taxly-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-taxly-500/20"
                placeholder="Minim 8 caractere, 1 maj., 1 cifră"
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
              {loading ? 'Se creează contul...' : 'Începe gratuit — 30 zile trial'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-taxly-500">
            Ai deja cont?{' '}
            <Link href="/login" className="font-medium text-taxly-700 hover:text-taxly-800 underline underline-offset-2">
              Intră în cont
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
