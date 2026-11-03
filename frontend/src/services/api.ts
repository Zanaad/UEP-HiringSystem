import axios, { isAxiosError } from 'axios'
import { useAuthStore } from '../stores/auth.store'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8001',
})

api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(undefined, (error) => {
  // Expired or invalid token: dropping the session makes RoleGuard redirect to login.
  if (isAxiosError(error) && error.response?.status === 401 && error.config?.headers.Authorization) {
    useAuthStore.getState().logout()
  }
  return Promise.reject(error)
})

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback
  const detail = error.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && typeof detail[0]?.msg === 'string') {
    return detail[0].msg.replace(/^Value error, /, '')
  }
  return fallback
}
