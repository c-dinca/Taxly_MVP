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
    emoji: '👤',
  },
  {
    value: 'II' as const,
    label: 'Întreprindere Individuală',
    desc: 'II — similar PFA, fără angajați sau cu angajați',
    emoji: '🏢',
  },
  {
    value: 'SRL' as const,
    label: 'Micro-SRL',
    desc: 'SRL cu regim micro-întreprindere (≤100.000€)',
    emoji: '🏛️',
  },
]

export default function StepEntityType({ data, onNext }: Props) {
  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold text-gray-900">Ce tip de entitate ai?</h2>
      <p className="mb-8 text-gray-500">
        Alegerea influențează modul de calcul al taxelor și registrele generate.
      </p>

      <div className="space-y-3">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onNext({ entityType: opt.value })}
            className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition hover:border-taxly-400 hover:bg-taxly-50 ${
              data.entityType === opt.value
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
    </div>
  )
}
