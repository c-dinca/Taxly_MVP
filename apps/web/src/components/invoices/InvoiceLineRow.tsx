'use client'

import type { CatalogItem } from '@taxly/types'

const VAT_OPTIONS = [0, 5, 9, 19]
const UNIT_OPTIONS = ['buc', 'oră', 'zi', 'lună', 'km', 'kg', 'l', 'm²', 'm³']

interface LineData {
  description: string
  quantity: number
  unitPrice: number
  vatRate: number
  unit: string
}

interface InvoiceLineRowProps {
  line: LineData
  onChange: (line: LineData) => void
  onRemove: () => void
  catalogItems: CatalogItem[]
}

export function InvoiceLineRow({ line, onChange, onRemove, catalogItems }: InvoiceLineRowProps) {
  const subtotal = line.quantity * line.unitPrice
  const vatAmount = subtotal * (line.vatRate / 100)
  const total = subtotal + vatAmount

  function set<K extends keyof LineData>(field: K, value: LineData[K]) {
    onChange({ ...line, [field]: value })
  }

  function handleDescriptionChange(value: string) {
    const match = catalogItems.find(
      item => item.name.toLowerCase() === value.toLowerCase(),
    )
    if (match) {
      onChange({
        ...line,
        description: match.name,
        unitPrice: match.defaultPrice,
        vatRate: match.defaultVatRate,
        unit: match.unit,
      })
    } else {
      set('description', value)
    }
  }

  return (
    <div className="grid grid-cols-12 gap-3 items-start py-3 border-b border-[#F4F6FB] last:border-0">
      {/* Description (with datalist autocomplete) */}
      <div className="col-span-4">
        <input
          list="catalog-items"
          value={line.description}
          onChange={e => handleDescriptionChange(e.target.value)}
          placeholder="Descriere serviciu / produs"
          className="w-full rounded-lg border border-[#E2EAF4] px-3 py-2 text-sm text-[#0D1B3E] focus:outline-none focus:ring-2 focus:ring-taxly-700"
        />
        <datalist id="catalog-items">
          {catalogItems.map(item => (
            <option key={item._id} value={item.name} />
          ))}
        </datalist>
      </div>

      {/* Quantity */}
      <div className="col-span-1">
        <input
          type="number"
          min={0}
          step="any"
          value={line.quantity}
          onChange={e => set('quantity', parseFloat(e.target.value) || 0)}
          className="w-full rounded-lg border border-[#E2EAF4] px-3 py-2 text-sm text-[#0D1B3E] focus:outline-none focus:ring-2 focus:ring-taxly-700"
        />
      </div>

      {/* Unit */}
      <div className="col-span-1">
        <select
          value={line.unit}
          onChange={e => set('unit', e.target.value)}
          className="w-full rounded-lg border border-[#E2EAF4] px-2 py-2 text-sm text-[#0D1B3E] focus:outline-none focus:ring-2 focus:ring-taxly-700 bg-white"
        >
          {UNIT_OPTIONS.map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>

      {/* Unit price */}
      <div className="col-span-2">
        <input
          type="number"
          min={0}
          step="any"
          value={line.unitPrice}
          onChange={e => set('unitPrice', parseFloat(e.target.value) || 0)}
          className="w-full rounded-lg border border-[#E2EAF4] px-3 py-2 text-sm text-[#0D1B3E] focus:outline-none focus:ring-2 focus:ring-taxly-700"
        />
      </div>

      {/* VAT rate */}
      <div className="col-span-1">
        <select
          value={line.vatRate}
          onChange={e => set('vatRate', parseInt(e.target.value))}
          className="w-full rounded-lg border border-[#E2EAF4] px-2 py-2 text-sm text-[#0D1B3E] focus:outline-none focus:ring-2 focus:ring-taxly-700 bg-white"
        >
          {VAT_OPTIONS.map(v => (
            <option key={v} value={v}>{v}%</option>
          ))}
        </select>
      </div>

      {/* Computed totals */}
      <div className="col-span-2 text-right space-y-0.5">
        <p className="text-xs text-[#8FA3C0]">{subtotal.toFixed(2)}</p>
        <p className="text-xs text-[#8FA3C0]">TVA: {vatAmount.toFixed(2)}</p>
        <p className="text-sm font-semibold text-[#0D1B3E]">{total.toFixed(2)}</p>
      </div>

      {/* Remove */}
      <div className="col-span-1 flex items-center justify-center pt-1">
        <button
          type="button"
          onClick={onRemove}
          className="text-[#8FA3C0] hover:text-red-500 transition-colors"
          title="Șterge linie"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6" stroke="currentColor"/>
            <path d="M19 6l-1 14H6L5 6" stroke="currentColor"/>
            <path d="M10 11v6M14 11v6" stroke="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
