import type { OnboardingData } from '@/app/onboarding/page'

interface Props {
  data: OnboardingData
  onFinish: (update: Partial<OnboardingData>) => void
  onBack: () => void
  saving: boolean
}

const LABELS: Record<string, string> = {
  PFA: 'Persoană Fizică Autorizată',
  II: 'Întreprindere Individuală',
  SRL: 'Micro-SRL',
  real: 'Sistem real',
  norma_venit: 'Normă de venit',
  neplatitor: 'Neînregistrat TVA',
  platitor: 'Plătitor TVA',
}

export default function StepComplete({ data, onFinish, onBack, saving }: Props) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <span className="text-3xl">🎉</span>
        </div>
      </div>

      <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">
        Totul arată bine!
      </h2>
      <p className="mb-8 text-center text-gray-500">
        Verifică datele înainte de a finaliza configurarea contului.
      </p>

      <div className="mb-8 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
        {data.name && (
          <Row label="Denumire" value={data.name} />
        )}
        <Row label="Tip entitate" value={LABELS[data.entityType ?? ''] ?? data.entityType ?? '—'} />
        <Row label="Regim fiscal" value={LABELS[data.fiscalRegime ?? ''] ?? data.fiscalRegime ?? '—'} />
        <Row label="CUI" value={data.cui ?? '—'} />
        {data.caenCode && <Row label="Cod CAEN" value={data.caenCode} />}
        <Row label="Statut TVA" value={LABELS[data.vatStatus ?? ''] ?? data.vatStatus ?? '—'} />
        <Row label="Județ" value={data.county ?? '—'} />
        <Row label="Adresă" value={data.address ?? '—'} />
      </div>

      <button
        onClick={() => onFinish({})}
        disabled={saving}
        className="w-full rounded-lg bg-taxly-700 py-3 text-sm font-semibold text-white hover:bg-taxly-800 disabled:opacity-60"
      >
        {saving ? 'Se salvează...' : '✓ Finalizează și accesează Taxly'}
      </button>

      <button onClick={onBack} className="mt-4 w-full text-sm font-medium text-gray-500 hover:text-taxly-700">
        ← Modifică datele
      </button>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-4 py-3">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  )
}
