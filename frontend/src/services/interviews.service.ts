import { api } from './api'

export const interviewsService = {
  list: () => api.get('/mock-interviews'),
}
