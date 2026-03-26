import { z } from 'zod'

export const CurrencySchema = z.enum(['RON', 'EUR', 'USD'])
export const InvoiceTypeSchema = z.enum(['factura', 'deviz', 'proforma', 'avans', 'storno'])

export const InvoiceLineSchema = z.object({
  description: z.string().min(1, 'Descrierea este obligatorie'),
  quantity: z.number().positive('Cantitatea trebuie să fie pozitivă'),
  unitPrice: z.number().nonnegative('Prețul unitar nu poate fi negativ'),
  vatRate: z.number().min(0).max(100),
  unit: z.string().default('buc'),
})

export const AcompteSchema = z.object({
  description: z.string().default(''),
  date: z.string().datetime(),
  amount: z.number().nonnegative(),
})

export const CreateInvoiceSchema = z.object({
  type: InvoiceTypeSchema,
  status: z.enum(['draft', 'emisa']).default('draft'),
  issueDate: z.string().datetime(),
  dueDate: z.string().datetime().optional(),
  clientId: z.string().min(1, 'Clientul este obligatoriu'),
  lines: z.array(InvoiceLineSchema).min(1, 'Factura trebuie să aibă cel puțin o linie'),
  currency: CurrencySchema.default('RON'),
  notes: z.string().max(500).optional(),
  internalNote: z.string().max(1000).optional(),
  remiseGenerala: z.number().min(0).max(100).default(0),
  acomptes: z.array(AcompteSchema).default([]),
})

export const PaymentSchema = z.object({
  date: z.string().datetime(),
  method: z.enum(['numerar', 'transfer', 'card', 'cec', 'altele']),
  notes: z.string().max(500).optional(),
  amountPaid: z.number().nonnegative(),
})

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>
export type PaymentInput = z.infer<typeof PaymentSchema>
