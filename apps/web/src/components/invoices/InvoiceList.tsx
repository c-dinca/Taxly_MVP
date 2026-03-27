'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import type { Client, Invoice, InvoiceStatus, InvoiceType } from '@taxly/types'
import { apiRequest } from '@/lib/api'
import { useAuthToken } from '@/hooks/useAuthToken'
import { PaymentModal } from './PaymentModal'
import { InvoicePreview, type Acompte } from './InvoicePreview'
import { StornoModal } from './StornoModal'
import type { LineData } from './InvoiceLineRow'

interface InvoiceListProps {}

const STATUS_BADGE: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600' },
  emisa: { label: 'Emisă', className: 'bg-blue-50 text-blue-700' },
  trimisa_anaf: { label: 'Trimisă ANAF', className: 'bg-yellow-50 text-yellow-700' },
  validata_anaf: { label: 'Validată ANAF', className: 'bg-teal-50 text-teal-700' },
  respinsa_anaf: { label: 'Respinsă ANAF', className: 'bg-red-50 text-red-700' },
  incasata: { label: 'Încasată', className: 'bg-emerald-50 text-emerald-700' },
  anulata: { label: 'Anulată', className: 'bg-red-50 text-red-600' },
}

const TYPE_LABEL: Record<InvoiceType, string> = {
  factura: 'Factură',
  deviz: 'Deviz',
  storno: 'Notă de credit',
  avans: 'Avans',
  proforma: 'Proformă',
}

const DOC_TABS: {
  value: InvoiceType
  label: string
  emptyLabel: string
  newLabel: string
}[] = [
  { value: 'factura', label: 'Facturi', emptyLabel: 'Nu există facturi încă', newLabel: '+ Factură nouă' },
  { value: 'deviz', label: 'Devize', emptyLabel: 'Nu există devize încă', newLabel: '+ Deviz nou' },
  { value: 'storno', label: 'Note de credit', emptyLabel: 'Nu există note de credit', newLabel: '' },
  { value: 'avans', label: 'Avans', emptyLabel: 'Nu există facturi de avans', newLabel: '+ Avans nou' },
  { value: 'proforma', label: 'Proformă', emptyLabel: 'Nu există facturi proformă', newLabel: '+ Proformă nouă' },
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
  const [tab, setTab] = useState<InvoiceType>('factura')
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null)
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null)
  const [stornoInvoice, setStornoInvoice] = useState<Invoice | null>(null)

  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!token) return
    loadInvoices()
  }, [token])

  function loadInvoices() {
    if (!token) return
    setLoading(true)
    setError(null)
    apiRequest<{ invoices: Invoice[] }>('/api/invoices', { token })
      .then(data => setInvoices(data.invoices))
      .catch(err => setError(err instanceof Error ? err.message : 'Eroare la încărcarea documentelor'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!openDropdown) return
    function close(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [openDropdown])

  function openActionsDropdown(e: React.MouseEvent<HTMLButtonElement>, invId: string) {
    e.stopPropagation()
    if (openDropdown === invId) { setOpenDropdown(null); return }
    const rect = e.currentTarget.getBoundingClientRect()
    setDropdownPos({
      top: rect.bottom + window.scrollY + 4,
      right: window.innerWidth - rect.right,
    })
    setOpenDropdown(invId)
  }

  function handlePaid(updated: Invoice) {
    setInvoices(prev => prev.map(inv => inv._id === updated._id ? updated : inv))
    setPaymentInvoice(null)
  }

  function handleStornoCreated(storno: Invoice) {
    setInvoices(prev => {
      const updated = prev.map(inv =>
        inv._id === storno.originalInvoiceId ? { ...inv, status: 'anulata' as const } : inv,
      )
      return [storno, ...updated]
    })
  }

  async function handleCancel(inv: Invoice) {
    if (!token) return
    const label = inv.fullNumber ?? `${inv.series}${inv.number}`
    if (!window.confirm(`Anulezi documentul ${label}? Această acțiune nu poate fi anulată.`)) return
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

  function getAssociated(inv: Invoice): Invoice[] {
    const result: Invoice[] = []
    // Original document (if this is a storno)
    if (inv.originalInvoiceId) {
      const original = invoices.find(i => i._id === inv.originalInvoiceId)
      if (original) result.push(original)
    }
    // Stornos / notes de credit linked to this document
    const linked = invoices.filter(i => i.originalInvoiceId === inv._id)
    result.push(...linked)
    return result
  }

  const activeTab = DOC_TABS.find(t => t.value === tab)!
  const filtered = invoices.filter(inv => inv.type === tab)
  const countByType = invoices.reduce<Record<string, number>>((acc, inv) => {
    acc[inv.type] = (acc[inv.type] ?? 0) + 1
    return acc
  }, {})

  const previewAssociated = previewInvoice ? getAssociated(previewInvoice) : []

  function toLineData(l: Invoice['lines'][number]): LineData {
    return {
      reference: '',
      title: l.description,
      description: '',
      category: '',
      quantity: l.quantity,
      unit: l.unit,
      unitPrice: l.unitPrice,
      vatRate: l.vatRate,
      remise: 0,
    }
  }

  function toAcompte(a: Invoice['acomptes'][number]): Acompte {
    return {
      id: a._id,
      description: a.description,
      date: a.date,
      amount: a.amount,
    }
  }

  return (
    <>
      {paymentInvoice && (
        <PaymentModal
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onPaid={handlePaid}
        />
      )}

      {stornoInvoice && (
        <StornoModal
          invoice={stornoInvoice}
          onClose={() => setStornoInvoice(null)}
          onCreated={handleStornoCreated}
        />
      )}

      {/* Actions dropdown portal */}
      {openDropdown && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: 'fixed', top: dropdownPos.top, right: dropdownPos.right, zIndex: 9999 }}
          className="min-w-[200px] bg-white border border-[#E2EAF4] rounded-xl shadow-xl py-1 overflow-hidden"
          onMouseDown={e => e.stopPropagation()}
        >
          {(() => {
            const inv = invoices.find(i => i._id === openDropdown)
            if (!inv) return null
            const isPayable = PAYABLE_STATUSES.includes(inv.status)
            const isCancelled = inv.status === 'anulata'
            const isStorno = inv.type === 'storno'
            return (
              <>
                <button
                  className="px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-[#F4F6FB] cursor-pointer w-full text-left text-[#0D1B3E]"
                  onClick={() => { setOpenDropdown(null); window.open(`/api/pdf/invoice/${inv._id}`, '_blank') }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16l-4-4h2.5V4h3v8H16l-4 4z" stroke="currentColor" fill="none"/><path d="M4 20h16" stroke="currentColor"/></svg>
                  Descarcă PDF
                </button>
                <div className="mx-3 my-1 border-t border-[#F4F6FB]" />
                {isPayable && (
                  <button
                    className="px-4 py-2.5 text-sm flex items-center gap-2.5 hover:bg-[#F4F6FB] cursor-pointer w-full text-left text-[#0D1B3E]"
                    onClick={() => { setOpenDropdown(null); setPaymentInvoice(inv) }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" stroke="currentColor"/></svg>
                    Încasează
                  </button>
                )}
                {!isCancelled && !isStorno && (
                  <>
                    <button
                      className="px-4 py-2.5 text-sm flex items-center gap-2.5 hover:bg-[#F4F6FB] cursor-pointer w-full text-left text-[#0D1B3E]"
                      onClick={() => { setOpenDropdown(null); setStornoInvoice(inv) }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14l-4-4 4-4M5 10h11a4 4 0 010 8h-1" stroke="currentColor"/></svg>
                      Emite notă de credit
                    </button>
                    <button
                      className="px-4 py-2.5 text-sm flex items-center gap-2.5 hover:bg-[#F4F6FB] cursor-pointer w-full text-left text-[#0D1B3E]"
                      onClick={() => { setOpenDropdown(null); router.push('/invoices/new') }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" stroke="currentColor"/></svg>
                      Re-emite / Duplicat
                    </button>
                  </>
                )}
                {!isCancelled && (
                  <>
                    <div className="mx-3 my-1 border-t border-[#F4F6FB]" />
                    <button
                      className="px-4 py-2.5 text-sm flex items-center gap-2.5 hover:bg-red-50 cursor-pointer w-full text-left text-red-600"
                      onClick={() => { setOpenDropdown(null); handleCancel(inv) }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor"/></svg>
                      Anulează
                    </button>
                  </>
                )}
              </>
            )
          })()}
        </div>,
        document.body,
      )}

      {/* Preview modal */}
      {previewInvoice && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewInvoice(null)}
        >
          <div
            className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden max-h-[90vh] transition-all ${previewAssociated.length > 0 ? 'max-w-5xl' : 'max-w-3xl'}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2EAF4] flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-[#0D1B3E]">
                  {previewInvoice.fullNumber ?? `${previewInvoice.series}${previewInvoice.number}`}
                </span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[previewInvoice.status].className}`}>
                  {STATUS_BADGE[previewInvoice.status].label}
                </span>
                <span className="text-xs text-[#8FA3C0] font-medium">{TYPE_LABEL[previewInvoice.type]}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.open(`/api/pdf/invoice/${previewInvoice._id}`, '_blank')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2EAF4] bg-white px-3 py-1.5 text-xs font-semibold text-[#5A6A8A] hover:bg-[#F4F6FB] hover:text-taxly-700 transition-colors"
                  title="Descarcă PDF"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16l-4-4h2.5V4h3v8H16l-4 4z" stroke="currentColor" fill="none"/><path d="M4 20h16" stroke="currentColor"/></svg>
                  Descarcă PDF
                </button>
                <button
                  onClick={() => setPreviewInvoice(null)}
                  className="text-[#5A6A8A] hover:text-[#0D1B3E] transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className={`flex flex-1 min-h-0 ${previewAssociated.length > 0 ? 'divide-x divide-[#E2EAF4]' : ''}`}>
              {/* Main preview */}
              <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <InvoicePreview
                  flat
                  type={previewInvoice.type}
                  invoiceNumber={previewInvoice.fullNumber ?? `${previewInvoice.series}${previewInvoice.number}`}
                  issueDate={previewInvoice.issueDate.split('T')[0]}
                  dueDate={previewInvoice.dueDate ? previewInvoice.dueDate.split('T')[0] : ''}
                  currency={previewInvoice.totals.currency}
                  client={previewInvoice.client as unknown as Client}
                  lines={previewInvoice.lines.map(toLineData)}
                  remiseGenerala={previewInvoice.remiseGenerala}
                  acomptes={previewInvoice.acomptes.map(toAcompte)}
                  mentiuni={previewInvoice.notes ?? ''}
                  userName=""
                  originalInvoiceNumber={previewInvoice.originalInvoiceNumber}
                />
              </div>

              {/* Associated documents panel */}
              {previewAssociated.length > 0 && (
                <div className="w-72 flex-shrink-0 flex flex-col overflow-hidden bg-[#FAFBFD]">
                  <div className="px-4 py-3 border-b border-[#E2EAF4] flex-shrink-0">
                    <p className="text-[10px] font-bold text-[#8FA3C0] uppercase tracking-[0.15em]">
                      Documente asociate
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-3 space-y-2">
                    {previewAssociated.map(doc => {
                      const isOriginal = doc._id === previewInvoice.originalInvoiceId
                      return (
                        <button
                          key={doc._id}
                          onClick={() => setPreviewInvoice(doc)}
                          className="w-full text-left rounded-xl border border-[#E2EAF4] bg-white p-3.5 hover:border-taxly-300 hover:shadow-sm transition-all group"
                        >
                          {/* Type + relation label */}
                          <p className="text-[10px] font-bold text-[#8FA3C0] uppercase tracking-wide mb-1.5">
                            {isOriginal ? '← Document original' : `→ ${TYPE_LABEL[doc.type]}`}
                          </p>
                          {/* Number + status */}
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="text-xs font-bold text-taxly-700 font-mono group-hover:text-taxly-800">
                              {doc.fullNumber ?? `${doc.series}${doc.number}`}
                            </span>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium flex-shrink-0 ${STATUS_BADGE[doc.status].className}`}>
                              {STATUS_BADGE[doc.status].label}
                            </span>
                          </div>
                          {/* Client + total */}
                          <p className="text-[11px] text-[#5A6A8A] truncate mb-1">{doc.client.name}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#8FA3C0]">{formatDate(doc.issueDate)}</span>
                            <span className={`text-xs font-semibold ${doc.totals.total < 0 ? 'text-red-600' : 'text-[#0D1B3E]'}`}>
                              {doc.totals.total.toFixed(2)} {doc.totals.currency}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#E2EAF4] shadow-sm p-6">
        {/* Type tabs + new button */}
        <div className="flex items-center justify-between mb-5 gap-4">
          <div className="flex gap-0.5 rounded-xl bg-[#F4F6FB] p-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {DOC_TABS.map(t => {
              const count = countByType[t.value] ?? 0
              const isActive = tab === t.value
              return (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
                  className={`relative whitespace-nowrap px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white text-taxly-700 shadow-sm'
                      : 'text-[#5A6A8A] hover:text-taxly-700'
                  }`}
                >
                  {t.label}
                  {count > 0 && (
                    <span className={`ml-1.5 inline-flex items-center justify-center rounded-full text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] ${
                      isActive ? 'bg-taxly-100 text-taxly-700' : 'bg-[#E2EAF4] text-[#8FA3C0]'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          {activeTab.newLabel && (
            <button
              onClick={() => router.push('/invoices/new')}
              className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-taxly-700 px-4 py-2 text-sm font-semibold text-white hover:bg-taxly-800 transition-colors"
            >
              {activeTab.newLabel}
            </button>
          )}
        </div>

        {loading && (
          <div className="text-center py-12 text-sm text-[#5A6A8A]">Se încarcă...</div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={loadInvoices} className="ml-4 text-xs font-semibold underline hover:no-underline cursor-pointer">
              Reîncearcă
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2EAF4]">
                  <th className="pb-3 text-left font-medium text-[#5A6A8A] pr-4">Număr</th>
                  <th className="pb-3 text-left font-medium text-[#5A6A8A] pr-4">Client</th>
                  <th className="pb-3 text-left font-medium text-[#5A6A8A] pr-4">Dată</th>
                  <th className="pb-3 text-left font-medium text-[#5A6A8A] pr-4">Total</th>
                  <th className="pb-3 text-left font-medium text-[#5A6A8A]">Status</th>
                  <th className="pb-3 text-right font-medium text-[#5A6A8A]">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-14 text-center">
                      <p className="text-[#8FA3C0] text-sm">{activeTab.emptyLabel}</p>
                      {activeTab.newLabel && (
                        <button
                          onClick={() => router.push('/invoices/new')}
                          className="mt-3 text-xs text-taxly-700 font-semibold hover:underline"
                        >
                          {activeTab.newLabel}
                        </button>
                      )}
                    </td>
                  </tr>
                )}
                {filtered.map(inv => {
                  const badge = STATUS_BADGE[inv.status]
                  const isDraft = inv.status === 'draft'
                  const associated = getAssociated(inv)
                  const linkedStornos = associated.filter(d => d.originalInvoiceId === inv._id)
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
                      <td className="py-3 pr-4">
                        <span className="font-mono font-semibold text-taxly-700">
                          {inv.fullNumber ?? `${inv.series}${inv.number}`}
                        </span>
                        {isDraft && (
                          <span className="ml-1.5 text-[10px] text-[#8FA3C0]">· draft</span>
                        )}
                        {inv.originalInvoiceNumber && (
                          <p className="text-[10px] text-[#8FA3C0] mt-0.5 font-mono">
                            ref: {inv.originalInvoiceNumber}
                          </p>
                        )}
                        {linkedStornos.length > 0 && (
                          <p className="text-[10px] text-amber-600 mt-0.5">
                            {linkedStornos.length === 1 ? '1 notă de credit' : `${linkedStornos.length} note de credit`}
                          </p>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-[#0D1B3E]">{inv.client.name}</td>
                      <td className="py-3 pr-4 text-[#5A6A8A]">{formatDate(inv.issueDate)}</td>
                      <td className="py-3 pr-4 font-medium text-[#0D1B3E]">
                        <span className={inv.totals.total < 0 ? 'text-red-600' : ''}>
                          {inv.totals.total.toFixed(2)} {inv.totals.currency}
                        </span>
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
                        <button
                          onClick={(e) => openActionsDropdown(e, inv._id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#E2EAF4] bg-white px-3 py-1 text-xs font-semibold text-[#5A6A8A] hover:bg-[#F4F6FB] hover:text-taxly-700 transition-colors cursor-pointer"
                        >
                          Acțiuni
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6" stroke="currentColor"/></svg>
                        </button>
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
