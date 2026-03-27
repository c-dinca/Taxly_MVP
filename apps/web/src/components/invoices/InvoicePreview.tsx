'use client'

import type { Client } from '@taxly/types'
import { lineCalc, type LineData } from './InvoiceLineRow'

export interface Acompte {
  id: string
  description: string
  date: string
  amount: number
}

export interface SupplierInfo {
  name?: string
  address?: string
  cui?: string
  regCom?: string
  iban?: string
  bank?: string
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
  supplier?: SupplierInfo
  invoiceNumber?: string
  originalInvoiceNumber?: string
  /** Removes outer card wrapper — use when InvoicePreview is already inside a modal/card */
  flat?: boolean
}

const TYPE_LABELS: Record<string, { title: string; subtitle: string }> = {
  factura:  { title: 'FACTURĂ FISCALĂ',            subtitle: 'conf. art. 319 din Legea nr. 227/2015' },
  proforma: { title: 'FACTURĂ PROFORMĂ',           subtitle: 'Document fără valoare fiscală' },
  deviz:    { title: 'DEVIZ / OFERTĂ',             subtitle: 'Document estimativ de costuri' },
  avans:    { title: 'FACTURĂ DE AVANS',           subtitle: 'conf. art. 319 din Legea nr. 227/2015' },
  storno:   { title: 'FACTURĂ STORNO',             subtitle: 'Notă de credit / Corecție fiscală' },
}

const HEADER_COLOR: Record<string, string> = {
  factura:  'bg-taxly-700',
  proforma: 'bg-slate-600',
  deviz:    'bg-indigo-700',
  avans:    'bg-teal-700',
  storno:   'bg-red-700',
}

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('ro-RO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function fmtDate(d: string) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}`
}

export function InvoicePreview({
  type, issueDate, dueDate, currency, client, lines,
  remiseGenerala, acomptes, mentiuni, userName, supplier,
  invoiceNumber, originalInvoiceNumber, flat,
}: InvoicePreviewProps) {
  const calcs = lines.map(lineCalc)

  const totalHTBrut     = calcs.reduce((s, c) => s + c.baseHT, 0)
  const totalRemiseLinii = calcs.reduce((s, c) => s + c.remiseAmount, 0)
  const totalHTNetLinii  = calcs.reduce((s, c) => s + c.netHT, 0)
  const remiseGeneralaAmount = totalHTNetLinii * (remiseGenerala / 100)
  const totalHTNet = totalHTNetLinii - remiseGeneralaAmount
  const factor     = 1 - remiseGenerala / 100

  // TVA breakdown by rate
  const tvaByRate: Record<number, { base: number; tva: number }> = {}
  lines.forEach((line, i) => {
    const base = calcs[i].netHT * factor
    const tva  = base * (line.vatRate / 100)
    if (!tvaByRate[line.vatRate]) tvaByRate[line.vatRate] = { base: 0, tva: 0 }
    tvaByRate[line.vatRate].base += base
    tvaByRate[line.vatRate].tva  += tva
  })
  const totalTVA  = Object.values(tvaByRate).reduce((s, v) => s + v.tva, 0)
  const totalTTC  = totalHTNet + totalTVA
  const totalAcomptes = acomptes.reduce((s, a) => s + a.amount, 0)
  const restaPlata    = totalTTC - totalAcomptes

  const hasRemise = totalRemiseLinii > 0 || remiseGenerala > 0
  const isStorno  = type === 'storno'

  const typeInfo   = TYPE_LABELS[type] ?? TYPE_LABELS['factura']
  const headerBg   = HEADER_COLOR[type] ?? HEADER_COLOR['factura']
  const supplierName = supplier?.name || userName || '—'

  const wrapper = flat
    ? 'text-[#0D1B3E] text-[12px] leading-[1.6] font-sans select-text'
    : 'bg-white rounded-xl shadow-lg overflow-hidden text-[#0D1B3E] text-[12px] leading-[1.6] font-sans select-text'

  return (
    <div className={wrapper}>

      {/* ── Document header ── */}
      <div className={`${headerBg} px-6 py-4`}>
        <div className="flex items-start justify-between gap-4">
          {/* Left: type */}
          <div>
            <p className="text-white/60 text-[9px] uppercase tracking-[0.2em] mb-1">
              {typeInfo.subtitle}
            </p>
            <h1 className="text-white text-[15px] font-extrabold tracking-wide leading-tight">
              {typeInfo.title}
            </h1>
          </div>
          {/* Right: number + dates */}
          <div className="text-right flex-shrink-0">
            <p className="text-white font-mono font-bold text-[15px] tracking-wider">
              {invoiceNumber ?? '—'}
            </p>
            <p className="text-white/70 text-[10px] mt-0.5">
              {fmtDate(issueDate)}{dueDate ? ` · scad. ${fmtDate(dueDate)}` : ''} · {currency}
            </p>
          </div>
        </div>
      </div>

      {/* ── Storno reference banner ── */}
      {originalInvoiceNumber && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-2.5 flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" className="text-red-500 flex-shrink-0"><path d="M9 14l-4-4 4-4M5 10h11a4 4 0 010 8h-1" stroke="currentColor"/></svg>
          <p className="text-[11px] text-red-700">
            <span className="font-semibold">Notă de credit</span>{' '}
            emisă pentru factura{' '}
            <span className="font-mono font-bold">{originalInvoiceNumber}</span>
          </p>
        </div>
      )}

      <div className="px-6 py-5 space-y-5">

        {/* ── Furnizor / Beneficiar ── */}
        <div className="grid grid-cols-2 divide-x divide-[#E2EAF4] border border-[#E2EAF4] rounded-lg overflow-hidden">
          {/* Furnizor */}
          <div className="px-4 py-3.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-taxly-600 mb-2">Furnizor</p>
            <p className="font-bold text-[13px] text-[#0D1B3E] leading-tight mb-1.5">{supplierName}</p>
            <InfoLine label="Adresă" value={supplier?.address} />
            <InfoLine label="CUI"    value={supplier?.cui} />
            <InfoLine label="Reg. Com." value={supplier?.regCom} />
            <InfoLine label="IBAN"   value={supplier?.iban} mono />
            <InfoLine label="Bancă"  value={supplier?.bank} />
          </div>
          {/* Client / Beneficiar */}
          <div className="px-4 py-3.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#8FA3C0] mb-2">Beneficiar / Client</p>
            {client ? (
              <>
                <p className="font-bold text-[13px] text-[#0D1B3E] leading-tight mb-1.5">{client.name}</p>
                <InfoLine label="Adresă" value={client.address} />
                <InfoLine label="CUI"    value={client.cui} />
                <InfoLine label="CNP"    value={client.cnp} />
                <InfoLine label="Email"  value={client.email} />
              </>
            ) : (
              <p className="text-[#8FA3C0] italic text-[11px] mt-1">— Niciun client selectat —</p>
            )}
          </div>
        </div>

        {/* ── Produse / Servicii ── */}
        {lines.length > 0 && lines.some(l => l.title) && (
          <div>
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-[#F4F6FB] border-y border-[#E2EAF4]">
                  <th className="py-2 px-2 text-left font-semibold text-[#5A6A8A] w-7">#</th>
                  <th className="py-2 px-2 text-left font-semibold text-[#5A6A8A]">Denumire produs / serviciu</th>
                  <th className="py-2 px-2 text-center font-semibold text-[#5A6A8A] w-10">U.M.</th>
                  <th className="py-2 px-2 text-right font-semibold text-[#5A6A8A] w-14">Cant.</th>
                  <th className="py-2 px-2 text-right font-semibold text-[#5A6A8A] w-20">Preț unit. fără TVA</th>
                  <th className="py-2 px-2 text-right font-semibold text-[#5A6A8A] w-12">Disc.</th>
                  <th className="py-2 px-2 text-right font-semibold text-[#5A6A8A] w-14">Cotă TVA</th>
                  <th className="py-2 px-2 text-right font-semibold text-[#5A6A8A] w-22">Val. fără TVA</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => {
                  const c = calcs[i]
                  const isNeg = line.unitPrice < 0 || c.netHT < 0
                  const rowColor = isNeg ? 'text-red-600' : 'text-[#0D1B3E]'
                  return (
                    <tr key={i} className="border-b border-[#F4F6FB] last:border-0 hover:bg-[#FAFBFD]">
                      <td className="py-2 px-2 text-[#8FA3C0] text-center">{i + 1}</td>
                      <td className="py-2 px-2">
                        {line.reference && (
                          <p className="text-[9px] text-[#8FA3C0] font-mono mb-0.5 uppercase tracking-wide">{line.reference}</p>
                        )}
                        <p className={`font-medium ${isStorno || isNeg ? 'text-red-700' : 'text-[#0D1B3E]'}`}>
                          {line.title || <span className="text-[#8FA3C0] italic">—</span>}
                        </p>
                        {line.description && (
                          <p className="text-[10px] text-[#8FA3C0] mt-0.5 leading-tight">{line.description}</p>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center text-[#5A6A8A]">{line.unit || '—'}</td>
                      <td className={`py-2 px-2 text-right font-mono ${rowColor}`}>{line.quantity}</td>
                      <td className={`py-2 px-2 text-right font-mono ${rowColor}`}>{fmt(line.unitPrice)}</td>
                      <td className="py-2 px-2 text-right">
                        {line.remise > 0
                          ? <span className="text-red-500 font-medium">{line.remise}%</span>
                          : <span className="text-[#C8D5E8]">—</span>}
                      </td>
                      <td className="py-2 px-2 text-right text-[#5A6A8A]">{line.vatRate}%</td>
                      <td className={`py-2 px-2 text-right font-mono font-semibold ${isNeg ? 'text-red-600' : 'text-[#0D1B3E]'}`}>
                        {fmt(c.netHT)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Totals ── */}
        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-1">
            {/* Subtotal */}
            <TotalRow label="Valoare totală fără TVA" value={`${fmt(totalHTBrut)} ${currency}`} />

            {/* Discounts */}
            {hasRemise && (
              <>
                {totalRemiseLinii > 0 && (
                  <TotalRow
                    label="Reduceri comerciale (pe linii)"
                    value={`−${fmt(totalRemiseLinii)} ${currency}`}
                    accent="red"
                  />
                )}
                {remiseGenerala > 0 && (
                  <TotalRow
                    label={`Reducere comercială globală (${remiseGenerala}%)`}
                    value={`−${fmt(remiseGeneralaAmount)} ${currency}`}
                    accent="red"
                  />
                )}
                <TotalRow
                  label="Bază impozabilă netă"
                  value={`${fmt(totalHTNet)} ${currency}`}
                  semi
                />
              </>
            )}

            {/* TVA by rate */}
            {Object.entries(tvaByRate)
              .filter(([, v]) => Math.abs(v.tva) > 0.001)
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([rate, { base, tva }]) => (
                <TotalRow
                  key={rate}
                  label={`TVA ${rate}% (bază ${fmt(base)} ${currency})`}
                  value={`${fmt(tva)} ${currency}`}
                />
              ))}

            {/* Total TVA */}
            <div className="border-t border-[#E2EAF4] pt-1">
              <TotalRow label="Total TVA" value={`${fmt(totalTVA)} ${currency}`} semi />
            </div>

            {/* Grand total */}
            <div className={`mt-1 border-t-2 ${isStorno ? 'border-red-400' : 'border-taxly-700'} pt-2`}>
              <div className="flex justify-between items-baseline gap-4">
                <span className={`text-[12px] font-bold ${isStorno ? 'text-red-700' : 'text-[#0D1B3E]'}`}>
                  TOTAL DE PLATĂ (cu TVA)
                </span>
                <span className={`text-[15px] font-extrabold font-mono ${isStorno ? 'text-red-700' : 'text-[#0D1B3E]'}`}>
                  {fmt(totalTTC)} {currency}
                </span>
              </div>
            </div>

            {/* Aconturi / advances */}
            {acomptes.length > 0 && (
              <>
                <div className="border-t border-[#E2EAF4] pt-1 mt-1">
                  <p className="text-[9px] uppercase tracking-wider text-[#8FA3C0] font-bold mb-1">Aconturi deduse</p>
                  {acomptes.map(a => (
                    <TotalRow
                      key={a.id}
                      label={a.description || 'Avans primit'}
                      value={`−${fmt(a.amount)} ${currency}`}
                      accent="emerald"
                    />
                  ))}
                </div>
                <div className="border-t-2 border-taxly-200 pt-2">
                  <div className="flex justify-between items-baseline gap-4">
                    <span className="text-[12px] font-bold text-taxly-700">REST DE ACHITAT</span>
                    <span className="text-[15px] font-extrabold font-mono text-taxly-700">
                      {fmt(restaPlata)} {currency}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Mențiuni ── */}
        {mentiuni && (
          <div className="border-t border-[#E2EAF4] pt-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#8FA3C0] mb-1.5">Mențiuni</p>
            <p className="text-[11px] text-[#5A6A8A] whitespace-pre-wrap leading-relaxed">{mentiuni}</p>
          </div>
        )}

        {/* ── Legal mentions ── */}
        <div className="border-t border-[#E2EAF4] pt-3 bg-[#FAFBFD] rounded-lg px-4 py-3">
          <p className="text-[10px] text-[#8FA3C0] leading-relaxed">
            {type === 'factura' || type === 'avans'
              ? 'Prezenta factură este documentul fiscal emis în conformitate cu art. 319 din Legea nr. 227/2015 privind Codul fiscal, cu modificările și completările ulterioare.'
              : type === 'storno'
              ? 'Prezenta notă de credit (factură storno) este emisă în conformitate cu art. 330 din Legea nr. 227/2015 privind Codul fiscal. Documentul reduce/anulează obligațiile fiscale ale facturii de referință.'
              : type === 'proforma'
              ? 'Factura proformă nu reprezintă un document fiscal și nu generează obligații de TVA. Este valabilă ca ofertă comercială până la emiterea facturii fiscale.'
              : type === 'deviz'
              ? 'Prezentul deviz este o estimare a costurilor și nu generează obligații fiscale. Prețurile sunt orientative și pot fi modificate la emiterea facturii fiscale.'
              : null}
          </p>
        </div>

        {/* ── Signature area ── */}
        <div className="border-t border-[#E2EAF4] pt-4 grid grid-cols-2 gap-8">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#8FA3C0] mb-5">
              Furnizor — semnătură și ștampilă
            </p>
            <div className="border-b border-dashed border-[#C8D5E8] h-10" />
            <p className="text-[10px] text-[#8FA3C0] mt-1.5">{supplierName}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#8FA3C0] mb-5">
              Beneficiar — confirmare primire
            </p>
            <div className="border-b border-dashed border-[#C8D5E8] h-10" />
            <p className="text-[10px] text-[#8FA3C0] mt-1.5">{client?.name ?? '—'}</p>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-[#F4F6FB] pt-3 flex items-center justify-between">
          <p className="text-[9px] text-[#C8D5E8] uppercase tracking-widest">Document generat cu Taxly</p>
          <p className="text-[9px] text-[#C8D5E8]">taxly.ro</p>
        </div>

      </div>
    </div>
  )
}

function InfoLine({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  if (!value) return null
  return (
    <p className="text-[11px] text-[#5A6A8A] leading-snug">
      <span className="text-[#8FA3C0]">{label}: </span>
      <span className={mono ? 'font-mono' : 'font-medium'}>{value}</span>
    </p>
  )
}

function TotalRow({
  label, value, semi, accent,
}: {
  label: string
  value: string
  semi?: boolean
  accent?: 'red' | 'emerald'
}) {
  const labelColor = semi ? 'text-[#0D1B3E] font-medium' : 'text-[#5A6A8A]'
  const valueColor =
    accent === 'red'     ? 'text-red-600' :
    accent === 'emerald' ? 'text-emerald-600' :
    semi                 ? 'text-[#0D1B3E] font-medium' :
                           'text-[#5A6A8A]'
  return (
    <div className="flex justify-between items-baseline gap-4">
      <span className={`text-[11px] ${labelColor} leading-tight`}>{label}</span>
      <span className={`text-[11px] font-mono ${valueColor} flex-shrink-0`}>{value}</span>
    </div>
  )
}
