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

interface RegisterPayload {
  name: string
  email: string
  password: string
  role: UserRole
}

export const authService = {
  login: (payload: LoginPayload) => api.post<AuthResponse>('/auth/login', payload),
  register: (payload: RegisterPayload) => api.post<AuthResponse>('/auth/register', payload),
  saveToken: (token: string) => localStorage.setItem('access_token', token),
  getToken: () => localStorage.getItem('access_token'),
  clearToken: () => localStorage.removeItem('access_token'),
}
