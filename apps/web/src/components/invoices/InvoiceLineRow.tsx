'use client'

import type { CatalogItem } from '@taxly/types'

const VAT_OPTIONS = [0, 5, 9, 19]
const UNIT_OPTIONS = ['buc', 'oră', 'zi', 'lună', 'km', 'kg', 'l', 'm', 'm²', 'm³', 'set', 'serviciu', 'forfet']

export const CATEGORIES = [
  { value: '', label: '— Fără categorie —' },
  { value: '701', label: '701 – Produse finite' },
  { value: '702', label: '702 – Semifabricate' },
  { value: '703', label: '703 – Produse reziduale' },
  { value: '704', label: '704 – Servicii prestate' },
  { value: '705', label: '705 – Studii și cercetări' },
  { value: '706', label: '706 – Chirii și redevențe' },
  { value: '707', label: '707 – Mărfuri' },
  { value: '708', label: '708 – Activități diverse' },
]

export interface LineData {
  reference: string
  title: string
  description: string
  category: string
  quantity: number
  unit: string
  unitPrice: number
  vatRate: number
  remise: number
}

export function lineCalc(line: LineData) {
  const baseHT = line.quantity * line.unitPrice
  const remiseAmount = baseHT * (line.remise / 100)
  const netHT = baseHT - remiseAmount
  const tvaAmount = netHT * (line.vatRate / 100)
  return { baseHT, remiseAmount, netHT, tvaAmount, totalTTC: netHT + tvaAmount }
}

interface InvoiceLineRowProps {
  index: number
  line: LineData
  onChange: (line: LineData) => void
  onRemove: () => void
  catalogItems: CatalogItem[]
}

const inp = 'w-full rounded-lg border border-[#E2EAF4] px-2.5 py-1.5 text-sm text-[#0D1B3E] focus:outline-none focus:ring-2 focus:ring-taxly-700 bg-white'
const lbl = 'block text-[10px] font-semibold text-[#8FA3C0] uppercase tracking-wide mb-1'

export function InvoiceLineRow({ index, line, onChange, onRemove, catalogItems }: InvoiceLineRowProps) {
  const calc = lineCalc(line)

  function set<K extends keyof LineData>(field: K, value: LineData[K]) {
    onChange({ ...line, [field]: value })
  }

  function handleTitleChange(value: string) {
    const match = catalogItems.find(item => item.name.toLowerCase() === value.toLowerCase())
    if (match) {
      onChange({ ...line, title: match.name, unitPrice: match.defaultPrice, vatRate: match.defaultVatRate, unit: match.unit })
    } else {
      set('title', value)
    }
  }

  return (
    <div className="rounded-xl border border-[#E2EAF4] bg-white shadow-sm p-4 space-y-3 relative group">
      {/* Line badge + remove */}
      <div className="flex items-center justify-between mb-1">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-taxly-50 text-[10px] font-bold text-taxly-700">
          {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] text-[#8FA3C0] hover:text-red-500 transition-all"
          title="Șterge linie"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor"/>
          </svg>
          Șterge
        </button>
      </div>

      {/* Row 1: Reference, Title, Category */}
      <div className="grid grid-cols-12 gap-2.5">
        <div className="col-span-2">
          <label className={lbl}>Referință</label>
          <input
            value={line.reference}
            onChange={e => set('reference', e.target.value)}
            placeholder="REF-001"
            className={inp}
          />
        </div>
        <div className="col-span-6">
          <label className={lbl}>Denumire *</label>
          <input
            list={`catalog-items-${index}`}
            value={line.title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder="Produs sau serviciu"
            required
            className={inp}
          />
          <datalist id={`catalog-items-${index}`}>
            {catalogItems.map(item => <option key={item._id} value={item.name} />)}
          </datalist>
        </div>
        <div className="col-span-4">
          <label className={lbl}>Categorie (cont)</label>
          <select value={line.category} onChange={e => set('category', e.target.value)} className={inp}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {/* Row 2: Description */}
      <div>
        <label className={lbl}>Descriere detaliată <span className="normal-case font-normal text-[#8FA3C0]">(opțional)</span></label>
        <textarea
          value={line.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Specificații, detalii suplimentare..."
          rows={2}
          className={`${inp} resize-none`}
        />
      </div>

      {/* Row 3: Quantities, prices, computed */}
      <div className="grid grid-cols-12 gap-2.5 items-end">
        <div className="col-span-2">
          <label className={lbl}>Cantitate</label>
          <input
            type="number"
            min={0}
            step="any"
            value={line.quantity}
            onChange={e => set('quantity', parseFloat(e.target.value) || 0)}
            className={inp}
          />
        </div>
        <div className="col-span-2">
          <label className={lbl}>UM</label>
          <select value={line.unit} onChange={e => set('unit', e.target.value)} className={inp}>
            {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className={lbl}>Preț HT/UM</label>
          <input
            type="number"
            min={0}
            step="any"
            value={line.unitPrice}
            onChange={e => set('unitPrice', parseFloat(e.target.value) || 0)}
            className={inp}
          />
        </div>
        <div className="col-span-2">
          <label className={lbl}>TVA %</label>
          <select value={line.vatRate} onChange={e => set('vatRate', parseInt(e.target.value))} className={inp}>
            {VAT_OPTIONS.map(v => <option key={v} value={v}>{v}%</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className={lbl}>Remisă %</label>
          <input
            type="number"
            min={0}
            max={100}
            step="any"
            value={line.remise || ''}
            onChange={e => set('remise', parseFloat(e.target.value) || 0)}
            placeholder="0"
            className={inp}
          />
        </div>

        {/* Computed totals */}
        <div className="col-span-2 text-right">
          <p className="text-[10px] text-[#8FA3C0] uppercase tracking-wide">Net HT</p>
          <p className="text-sm font-semibold text-[#0D1B3E]">{calc.netHT.toFixed(2)}</p>
          <p className="text-[10px] text-[#8FA3C0]">TVA: {calc.tvaAmount.toFixed(2)}</p>
          <p className="text-xs font-bold text-taxly-700">{calc.totalTTC.toFixed(2)} TTC</p>
        </div>
      </div>
    </div>
  )
}
