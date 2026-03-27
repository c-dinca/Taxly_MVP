'use client'

import { useState, useEffect } from 'react'
import { useAuthToken } from '@/hooks/useAuthToken'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

const MONTHS_RO = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const formatRON = (amount: number) =>
  new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON', maximumFractionDigits: 0 }).format(amount)

interface FiscalData {
  year: number
  venitBrut: number
  cheltuieliDeductibile: number
  venitNet: number
  cas: number
  cass: number
  impozit: number
  totalTaxe: number
  restInBuzunar: number
  efectivRate: number
  constants: {
    casRate: number
    cassRate: number
    impozitRate: number
    casCap: number
    cassCap: number
    salariuMinimLunar: number
  }
  monthly: { month: number; venit: number; count: number }[]
  invoiceCount: number
}

export function FiscalCalculator() {
  const token = useAuthToken()
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [cheltuieli, setCheltuieli] = useState(0)
  const [data, setData] = useState<FiscalData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetch(
      `${API_URL}/api/fiscal/calculator?year=${selectedYear}&cheltuieli=${cheltuieli}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      }
    )
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<FiscalData>
      })
      .then(setData)
      .catch(err => {
        if ((err as { name?: string }).name !== 'AbortError') {
          setError('Nu s-au putut încărca datele fiscale.')
        }
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [token, selectedYear, cheltuieli])

  const chartData = data?.monthly.map(m => ({
    name: MONTHS_RO[m.month - 1],
    venit: m.venit,
  })) ?? []

  return (
    <div className="px-8 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-[#0D1B3E] flex items-center gap-2">
          <span className="inline-block w-1 h-5 rounded-full bg-accent-500" />
          Calculator Fiscal {selectedYear}
        </h1>
        <p className="mt-1 text-sm text-[#5A6A8A] pl-3">
          Estimare CAS, CASS și impozit pe venit — PFA / micro-SRL 2025
        </p>
      </div>

      {/* Year selector */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm font-medium text-[#5A6A8A] mr-1">An fiscal:</span>
        {[2023, 2024, 2025].map(yr => (
          <button
            key={yr}
            onClick={() => setSelectedYear(yr)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              selectedYear === yr
                ? 'bg-taxly-700 text-white shadow-sm'
                : 'bg-white border border-[#E2EAF4] text-[#5A6A8A] hover:border-taxly-300 hover:text-taxly-700'
            }`}
          >
            {yr}
          </button>
        ))}
      </div>

      {/* Cheltuieli input */}
      <div className="rounded-xl border border-[#E2EAF4] bg-white p-5 shadow-sm mb-6">
        <label className="block text-sm font-semibold text-[#0D1B3E] mb-2">
          Cheltuieli deductibile (RON)
        </label>
        <p className="text-xs text-[#8FA3C0] mb-3">
          Introduceți cheltuielile deductibile pentru a calcula venitul net corect.
        </p>
        <input
          type="number"
          min={0}
          step={100}
          value={cheltuieli || ''}
          onChange={e => setCheltuieli(Math.max(0, parseFloat(e.target.value) || 0))}
          placeholder="0"
          className="w-full max-w-xs rounded-lg border border-[#E2EAF4] px-4 py-2.5 text-sm text-[#0D1B3E] focus:outline-none focus:ring-2 focus:ring-taxly-700/30 focus:border-taxly-700 transition"
        />
      </div>

      {loading && (
        <div className="text-center py-12 text-[#8FA3C0] text-sm">Se calculează...</div>
      )}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {data && !loading && (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="rounded-xl border border-[#E2EAF4] bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-[#5A6A8A] mb-2">Venit brut</p>
              <p className={`text-2xl font-bold ${data.venitBrut > 0 ? 'text-emerald-600' : 'text-[#0D1B3E]'}`}>
                {formatRON(data.venitBrut)}
              </p>
              <p className="text-xs text-[#8FA3C0] mt-1">{data.invoiceCount} facturi</p>
            </div>
            <div className="rounded-xl border border-[#E2EAF4] bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-[#5A6A8A] mb-2">Total taxe</p>
              <p className="text-2xl font-bold text-orange-500">{formatRON(data.totalTaxe)}</p>
              <p className="text-xs text-[#8FA3C0] mt-1">CAS + CASS + impozit</p>
            </div>
            <div className="rounded-xl border border-[#E2EAF4] bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-[#5A6A8A] mb-2">Rată efectivă</p>
              <p className="text-2xl font-bold text-[#0D1B3E]">{data.efectivRate}%</p>
              <p className="text-xs text-[#8FA3C0] mt-1">din venitul brut</p>
            </div>
            <div className="rounded-xl border border-[#E2EAF4] bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-[#5A6A8A] mb-2">Rest în buzunar</p>
              <p className="text-2xl font-bold text-taxly-700">{formatRON(data.restInBuzunar)}</p>
              <p className="text-xs text-[#8FA3C0] mt-1">venit net după taxe</p>
            </div>
          </div>

          {/* Tax breakdown */}
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <div className="rounded-xl border border-[#E2EAF4] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-[#0D1B3E]">CAS</p>
                <span className="text-xs font-medium bg-blue-50 text-blue-600 rounded-full px-2 py-0.5">25%</span>
              </div>
              <p className="text-xl font-bold text-[#0D1B3E]">{formatRON(data.cas)}</p>
              <p className="text-xs text-[#8FA3C0] mt-1.5">
                Pensie (plafon {formatRON(data.constants.casCap)})
              </p>
            </div>
            <div className="rounded-xl border border-[#E2EAF4] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-[#0D1B3E]">CASS</p>
                <span className="text-xs font-medium bg-purple-50 text-purple-600 rounded-full px-2 py-0.5">10%</span>
              </div>
              <p className="text-xl font-bold text-[#0D1B3E]">{formatRON(data.cass)}</p>
              <p className="text-xs text-[#8FA3C0] mt-1.5">
                Sănătate (plafon {formatRON(data.constants.cassCap)})
              </p>
            </div>
            <div className="rounded-xl border border-[#E2EAF4] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-[#0D1B3E]">Impozit pe venit</p>
                <span className="text-xs font-medium bg-orange-50 text-orange-600 rounded-full px-2 py-0.5">10%</span>
              </div>
              <p className="text-xl font-bold text-[#0D1B3E]">{formatRON(data.impozit)}</p>
              <p className="text-xs text-[#8FA3C0] mt-1.5">Pe venitul net după CAS și CASS</p>
            </div>
          </div>

          {/* Monthly chart */}
          <div className="rounded-xl border border-[#E2EAF4] bg-white p-5 shadow-sm mb-6">
            <p className="text-sm font-semibold text-[#0D1B3E] mb-4">Venituri lunare (RON)</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2EAF4" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#8FA3C0' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#8FA3C0' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                  width={36}
                />
                <Tooltip
                  formatter={(value) => [formatRON(Number(value ?? 0)), 'Venit']}
                  contentStyle={{
                    fontSize: 12,
                    border: '1px solid #E2EAF4',
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                  cursor={{ fill: '#F4F6FB' }}
                />
                <Bar dataKey="venit" fill="#004AAD" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Info box */}
          <div className="rounded-xl bg-[#F4F6FB] border border-[#E2EAF4] px-5 py-4 flex items-start gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8FA3C0] shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" stroke="currentColor"/>
              <path d="M12 16v-4M12 8h.01" stroke="currentColor"/>
            </svg>
            <p className="text-xs text-[#5A6A8A]">
              Valorile sunt estimate pe baza facturilor din sistem. Consultați un contabil pentru declarații oficiale.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
