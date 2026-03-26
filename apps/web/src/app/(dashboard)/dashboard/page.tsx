import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="px-8 py-8 max-w-5xl">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-[#0D1B3E] flex items-center gap-2">
          <span className="inline-block w-1 h-5 rounded-full bg-accent-500" />
          Bun venit, {session.user?.name?.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-[#5A6A8A] pl-3">Iată rezumatul activității tale</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Facturi emise"
          value="—"
          sub="luna aceasta"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-taxly-400">
              <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor"/>
              <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor"/>
            </svg>
          }
        />
        <StatCard
          label="Rest în buzunar"
          value="—"
          sub="estimat anual"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-taxly-400">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor"/>
            </svg>
          }
        />
        <StatCard
          label="Taxe datorate"
          value="—"
          sub="CAS + CASS + impozit"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-taxly-400">
              <path d="M3 20h18" stroke="currentColor"/>
              <rect x="5" y="12" width="3" height="8" rx="0.5" stroke="currentColor"/>
              <rect x="10.5" y="7" width="3" height="13" rx="0.5" stroke="currentColor"/>
              <rect x="16" y="4" width="3" height="16" rx="0.5" stroke="currentColor"/>
            </svg>
          }
        />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link href="/clients" className="group rounded-xl border border-[#E2EAF4] bg-white p-5 shadow-sm hover:border-taxly-300 hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-taxly-50 group-hover:bg-taxly-100 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-taxly-700">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0D1B3E]">Clienți</p>
              <p className="text-xs text-[#8FA3C0]">Gestionează clienții</p>
            </div>
          </div>
        </Link>

        <Link href="/invoices" className="group rounded-xl border border-[#E2EAF4] bg-white p-5 shadow-sm hover:border-taxly-300 hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-taxly-50 group-hover:bg-taxly-100 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-taxly-700">
                <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor"/>
                <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0D1B3E]">Facturi</p>
              <p className="text-xs text-[#8FA3C0]">Vezi toate facturile</p>
            </div>
          </div>
        </Link>

        <Link href="/invoices/new" className="group rounded-xl border border-[#E2EAF4] bg-white p-5 shadow-sm hover:border-accent-500 hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/10 group-hover:bg-accent-500/20 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className="text-accent-600">
                <path d="M12 5v14M5 12h14" stroke="currentColor"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0D1B3E]">Factură nouă</p>
              <p className="text-xs text-[#8FA3C0]">Emite o factură</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-8 rounded-xl bg-taxly-700 px-6 py-5">
        <div className="flex items-start gap-4">
          <div className="shrink-0 text-accent-500 mt-0.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Funcționalitățile sunt în construcție</p>
            <p className="mt-0.5 text-sm text-taxly-100">Calculator fiscal și e-Factura vor fi disponibile în curând.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, icon }: { label: string; value: string; sub: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#E2EAF4] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-[#5A6A8A]">{label}</p>
        {icon}
      </div>
      <p className="mt-3 text-3xl font-bold text-[#0D1B3E]">{value}</p>
      <p className="mt-1 text-xs text-[#8FA3C0]">{sub}</p>
    </div>
  )
}
