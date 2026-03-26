'use client'

import { useState } from 'react'
import type { Invoice, PaymentMethod } from '@taxly/types'
import { Button } from '@/components/ui/Button'
import { apiRequest } from '@/lib/api'
import { useAuthToken } from '@/hooks/useAuthToken'

interface PaymentModalProps {
  invoice: Invoice
  onClose: () => void
  onPaid: (updated: Invoice) => void
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'transfer', label: 'Transfer bancar' },
  { value: 'numerar', label: 'Numerar' },
  { value: 'card', label: 'Card' },
  { value: 'cec', label: 'CEC / BO' },
  { value: 'altele', label: 'Altele' },
]

function today() { return new Date().toISOString().split('T')[0] }

export function PaymentModal({ invoice, onClose, onPaid }: PaymentModalProps) {
  const token = useAuthToken()
  const totalTTC = invoice.totals.total
  const totalAcomptes = invoice.acomptes.reduce((s, a) => s + a.amount, 0)
  const restDePlata = totalTTC - totalAcomptes

  const [paymentDate, setPaymentDate] = useState(today())
  const [method, setMethod] = useState<PaymentMethod>('transfer')
  const [notes, setNotes] = useState('')
  const [amountPaid, setAmountPaid] = useState(restDePlata > 0 ? restDePlata : totalTTC)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    if (!token) return
    setError(null)
    setLoading(true)
    try {
      const res = await apiRequest<{ invoice: Invoice }>(`/api/invoices/${invoice._id}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'incasata',
          payment: {
            date: new Date(paymentDate).toISOString(),
            method,
            notes: notes || undefined,
            amountPaid,
          },
        }),
        token,
      })
      onPaid(res.invoice)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la actualizare')
    } finally {
      setLoading(false)
    }
  }

  const inp = 'w-full rounded-lg border border-[#E2EAF4] px-3 py-2 text-sm text-[#0D1B3E] focus:outline-none focus:ring-2 focus:ring-taxly-700 bg-white'
  const lbl = 'block text-xs font-semibold text-[#5A6A8A] mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl border border-[#E2EAF4] shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2EAF4]">
          <div>
            <h2 className="text-base font-bold text-[#0D1B3E]">Marchează ca încasată</h2>
            <p className="text-xs text-[#5A6A8A] mt-0.5">{invoice.fullNumber} · {invoice.client.name}</p>
          </div>
          <button onClick={onClose} className="text-[#5A6A8A] hover:text-[#0D1B3E] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{error}</div>
          )}

          {/* Invoice totals summary */}
          <div className="rounded-lg bg-[#F4F6FB] border border-[#E2EAF4] px-4 py-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-[#5A6A8A]">Total TTC</span>
              <span className="font-semibold text-[#0D1B3E]">{totalTTC.toFixed(2)} {invoice.totals.currency}</span>
            </div>
            {invoice.acomptes.length > 0 && (
              <>
                {invoice.acomptes.map(a => (
                  <div key={a._id} className="flex justify-between">
                    <span className="text-[#5A6A8A]">Acont — {a.description || 'Avans'}</span>
                    <span className="text-emerald-600 font-medium">−{a.amount.toFixed(2)} {invoice.totals.currency}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-1 border-t border-[#E2EAF4]">
                  <span className="font-semibold text-taxly-700">Rest de plată</span>
                  <span className="font-bold text-taxly-700">{restDePlata.toFixed(2)} {invoice.totals.currency}</span>
                </div>
              </>
            )}
          </div>

          {/* Payment fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Data plății</label>
              <input
                type="date"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Metodă plată</label>
              <select value={method} onChange={e => setMethod(e.target.value as PaymentMethod)} className={inp}>
                {PAYMENT_METHODS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={lbl}>Sumă încasată ({invoice.totals.currency})</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={amountPaid}
              onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)}
              className={inp}
            />
            {amountPaid < restDePlata - 0.01 && (
              <p className="text-xs text-amber-600 mt-1">Sumă parțială — restul de {(restDePlata - amountPaid).toFixed(2)} {invoice.totals.currency} rămâne neîncasat.</p>
            )}
          </div>

          <div>
            <label className={lbl}>Note plată <span className="font-normal text-[#8FA3C0]">(opțional)</span></label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Referință bancară, chitanță nr., etc."
              className={`${inp} resize-none`}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 pb-5">
          <Button variant="secondary" onClick={onClose} type="button">
            Anulează
          </Button>
          <Button type="button" loading={loading} onClick={handleConfirm}>
            Confirmă încasarea
          </Button>
        </div>
      </div>
    </div>
  )
}
