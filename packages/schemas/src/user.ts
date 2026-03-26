import { z } from 'zod'

export const EntityTypeSchema = z.enum(['PFA', 'II', 'SRL'])
export const FiscalRegimeSchema = z.enum(['real', 'norma_venit'])
export const VatStatusSchema = z.enum(['neplatitor', 'platitor', 'platitor_special'])

export const UserProfileSchema = z.object({
  name: z.string().min(2, 'Numele trebuie să aibă minim 2 caractere'),
  entityType: EntityTypeSchema,
  fiscalRegime: FiscalRegimeSchema,
  cui: z.string().min(2, 'CUI invalid').max(12, 'CUI invalid'),
  cnp: z.string().length(13, 'CNP invalid').optional(),
  caenCode: z.string().min(4, 'Codul CAEN trebuie să aibă 4 cifre').max(4),
  vatStatus: VatStatusSchema,
  county: z.string().min(2, 'Județul este obligatoriu'),
  address: z.string().min(5, 'Adresa este obligatorie'),
  tradeRegisterNumber: z.string().optional(),
})

export type UserProfileInput = z.infer<typeof UserProfileSchema>
