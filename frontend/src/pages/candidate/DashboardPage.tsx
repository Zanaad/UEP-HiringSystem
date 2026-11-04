import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Award, Briefcase, Building2, CheckCircle2, ChevronRight, Clock, MapPin, Play, Search, TrendingUp, Users } from 'lucide-react'
import { MatchBadge, SkillChips } from '../../components/Ats'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Progress } from '../../components/ui/progress'
import { cn } from '../../components/ui/utils'
import {
  applicationsService,
  PROGRESS_STAGES,
  STAGES,
  type MyApplication,
  type StageEvent,
} from '../../services/applications.service'
import { useStartInterview } from '../../services/interviews.service'
import { EMPLOYMENT_TYPES, formatDate } from '../../services/jobs.service'
import { useAuthStore } from '../../stores/auth.store'

const describeEvent = (event: StageEvent) =>
  event.from_stage ? `Moved to ${STAGES[event.to_stage].label}` : 'Application submitted'

export default function CandidateDashboardPage() {
  const name = useAuthStore((state) => state.user?.name ?? '')
  const [detail, setDetail] = useState<MyApplication | null>(null)
  const prepare = useStartInterview()
  const { data: applications, isPending, isError, refetch } = useQuery({
    queryKey: ['my-applications'],
    queryFn: applicationsService.mine,
  })

  const stats = useMemo(() => {
    const list = applications ?? []
    const active = list.filter((app) => app.stage !== 'hired' && app.stage !== 'rejected')
    return [
      { title: 'Active Applications', value: active.length, icon: Briefcase, color: 'bg-blue-100 text-blue-600' },
      {
        title: 'In Interviews',
        value: list.filter((app) => app.stage === 'interview' || app.stage === 'technical').length,
        icon: Users,
        color: 'bg-indigo-100 text-indigo-600',
      },
      {
        title: 'Offers',
        value: list.filter((app) => app.stage === 'offer' || app.stage === 'hired').length,
        icon: Award,
        color: 'bg-green-100 text-green-600',
      },
      {
        title: 'Average Match',
        value: list.length ? `${Math.round(list.reduce((sum, app) => sum + app.ats.overall, 0) / list.length)}%` : '–',
        icon: TrendingUp,
        color: 'bg-orange-100 text-orange-600',
      },
    ]
  }, [applications])

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Welcome back, {name.split(' ')[0]}!</h1>
        <p className="text-gray-600">Track your applications and see where you stand.</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ title, value, icon: Icon, color }) => (
          <Card key={title} className="border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className={cn('mb-4 flex size-12 items-center justify-center rounded-xl', color)}>
                <Icon size={24} />
              </div>
              <div className="mb-1 text-3xl font-bold text-gray-900">{value}</div>
              <div className="text-sm text-gray-600">{title}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Briefcase size={20} className="text-primary" />
            My Applications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPending && <p className="py-8 text-center text-gray-500">Loading applications…</p>}
          {isError && (
            <div className="py-8 text-center">
              <p className="mb-4 text-gray-600">Could not load your applications.</p>
              <Button variant="outline" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          )}
          {applications?.length === 0 && (
            <div className="py-10 text-center">
              <Search size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="mb-4 text-gray-600">You haven't applied to any jobs yet.</p>
              <Button asChild>
                <Link to="/candidate/jobs">Find Jobs</Link>
              </Button>
            </div>
          )}
          {applications?.map((app) => {
            const step = PROGRESS_STAGES.indexOf(app.stage) + 1
            return (
              <div key={app.id} className="rounded-xl border border-gray-200 p-4 transition-shadow hover:shadow-md">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="mb-1 font-semibold text-gray-900">{app.job.title}</h3>
                    <p className="text-sm text-gray-600">
                      {app.job.company_name} · {app.job.location}
                    </p>
                  </div>
                  <Badge className={STAGES[app.stage].badge}>{STAGES[app.stage].label}</Badge>
                </div>
                {app.stage === 'rejected' ? (
                  <p className="mb-3 text-sm text-gray-500">The company has decided not to move forward this time.</p>
                ) : (
                  <div className="mb-3">
                    <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
                      <span>Progress</span>
                      <span>
                        {step}/{PROGRESS_STAGES.length} stages
                      </span>
                    </div>
                    <Progress value={(step / PROGRESS_STAGES.length) * 100} />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <Clock size={14} className="mr-1 inline" />
                    Applied {formatDate(app.created_at)}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setDetail(app)}>
                      View Details
                    </Button>
                    {app.stage !== 'hired' && app.stage !== 'rejected' && (
                      <Button
                        size="sm"
                        disabled={prepare.isPending}
                        onClick={() => prepare.mutate({ job_id: app.job.id })}
                      >
                        <Play size={13} />
                        {prepare.isPending && prepare.variables?.job_id === app.job.id ? 'Preparing…' : 'Prepare'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent>
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{detail.job.title}</DialogTitle>
                <p className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  <Building2 size={14} />
                  {detail.job.company_name}
                  <span className="text-gray-300">·</span>
                  <MapPin size={14} />
                  {detail.job.location}
                </p>
              </DialogHeader>

              <div className="flex flex-wrap items-center gap-1 py-1">
                {PROGRESS_STAGES.map((stage, index) => {
                  const current = PROGRESS_STAGES.indexOf(detail.stage)
                  const active = index === current
                  const done = current >= 0 && index < current
                  return (
                    <div key={stage} className="flex items-center gap-1">
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-1 text-xs font-medium',
                          active ? 'bg-primary text-white' : done ? 'text-primary bg-blue-100' : 'text-gray-400',
                        )}
                      >
                        {done && <CheckCircle2 size={10} className="mr-1 inline" />}
                        {STAGES[stage].label}
                      </span>
                      {index < PROGRESS_STAGES.length - 1 && <ChevronRight size={12} className="text-gray-300" />}
                    </div>
                  )
                })}
              </div>
              {detail.stage === 'rejected' && <Badge className={STAGES.rejected.badge}>Not selected</Badge>}

              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Department', value: detail.job.department },
                  { label: 'Type', value: EMPLOYMENT_TYPES[detail.job.employment_type] },
                  { label: 'Applied', value: formatDate(detail.created_at) },
                  { label: 'Last update', value: formatDate(detail.updated_at) },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg bg-gray-50 p-3">
                    <p className="mb-0.5 text-xs text-gray-500">{label}</p>
                    <p className="font-medium text-gray-900">{value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Your match for this role</p>
                <MatchBadge ats={detail.ats} size="sm" />
                <SkillChips matched={detail.ats.matched} missing={detail.ats.missing} />
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">Activity</p>
                {[...detail.events].reverse().map((event, index, events) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />
                      {index < events.length - 1 && <div className="h-6 w-px bg-gray-200" />}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm text-gray-800">{describeEvent(event)}</p>
                      <p className="text-xs text-gray-400">{formatDate(event.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
