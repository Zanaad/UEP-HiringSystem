import { api } from './api'
import type { AuthUser } from './auth.service'

export const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'] as const

export interface Company {
  name: string
  website: string | null
  industry: string | null
  size: (typeof COMPANY_SIZES)[number] | null
  location: string | null
}

export const accountService = {
  updateName: (name: string) => api.patch<AuthUser>('/me/account', { name }).then((res) => res.data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/me/password', { current_password: currentPassword, new_password: newPassword }),
  getCompany: () => api.get<Company>('/me/company').then((res) => res.data),
  updateCompany: (company: Company) => api.put<Company>('/me/company', company).then((res) => res.data),
}
