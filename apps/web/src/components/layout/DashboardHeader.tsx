import Link from 'next/link'

interface DashboardHeaderProps {
  email?: string | null
  name?: string | null
}

export function DashboardHeader({ email, name }: DashboardHeaderProps) {
  return (
    <header className="bg-white border-b border-[#E2EAF4] px-6 py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-taxly-700">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M4 12h16M4 18h10" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                <circle cx="19" cy="18" r="3" fill="#F79A36"/>
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-[#0D1B3E]">Taxly</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-[#5A6A8A] hover:text-taxly-700 transition-colors">Dashboard</Link>
            <Link href="/clients" className="text-sm font-medium text-[#5A6A8A] hover:text-taxly-700 transition-colors">Clienți</Link>
            <Link href="/invoices" className="text-sm font-medium text-[#5A6A8A] hover:text-taxly-700 transition-colors">Facturi</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#5A6A8A]">{email}</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-taxly-100 text-sm font-semibold text-taxly-700">
            {name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  )
}
