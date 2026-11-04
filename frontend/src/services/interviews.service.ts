import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { api, getApiErrorMessage } from './api'

export type Track = 'behavioral' | 'frontend' | 'product' | 'system-design'

export const TRACKS: Record<Track, { title: string; description: string; badge: string }> = {
  behavioral: {
    title: 'Behavioral Interview',
    description: 'Situational questions about communication, teamwork and ownership.',
    badge: 'bg-blue-100 text-blue-700',
  },
  frontend: {
    title: 'Technical Frontend',
    description: 'JavaScript, React, CSS and web performance.',
    badge: 'bg-indigo-100 text-indigo-700',
  },
  product: {
    title: 'Product Management',
    description: 'Product sense, prioritisation and metrics.',
    badge: 'bg-orange-100 text-orange-700',
  },
  'system-design': {
    title: 'System Design',
    description: 'Design scalable systems and talk through trade-offs.',
    badge: 'bg-emerald-100 text-emerald-700',
  },
}

export interface InterviewQuestion {
  id: number
  position: number
  category: string
  question: string
  tip: string
  answer: string | null
  score: number | null
  strengths: string[] | null
  improvements: string[] | null
  suggestion: string | null
  answered_at: string | null
}

interface SessionBase {
  id: number
  title: string
  track: Track | null
  job_id: number | null
  status: 'in_progress' | 'completed'
  overall_score: number | null
  ai_generated: boolean
  created_at: string
}

export interface InterviewSession extends SessionBase {
  ai_feedback_enabled: boolean
  completed_at: string | null
  questions: InterviewQuestion[]
}

export interface SessionSummary extends SessionBase {
  question_count: number
  answered_count: number
}

export type StartPayload = { track: Track; job_id?: never } | { job_id: number; track?: never }

export const interviewsService = {
  list: () => api.get<SessionSummary[]>('/mock-interviews').then((res) => res.data),
  get: (id: number) => api.get<InterviewSession>(`/mock-interviews/${id}`).then((res) => res.data),
  start: (payload: StartPayload & { num_questions?: number }) =>
    api.post<InterviewSession>('/mock-interviews', payload).then((res) => res.data),
  answer: (id: number, questionId: number, answer: string) =>
    api
      .post<InterviewQuestion>(`/mock-interviews/${id}/answers`, { question_id: questionId, answer })
      .then((res) => res.data),
  complete: (id: number) => api.post<InterviewSession>(`/mock-interviews/${id}/complete`).then((res) => res.data),
}

export function useStartInterview() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: interviewsService.start,
    onSuccess: (session) => {
      queryClient.setQueryData(['mock-interview', session.id], session)
      queryClient.invalidateQueries({ queryKey: ['mock-interviews'] })
      navigate(`/candidate/mock-interviews/${session.id}`)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not start the mock interview.')),
  })
}
