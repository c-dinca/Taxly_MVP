import type { OnboardingData } from '@/app/onboarding/page'

interface Props {
  data: OnboardingData
  onNext: (update: Partial<OnboardingData>) => void
  onBack: () => void
}

const OPTIONS = [
  {
    value: 'real' as const,
    label: 'Sistem real',
    desc: 'Plătești taxe pe venitul net (venituri − cheltuieli). Recomandat dacă ai cheltuieli mari.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 20h18" stroke="currentColor"/>
        <rect x="5" y="12" width="3" height="8" rx="0.5" stroke="currentColor"/>
        <rect x="10.5" y="7" width="3" height="13" rx="0.5" stroke="currentColor"/>
        <rect x="16" y="4" width="3" height="16" rx="0.5" stroke="currentColor"/>
      </svg>
    ),
  },
  {
    value: 'norma_venit' as const,
    label: 'Normă de venit',
    desc: 'Taxe fixe stabilite de DGRFP județean, indiferent de venituri reale. Mai simplu.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor"/>
        <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor"/>
      </svg>
    ),
  },
]

export default function StepFiscalRegime({ data, onNext, onBack }: Props) {
  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold tracking-tight text-[#0D1B3E]">Regim fiscal</h2>
      <p className="mb-8 text-[#5A6A8A]">
        Cum ești impozitat? Poți verifica în Declarația Unică depusă anterior.
      </p>

      <div className="space-y-3">
        {OPTIONS.map(opt => {
          const selected = data.fiscalRegime === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onNext({ fiscalRegime: opt.value })}
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

      <button
        onClick={onBack}
        className="mt-6 flex items-center gap-1.5 text-sm text-[#5A6A8A] hover:text-taxly-700"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor"/>
        </svg>
        Înapoi
      </button>
    </div>
  )
}
