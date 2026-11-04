import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, BarChart3, Briefcase, CheckCircle2, MapPin, Search, Star, Users } from 'lucide-react'
import { MatchBadge, MatchBar, ScoreBreakdown, SkillChips } from '../../components/Ats'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import { cn } from '../../components/ui/utils'
import { applicationsService, STAGES, type Verdict } from '../../services/applications.service'
import { EDUCATION_LEVELS, EMPLOYMENT_TYPES, jobsService } from '../../services/jobs.service'

export default function AtsScreeningPage() {
  const jobId = Number(useParams().jobId)
  const [search, setSearch] = useState('')
  const [verdict, setVerdict] = useState<Verdict | ''>('')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const { data: jobs, isPending: jobsPending } = useQuery({ queryKey: ['recruiter-jobs'], queryFn: jobsService.listMine })
  const job = jobs?.find((item) => item.id === jobId)
  const { data: applications, isPending } = useQuery({
    queryKey: ['applications', jobId],
    queryFn: () => applicationsService.listForJob(jobId),
    enabled: !!job,
  })

  const ranks = useMemo(() => new Map(applications?.map((app, index) => [app.id, index + 1])), [applications])
  const ranked = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (applications ?? []).filter(
      (app) => (!verdict || app.ats.verdict === verdict) && (!term || app.candidate.name.toLowerCase().includes(term)),
    )
  }, [applications, search, verdict])

  if (jobsPending) return <p className="p-8 text-center text-gray-500">Loading…</p>
  if (!job) {
    return (
      <div className="p-8 text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Job not found</h2>
        <Button asChild>
          <Link to="/recruiter/jobs">Back to Jobs</Link>
        </Button>
      </div>
    )
  }

  const all = applications ?? []
  const kpis = [
    { label: 'Candidates Screened', value: all.length, icon: Users, color: 'bg-blue-100 text-blue-600' },
    {
      label: 'Avg. ATS Score',
      value: all.length ? `${Math.round(all.reduce((sum, app) => sum + app.ats.overall, 0) / all.length)}%` : '–',
      icon: BarChart3,
      color: 'bg-indigo-100 text-indigo-600',
    },
    { label: 'Strong Matches', value: all.filter((a) => a.ats.verdict === 'strong').length, icon: Star, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Good Matches', value: all.filter((a) => a.ats.verdict === 'good').length, icon: CheckCircle2, color: 'bg-orange-100 text-orange-600' },
  ]

  return (
    <div className="p-4 md:p-8">
      <Button asChild variant="ghost" className="mb-6">
        <Link to="/recruiter/jobs">
          <ArrowLeft size={20} />
          Back to Jobs
        </Link>
      </Button>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="mb-1 text-3xl font-bold text-gray-900">{job.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Briefcase size={14} />
              {job.department}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={14} />
              {job.location}
            </span>
            <span>{EMPLOYMENT_TYPES[job.employment_type]}</span>
            <span>
              {job.min_experience_years}+ yrs · {EDUCATION_LEVELS[job.education_level]}
            </span>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link to={`/recruiter/pipeline?job=${job.id}`}>
            <Users size={16} />
            View Pipeline
          </Link>
        </Button>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-gray-200 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl', color)}>
                <Icon size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={17} />
          <Input
            placeholder="Search candidates…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 pl-9"
          />
        </div>
        <Select
          aria-label="Match filter"
          className="h-10 sm:w-48"
          value={verdict}
          onChange={(event) => setVerdict(event.target.value as Verdict | '')}
        >
          <option value="">All matches</option>
          <option value="strong">Strong match</option>
          <option value="good">Good match</option>
          <option value="fair">Fair match</option>
          <option value="weak">Weak match</option>
        </Select>
      </div>

      {isPending ? (
        <p className="py-16 text-center text-gray-500">Loading candidates…</p>
      ) : ranked.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Users size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="font-medium">{all.length ? 'No candidates match your filters' : 'No applicants yet'}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {ranked.map((app) => {
            const expanded = expandedId === app.id
            return (
              <Card key={app.id} className="border-gray-200 shadow-sm">
                <CardContent className="space-y-3 p-5">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="w-8 text-lg font-bold text-gray-300">#{ranks.get(app.id)}</span>
                    <div className="min-w-0 flex-1">
                      <Link to={`/recruiter/applications/${app.id}`} className="font-semibold text-gray-900 hover:underline">
                        {app.candidate.name}
                      </Link>
                      <p className="truncate text-sm text-gray-500">
                        {app.candidate.headline ?? app.candidate.email} · {app.candidate.experience_years} yrs
                      </p>
                    </div>
                    <Badge className={STAGES[app.stage].badge}>{STAGES[app.stage].label}</Badge>
                    <MatchBadge ats={app.ats} />
                  </div>
                  <MatchBar ats={app.ats} className="h-1.5" />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <SkillChips matched={app.ats.matched} missing={app.ats.missing} />
                    <Button variant="ghost" size="sm" aria-expanded={expanded} onClick={() => setExpandedId(expanded ? null : app.id)}>
                      {expanded ? 'Hide breakdown' : 'Show breakdown'}
                    </Button>
                  </div>
                  {expanded && <ScoreBreakdown ats={app.ats} />}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
