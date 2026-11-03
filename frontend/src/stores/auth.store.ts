import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthResponse, AuthUser, UserRole } from '../services/auth.service'

interface AuthState {
  token: string | null
  user: AuthUser | null
  setSession: (session: AuthResponse) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: ({ access_token, user }) => set({ token: access_token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'hireprep-auth' },
  ),
)

export const homePath = (role: UserRole) => (role === 'recruiter' ? '/recruiter' : '/candidate')
