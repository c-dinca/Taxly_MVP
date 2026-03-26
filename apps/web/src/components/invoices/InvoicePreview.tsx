'use client'

import type { Client } from '@taxly/types'
import { lineCalc, type LineData } from './InvoiceLineRow'

export interface Acompte {
  id: string
  description: string
  date: string
  amount: number
}

interface InvoicePreviewProps {
  type: string
  issueDate: string
  dueDate: string
  currency: string
  client: Client | null
  lines: LineData[]
  remiseGenerala: number
  acomptes: Acompte[]
  mentiuni: string
  userName: string
}

const TYPE_LABELS: Record<string, string> = {
  factura: 'FACTURĂ FISCALĂ',
  proforma: 'FACTURĂ PROFORMĂ',
  deviz: 'DEVIZ',
  avans: 'FACTURĂ DE AVANS',
  storno: 'FACTURĂ STORNO',
}

function fmt(n: number) { return n.toFixed(2) }
function fmtDate(d: string) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}`
}

export function InvoicePreview({
  type, issueDate, dueDate, currency, client, lines,
  remiseGenerala, acomptes, mentiuni, userName,
}: InvoicePreviewProps) {
  const calcs = lines.map(lineCalc)

  const totalHTBrut = calcs.reduce((s, c) => s + c.baseHT, 0)
  const totalRemiseLinii = calcs.reduce((s, c) => s + c.remiseAmount, 0)
  const totalHTNetLinii = calcs.reduce((s, c) => s + c.netHT, 0)
  const remiseGeneralaAmount = totalHTNetLinii * (remiseGenerala / 100)
  const totalHTNet = totalHTNetLinii - remiseGeneralaAmount
  const factor = 1 - remiseGenerala / 100

  // TVA breakdown by rate (with global remise applied)
  const tvaByRate: Record<number, number> = {}
  lines.forEach((line, i) => {
    const adjustedNet = calcs[i].netHT * factor
    tvaByRate[line.vatRate] = (tvaByRate[line.vatRate] ?? 0) + adjustedNet * (line.vatRate / 100)
  })
  const totalTVA = Object.values(tvaByRate).reduce((s, v) => s + v, 0)
  const totalTTC = totalHTNet + totalTVA
  const totalAcomptes = acomptes.reduce((s, a) => s + a.amount, 0)
  const restaPlata = totalTTC - totalAcomptes

  const hasRemise = totalRemiseLinii > 0 || remiseGenerala > 0

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden text-[#0D1B3E] text-[13px] leading-relaxed">
      {/* Header stripe */}
      <div className="bg-taxly-700 px-6 py-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-taxly-200 text-[9px] uppercase tracking-[0.15em] mb-1">Document fiscal</p>
            <h2 className="text-white text-sm font-bold tracking-wide">{TYPE_LABELS[type] ?? 'FACTURĂ'}</h2>
          </div>
          <div className="text-right">
            <p className="text-white text-xl font-bold opacity-40">—</p>
            <p className="text-taxly-200 text-[10px] mt-0.5">Număr serie</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Meta row */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 pb-4 border-b border-[#F4F6FB]">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-[#8FA3C0] font-semibold">Data emiterii</p>
            <p className="font-medium">{fmtDate(issueDate)}</p>
          </div>
          {dueDate && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-[#8FA3C0] font-semibold">Scadență</p>
              <p className="font-medium">{fmtDate(dueDate)}</p>
            </div>
          )}
          <div>
            <p className="text-[9px] uppercase tracking-wider text-[#8FA3C0] font-semibold">Valută</p>
            <p className="font-medium">{currency}</p>
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-[#8FA3C0] font-semibold mb-2">Furnizor</p>
            <p className="font-semibold text-[#0D1B3E]">{userName || '—'}</p>
            <p className="text-[#8FA3C0] text-xs italic mt-0.5">Adresă · CUI · IBAN</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-[#8FA3C0] font-semibold mb-2">Client</p>
            {client ? (
              <>
                <p className="font-semibold text-[#0D1B3E]">{client.name}</p>
                {client.address && <p className="text-[#5A6A8A] text-xs mt-0.5">{client.address}</p>}
                {client.cui && <p className="text-[#5A6A8A] text-xs">CUI: {client.cui}</p>}
                {client.cnp && <p className="text-[#5A6A8A] text-xs">CNP: {client.cnp}</p>}
              </>
            ) : (
              <p className="text-[#8FA3C0] italic">— Selectează un client —</p>
            )}
          </div>
        </div>

        {/* Lines table */}
        {lines.length > 0 && lines.some(l => l.title) && (
          <div>
            <p className="text-[9px] uppercase tracking-wider text-[#8FA3C0] font-semibold mb-2">Produse / Servicii</p>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-[#E2EAF4]">
                  {['Denumire', 'Cant.', 'UM', 'Preț HT', 'Rem.', 'TVA', 'Net HT'].map(h => (
                    <th key={h} className={`pb-2 text-[10px] font-semibold text-[#8FA3C0] ${h === 'Denumire' ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => {
                  const c = calcs[i]
                  return (
                    <tr key={i} className="border-b border-[#F4F6FB] last:border-0">
                      <td className="py-2 pr-3">
                        {line.reference && (
                          <p className="text-[10px] text-[#8FA3C0] font-mono mb-0.5">{line.reference}</p>
                        )}
                        <p className="font-medium text-[#0D1B3E]">{line.title || <span className="text-[#8FA3C0] italic">—</span>}</p>
                        {line.description && (
                          <p className="text-[10px] text-[#8FA3C0] mt-0.5 leading-tight">{line.description}</p>
                        )}
                      </td>
                      <td className="py-2 text-right text-[#5A6A8A]">{line.quantity}</td>
                      <td className="py-2 text-right text-[#5A6A8A]">{line.unit}</td>
                      <td className="py-2 text-right text-[#5A6A8A]">{fmt(line.unitPrice)}</td>
                      <td className="py-2 text-right text-[#5A6A8A]">
                        {line.remise > 0 ? <span className="text-red-500">{line.remise}%</span> : '—'}
                      </td>
                      <td className="py-2 text-right text-[#5A6A8A]">{line.vatRate}%</td>
                      <td className="py-2 text-right font-semibold text-[#0D1B3E]">{fmt(c.netHT)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        <div className="border-t-2 border-[#E2EAF4] pt-4 space-y-1.5">
          <Row label="Total HT brut" value={`${fmt(totalHTBrut)} ${currency}`} />

          {hasRemise && (
            <>
              {totalRemiseLinii > 0 && (
                <Row label="Remisă linii" value={`−${fmt(totalRemiseLinii)} ${currency}`} accent="red" />
              )}
              {remiseGenerala > 0 && (
                <Row label={`Remisă generală (${remiseGenerala}%)`} value={`−${fmt(remiseGeneralaAmount)} ${currency}`} accent="red" />
              )}
            </>
          )}

          <Row label="Total HT net" value={`${fmt(totalHTNet)} ${currency}`} semi />

          {Object.entries(tvaByRate)
            .filter(([, v]) => v > 0.001)
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([rate, amount]) => (
              <Row key={rate} label={`TVA ${rate}%`} value={`${fmt(amount)} ${currency}`} />
            ))}

          <div className="pt-1 border-t border-[#E2EAF4]">
            <Row label="Total TVA" value={`${fmt(totalTVA)} ${currency}`} semi />
          </div>

          <div className="pt-2 border-t-2 border-[#0D1B3E]">
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-bold">Total TTC</span>
              <span className="text-base font-bold">{fmt(totalTTC)} {currency}</span>
            </div>
          </div>

          {acomptes.length > 0 && (
            <>
              <div className="pt-1 border-t border-[#E2EAF4]">
                {acomptes.map(a => (
                  <Row key={a.id} label={`Deja plătit — ${a.description || 'Acont'}`} value={`−${fmt(a.amount)} ${currency}`} accent="emerald" />
                ))}
              </div>
              <div className="pt-2 border-t border-taxly-200">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-bold text-taxly-700">Rest de plată</span>
                  <span className="text-base font-bold text-taxly-700">{fmt(restaPlata)} {currency}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Mentiuni */}
        {mentiuni && (
          <div className="border-t border-[#F4F6FB] pt-4">
            <p className="text-[9px] uppercase tracking-wider text-[#8FA3C0] font-semibold mb-1.5">Mențiuni</p>
            <p className="text-xs text-[#5A6A8A] whitespace-pre-wrap leading-relaxed">{mentiuni}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-[#F4F6FB] pt-3 text-center">
          <p className="text-[10px] text-[#8FA3C0]">Document generat cu Taxly · taxly.ro</p>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, semi, accent }: { label: string; value: string; semi?: boolean; accent?: 'red' | 'emerald' }) {
  const valueColor = accent === 'red' ? 'text-red-500' : accent === 'emerald' ? 'text-emerald-600' : semi ? 'text-[#0D1B3E]' : 'text-[#5A6A8A]'
  return (
    <div className="flex justify-between items-baseline">
      <span className={`${semi ? 'font-medium text-[#0D1B3E]' : 'text-[#5A6A8A]'}`}>{label}</span>
      <span className={`font-medium ${valueColor}`}>{value}</span>
    </div>
  )
}
