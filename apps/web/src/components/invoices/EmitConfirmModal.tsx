'use client'

import { useState } from 'react'
import type { Client, InvoiceType } from '@taxly/types'
import { Button } from '@/components/ui/Button'
import type { Acompte } from './InvoicePreview'

const TYPE_LABELS: Record<InvoiceType, string> = {
  factura: 'Factură fiscală',
  proforma: 'Factură proformă',
  deviz: 'Deviz',
  avans: 'Factură de avans',
  storno: 'Factură storno / Notă de creditare',
}

function fmtDate(dateStr: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function addDays(dateStr: string, days: number): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function diffDays(from: string, to: string): number {
  if (!from || !to) return 30
  const ms = new Date(to).getTime() - new Date(from).getTime()
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)))
}

interface EmitConfirmModalProps {
  type: InvoiceType
  issueDate: string
  dueDate: string
  client: Client | null
  acomptes: Acompte[]
  submitting: boolean
  onConfirm: (issueDate: string, dueDate: string) => void
  onClose: () => void
}

export function EmitConfirmModal({
  type,
  issueDate: initialIssueDate,
  dueDate: initialDueDate,
  client,
  acomptes,
  submitting,
  onConfirm,
  onClose,
}: EmitConfirmModalProps) {
  const initialDelay = initialDueDate ? diffDays(initialIssueDate, initialDueDate) : 30

  const [localIssueDate, setLocalIssueDate] = useState(initialIssueDate)
  const [termenZile, setTermenZile] = useState(initialDelay)

  const localDueDate = addDays(localIssueDate, termenZile)
  const year = localIssueDate ? new Date(localIssueDate).getFullYear() : new Date().getFullYear()

  function handleTermenChange(val: number) {
    const clamped = Math.max(0, val)
    setTermenZile(clamped)
  }

  function handleIssueDateChange(val: string) {
    setLocalIssueDate(val)
  }

  const inp = 'rounded-lg border border-[#E2EAF4] px-3 py-1.5 text-sm text-[#0D1B3E] focus:outline-none focus:ring-2 focus:ring-taxly-700 bg-white'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-taxly-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" stroke="white"/>
              </svg>
            </div>
            <h2 className="text-white font-bold text-lg">Validare</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Description */}
          <p className="text-sm text-[#5A6A8A] text-center leading-relaxed">
            Ești pe cale să validezi ciorna documentului tău. Aceasta înseamnă că nu vei mai putea
            edita informațiile sale, dar vei putea în continuare emite note de creditare, facturi
            de avans sau aconturi pe aceasta. Te rugăm să verifici rezumatul informațiilor mai jos.
          </p>

          {/* Warning — always shown */}
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 text-center font-medium">
            Atenție: odată ce factura este validată, nu vei mai putea crea aconturi pe ea.
          </div>

          <div className="border-t border-[#F4F6FB]" />

          {/* Summary grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left: Client + Dates */}
            <div className="space-y-5">
              <div>
                <p className="text-[11px] font-bold text-taxly-700 uppercase tracking-widest mb-2">Client</p>
                {client ? (
                  <div className="text-sm text-[#0D1B3E] space-y-0.5">
                    <p className="font-semibold">{client.name}</p>
                    {client.address && <p className="text-[#5A6A8A]">{client.address}</p>}
                    {client.cui && <p className="text-[#5A6A8A]">CUI: {client.cui}</p>}
                  </div>
                ) : (
                  <p className="text-sm text-[#8FA3C0] italic">— Niciun client selectat —</p>
                )}
              </div>

              <div>
                <p className="text-[11px] font-bold text-taxly-700 uppercase tracking-widest mb-3">Date</p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-[#5A6A8A] w-32 shrink-0">Dată creare:</span>
                    <input
                      type="date"
                      value={localIssueDate}
                      onChange={e => handleIssueDateChange(e.target.value)}
                      className={inp}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#5A6A8A] w-32 shrink-0">Termen plată:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={termenZile}
                        onChange={e => handleTermenChange(parseInt(e.target.value) || 0)}
                        className={`${inp} w-20 text-center`}
                      />
                      <span className="text-[#5A6A8A]">zile</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#5A6A8A] w-32 shrink-0">Dată limită plată:</span>
                    <span className="font-medium text-[#0D1B3E]">{fmtDate(localDueDate)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#5A6A8A] w-32 shrink-0">Tip document:</span>
                    <span className="font-medium text-[#0D1B3E]">{TYPE_LABELS[type]}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Provisional number */}
            <div className="flex items-center justify-center">
              <div className="w-full rounded-xl bg-[#F4F6FB] border border-[#E2EAF4] px-6 py-8 text-center">
                <p className="text-[10px] font-bold text-[#8FA3C0] uppercase tracking-[0.2em] mb-4">
                  Număr previzional
                </p>
                <p className="text-3xl font-bold text-[#0D1B3E] tracking-wide font-mono">
                  TAXLY-{year}
                </p>
                <p className="text-[#8FA3C0] text-xs mt-2">
                  Numărul exact este alocat automat la emitere
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 pb-5 pt-3 border-t border-[#F4F6FB]">
          <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
            Anulează
          </Button>
          <Button
            type="button"
            loading={submitting}
            onClick={() => onConfirm(localIssueDate, localDueDate)}
          >
            Validează
          </Button>
        </div>
      </div>
    </div>
  )
}
