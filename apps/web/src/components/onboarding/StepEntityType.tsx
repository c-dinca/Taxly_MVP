import type { OnboardingData } from '@/app/onboarding/page'

interface Props {
  data: OnboardingData
  onNext: (update: Partial<OnboardingData>) => void
}

const OPTIONS = [
  {
    value: 'PFA' as const,
    label: 'PFA',
    desc: 'Persoană Fizică Autorizată — contabilitate în partidă simplă',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" stroke="currentColor"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor"/>
      </svg>
    ),
  },
  {
    value: 'II' as const,
    label: 'Întreprindere Individuală',
    desc: 'II — similar PFA, fără angajați sau cu angajați',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="10" width="18" height="11" rx="1" stroke="currentColor"/>
        <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor"/>
        <path d="M9 14h6M9 17h6" stroke="currentColor"/>
      </svg>
    ),
  },
  {
    value: 'SRL' as const,
    label: 'Micro-SRL',
    desc: 'SRL cu regim micro-întreprindere (≤100.000€)',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M3 10l9-7 9 7" stroke="currentColor"/>
        <rect x="8" y="13" width="3" height="8" rx="0.5" stroke="currentColor"/>
        <rect x="13" y="13" width="3" height="8" rx="0.5" stroke="currentColor"/>
      </svg>
    ),
  },
]

export default function StepEntityType({ data, onNext }: Props) {
  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold tracking-tight text-[#0D1B3E]">Ce tip de entitate ai?</h2>
      <p className="mb-8 text-[#5A6A8A]">
        Alegerea influențează modul de calcul al taxelor și registrele generate.
      </p>

      <div className="space-y-3">
        {OPTIONS.map(opt => {
          const selected = data.entityType === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onNext({ entityType: opt.value })}
              className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${
                selected
                  ? 'border-taxly-700 bg-taxly-50 ring-1 ring-taxly-700/20'
                  : 'border-[#E2EAF4] bg-white hover:border-taxly-400 hover:shadow-sm'
              }`}
            >
              <span className={selected ? 'text-taxly-700' : 'text-[#2A86DB]'}>{opt.icon}</span>
              <div>
                <div className="font-semibold text-[#0D1B3E]">{opt.label}</div>
                <div className="text-sm text-[#5A6A8A]">{opt.desc}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
