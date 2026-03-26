import { z } from 'zod'

export const RegisterSchema = z.object({
  email: z.string().email('Email invalid'),
  password: z
    .string()
    .min(8, 'Parola trebuie să aibă minim 8 caractere')
    .regex(/[A-Z]/, 'Parola trebuie să conțină cel puțin o literă mare')
    .regex(/[0-9]/, 'Parola trebuie să conțină cel puțin o cifră'),
  name: z.string().min(2, 'Numele trebuie să aibă minim 2 caractere'),
})

export const LoginSchema = z.object({
  email: z.string().email('Email invalid'),
  password: z.string().min(1, 'Parola este obligatorie'),
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
