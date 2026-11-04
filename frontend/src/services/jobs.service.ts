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

// The API sends UTC timestamps without a zone suffix.
export const parseServerDate = (iso: string) => new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`)

export const formatDate = (iso: string) =>
  parseServerDate(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

export function timeAgo(iso: string) {
  const seconds = Math.round((parseServerDate(iso).getTime() - Date.now()) / 1000)
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit)
  }
  return 'just now'
}

export const jobsService = {
  search: (params: JobSearchParams) => api.get<JobPage>('/jobs', { params }).then((res) => res.data),
  listMine: () => api.get<Job[]>('/recruiter/jobs').then((res) => res.data),
  create: (payload: JobPayload) => api.post<Job>('/jobs', payload).then((res) => res.data),
  update: (id: number, payload: Partial<JobPayload>) => api.patch<Job>(`/jobs/${id}`, payload).then((res) => res.data),
}
