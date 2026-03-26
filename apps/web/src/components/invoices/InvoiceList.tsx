'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Invoice, InvoiceStatus } from '@taxly/types'
import { apiRequest } from '@/lib/api'
import { useAuthToken } from '@/hooks/useAuthToken'
import { PaymentModal } from './PaymentModal'

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

  useEffect(() => {
    if (!token) return
    apiRequest<{ invoices: Invoice[] }>('/api/invoices', { token })
      .then(data => setInvoices(data.invoices))
      .catch(err => setError(err instanceof Error ? err.message : 'Eroare la încărcarea facturilor'))
      .finally(() => setLoading(false))
  }, [token])

  function handlePaid(updated: Invoice) {
    setInvoices(prev => prev.map(inv => inv._id === updated._id ? updated : inv))
    setPaymentInvoice(null)
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
                  return (
                    <tr
                      key={inv._id}
                      className={`border-b border-[#F4F6FB] transition-colors ${isDraft ? 'cursor-pointer hover:bg-[#F4F6FB]/80' : 'hover:bg-[#F4F6FB]/60'}`}
                      onClick={isDraft ? () => router.push(`/invoices/${inv._id}/edit`) : undefined}
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
                            rest: {(inv.totals.total - inv.acomptes.reduce((s, a) => s + a.amount, 0)).toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 text-right" onClick={e => e.stopPropagation()}>
                        {isPayable && (
                          <button
                            onClick={() => setPaymentInvoice(inv)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                          >
                            Încasează
                          </button>
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
