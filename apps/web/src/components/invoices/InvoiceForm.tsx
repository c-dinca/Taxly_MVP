'use client'

import { useEffect, useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Client, CatalogItem, Invoice, InvoiceType, Currency } from '@taxly/types'
import { Button } from '@/components/ui/Button'
import { apiRequest } from '@/lib/api'
import { useAuthToken } from '@/hooks/useAuthToken'
import { InvoiceLineRow, lineCalc, type LineData } from './InvoiceLineRow'
import { InvoicePreview, type Acompte } from './InvoicePreview'
import { EmitConfirmModal } from './EmitConfirmModal'

interface InvoiceFormProps {
  userName?: string | null
  mode?: 'create' | 'edit'
  initialData?: Invoice
}

const INVOICE_TYPES: { value: InvoiceType; label: string }[] = [
  { value: 'factura', label: 'Factură fiscală' },
  { value: 'proforma', label: 'Proformă' },
  { value: 'deviz', label: 'Deviz' },
  { value: 'avans', label: 'Avans' },
  { value: 'storno', label: 'Storno' },
]

const CURRENCIES: Currency[] = ['RON', 'EUR', 'USD']

function emptyLine(): LineData {
  return { reference: '', title: '', description: '', category: '', quantity: 1, unit: 'buc', unitPrice: 0, vatRate: 19, remise: 0 }
}

function today() { return new Date().toISOString().split('T')[0] }
function uid() { return Math.random().toString(36).slice(2, 9) }

const sectionCls = 'bg-white rounded-xl border border-[#E2EAF4] shadow-sm p-5'
const labelCls = 'block text-[11px] font-semibold text-[#5A6A8A] uppercase tracking-wide mb-1.5'
const inputCls = 'w-full rounded-lg border border-[#E2EAF4] px-3 py-2 text-sm text-[#0D1B3E] focus:outline-none focus:ring-2 focus:ring-taxly-700 bg-white'
const sectionTitle = 'text-[13px] font-bold text-[#0D1B3E] mb-4 flex items-center gap-2'

export function InvoiceForm({ userName, mode = 'create', initialData }: InvoiceFormProps) {
  const token = useAuthToken()
  const router = useRouter()
  const acompteUid = useId()

  const [clients, setClients] = useState<Client[]>([])
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Invoice header fields
  const [type, setType] = useState<InvoiceType>(initialData?.type ?? 'factura')
  const [issueDate, setIssueDate] = useState(initialData ? initialData.issueDate.split('T')[0] : today())
  const [dueDate, setDueDate] = useState(initialData?.dueDate ? initialData.dueDate.split('T')[0] : '')
  const [currency, setCurrency] = useState<Currency>(initialData?.totals?.currency ?? 'RON')
  const [clientId, setClientId] = useState(initialData?.client?._id ?? '')

  // Lines
  const [lines, setLines] = useState<LineData[]>(() => {
    if (initialData?.lines?.length) {
      return initialData.lines.map(l => ({
        reference: '',
        title: l.description,
        description: '',
        category: '',
        quantity: l.quantity,
        unit: l.unit,
        unitPrice: l.unitPrice,
        vatRate: l.vatRate,
        remise: 0,
      }))
    }
    return [emptyLine()]
  })

  // Extras
  const [remiseGenerala, setRemiseGenerala] = useState(initialData?.remiseGenerala ?? 0)
  const [acomptes, setAcomptes] = useState<Acompte[]>(() =>
    initialData?.acomptes?.map(a => ({
      id: uid(),
      description: a.description,
      date: a.date.split('T')[0],
      amount: a.amount,
    })) ?? []
  )
  const [mentiuni, setMentiuni] = useState(initialData?.notes ?? '')
  const [notaPersonala, setNotaPersonala] = useState(initialData?.internalNote ?? '')

  // UI state
  const [showRemise, setShowRemise] = useState((initialData?.remiseGenerala ?? 0) > 0)
  const [showAcomptes, setShowAcomptes] = useState((initialData?.acomptes?.length ?? 0) > 0)
  const [submitting, setSubmitting] = useState<'draft' | 'emisa' | null>(null)
  const [showEmitConfirm, setShowEmitConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    Promise.all([
      apiRequest<{ clients: Client[] }>('/api/clients', { token }),
      apiRequest<{ items: CatalogItem[] }>('/api/catalog', { token }),
    ])
      .then(([c, cat]) => { setClients(c.clients); setCatalog(cat.items) })
      .catch(() => {})
      .finally(() => setLoadingData(false))
  }, [token])

  // Derived totals
  const calcs = lines.map(lineCalc)
  const totalHTBrut = calcs.reduce((s, c) => s + c.baseHT, 0)
  const totalRemiseLinii = calcs.reduce((s, c) => s + c.remiseAmount, 0)
  const totalHTNetLinii = calcs.reduce((s, c) => s + c.netHT, 0)
  const remiseGeneralaAmount = totalHTNetLinii * (remiseGenerala / 100)
  const totalHTNet = totalHTNetLinii - remiseGeneralaAmount
  const factor = 1 - remiseGenerala / 100

  const tvaByRate: Record<number, number> = {}
  lines.forEach((line, i) => {
    const adjustedNet = calcs[i].netHT * factor
    tvaByRate[line.vatRate] = (tvaByRate[line.vatRate] ?? 0) + adjustedNet * (line.vatRate / 100)
  })
  const totalTVA = Object.values(tvaByRate).reduce((s, v) => s + v, 0)
  const totalTTC = totalHTNet + totalTVA
  const totalAcomptes = acomptes.reduce((s, a) => s + a.amount, 0)
  const restaPlata = totalTTC - totalAcomptes

  const selectedClient = clients.find(c => c._id === clientId) ?? null

  function updateLine(index: number, line: LineData) {
    setLines(prev => prev.map((l, i) => i === index ? line : l))
  }
  function removeLine(index: number) {
    setLines(prev => prev.length === 1 ? prev : prev.filter((_, i) => i !== index))
  }
  function addLine() {
    setLines(prev => [...prev, emptyLine()])
  }

  function addAcompte() {
    setAcomptes(prev => [...prev, { id: uid(), description: '', date: today(), amount: 0 }])
  }
  function updateAcompte(id: string, field: keyof Acompte, value: string | number) {
    setAcomptes(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a))
  }
  function removeAcompte(id: string) {
    setAcomptes(prev => prev.filter(a => a.id !== id))
  }

  async function submit(targetStatus: 'draft' | 'emisa') {
    if (!token) return
    if (!clientId) { setError('Selectează un client'); return }
    if (lines.every(l => !l.title)) { setError('Adaugă cel puțin o linie cu denumire'); return }

    setError(null)
    setSubmitting(targetStatus)
    try {
      const validLines = lines.filter(l => l.title)
      const payload = {
        type,
        status: targetStatus,
        issueDate: new Date(issueDate).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        clientId,
        currency,
        notes: mentiuni || undefined,
        internalNote: notaPersonala || undefined,
        remiseGenerala,
        acomptes: acomptes.map(a => ({
          description: a.description,
          date: new Date(a.date).toISOString(),
          amount: a.amount,
        })),
        lines: validLines.map(l => ({
          description: [l.reference, l.title, l.description].filter(Boolean).join(' – '),
          quantity: l.quantity,
          unitPrice: l.unitPrice * (1 - l.remise / 100),
          vatRate: l.vatRate,
          unit: l.unit,
        })),
      }

      if (mode === 'edit' && initialData) {
        await apiRequest(`/api/invoices/${initialData._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
          token,
        })
      } else {
        await apiRequest('/api/invoices', {
          method: 'POST',
          body: JSON.stringify(payload),
          token,
        })
      }

      router.push('/invoices')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la salvarea facturii')
    } finally {
      setSubmitting(null)
    }
  }

  if (!token) return null

  return (
    <div className="flex">
      {showEmitConfirm && (
        <EmitConfirmModal
          type={type}
          issueDate={issueDate}
          dueDate={dueDate}
          client={selectedClient}
          acomptes={acomptes}
          submitting={submitting === 'emisa'}
          onClose={() => setShowEmitConfirm(false)}
          onConfirm={() => { setShowEmitConfirm(false); submit('emisa') }}
        />
      )}
      {/* ─── Left: Form ─── */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <form onSubmit={e => e.preventDefault()} className="p-6 space-y-4 max-w-2xl">
          {/* Page title */}
          <div className="mb-2">
            <h1 className="text-xl font-bold text-[#0D1B3E] flex items-center gap-2">
              <span className="inline-block w-1 h-5 rounded-full bg-accent-500" />
              {mode === 'edit' ? 'Editează factură draft' : 'Factură nouă'}
            </h1>
            <p className="mt-1 text-sm text-[#5A6A8A] pl-3">Completează detaliile · preview live în dreapta</p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Section 1: Document details */}
          <div className={sectionCls}>
            <h2 className={sectionTitle}>
              <span className="flex h-5 w-5 items-center justify-center rounded bg-taxly-50 text-taxly-700 text-[10px] font-bold">1</span>
              Detalii document
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <label className={labelCls}>Tip document</label>
                <select value={type} onChange={e => setType(e.target.value as InvoiceType)} className={inputCls}>
                  {INVOICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Dată emitere</label>
                <input type="date" required value={issueDate} onChange={e => setIssueDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Scadență</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Valută</label>
                <select value={currency} onChange={e => setCurrency(e.target.value as Currency)} className={inputCls}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Client */}
          <div className={sectionCls}>
            <h2 className={sectionTitle}>
              <span className="flex h-5 w-5 items-center justify-center rounded bg-taxly-50 text-taxly-700 text-[10px] font-bold">2</span>
              Client
            </h2>
            {loadingData ? (
              <p className="text-sm text-[#8FA3C0]">Se încarcă...</p>
            ) : (
              <select required value={clientId} onChange={e => setClientId(e.target.value)} className={inputCls}>
                <option value="">— Selectează client —</option>
                {clients.filter(c => c.isActive).map(c => (
                  <option key={c._id} value={c._id}>{c.name}{c.cui ? ` · ${c.cui}` : ''}</option>
                ))}
              </select>
            )}
          </div>

          {/* Section 3: Lines */}
          <div className={sectionCls}>
            <h2 className={sectionTitle}>
              <span className="flex h-5 w-5 items-center justify-center rounded bg-taxly-50 text-taxly-700 text-[10px] font-bold">3</span>
              Linii factură
            </h2>

            <div className="space-y-3">
              {lines.map((line, i) => (
                <InvoiceLineRow
                  key={i}
                  index={i}
                  line={line}
                  onChange={l => updateLine(i, l)}
                  onRemove={() => removeLine(i)}
                  catalogItems={catalog}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={addLine}
              className="mt-4 flex items-center gap-2 text-sm font-medium text-taxly-700 hover:text-taxly-800 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" stroke="currentColor"/>
              </svg>
              Adaugă linie
            </button>
          </div>

          {/* Section 4: Remisă generală (collapsible) */}
          <div className={sectionCls}>
            <button
              type="button"
              onClick={() => setShowRemise(v => !v)}
              className="w-full flex items-center justify-between text-left"
            >
              <h2 className={sectionTitle + ' mb-0'}>
                <span className="flex h-5 w-5 items-center justify-center rounded bg-taxly-50 text-taxly-700 text-[10px] font-bold">4</span>
                Remisă generală
                {remiseGenerala > 0 && (
                  <span className="ml-2 text-xs font-normal text-red-500">−{remiseGenerala}%</span>
                )}
              </h2>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round"
                className={`text-[#8FA3C0] transition-transform ${showRemise ? 'rotate-180' : ''}`}
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor"/>
              </svg>
            </button>

            {showRemise && (
              <div className="mt-4 max-w-xs">
                <label className={labelCls}>Remisă globală pe factură (%)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="any"
                    value={remiseGenerala || ''}
                    onChange={e => setRemiseGenerala(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className={`${inputCls} max-w-[120px]`}
                  />
                  <span className="text-sm text-[#5A6A8A]">
                    = −{remiseGeneralaAmount.toFixed(2)} {currency}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-[#8FA3C0]">
                  Aplicată după remisele individuale de pe fiecare linie.
                </p>
              </div>
            )}
          </div>

          {/* Section 5: Aconturi / Avansuri */}
          <div className={sectionCls}>
            <button
              type="button"
              onClick={() => setShowAcomptes(v => !v)}
              className="w-full flex items-center justify-between text-left"
            >
              <h2 className={sectionTitle + ' mb-0'}>
                <span className="flex h-5 w-5 items-center justify-center rounded bg-taxly-50 text-taxly-700 text-[10px] font-bold">5</span>
                Aconturi / Avansuri primite
                {acomptes.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-emerald-600">{acomptes.length} înregistrat{acomptes.length !== 1 ? 'e' : ''}</span>
                )}
              </h2>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round"
                className={`text-[#8FA3C0] transition-transform ${showAcomptes ? 'rotate-180' : ''}`}
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor"/>
              </svg>
            </button>

            {showAcomptes && (
              <div className="mt-4 space-y-3">
                {acomptes.length === 0 && (
                  <p className="text-sm text-[#8FA3C0] italic">Niciun acont înregistrat.</p>
                )}
                {acomptes.map(a => (
                  <div key={a.id} className="grid grid-cols-12 gap-2 items-end p-3 rounded-lg bg-[#F4F6FB] border border-[#E2EAF4]">
                    <div className="col-span-5">
                      <label className={labelCls}>Descriere</label>
                      <input
                        value={a.description}
                        onChange={e => updateAcompte(a.id, 'description', e.target.value)}
                        placeholder="ex: Avans 50% deviz nr. 5"
                        className={inputCls}
                      />
                    </div>
                    <div className="col-span-3">
                      <label className={labelCls}>Dată</label>
                      <input
                        type="date"
                        value={a.date}
                        onChange={e => updateAcompte(a.id, 'date', e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div className="col-span-3">
                      <label className={labelCls}>Sumă TTC ({currency})</label>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={a.amount || ''}
                        onChange={e => updateAcompte(a.id, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className={inputCls}
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => removeAcompte(a.id)}
                        className="text-[#8FA3C0] hover:text-red-500 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
                          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addAcompte}
                  className="flex items-center gap-2 text-sm font-medium text-taxly-700 hover:text-taxly-800 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" stroke="currentColor"/>
                  </svg>
                  Adaugă acont
                </button>
              </div>
            )}
          </div>

          {/* Section 6: Mențiuni */}
          <div className={sectionCls}>
            <h2 className={sectionTitle}>
              <span className="flex h-5 w-5 items-center justify-center rounded bg-taxly-50 text-taxly-700 text-[10px] font-bold">6</span>
              Mențiuni
              <span className="text-[11px] font-normal text-[#8FA3C0] normal-case ml-1">· vizibile pe factură</span>
            </h2>
            <textarea
              value={mentiuni}
              onChange={e => setMentiuni(e.target.value)}
              rows={3}
              placeholder="Termeni de plată, mențiuni legale, mulțumiri..."
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Section 7: Notă personală */}
          <div className={sectionCls}>
            <h2 className={sectionTitle}>
              <span className="flex h-5 w-5 items-center justify-center rounded bg-[#FFF7ED] text-accent-600 text-[10px] font-bold">7</span>
              Notă personală
              <span className="text-[11px] font-normal text-[#8FA3C0] normal-case ml-1">· nu apare pe factură</span>
            </h2>
            <textarea
              value={notaPersonala}
              onChange={e => setNotaPersonala(e.target.value)}
              rows={2}
              placeholder="Memorii interne, contexte, referințe proiect..."
              className={`${inputCls} resize-none bg-[#FFFBF5] border-accent-400/30`}
            />
          </div>

          {/* Totals summary + submit */}
          <div className="bg-white rounded-xl border border-[#E2EAF4] shadow-sm p-5">
            <div className="grid grid-cols-2 gap-6 items-end">
              {/* Summary */}
              <div className="space-y-1.5 text-sm">
                <SummaryRow label="Total HT brut" value={`${totalHTBrut.toFixed(2)} ${currency}`} />
                {totalRemiseLinii > 0 && (
                  <SummaryRow label="Reduceri comerciale linii" value={`−${totalRemiseLinii.toFixed(2)} ${currency}`} red />
                )}
                {remiseGenerala > 0 && (
                  <SummaryRow label={`Reducere comercială globală ${remiseGenerala}%`} value={`−${remiseGeneralaAmount.toFixed(2)} ${currency}`} red />
                )}
                <SummaryRow label="Total HT net" value={`${totalHTNet.toFixed(2)} ${currency}`} semi />
                <SummaryRow label="Total TVA" value={`${totalTVA.toFixed(2)} ${currency}`} />
                <div className="pt-1 border-t-2 border-[#0D1B3E]">
                  <div className="flex justify-between font-bold text-base text-[#0D1B3E]">
                    <span>Total TTC</span>
                    <span>{totalTTC.toFixed(2)} {currency}</span>
                  </div>
                </div>
                {acomptes.length > 0 && (
                  <>
                    <SummaryRow label="Deja plătit" value={`−${totalAcomptes.toFixed(2)} ${currency}`} />
                    <div className="pt-1 border-t border-[#E2EAF4]">
                      <div className="flex justify-between font-bold text-taxly-700">
                        <span>Rest de plată</span>
                        <span>{restaPlata.toFixed(2)} {currency}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  disabled={submitting !== null}
                  onClick={() => {
                    if (!clientId) { setError('Selectează un client'); return }
                    if (lines.every(l => !l.title)) { setError('Adaugă cel puțin o linie cu denumire'); return }
                    setError(null)
                    setShowEmitConfirm(true)
                  }}
                  className="w-full justify-center"
                >
                  Emite factură
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  loading={submitting === 'draft'}
                  disabled={submitting !== null}
                  onClick={() => submit('draft')}
                  className="w-full justify-center"
                >
                  {mode === 'edit' ? 'Salvează draft' : 'Salvează ca draft'}
                </Button>
                <Button
                  variant="ghost"
                  type="button"
                  disabled={submitting !== null}
                  onClick={() => router.push('/invoices')}
                  className="w-full justify-center text-[#8FA3C0]"
                >
                  Anulează
                </Button>
                {mode === 'edit' && initialData?._id && (
                  <button
                    type="button"
                    onClick={() => window.open(`/api/pdf/invoice/${initialData._id}`, '_blank')}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[#E2EAF4] bg-white px-3 py-2 text-sm font-medium text-[#5A6A8A] hover:bg-[#F4F6FB] hover:text-taxly-700 transition-colors"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16l-4-4h2.5V4h3v8H16l-4 4z" stroke="currentColor" fill="none"/><path d="M4 20h16" stroke="currentColor"/></svg>
                    Descarcă PDF
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bottom padding */}
          <div className="h-8" />
        </form>
      </div>

      {/* ─── Right: Live preview (sticky) ─── */}
      <div className="w-[460px] shrink-0 hidden xl:block">
        <div className="sticky top-0 h-screen overflow-y-auto bg-[#E8EDF5] border-l border-[#D5DFF0] p-5">
          <p className="text-[10px] uppercase tracking-widest text-[#8FA3C0] font-semibold mb-3">
            Preview factură
          </p>
          <InvoicePreview
            type={type}
            issueDate={issueDate}
            dueDate={dueDate}
            currency={currency}
            client={selectedClient}
            lines={lines}
            remiseGenerala={remiseGenerala}
            acomptes={acomptes}
            mentiuni={mentiuni}
            userName={userName ?? ''}
          />
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value, semi, red }: { label: string; value: string; semi?: boolean; red?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={semi ? 'font-medium text-[#0D1B3E]' : 'text-[#5A6A8A]'}>{label}</span>
      <span className={`font-medium ${red ? 'text-red-500' : semi ? 'text-[#0D1B3E]' : 'text-[#0D1B3E]'}`}>{value}</span>
    </div>
  )
}
