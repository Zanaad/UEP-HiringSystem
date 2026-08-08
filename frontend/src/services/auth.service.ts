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

const AUTH_TOKEN_KEY = 'access_token'
const AUTH_USER_KEY = 'auth_user'

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
  saveSession: (session: AuthResponse) => {
    localStorage.setItem(AUTH_TOKEN_KEY, session.access_token)
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.user))
  },
  saveToken: (token: string) => localStorage.setItem(AUTH_TOKEN_KEY, token),
  getToken: () => localStorage.getItem(AUTH_TOKEN_KEY),
  getCurrentUser: (): AuthUser | null => {
    const rawUser = localStorage.getItem(AUTH_USER_KEY)
    if (!rawUser) {
      return null
    }

    try {
      return JSON.parse(rawUser) as AuthUser
    } catch {
      localStorage.removeItem(AUTH_USER_KEY)
      return null
    }
  },
  clearSession: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
  },
  clearToken: () => localStorage.removeItem(AUTH_TOKEN_KEY),
}
