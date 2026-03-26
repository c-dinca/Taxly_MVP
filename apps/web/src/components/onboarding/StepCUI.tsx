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
      <h2 className="mb-2 text-2xl font-bold text-gray-900">Date fiscale</h2>
      <p className="mb-8 text-gray-500">
        Introduci CUI-ul și verificăm automat datele din ANAF.
      </p>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            CUI / Cod fiscal
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={cui}
              onChange={e => setCui(e.target.value)}
              placeholder="ex: 12345678"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-taxly-500 focus:outline-none focus:ring-2 focus:ring-taxly-500/20"
            />
            <button
              onClick={verifyCUI}
              disabled={checking || !cui.trim()}
              className="rounded-lg bg-taxly-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-taxly-800 disabled:opacity-60"
            >
              {checking ? '...' : 'Verifică ANAF'}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-800">{error}</div>
        )}

        {anafData && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-600">✓</span>
              <span className="text-sm font-semibold text-green-800">Găsit în ANAF</span>
            </div>
            <p className="text-sm text-gray-800"><span className="font-medium">Denumire:</span> {anafData.name}</p>
            <p className="text-sm text-gray-600"><span className="font-medium">Adresă:</span> {anafData.address}</p>
            <p className="text-sm text-gray-600"><span className="font-medium">Cod CAEN:</span> {anafData.caenCode}</p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">TVA:</span>{' '}
              <span className={anafData.vatStatus === 'platitor' ? 'text-blue-700' : 'text-gray-600'}>
                {anafData.vatStatus === 'platitor' ? 'Înregistrat în scop TVA' : 'Neîregistrat TVA'}
              </span>
            </p>
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={!cui.trim()}
          className="w-full rounded-lg bg-taxly-700 py-2.5 text-sm font-semibold text-white hover:bg-taxly-800 disabled:opacity-60"
        >
          Continuă →
        </button>
      </div>

      <button
        onClick={onBack}
        className="mt-4 text-sm font-medium text-gray-500 hover:text-taxly-700"
      >
        ← Înapoi
      </button>
    </div>
  )
}
