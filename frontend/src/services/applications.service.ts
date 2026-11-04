import { api, downloadFile } from './api'
import type { CandidateProfile } from './profile.service'
import type { EducationLevel, EmploymentType, JobStatus } from './jobs.service'

export type Stage = 'applied' | 'screening' | 'interview' | 'technical' | 'offer' | 'hired' | 'rejected'
export type Verdict = 'strong' | 'good' | 'fair' | 'weak'

export const STAGES: Record<Stage, { label: string; badge: string; dot: string }> = {
  applied: { label: 'Applied', badge: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
  screening: { label: 'Screening', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400' },
  interview: { label: 'Interview', badge: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  technical: { label: 'Technical', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' },
  offer: { label: 'Offer', badge: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  hired: { label: 'Hired', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  rejected: { label: 'Rejected', badge: 'bg-red-100 text-red-700', dot: 'bg-red-400' },
}

export const PIPELINE_STAGES = Object.keys(STAGES) as Stage[]
export const PROGRESS_STAGES: Stage[] = PIPELINE_STAGES.filter((stage) => stage !== 'rejected')

export interface AtsResult {
  overall: number
  verdict: Verdict
  skills_score: number
  experience_score: number
  education_score: number
  location_score: number
  matched: string[]
  missing: string[]
}

export interface StageEvent {
  from_stage: Stage | null
  to_stage: Stage
  actor_name?: string | null
  created_at: string
}

export interface JobBrief {
  id: number
  title: string
  company_name: string
  department: string
  location: string
  employment_type: EmploymentType
  status: JobStatus
  required_skills: string[]
  min_experience_years: number
  education_level: EducationLevel
}

export interface MyApplication {
  id: number
  stage: Stage
  ats: AtsResult
  created_at: string
  updated_at: string
  job: JobBrief
  events: StageEvent[]
}

export interface ApplicationSummary {
  id: number
  stage: Stage
  ats: AtsResult
  created_at: string
  updated_at: string
  candidate: {
    id: number
    name: string
    email: string
    headline: string | null
    location: string | null
    experience_years: number
    skills: string[]
  }
}

export interface Note {
  id: number
  body: string
  author_name: string | null
  created_at: string
}

export interface ApplicationDetail {
  id: number
  stage: Stage
  ats: AtsResult
  cover_note: string | null
  created_at: string
  candidate_id: number
  candidate_name: string
  candidate_email: string
  profile: CandidateProfile
  job: JobBrief
  events: StageEvent[]
  notes: Note[]
}

export const applicationsService = {
  apply: (jobId: number, coverNote: string) =>
    api.post<MyApplication>('/applications', { job_id: jobId, cover_note: coverNote || null }).then((res) => res.data),
  mine: () => api.get<MyApplication[]>('/applications/mine').then((res) => res.data),
  listForJob: (jobId: number) =>
    api.get<ApplicationSummary[]>('/applications', { params: { job_id: jobId } }).then((res) => res.data),
  get: (id: number) => api.get<ApplicationDetail>(`/applications/${id}`).then((res) => res.data),
  updateStage: (id: number, stage: Stage) =>
    api.patch<ApplicationDetail>(`/applications/${id}/status`, { stage }).then((res) => res.data),
  addNote: (id: number, body: string) =>
    api.post<Note>(`/applications/${id}/notes`, { body }).then((res) => res.data),
  downloadResume: (id: number, filename: string) => downloadFile(`/applications/${id}/resume`, filename),
}
