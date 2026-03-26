import { z } from 'zod'

export const CreateClientSchema = z.object({
  name: z.string().min(2, 'Numele clientului este obligatoriu'),
  cui: z.string().optional(),
  cnp: z.string().length(13).optional(),
  address: z.string().min(5, 'Adresa este obligatorie'),
  county: z.string().optional(),
  country: z.string().default('RO'),
  email: z.string().email('Email invalid').optional().or(z.literal('')),
  phone: z.string().optional(),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
})

export type CreateClientInput = z.infer<typeof CreateClientSchema>
