import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Brain, Briefcase, ChevronRight, Code2, Layers, MessageSquare, Play, Target } from 'lucide-react'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Select } from '../../components/ui/select'
import { cn } from '../../components/ui/utils'
import { applicationsService } from '../../services/applications.service'
import { TRACKS, interviewsService, useStartInterview, type Track } from '../../services/interviews.service'
import { formatDate } from '../../services/jobs.service'

const TRACK_ICONS: Record<Track, typeof Brain> = {
  behavioral: MessageSquare,
  frontend: Code2,
  product: Target,
  'system-design': Layers,
}

export default function MockInterviewsPage() {
  const [numQuestions, setNumQuestions] = useState(5)
  const start = useStartInterview()
  const { data: sessions } = useQuery({ queryKey: ['mock-interviews'], queryFn: interviewsService.list })
  const { data: applications } = useQuery({ queryKey: ['my-applications'], queryFn: applicationsService.mine })
  const openApplications = applications?.filter((app) => app.stage !== 'hired' && app.stage !== 'rejected') ?? []

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Mock Interviews</h1>
          <p className="text-gray-600">Practise with AI-generated questions and get instant feedback on every answer.</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          Questions per session
          <Select
            className="w-20"
            value={numQuestions}
            onChange={(event) => setNumQuestions(Number(event.target.value))}
          >
            {[3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Briefcase size={20} className="text-primary" />
                Practise for a job you applied to
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {openApplications.length === 0 && (
                <p className="text-sm text-gray-500">
                  Questions are tailored to the job description.{' '}
                  <Link to="/candidate/jobs" className="text-primary font-medium hover:underline">
                    Find a job
                  </Link>{' '}
                  to get started, or pick a practice track below.
                </p>
              )}
              {openApplications.map((app) => (
                <div key={app.id} className="flex items-center gap-4 rounded-xl border border-gray-200 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">{app.job.title}</p>
                    <p className="text-sm text-gray-500">{app.job.company_name}</p>
                  </div>
                  <Button
                    size="sm"
                    disabled={start.isPending}
                    onClick={() => start.mutate({ job_id: app.job.id, num_questions: numQuestions })}
                  >
                    <Play size={14} />
                    {start.isPending && start.variables?.job_id === app.job.id ? 'Preparing…' : 'Start'}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {(Object.keys(TRACKS) as Track[]).map((track) => {
              const Icon = TRACK_ICONS[track]
              return (
                <Card key={track} className="border-gray-200 shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="flex h-full flex-col p-6">
                    <div className={cn('mb-4 flex size-12 items-center justify-center rounded-xl', TRACKS[track].badge)}>
                      <Icon size={24} />
                    </div>
                    <h3 className="mb-1 text-lg font-semibold text-gray-900">{TRACKS[track].title}</h3>
                    <p className="mb-4 flex-1 text-sm text-gray-600">{TRACKS[track].description}</p>
                    <Button
                      variant="outline"
                      disabled={start.isPending}
                      onClick={() => start.mutate({ track, num_questions: numQuestions })}
                    >
                      <Play size={14} />
                      {start.isPending && start.variables?.track === track ? 'Preparing…' : 'Start practice'}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        <Card className="h-fit border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Brain size={20} className="text-primary" />
              Your Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessions?.length === 0 && <p className="text-sm text-gray-500">No sessions yet. Start one to see it here.</p>}
            {sessions?.map((session) => (
              <Link
                key={session.id}
                to={`/candidate/mock-interviews/${session.id}`}
                className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 transition-colors hover:bg-gray-100"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{session.title}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(session.created_at)} · {session.answered_count}/{session.question_count} answered
                  </p>
                </div>
                {session.status === 'completed' ? (
                  <span className="text-primary text-lg font-bold">
                    {session.overall_score !== null ? `${session.overall_score}%` : '–'}
                  </span>
                ) : (
                  <Badge className="bg-orange-100 text-orange-700">In progress</Badge>
                )}
                <ChevronRight size={16} className="shrink-0 text-gray-400" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
