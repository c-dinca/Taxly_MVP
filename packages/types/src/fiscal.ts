export interface FiscalRules {
  _id: string
  effectiveFrom: string
  effectiveTo?: string
  minWage: number
  casRate: number
  cassRate: number
  incomeTaxRate: number
  vatThreshold: number
  microThresholdEur: number
  cassThresholds: CassThreshold[]
}

export interface CassThreshold {
  minSalaries: number
  maxSalaries: number | null
  baseSalaries: number
}

export interface TaxCalculation {
  grossIncome: number
  cas: number
  cass: number
  incomeTax: number
  netIncome: number
  year: number
  quarter?: number
}

export interface TaxCalculationResult {
  grossIncome: number
  casBase: number
  cas: number
  cassBase: number
  cass: number
  taxableIncome: number
  incomeTax: number
  totalTaxes: number
  netIncome: number
  effectiveRate: number
}
