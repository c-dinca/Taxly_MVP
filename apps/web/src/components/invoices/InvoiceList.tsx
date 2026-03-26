'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Client, Invoice, InvoiceStatus } from '@taxly/types'
import { apiRequest } from '@/lib/api'
import { useAuthToken } from '@/hooks/useAuthToken'
import { PaymentModal } from './PaymentModal'
import { InvoicePreview, type Acompte } from './InvoicePreview'
import type { LineData } from './InvoiceLineRow'

interface InvoiceListProps {}

type FilterTab = 'toate' | 'draft' | 'emise' | 'incasate'

const STATUS_BADGE: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600' },
  emisa: { label: 'Emisă', className: 'bg-blue-50 text-blue-700' },
  trimisa_anaf: { label: 'Trimisă ANAF', className: 'bg-yellow-50 text-yellow-700' },
  validata_anaf: { label: 'Validată ANAF', className: 'bg-teal-50 text-teal-700' },
  respinsa_anaf: { label: 'Respinsă ANAF', className: 'bg-red-50 text-red-700' },
  incasata: { label: 'Încasată', className: 'bg-emerald-50 text-emerald-700' },
  anulata: { label: 'Anulată', className: 'bg-red-50 text-red-600' },
}

const TABS: { value: FilterTab; label: string }[] = [
  { value: 'toate', label: 'Toate' },
  { value: 'draft', label: 'Draft' },
  { value: 'emise', label: 'Emise' },
  { value: 'incasate', label: 'Încasate' },
]

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const PAYABLE_STATUSES: InvoiceStatus[] = ['emisa', 'trimisa_anaf', 'validata_anaf']

export function InvoiceList({}: InvoiceListProps) {
  const token = useAuthToken()
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<FilterTab>('toate')
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null)
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    apiRequest<{ invoices: Invoice[] }>('/api/invoices', { token })
      .then(data => setInvoices(data.invoices))
      .catch(err => setError(err instanceof Error ? err.message : 'Eroare la încărcarea facturilor'))
      .finally(() => setLoading(false))
  }, [token])

  // Close dropdown on outside click
  useEffect(() => {
    if (!openDropdown) return
    function close() { setOpenDropdown(null) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [openDropdown])

  function handlePaid(updated: Invoice) {
    setInvoices(prev => prev.map(inv => inv._id === updated._id ? updated : inv))
    setPaymentInvoice(null)
  }

  async function handleCancel(inv: Invoice) {
    if (!token) return
    if (!window.confirm(`Anulezi factura ${inv.fullNumber ?? `${inv.series}${inv.number}`}? Această acțiune nu poate fi anulată.`)) return
    try {
      const res = await apiRequest<{ invoice: Invoice }>(`/api/invoices/${inv._id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'anulata' }),
        token,
      })
      setInvoices(prev => prev.map(i => i._id === res.invoice._id ? res.invoice : i))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Eroare la anulare')
    }
  }

  const filtered = invoices.filter(inv => {
    if (tab === 'draft') return inv.status === 'draft'
    if (tab === 'emise') return inv.status === 'emisa' || inv.status === 'trimisa_anaf' || inv.status === 'validata_anaf'
    if (tab === 'incasate') return inv.status === 'incasata'
    return true
  })

  return (
    <>
      {paymentInvoice && (
        <PaymentModal
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onPaid={handlePaid}
        />
      )}

      {/* Invoice preview modal */}
      {previewInvoice && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewInvoice(null)}
        >
          <div
            className="bg-white rounded-xl border border-[#E2EAF4] shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2EAF4] flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#0D1B3E]">
                  {previewInvoice.fullNumber ?? `${previewInvoice.series}${previewInvoice.number}`}
                </span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[previewInvoice.status].className}`}>
                  {STATUS_BADGE[previewInvoice.status].label}
                </span>
              </div>
              <button
                onClick={() => setPreviewInvoice(null)}
                className="text-[#5A6A8A] hover:text-[#0D1B3E] transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" />
                </svg>
              </button>
            </div>
            {/* Modal body */}
            <div className="overflow-y-auto flex-1 p-6">
              <InvoicePreview
                type={previewInvoice.type}
                issueDate={previewInvoice.issueDate.split('T')[0]}
                dueDate={previewInvoice.dueDate ? previewInvoice.dueDate.split('T')[0] : ''}
                currency={previewInvoice.totals.currency}
                client={previewInvoice.client as unknown as Client}
                lines={previewInvoice.lines.map((l): LineData => ({
                  reference: '',
                  title: l.description,
                  description: '',
                  category: '',
                  quantity: l.quantity,
                  unit: l.unit,
                  unitPrice: l.unitPrice,
                  vatRate: l.vatRate,
                  remise: 0,
                }))}
                remiseGenerala={previewInvoice.remiseGenerala}
                acomptes={previewInvoice.acomptes.map((a): Acompte => ({
                  id: a._id,
                  description: a.description,
                  date: a.date,
                  amount: a.amount,
                }))}
                mentiuni={previewInvoice.notes ?? ''}
                userName=""
              />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#E2EAF4] shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-1 rounded-lg bg-[#F4F6FB] p-1">
            {TABS.map(t => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === t.value
                    ? 'bg-white text-taxly-700 shadow-sm'
                    : 'text-[#5A6A8A] hover:text-taxly-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => router.push('/invoices/new')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-taxly-700 px-4 py-2 text-sm font-semibold text-white hover:bg-taxly-800 transition-colors"
          >
            + Factură nouă
          </button>
        </div>

        {loading && (
          <div className="text-center py-12 text-sm text-[#5A6A8A]">Se încarcă...</div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2EAF4]">
                  <th className="pb-3 text-left font-medium text-[#5A6A8A] pr-4">Număr</th>
                  <th className="pb-3 text-left font-medium text-[#5A6A8A] pr-4">Client</th>
                  <th className="pb-3 text-left font-medium text-[#5A6A8A] pr-4">Tip</th>
                  <th className="pb-3 text-left font-medium text-[#5A6A8A] pr-4">Dată</th>
                  <th className="pb-3 text-left font-medium text-[#5A6A8A] pr-4">Total</th>
                  <th className="pb-3 text-left font-medium text-[#5A6A8A]">Status</th>
                  <th className="pb-3 text-right font-medium text-[#5A6A8A]">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-[#8FA3C0]">
                      Nu există facturi în această categorie
                    </td>
                  </tr>
                )}
                {filtered.map(inv => {
                  const badge = STATUS_BADGE[inv.status]
                  const isDraft = inv.status === 'draft'
                  const isPayable = PAYABLE_STATUSES.includes(inv.status)
                  const isCancelled = inv.status === 'anulata'
                  return (
                    <tr
                      key={inv._id}
                      className="border-b border-[#F4F6FB] transition-colors cursor-pointer hover:bg-[#F4F6FB]/80"
                      onClick={() => {
                        if (isDraft) {
                          router.push(`/invoices/${inv._id}/edit`)
                        } else {
                          setPreviewInvoice(inv)
                        }
                      }}
                    >
                      <td className="py-3 pr-4 font-medium text-taxly-700">
                        {inv.fullNumber ?? `${inv.series}${inv.number}`}
                        {isDraft && (
                          <span className="ml-1.5 text-[10px] text-[#8FA3C0]">· click pentru editare</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-[#0D1B3E]">{inv.client.name}</td>
                      <td className="py-3 pr-4 text-[#5A6A8A] capitalize">{inv.type}</td>
                      <td className="py-3 pr-4 text-[#5A6A8A]">{formatDate(inv.issueDate)}</td>
                      <td className="py-3 pr-4 font-medium text-[#0D1B3E]">
                        {inv.totals.total.toFixed(2)} {inv.totals.currency}
                        {inv.acomptes.length > 0 && (
                          <span className="block text-[11px] text-emerald-600">
                            rest: {(
                              inv.totals.total -
                              inv.acomptes.reduce((s, a) => s + a.amount, 0)
                            ).toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      {/* Actions column — stopPropagation so row click doesn't fire */}
                      <td className="py-3 text-right relative" onClick={e => e.stopPropagation()}>
                        <button
                          onMouseDown={e => {
                            e.stopPropagation()
                            setOpenDropdown(openDropdown === inv._id ? null : inv._id)
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#E2EAF4] bg-white px-3 py-1 text-xs font-semibold text-[#5A6A8A] hover:bg-[#F4F6FB] hover:text-taxly-700 transition-colors"
                        >
                          Acțiuni <span className="text-[10px]">▾</span>
                        </button>
                        {openDropdown === inv._id && (
                          <div
                            className="absolute right-0 top-full mt-1 z-10 min-w-[190px] bg-white border border-[#E2EAF4] rounded-xl shadow-lg py-1 overflow-hidden"
                            onMouseDown={e => e.stopPropagation()}
                          >
                            {isPayable && (
                              <button
                                className="px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-[#F4F6FB] cursor-pointer w-full text-left text-[#0D1B3E]"
                                onClick={() => { setOpenDropdown(null); setPaymentInvoice(inv) }}
                              >
                                <span>✓</span> Încasează
                              </button>
                            )}
                            {!isCancelled && (
                              <>
                                <button
                                  className="px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-[#F4F6FB] cursor-pointer w-full text-left text-[#0D1B3E]"
                                  onClick={() => { setOpenDropdown(null); alert('Coming soon — Avoir') }}
                                >
                                  <span>↩</span> Creează avoir
                                </button>
                                <button
                                  className="px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-[#F4F6FB] cursor-pointer w-full text-left text-[#0D1B3E]"
                                  onClick={() => { setOpenDropdown(null); router.push('/invoices/new') }}
                                >
                                  <span>↗</span> Re-emite
                                </button>
                                <button
                                  className="px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-red-50 cursor-pointer w-full text-left text-red-600"
                                  onClick={() => { setOpenDropdown(null); handleCancel(inv) }}
                                >
                                  <span>✕</span> Anulează factura
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
