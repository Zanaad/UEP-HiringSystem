import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { BarChart3, Briefcase, CheckCircle2, Mail, Search, Users } from 'lucide-react'
import { MatchBadge } from '../../components/Ats'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import { cn } from '../../components/ui/utils'
import { getApiErrorMessage } from '../../services/api'
import {
  applicationsService,
  PIPELINE_STAGES,
  STAGES,
  type ApplicationSummary,
  type Stage,
} from '../../services/applications.service'
import { EMPLOYMENT_TYPES, formatDate, jobsService } from '../../services/jobs.service'

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

export default function RecruiterPipelinePage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [dragOver, setDragOver] = useState<Stage | null>(null)

  const { data: jobs } = useQuery({ queryKey: ['recruiter-jobs'], queryFn: jobsService.listMine })
  const requestedId = Number(searchParams.get('job'))
  const selectedJob =
    jobs?.find((job) => job.id === requestedId) ?? jobs?.find((job) => job.status === 'active') ?? jobs?.[0]

  const applicationsKey = ['applications', selectedJob?.id]
  const { data: applications, isPending } = useQuery({
    queryKey: applicationsKey,
    queryFn: () => applicationsService.listForJob(selectedJob!.id),
    enabled: !!selectedJob,
  })

  const move = useMutation({
    mutationFn: ({ id, stage }: { id: number; stage: Stage }) => applicationsService.updateStage(id, stage),
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: applicationsKey })
      const previous = queryClient.getQueryData<ApplicationSummary[]>(applicationsKey)
      queryClient.setQueryData<ApplicationSummary[]>(applicationsKey, (current) =>
        current?.map((app) => (app.id === id ? { ...app, stage } : app)),
      )
      return { previous }
    },
    onSuccess: (detail) => queryClient.setQueryData(['application', detail.id], detail),
    onError: (error, _variables, context) => {
      queryClient.setQueryData(applicationsKey, context?.previous)
      toast.error(getApiErrorMessage(error, 'Could not move the candidate.'))
    },
  })

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (applications ?? []).filter(
      ({ candidate }) =>
        !term ||
        candidate.name.toLowerCase().includes(term) ||
        candidate.email.toLowerCase().includes(term) ||
        candidate.skills.some((skill) => skill.toLowerCase().includes(term)),
    )
  }, [applications, search])

  const byStage = useMemo(() => {
    const groups = Object.fromEntries(PIPELINE_STAGES.map((stage) => [stage, [] as ApplicationSummary[]]))
    filtered.forEach((app) => groups[app.stage].push(app))
    return groups as Record<Stage, ApplicationSummary[]>
  }, [filtered])

  const all = applications ?? []
  const kpis = [
    { label: 'In Pipeline', value: all.filter((a) => a.stage !== 'rejected').length, icon: Users, color: 'text-primary' },
    {
      label: 'Interviewing',
      value: all.filter((a) => a.stage === 'interview' || a.stage === 'technical').length,
      icon: BarChart3,
      color: 'text-orange-500',
    },
    { label: 'Hired', value: all.filter((a) => a.stage === 'hired').length, icon: CheckCircle2, color: 'text-emerald-600' },
  ]

  const moveTo = (id: number, stage: Stage) => {
    const app = applications?.find((item) => item.id === id)
    if (app && app.stage !== stage) move.mutate({ id, stage })
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="mb-1 text-3xl font-bold text-gray-900">Candidate Pipeline</h1>
        <p className="text-sm text-gray-500">Drag candidates between stages, or use the menu on each card.</p>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex-1">
            <label htmlFor="job" className="mb-1.5 block text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Job Posting
            </label>
            <Select
              id="job"
              className="h-12 bg-gray-50 text-base font-medium"
              value={selectedJob?.id ?? ''}
              onChange={(event) => setSearchParams({ job: event.target.value })}
              disabled={!jobs?.length}
            >
              {!jobs?.length && <option value="">No jobs yet</option>}
              {jobs?.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} ({job.status})
                </option>
              ))}
            </Select>
          </div>
          {selectedJob && (
            <div className="flex shrink-0 gap-6">
              {kpis.map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="text-center">
                  <div className={cn('flex items-center justify-center gap-1 text-2xl font-bold', color)}>
                    <Icon size={18} />
                    {value}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        {selectedJob && (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 pt-4 text-sm text-gray-500">
            <span className="font-medium text-gray-800">{selectedJob.title}</span>
            <span>{selectedJob.department}</span>
            <span>{selectedJob.location}</span>
            <span>{EMPLOYMENT_TYPES[selectedJob.employment_type]}</span>
            <Link to={`/recruiter/jobs/${selectedJob.id}/ats`} className="text-primary ml-auto font-medium hover:underline">
              View ATS ranking
            </Link>
          </div>
        )}
      </div>

      {!jobs?.length ? (
        <div className="py-20 text-center text-gray-400">
          <Briefcase size={48} className="mx-auto mb-4 text-gray-200" />
          <p className="text-lg font-medium">No jobs yet</p>
          <p className="mt-1 text-sm">
            <Link to="/recruiter/jobs" className="text-primary hover:underline">
              Create a job
            </Link>{' '}
            to start receiving applications.
          </p>
        </div>
      ) : isPending ? (
        <p className="py-16 text-center text-gray-500">Loading candidates…</p>
      ) : all.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          <Users size={48} className="mx-auto mb-4 text-gray-200" />
          <p className="text-lg font-medium">No candidates yet</p>
          <p className="mt-1 text-sm">Nobody has applied to {selectedJob?.title} yet.</p>
        </div>
      ) : (
        <>
          <div className="mb-6 flex gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={17} />
              <Input
                placeholder="Search candidates…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10 pl-9"
              />
            </div>
          </div>

          <div className="overflow-x-auto pb-6">
            <div className="flex min-w-max gap-4">
              {PIPELINE_STAGES.map((stage) => (
                <div
                  key={stage}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setDragOver(stage)
                  }}
                  onDragLeave={() => setDragOver((current) => (current === stage ? null : current))}
                  onDrop={(event) => {
                    event.preventDefault()
                    setDragOver(null)
                    moveTo(Number(event.dataTransfer.getData('text/plain')), stage)
                  }}
                  className={cn(
                    'w-72 shrink-0 rounded-2xl p-4 transition-colors',
                    dragOver === stage ? 'ring-primary/30 bg-blue-50 ring-2' : 'bg-gray-50',
                  )}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn('size-2 rounded-full', STAGES[stage].dot)} />
                      <h3 className="text-sm font-semibold text-gray-800">{STAGES[stage].label}</h3>
                    </div>
                    <Badge className={STAGES[stage].badge}>{byStage[stage].length}</Badge>
                  </div>
                  <div className="max-h-[calc(100vh-360px)] space-y-3 overflow-y-auto pr-1">
                    {byStage[stage].map((app) => (
                      <PipelineCard key={app.id} app={app} onMove={moveTo} />
                    ))}
                    {byStage[stage].length === 0 && (
                      <div className="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center text-xs text-gray-400">
                        Drop candidates here
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function PipelineCard({ app, onMove }: { app: ApplicationSummary; onMove: (id: number, stage: Stage) => void }) {
  const { candidate } = app
  return (
    <Card
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', String(app.id))
        event.dataTransfer.effectAllowed = 'move'
      }}
      className="cursor-grab gap-0 border-gray-200 shadow-sm transition-all hover:shadow-md active:cursor-grabbing"
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white">
            {initials(candidate.name)}
          </div>
          <div className="min-w-0">
            <Link
              to={`/recruiter/applications/${app.id}`}
              draggable={false}
              className="block truncate text-sm font-semibold text-gray-900 hover:underline"
            >
              {candidate.name}
            </Link>
            <div className="truncate text-xs text-gray-500">
              {candidate.headline ?? `${candidate.experience_years} yrs experience`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Mail size={12} />
          <span className="truncate">{candidate.email}</span>
        </div>
        <MatchBadge ats={app.ats} size="sm" />
        {candidate.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {candidate.skills.slice(0, 3).map((skill) => (
              <Badge key={skill} className="bg-secondary text-secondary-foreground">
                {skill}
              </Badge>
            ))}
            {candidate.skills.length > 3 && (
              <Badge className="bg-secondary text-secondary-foreground">+{candidate.skills.length - 3}</Badge>
            )}
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-gray-400">Applied {formatDate(app.created_at)}</span>
          <Select
            aria-label={`Move ${candidate.name}`}
            className="h-7 w-auto px-2 text-xs"
            value={app.stage}
            onChange={(event) => onMove(app.id, event.target.value as Stage)}
          >
            {PIPELINE_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {STAGES[stage].label}
              </option>
            ))}
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
