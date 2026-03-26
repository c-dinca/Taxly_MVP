import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth()

  const onboardingCompleted = session.onboardingCompleted

  return (
    <div className="min-h-screen bg-[#faf7f4]">
      <header className="border-b border-taxly-300/30 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-taxly-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 6h18M3 12h18M3 18h18" stroke="#FFDBBB" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-taxly-900">Taxly</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-taxly-500">{session.user?.email}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-taxly-100 text-sm font-semibold text-taxly-700">
              {session.user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-taxly-100">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v1M12 20v1M4.22 4.22l.7.7M19.07 19.07l.7.7M3 12H2M22 12h-1M4.92 19.07l.7-.7M19.07 4.92l.7-.7" stroke="#664930"/>
              <circle cx="12" cy="12" r="5" stroke="#664930"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-taxly-900">Bun venit, {session.user?.name?.split(' ')[0]}</h1>
            <p className="text-sm text-taxly-500">Iata rezumatul activitatii tale</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Facturi emise" value="—" sub="luna aceasta" />
          <StatCard label="Rest in buzunar" value="—" sub="estimat anual" />
          <StatCard label="Taxe datorate" value="—" sub="CAS + CASS + impozit" />
        </div>

        <div className="mt-8 rounded-xl border border-taxly-200 bg-taxly-50 px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-taxly-100">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#664930"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-taxly-800">Functionalítatile sunt in constructie</p>
              <p className="mt-0.5 text-sm text-taxly-500">Facturare, calculator fiscal si e-Factura vor fi disponibile in curand.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-taxly-300/30 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-taxly-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-taxly-900">{value}</p>
      <p className="mt-1 text-xs text-taxly-400">{sub}</p>
    </div>
  )
}
