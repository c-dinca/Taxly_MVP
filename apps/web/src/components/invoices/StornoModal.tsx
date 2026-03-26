'use client'

import { useState } from 'react'
import type { Invoice } from '@taxly/types'
import { apiRequest } from '@/lib/api'
import { useAuthToken } from '@/hooks/useAuthToken'

interface StornoLine {
  description: string
  quantity: number
  unitPrice: number
  vatRate: number
  unit: string
  maxQuantity: number
}

interface StornoModalProps {
  invoice: Invoice
  onClose: () => void
  onCreated: (storno: Invoice) => void
}

function fmt(n: number) { return n.toFixed(2) }

export function StornoModal({ invoice, onClose, onCreated }: StornoModalProps) {
  const token = useAuthToken()
  const [stornoType, setStornoType] = useState<'total' | 'partial'>('total')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [partialLines, setPartialLines] = useState<StornoLine[]>(
    () => invoice.lines.map(l => ({
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      vatRate: l.vatRate,
      unit: l.unit,
      maxQuantity: l.quantity,
    })),
  )

  function updatePartialQty(index: number, qty: number) {
    setPartialLines(prev => prev.map((l, i) =>
      i === index ? { ...l, quantity: Math.min(Math.max(0, qty), l.maxQuantity) } : l,
    ))
  }

  async function handleSubmit() {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const body: Record<string, unknown> = { stornoType, reason: reason || undefined }
      if (stornoType === 'partial') {
        body['lines'] = partialLines
          .filter(l => l.quantity > 0)
          .map(l => ({
            description: l.description,
            quantity: -Math.abs(l.quantity),
            unitPrice: Math.abs(l.unitPrice),
            vatRate: l.vatRate,
            unit: l.unit,
          }))
        if ((body['lines'] as unknown[]).length === 0) {
          setError('Selectați cel puțin o linie pentru storno parțial.')
          setLoading(false)
          return
        }
      }
      const res = await apiRequest<{ invoice: Invoice }>(`/api/invoices/${invoice._id}/storno`, {
        method: 'POST',
        body: JSON.stringify(body),
        token,
      })
      onCreated(res.invoice)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la crearea notei de credit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-[#E2EAF4] shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2EAF4] flex-shrink-0">
          <div>
            <p className="text-xs text-[#8FA3C0] uppercase tracking-wide font-semibold mb-0.5">Emite notă de credit</p>
            <h3 className="text-[#0D1B3E] font-bold">
              {invoice.fullNumber}
            </h3>
          </div>
          <button onClick={onClose} className="text-[#5A6A8A] hover:text-[#0D1B3E] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Tip storno */}
          <div>
            <p className="text-[11px] font-semibold text-[#5A6A8A] uppercase tracking-wide mb-3">Tip storno</p>
            <div className="flex gap-3">
              {(['total', 'partial'] as const).map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="stornoType"
                    value={t}
                    checked={stornoType === t}
                    onChange={() => setStornoType(t)}
                    className="accent-taxly-700"
                  />
                  <span className="text-sm text-[#0D1B3E] font-medium">
                    {t === 'total' ? 'Storno total' : 'Storno parțial'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Sumar facturii originale (storno total) */}
          {stornoType === 'total' && (
            <div className="rounded-lg bg-[#F4F6FB] border border-[#E2EAF4] p-4">
              <p className="text-[11px] font-semibold text-[#5A6A8A] uppercase tracking-wide mb-3">Sumar factură originală</p>
              <div className="space-y-1.5 text-sm">
                {invoice.lines.map((l, i) => (
                  <div key={i} className="flex justify-between text-[#0D1B3E]">
                    <span className="truncate pr-4">{l.description}</span>
                    <span className="font-mono text-xs text-[#5A6A8A] whitespace-nowrap">
                      {l.quantity} × {fmt(l.unitPrice)}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-[#E2EAF4] flex justify-between font-semibold">
                  <span className="text-red-600">Total de stornat</span>
                  <span className="text-red-600">−{fmt(invoice.totals.total)} {invoice.totals.currency}</span>
                </div>
              </div>
            </div>
          )}

          {/* Linii parțiale */}
          {stornoType === 'partial' && (
            <div>
              <p className="text-[11px] font-semibold text-[#5A6A8A] uppercase tracking-wide mb-3">
                Cantități de stornat (0 = exclude linia)
              </p>
              <div className="space-y-2">
                {partialLines.map((line, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-[#E2EAF4] px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0D1B3E] truncate">{line.description}</p>
                      <p className="text-[11px] text-[#8FA3C0]">
                        max {line.maxQuantity} {line.unit} · {fmt(line.unitPrice)} · TVA {line.vatRate}%
                      </p>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={line.maxQuantity}
                      step={1}
                      value={line.quantity}
                      onChange={e => updatePartialQty(i, parseFloat(e.target.value) || 0)}
                      className="w-20 rounded-lg border border-[#E2EAF4] px-2 py-1 text-sm text-right text-[#0D1B3E] focus:outline-none focus:ring-2 focus:ring-taxly-700"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Motiv */}
          <div>
            <label className="block text-[11px] font-semibold text-[#5A6A8A] uppercase tracking-wide mb-1.5">
              Motiv storno <span className="text-[#8FA3C0] normal-case font-normal">(opțional)</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Ex: Eroare la facturare, produs returnat..."
              className="w-full rounded-lg border border-[#E2EAF4] px-3 py-2 text-sm text-[#0D1B3E] focus:outline-none focus:ring-2 focus:ring-taxly-700 resize-none"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E2EAF4] flex-shrink-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[#5A6A8A] hover:bg-[#F4F6FB] transition-colors"
          >
            Anulează
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-taxly-700 text-white text-sm font-semibold hover:bg-taxly-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Se procesează...' : 'Creează notă de credit'}
          </button>
        </div>
      </div>
    </div>
  )
}
