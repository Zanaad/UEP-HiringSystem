import { api, downloadFile } from './api'
import type { EducationLevel } from './jobs.service'

export type CandidateEducation = Exclude<EducationLevel, 'any'>

export interface CandidateProfile {
  headline: string | null
  phone: string | null
  location: string | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  skills: string[]
  experience_years: number
  education_level: CandidateEducation | null
  resume_filename: string | null
}

export type ProfilePayload = Omit<CandidateProfile, 'resume_filename'>

export const profileService = {
  get: () => api.get<CandidateProfile>('/me/profile').then((res) => res.data),
  update: (payload: ProfilePayload) => api.put<CandidateProfile>('/me/profile', payload).then((res) => res.data),
  uploadResume: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.put<CandidateProfile>('/me/resume', form).then((res) => res.data)
  },
  downloadResume: (filename: string) => downloadFile('/me/resume', filename),
}
