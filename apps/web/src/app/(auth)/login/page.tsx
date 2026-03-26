'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LoginSchema } from '@taxly/schemas'

function LogoMark({ white = false }: { white?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-taxly-700">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M4 6h16M4 12h16M4 18h10" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
          <circle cx="19" cy="18" r="3" fill="#F79A36"/>
        </svg>
      </div>
      <span className={`text-base font-bold tracking-tight ${white ? 'text-white' : 'text-[#0D1B3E]'}`}>Taxly</span>
    </div>
  )
}

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
    <div className="flex min-h-screen">
      {/* Left — brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-taxly-700 flex-col justify-between p-12">
        <LogoMark white />
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-white leading-snug">
            Contabilitate inteligentă pentru antreprenori români
          </h2>
          <ul className="space-y-4">
            {[
              'Facturare și e-Factura integrate',
              'Calculator fiscal în timp real',
              'Conformitate ANAF garantată',
            ].map(item => (
              <li key={item} className="flex items-start gap-3 text-white">
                <span className="mt-0.5 text-accent-500 text-lg leading-none">•</span>
                <span className="text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-taxly-100 text-xs">© {new Date().getFullYear()} Taxly. Toate drepturile rezervate.</p>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 flex-col justify-center bg-white px-8 py-12 sm:px-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <LogoMark />
        </div>

        <div className="mx-auto w-full max-w-sm">
          <h2 className="text-2xl font-bold text-[#0D1B3E] mb-1">Bun venit înapoi</h2>
          <p className="text-sm text-[#5A6A8A] mb-8">Intră în contul tău Taxly</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#0D1B3E]">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-lg border border-[#E2EAF4] bg-white px-3 py-2.5 text-sm text-[#0D1B3E] placeholder:text-[#8FA3C0] focus:border-taxly-700 focus:outline-none focus:ring-2 focus:ring-taxly-700/15"
                placeholder="ion@exemplu.ro"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[#0D1B3E]">
                Parolă
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-[#E2EAF4] bg-white px-3 py-2.5 text-sm text-[#0D1B3E] placeholder:text-[#8FA3C0] focus:border-taxly-700 focus:outline-none focus:ring-2 focus:ring-taxly-700/15"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#FF5252]">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-taxly-700 py-2.5 text-sm font-semibold text-white transition hover:bg-taxly-800 disabled:opacity-60"
            >
              {loading ? 'Se încarcă...' : 'Intră în cont'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#5A6A8A]">
            Nu ai cont?{' '}
            <Link href="/register" className="font-medium text-taxly-700 underline-offset-2 hover:underline">
              Creează cont gratuit
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
