import { api } from './api'

export const applicationsService = {
  list: () => api.get('/applications'),
}
