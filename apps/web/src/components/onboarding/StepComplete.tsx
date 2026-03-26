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
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-taxly-50 border border-stone-200">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12l2 2 4-4" stroke="#664930"/>
            <path d="M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2z" stroke="#664930"/>
          </svg>
        </div>
      </div>

      <h2 className="mb-2 text-center text-2xl font-bold tracking-tight text-stone-900">
        Totul arată bine!
      </h2>
      <p className="mb-8 text-center text-stone-500">
        Verifică datele înainte de a finaliza configurarea contului.
      </p>

      <div className="mb-8 divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
        {data.name && <Row label="Denumire" value={data.name} />}
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
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-taxly-700 py-3 text-sm font-semibold text-white hover:bg-taxly-800 disabled:opacity-60"
      >
        {saving ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10"/>
            </svg>
            Se salvează...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" stroke="currentColor"/>
            </svg>
            Finalizează și accesează Taxly
          </>
        )}
      </button>

      <button
        onClick={onBack}
        className="mt-4 flex w-full items-center justify-center gap-1.5 text-sm text-stone-400 hover:text-stone-600"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor"/>
        </svg>
        Modifică datele
      </button>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-4 py-3">
      <span className="text-sm text-stone-500">{label}</span>
      <span className="text-sm font-medium text-stone-900">{value}</span>
    </div>
  )
}
