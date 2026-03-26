'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import StepEntityType from '@/components/onboarding/StepEntityType'
import StepFiscalRegime from '@/components/onboarding/StepFiscalRegime'
import StepCUI from '@/components/onboarding/StepCUI'
import StepAddress from '@/components/onboarding/StepAddress'
import StepComplete from '@/components/onboarding/StepComplete'

export type OnboardingData = {
  entityType?: 'PFA' | 'II' | 'SRL'
  fiscalRegime?: 'real' | 'norma_venit'
  cui?: string
  cnp?: string
  caenCode?: string
  vatStatus?: 'neplatitor' | 'platitor' | 'platitor_special'
  county?: string
  address?: string
  tradeRegisterNumber?: string
  name?: string
}

const STEPS = ['Tip entitate', 'Regim fiscal', 'Date fiscale', 'Adresă', 'Finalizare']

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<OnboardingData>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const accessToken = session?.accessToken

  function next(update: Partial<OnboardingData>) {
    setData(prev => ({ ...prev, ...update }))
    setStep(s => s + 1)
  }

  function back() {
    setStep(s => s - 1)
  }

  async function finish(update: Partial<OnboardingData>) {
    const finalData = { ...data, ...update }
    setSaving(true)
    setError('')

    try {
      const res = await fetch(
        `${process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000'}/api/auth/onboarding`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken ?? ''}`,
          },
          body: JSON.stringify({ ...finalData, complete: true }),
        },
      )

      if (!res.ok) {
        const json = (await res.json()) as { message?: string }
        setError(json.message ?? 'Eroare la salvare')
        return
      }

      router.push('/dashboard')
    } catch {
      setError('Eroare de conexiune. Încearcă din nou.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#faf7f4]">
      {/* Header */}
      <div className="border-b border-taxly-300/30 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-taxly-700">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 6h18M3 12h18M3 18h18" stroke="#FFDBBB" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-taxly-900">Taxly</span>
          </div>
          <span className="text-sm text-taxly-500">
            Pasul {step + 1} din {STEPS.length}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-taxly-100">
        <div
          className="h-0.5 bg-taxly-700 transition-all duration-300"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Step labels */}
      <div className="border-b border-taxly-300/20 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-2xl justify-between">
          {STEPS.map((label, i) => (
            <span
              key={label}
              className={`text-xs font-medium ${i === step ? 'text-taxly-700' : i < step ? 'text-taxly-400' : 'text-taxly-300'}`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {step === 0 && <StepEntityType data={data} onNext={next} />}
        {step === 1 && <StepFiscalRegime data={data} onNext={next} onBack={back} />}
        {step === 2 && <StepCUI data={data} onNext={next} onBack={back} accessToken={accessToken} />}
        {step === 3 && <StepAddress data={data} onNext={next} onBack={back} />}
        {step === 4 && <StepComplete data={data} onFinish={finish} onBack={back} saving={saving} />}
      </div>
    </div>
  )
}
