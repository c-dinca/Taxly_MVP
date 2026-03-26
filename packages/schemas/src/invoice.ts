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

export const CreateInvoiceSchema = z.object({
  type: InvoiceTypeSchema,
  issueDate: z.string().datetime(),
  dueDate: z.string().datetime().optional(),
  clientId: z.string().min(1, 'Clientul este obligatoriu'),
  lines: z.array(InvoiceLineSchema).min(1, 'Factura trebuie să aibă cel puțin o linie'),
  currency: CurrencySchema.default('RON'),
  notes: z.string().max(500).optional(),
})

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>
