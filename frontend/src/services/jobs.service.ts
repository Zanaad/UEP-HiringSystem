import { api } from './api'
import type { AtsResult } from './applications.service'

export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship'
export type EducationLevel = 'any' | 'high-school' | 'bachelor' | 'master' | 'phd'
export type JobStatus = 'draft' | 'active' | 'closed'

export interface Job {
  id: number
  company_name: string
  title: string
  department: string
  location: string
  employment_type: EmploymentType
  salary_range: string | null
  description: string
  required_skills: string[]
  min_experience_years: number
  education_level: EducationLevel
  status: JobStatus
  created_at: string
  updated_at: string
  applicant_count: number
}

export interface JobSearchItem extends Job {
  match: AtsResult | null
  applied: boolean
}

export type JobPayload = Omit<Job, 'id' | 'company_name' | 'status' | 'created_at' | 'updated_at' | 'applicant_count'> & {
  status?: JobStatus
}

export interface JobPage {
  items: JobSearchItem[]
  total: number
  page: number
  page_size: number
}

export interface JobSearchParams {
  q?: string
  employment_type?: EmploymentType
  page: number
  page_size: number
}

export const EMPLOYMENT_TYPES: Record<EmploymentType, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
}

export const EDUCATION_LEVELS: Record<EducationLevel, string> = {
  any: 'Any education',
  'high-school': 'High school',
  bachelor: "Bachelor's degree",
  master: "Master's degree",
  phd: 'PhD',
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export const jobsService = {
  search: (params: JobSearchParams) => api.get<JobPage>('/jobs', { params }).then((res) => res.data),
  listMine: () => api.get<Job[]>('/recruiter/jobs').then((res) => res.data),
  create: (payload: JobPayload) => api.post<Job>('/jobs', payload).then((res) => res.data),
  update: (id: number, payload: Partial<JobPayload>) => api.patch<Job>(`/jobs/${id}`, payload).then((res) => res.data),
}
