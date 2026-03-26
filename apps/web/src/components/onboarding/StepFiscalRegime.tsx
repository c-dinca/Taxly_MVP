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
    emoji: '📊',
  },
  {
    value: 'norma_venit' as const,
    label: 'Normă de venit',
    desc: 'Taxe fixe stabilite de DGRFP județean, indiferent de venituri reale. Mai simplu.',
    emoji: '📋',
  },
]

export default function StepFiscalRegime({ data, onNext, onBack }: Props) {
  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold text-gray-900">Regim fiscal</h2>
      <p className="mb-8 text-gray-500">
        Cum ești impozitat? Poți verifica în Declarația Unică depusă anterior.
      </p>

      <div className="space-y-3">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onNext({ fiscalRegime: opt.value })}
            className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition hover:border-taxly-400 hover:bg-taxly-50 ${
              data.fiscalRegime === opt.value
                ? 'border-taxly-600 bg-taxly-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <span className="text-3xl">{opt.emoji}</span>
            <div>
              <div className="font-semibold text-gray-900">{opt.label}</div>
              <div className="text-sm text-gray-500">{opt.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={onBack}
        className="mt-6 text-sm font-medium text-gray-500 hover:text-taxly-700"
      >
        ← Înapoi
      </button>
    </div>
  )
}
