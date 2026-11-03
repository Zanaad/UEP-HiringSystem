import { z } from 'zod'

const email = z.string().trim().pipe(z.email('Please enter a valid email address.'))

export const loginSchema = z.object({
  email,
  password: z.string().min(8, 'Password must be at least 8 characters.').max(128),
})

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .regex(/^[A-Za-z][A-Za-z\s'-]{1,79}$/, 'Name must be 2-80 characters: letters, spaces, apostrophes or hyphens.'),
    email,
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .max(128, 'Password must be at most 128 characters.')
      .regex(/[a-z]/, 'Password must include a lowercase letter.')
      .regex(/[A-Z]/, 'Password must include an uppercase letter.')
      .regex(/[0-9]/, 'Password must include a number.')
      .regex(/[^A-Za-z0-9]/, 'Password must include a special character.'),
    role: z.enum(['recruiter', 'candidate']),
    company_name: z.string().trim().max(120, 'Company name must be at most 120 characters.'),
  })
  .refine((values) => values.role === 'candidate' || values.company_name.length >= 2, {
    path: ['company_name'],
    message: 'Company name is required.',
  })
