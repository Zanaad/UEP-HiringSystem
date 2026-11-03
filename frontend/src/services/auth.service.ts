import { api } from './api'

export type UserRole = 'recruiter' | 'candidate'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: UserRole
}

export interface AuthResponse {
  access_token: string
  token_type: 'bearer'
  user: AuthUser
}

interface LoginPayload {
  email: string
  password: string
}

interface RegisterPayload extends LoginPayload {
  name: string
  role: UserRole
}

export const authService = {
  login: (payload: LoginPayload) => api.post<AuthResponse>('/auth/login', payload).then((res) => res.data),
  register: (payload: RegisterPayload) => api.post<AuthResponse>('/auth/register', payload).then((res) => res.data),
}
