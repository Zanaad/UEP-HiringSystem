import { api } from './api'

export const jobsService = {
  list: () => api.get('/jobs'),
}
