'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Client, CatalogItem, InvoiceType, Currency, CreateInvoiceDto } from '@taxly/types'
import { Button } from '@/components/ui/Button'
import { apiRequest } from '@/lib/api'
import { InvoiceLineRow } from './InvoiceLineRow'

interface InvoiceFormProps {
  token: string
}

interface LineData {
  description: string
  quantity: number
  unitPrice: number
  vatRate: number
  unit: string
}

const INVOICE_TYPES: { value: InvoiceType; label: string }[] = [
  { value: 'factura', label: 'Factură' },
  { value: 'proforma', label: 'Proformă' },
  { value: 'deviz', label: 'Deviz' },
  { value: 'avans', label: 'Avans' },
  { value: 'storno', label: 'Storno' },
]

const CURRENCIES: Currency[] = ['RON', 'EUR', 'USD']

function emptyLine(): LineData {
  return { description: '', quantity: 1, unitPrice: 0, vatRate: 19, unit: 'buc' }
}

function today() {
  return new Date().toISOString().split('T')[0]
}

export function InvoiceForm({ token }: InvoiceFormProps) {
  const router = useRouter()

  const [clients, setClients] = useState<Client[]>([])
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const [type, setType] = useState<InvoiceType>('factura')
  const [issueDate, setIssueDate] = useState(today())
  const [dueDate, setDueDate] = useState('')
  const [currency, setCurrency] = useState<Currency>('RON')
  const [clientId, setClientId] = useState('')
  const [lines, setLines] = useState<LineData[]>([emptyLine()])
  const [notes, setNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      apiRequest<Client[]>('/api/clients', { token }),
      apiRequest<CatalogItem[]>('/api/catalog', { token }),
    ])
      .then(([c, cat]) => { setClients(c); setCatalog(cat) })
      .catch(() => { /* non-fatal */ })
      .finally(() => setLoadingData(false))
  }, [token])

  function updateLine(index: number, line: LineData) {
    setLines(prev => prev.map((l, i) => i === index ? line : l))
  }

  function removeLine(index: number) {
    setLines(prev => prev.filter((_, i) => i !== index))
  }

  function addLine() {
    setLines(prev => [...prev, emptyLine()])
  }

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
  const vatTotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice * (l.vatRate / 100), 0)
  const total = subtotal + vatTotal

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientId) { setError('Selectează un client'); return }
    if (lines.length === 0) { setError('Adaugă cel puțin o linie'); return }

    setError(null)
    setSubmitting(true)
    try {
      const dto: CreateInvoiceDto = {
        type,
        issueDate,
        dueDate: dueDate || undefined,
        clientId,
        currency,
        notes: notes || undefined,
        lines: lines.map(({ description, quantity, unitPrice, vatRate, unit }) => ({
          description,
          quantity,
          unitPrice,
          vatRate,
          unit,
        })),
      }
      await apiRequest('/api/invoices', {
        method: 'POST',
        body: JSON.stringify(dto),
        token,
      })
      router.push('/invoices')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la salvarea facturii')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Header section */}
      <div className="bg-white rounded-xl border border-[#E2EAF4] shadow-sm p-6">
        <h2 className="text-sm font-semibold text-[#0D1B3E] mb-4">Detalii factură</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-[#5A6A8A] mb-1">Tip document</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as InvoiceType)}
              className="w-full rounded-lg border border-[#E2EAF4] px-3 py-2 text-sm text-[#0D1B3E] focus:outline-none focus:ring-2 focus:ring-taxly-700 bg-white"
            >
              {INVOICE_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5A6A8A] mb-1">Dată emitere</label>
            <input
              type="date"
              required
              value={issueDate}
              onChange={e => setIssueDate(e.target.value)}
              className="w-full rounded-lg border border-[#E2EAF4] px-3 py-2 text-sm text-[#0D1B3E] focus:outline-none focus:ring-2 focus:ring-taxly-700"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5A6A8A] mb-1">Scadență</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-[#E2EAF4] px-3 py-2 text-sm text-[#0D1B3E] focus:outline-none focus:ring-2 focus:ring-taxly-700"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5A6A8A] mb-1">Valută</label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value as Currency)}
              className="w-full rounded-lg border border-[#E2EAF4] px-3 py-2 text-sm text-[#0D1B3E] focus:outline-none focus:ring-2 focus:ring-taxly-700 bg-white"
            >
              {CURRENCIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Client section */}
      <div className="bg-white rounded-xl border border-[#E2EAF4] shadow-sm p-6">
        <h2 className="text-sm font-semibold text-[#0D1B3E] mb-4">Client</h2>
        {loadingData ? (
          <p className="text-sm text-[#5A6A8A]">Se încarcă clienții...</p>
        ) : (
          <select
            required
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-[#E2EAF4] px-3 py-2 text-sm text-[#0D1B3E] focus:outline-none focus:ring-2 focus:ring-taxly-700 bg-white"
          >
            <option value="">— Selectează client —</option>
            {clients.filter(c => c.isActive).map(c => (
              <option key={c._id} value={c._id}>{c.name}{c.cui ? ` (${c.cui})` : ''}</option>
            ))}
          </select>
        )}
      </div>

      {/* Lines section */}
      <div className="bg-white rounded-xl border border-[#E2EAF4] shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#0D1B3E]">Linii factură</h2>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-12 gap-3 mb-2">
          <div className="col-span-4 text-xs font-medium text-[#5A6A8A]">Descriere</div>
          <div className="col-span-1 text-xs font-medium text-[#5A6A8A]">Cant.</div>
          <div className="col-span-1 text-xs font-medium text-[#5A6A8A]">UM</div>
          <div className="col-span-2 text-xs font-medium text-[#5A6A8A]">Preț/UM</div>
          <div className="col-span-1 text-xs font-medium text-[#5A6A8A]">TVA</div>
          <div className="col-span-2 text-xs font-medium text-[#5A6A8A] text-right">Total</div>
          <div className="col-span-1" />
        </div>

        {lines.map((line, i) => (
          <InvoiceLineRow
            key={i}
            line={line}
            onChange={l => updateLine(i, l)}
            onRemove={() => removeLine(i)}
            catalogItems={catalog}
          />
        ))}

        <button
          type="button"
          onClick={addLine}
          className="mt-4 flex items-center gap-1.5 text-sm font-medium text-taxly-700 hover:text-taxly-800 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" stroke="currentColor"/>
          </svg>
          Adaugă linie
        </button>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-[#E2EAF4] shadow-sm p-6">
        <h2 className="text-sm font-semibold text-[#0D1B3E] mb-4">Mențiuni</h2>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Mențiuni suplimentare pe factură..."
          className="w-full rounded-lg border border-[#E2EAF4] px-3 py-2 text-sm text-[#0D1B3E] focus:outline-none focus:ring-2 focus:ring-taxly-700 resize-none"
        />
      </div>

      {/* Summary + submit */}
      <div className="bg-white rounded-xl border border-[#E2EAF4] shadow-sm p-6">
        <div className="flex items-end justify-between">
          <div className="space-y-1 text-sm text-[#5A6A8A]">
            <div className="flex gap-8">
              <span>Subtotal</span>
              <span className="font-medium text-[#0D1B3E]">{subtotal.toFixed(2)} {currency}</span>
            </div>
            <div className="flex gap-8">
              <span>TVA</span>
              <span className="font-medium text-[#0D1B3E]">{vatTotal.toFixed(2)} {currency}</span>
            </div>
            <div className="flex gap-8 text-base font-bold text-[#0D1B3E] pt-1 border-t border-[#E2EAF4]">
              <span>Total</span>
              <span>{total.toFixed(2)} {currency}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => router.push('/invoices')}
            >
              Anulează
            </Button>
            <Button type="submit" loading={submitting}>
              Emite factură
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
