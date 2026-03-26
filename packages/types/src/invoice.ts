export type InvoiceType = 'factura' | 'deviz' | 'proforma' | 'avans' | 'storno'
export type InvoiceStatus = 'draft' | 'emisa' | 'trimisa_anaf' | 'validata_anaf' | 'respinsa_anaf' | 'incasata' | 'anulata'
export type Currency = 'RON' | 'EUR' | 'USD'

export interface InvoiceLine {
  description: string
  quantity: number
  unitPrice: number
  vatRate: number
  unit: string
  total: number
  vatAmount: number
}

export interface InvoiceTotals {
  subtotal: number
  vatTotal: number
  total: number
  currency: Currency
  exchangeRate?: number
  totalRON: number
}

export interface EFacturaStatus {
  uploadId?: string
  indexIncarcare?: string
  status: 'neprocesata' | 'in_prelucrare' | 'ok' | 'nok' | 'eroare'
  downloadId?: string
  errorMessage?: string
  uploadedAt?: string
  validatedAt?: string
}

export interface Invoice {
  _id: string
  userId: string
  number: string
  series: string
  type: InvoiceType
  status: InvoiceStatus
  issueDate: string
  dueDate?: string
  client: InvoiceClient
  lines: InvoiceLine[]
  totals: InvoiceTotals
  notes?: string
  eFactura: EFacturaStatus
  pdfUrl?: string
  xmlContent?: string
  createdAt: string
  updatedAt: string
}

export interface InvoiceClient {
  name: string
  cui?: string
  cnp?: string
  address: string
  email?: string
  county?: string
  country: string
}

export interface CreateInvoiceDto {
  type: InvoiceType
  issueDate: string
  dueDate?: string
  clientId: string
  lines: Omit<InvoiceLine, 'total' | 'vatAmount'>[]
  currency: Currency
  notes?: string
}
