'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'

interface DashboardShellProps {
  children: React.ReactNode
  email?: string | null
  name?: string | null
}

export function DashboardShell({ children, email, name }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar on route change (click navigation)
  useEffect(() => {
    setSidebarOpen(false)
  }, [])

  return (
    <div className="flex min-h-screen bg-[#F4F6FB]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — always visible on desktop, drawer on mobile */}
      <Sidebar
        email={email}
        name={name}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex flex-col flex-1 md:ml-60 min-w-0">
        {/* Mobile top bar */}
        <header className="flex md:hidden items-center gap-3 h-14 px-4 bg-white border-b border-[#E2EAF4] sticky top-0 z-10 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-[#F4F6FB] text-[#5A6A8A] transition-colors"
            aria-label="Deschide meniu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" />
            </svg>
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#004AAD] shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M4 12h16M4 18h10" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="19" cy="18" r="3" fill="#F79A36" />
              </svg>
            </div>
            <span className="text-[15px] font-bold tracking-tight text-[#0D1B3E]">Taxly</span>
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
