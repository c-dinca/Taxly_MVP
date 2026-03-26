'use client'

import { useState } from 'react'
import type { OnboardingData } from '@/app/onboarding/page'

interface Props {
  data: OnboardingData
  onNext: (update: Partial<OnboardingData>) => void
  onBack: () => void
  accessToken?: string
}

interface AnafResult {
  found: boolean
  data?: {
    cui: string
    name: string
    address: string
    tradeRegisterNumber: string
    caenCode: string
    vatStatus: 'neplatitor' | 'platitor'
    registrationDate?: string
  }
  error?: string
}

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000'

export default function StepCUI({ data, onNext, onBack, accessToken }: Props) {
  const [cui, setCui] = useState(data.cui ?? '')
  const [checking, setChecking] = useState(false)
  const [anafData, setAnafData] = useState<AnafResult['data'] | null>(null)
  const [error, setError] = useState('')

  async function verifyCUI() {
    if (!cui.trim()) return
    setChecking(true)
    setError('')
    setAnafData(null)

    try {
      const res = await fetch(`${API_URL}/api/utils/verify-cui/${cui.trim()}`, {
        headers: { Authorization: `Bearer ${accessToken ?? ''}` },
      })
      const json = (await res.json()) as AnafResult

      if (json.found && json.data) {
        setAnafData(json.data)
      } else {
        setError(json.error ?? 'CUI-ul nu a fost găsit în ANAF')
      }
    } catch {
      setError('Eroare la verificarea ANAF. Continuă manual.')
    } finally {
      setChecking(false)
    }
  }

  function handleNext() {
    if (!cui.trim()) {
      setError('CUI-ul este obligatoriu')
      return
    }
    onNext({
      cui: anafData?.cui ?? cui,
      name: anafData?.name,
      address: anafData?.address,
      tradeRegisterNumber: anafData?.tradeRegisterNumber,
      caenCode: anafData?.caenCode,
      vatStatus: anafData?.vatStatus ?? 'neplatitor',
    })
  }

  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold text-taxly-900">Date fiscale</h2>
      <p className="mb-8 text-taxly-500">
        Introduci CUI-ul și verificăm automat datele din ANAF.
      </p>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-taxly-700">
            CUI / Cod fiscal
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={cui}
              onChange={e => setCui(e.target.value)}
              placeholder="ex: 12345678"
              className="flex-1 rounded-lg border border-taxly-300/60 bg-taxly-50 px-3 py-2.5 text-sm text-taxly-900 placeholder:text-taxly-400 focus:border-taxly-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-taxly-500/20"
            />
            <button
              onClick={verifyCUI}
              disabled={checking || !cui.trim()}
              className="flex items-center gap-2 rounded-lg border border-taxly-700 px-4 py-2.5 text-sm font-semibold text-taxly-700 hover:bg-taxly-50 disabled:opacity-60"
            >
              {checking ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" stroke="currentColor"/>
                </svg>
              )}
              {checking ? 'Se verifică...' : 'Verifică ANAF'}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-taxly-200 bg-taxly-50 px-4 py-3 text-sm text-taxly-700">{error}</div>
        )}

        {anafData && (
          <div className="rounded-xl border border-taxly-300/50 bg-taxly-50 p-4 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" stroke="#664930"/>
              </svg>
              <span className="text-sm font-semibold text-taxly-800">Găsit în ANAF</span>
            </div>
            <p className="text-sm text-taxly-800"><span className="font-medium">Denumire:</span> {anafData.name}</p>
            <p className="text-sm text-taxly-600"><span className="font-medium">Adresă:</span> {anafData.address}</p>
            <p className="text-sm text-taxly-600"><span className="font-medium">Cod CAEN:</span> {anafData.caenCode}</p>
            <p className="text-sm text-taxly-600">
              <span className="font-medium">TVA:</span>{' '}
              {anafData.vatStatus === 'platitor' ? 'Înregistrat în scop TVA' : 'Neînregistrat TVA'}
            </p>
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={!cui.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-taxly-700 py-2.5 text-sm font-semibold text-taxly-100 hover:bg-taxly-800 disabled:opacity-60"
        >
          Continuă
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor"/>
          </svg>
        </button>
      </div>

      <button
        onClick={onBack}
        className="mt-4 flex items-center gap-1.5 text-sm font-medium text-taxly-500 hover:text-taxly-700"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor"/>
        </svg>
        Înapoi
      </button>
    </div>
  )
}
