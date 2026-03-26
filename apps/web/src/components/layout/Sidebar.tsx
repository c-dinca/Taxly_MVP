'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  email?: string | null
  name?: string | null
}

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor"/>
      </svg>
    ),
  },
  {
    href: '/clients',
    label: 'Clienți',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor"/>
      </svg>
    ),
  },
  {
    href: '/invoices',
    label: 'Facturi',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor"/>
        <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor"/>
      </svg>
    ),
  },
]

export function Sidebar({ email, name }: SidebarProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/invoices') {
      return pathname === '/invoices' || (pathname.startsWith('/invoices/') && pathname !== '/invoices/new')
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-white border-r border-[#E2EAF4] flex flex-col z-30">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-[#E2EAF4] shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-taxly-700 shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h10" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
            <circle cx="19" cy="18" r="3" fill="#F79A36"/>
          </svg>
        </div>
        <span className="text-[15px] font-bold tracking-tight text-[#0D1B3E]">Taxly</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                active
                  ? 'bg-taxly-50 text-taxly-700'
                  : 'text-[#5A6A8A] hover:bg-[#F4F6FB] hover:text-[#0D1B3E]'
              }`}
            >
              <span className={active ? 'text-taxly-700' : 'text-[#8FA3C0]'}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}

        <div className="pt-3 pb-1">
          <p className="px-3 text-[10px] font-semibold text-[#8FA3C0] uppercase tracking-wider">Acțiuni rapide</p>
        </div>

        <Link
          href="/invoices/new"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
            pathname === '/invoices/new'
              ? 'bg-accent-500 text-white shadow-sm'
              : 'text-accent-600 hover:bg-accent-500/10'
          }`}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" stroke="currentColor"/>
          </svg>
          Factură nouă
        </Link>
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-[#E2EAF4] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-taxly-100 text-xs font-bold text-taxly-700">
            {name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="overflow-hidden">
            {name && <p className="text-xs font-semibold text-[#0D1B3E] truncate">{name}</p>}
            <p className="text-[11px] text-[#8FA3C0] truncate">{email}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
