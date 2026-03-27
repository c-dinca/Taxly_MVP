'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="ro">
      <body className="flex min-h-screen items-center justify-center bg-[#F4F6FB] p-6">
        <div className="max-w-md text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" stroke="#DC2626"/>
                <path d="M12 8v4M12 16h.01" stroke="#DC2626"/>
              </svg>
            </div>
          </div>
          <h1 className="mb-2 text-xl font-bold text-[#0D1B3E]">Ceva a mers prost</h1>
          <p className="mb-6 text-sm text-[#5A6A8A]">
            A apărut o eroare neașteptată. Echipa noastră a fost notificată automat.
          </p>
          <button
            onClick={reset}
            className="rounded-lg bg-[#004AAD] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#002B67] transition-colors cursor-pointer"
          >
            Încearcă din nou
          </button>
        </div>
      </body>
    </html>
  )
}
