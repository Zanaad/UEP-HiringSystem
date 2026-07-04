import { api } from './api'

export const authService = {
  login: () => api.get('/health'),
}
