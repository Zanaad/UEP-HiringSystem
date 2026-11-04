import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, Briefcase, Clock, Plus, Star, TrendingUp, UserCheck, Users } from 'lucide-react'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { cn } from '../../components/ui/utils'
import { api } from '../../services/api'
import { STAGES, type Stage } from '../../services/applications.service'
import { timeAgo } from '../../services/jobs.service'
import { useAuthStore } from '../../stores/auth.store'

interface RecruiterStats {
  active_jobs: number
  total_candidates: number
  interviewing: number
  hires_this_month: number
  funnel: { stage: Stage; count: number }[]
  trend: { month: string; applications: number; hires: number }[]
  recent_activity: {
    application_id: number
    candidate_name: string
    job_title: string
    from_stage: Stage | null
    to_stage: Stage
    actor_name: string | null
    created_at: string
  }[]
  top_matches: { application_id: number; candidate_name: string; job_title: string; stage: Stage; ats_score: number }[]
}

const niceMax = (value: number) => {
  if (value <= 4) return 4
  const step = 10 ** Math.floor(Math.log10(value))
  return Math.ceil(value / step) * step
}

export default function RecruiterDashboardPage() {
  const name = useAuthStore((state) => state.user?.name ?? '')
  const { data: stats, isPending, isError, refetch } = useQuery({
    queryKey: ['recruiter-stats'],
    queryFn: () => api.get<RecruiterStats>('/recruiter/stats').then((res) => res.data),
    staleTime: 0,
  })

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {name.split(' ')[0]}. Here's what's happening with your hiring.</p>
        </div>
        <Button asChild>
          <Link to="/recruiter/jobs">
            <Plus size={20} />
            Post New Job
          </Link>
        </Button>
      </div>

      {isPending && <p className="py-16 text-center text-gray-500">Loading dashboard…</p>}
      {isError && (
        <div className="py-16 text-center">
          <p className="mb-4 text-gray-600">Could not load your dashboard.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}
      {stats && <Dashboard stats={stats} />}
    </div>
  )
}

function Dashboard({ stats }: { stats: RecruiterStats }) {
  const kpis = [
    { title: 'Active Jobs', value: stats.active_jobs, icon: Briefcase, color: 'bg-blue-100 text-blue-600' },
    { title: 'Total Candidates', value: stats.total_candidates, icon: Users, color: 'bg-indigo-100 text-indigo-600' },
    { title: 'Interviewing Now', value: stats.interviewing, icon: BarChart3, color: 'bg-orange-100 text-orange-600' },
    { title: 'Hires This Month', value: stats.hires_this_month, icon: UserCheck, color: 'bg-green-100 text-green-600' },
  ]
  const applied = stats.funnel[0]?.count ?? 0

  return (
    <>
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({ title, value, icon: Icon, color }) => (
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

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Hiring Funnel"
          subtitle="Candidates who reached each stage"
          empty={applied === 0}
          table={{
            head: ['Stage', 'Candidates', 'Share of applicants'],
            rows: stats.funnel.map((step) => [
              STAGES[step.stage].label,
              step.count,
              applied ? `${Math.round((step.count / applied) * 100)}%` : '–',
            ]),
          }}
        >
          <div className="space-y-2">
            {stats.funnel.map((step) => {
              const share = applied ? Math.round((step.count / applied) * 100) : 0
              return (
                <div
                  key={step.stage}
                  tabIndex={0}
                  aria-label={`${STAGES[step.stage].label}: ${step.count} candidates, ${share}% of applicants`}
                  className="group relative grid grid-cols-[84px_1fr] items-center gap-3 rounded-md py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <span className="text-sm text-gray-600">{STAGES[step.stage].label}</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="bg-primary h-5 rounded-r-[4px] transition-opacity group-hover:opacity-80"
                      style={{ width: `${applied ? (step.count / applied) * 100 : 0}%` }}
                    />
                    <span className="text-sm font-medium text-gray-900">{step.count}</span>
                  </div>
                  <Tooltip value={`${share}%`} label="of applicants" />
                </div>
              )
            })}
          </div>
        </ChartCard>

        <ChartCard
          title="Applications & Hires"
          subtitle="Last 6 months"
          empty={stats.trend.every((point) => point.applications === 0 && point.hires === 0)}
          table={{
            head: ['Month', 'Applications', 'Hires'],
            rows: stats.trend.map((point) => [point.month, point.applications, point.hires]),
          }}
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <ColumnChart title="Applications" points={stats.trend.map((p) => ({ label: p.month, value: p.applications }))} />
            <ColumnChart title="Hires" points={stats.trend.map((p) => ({ label: p.month, value: p.hires }))} />
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Star size={20} className="text-primary" />
              Top Matches Awaiting Review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.top_matches.length === 0 && (
              <p className="text-sm text-gray-500">No new applicants waiting in Applied or Screening.</p>
            )}
            {stats.top_matches.map((match) => (
              <Link
                key={match.application_id}
                to={`/recruiter/applications/${match.application_id}`}
                className="flex items-center gap-4 rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100"
              >
                <div className="bg-primary flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white">
                  {match.candidate_name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join('')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-gray-900">{match.candidate_name}</div>
                  <div className="truncate text-sm text-gray-600">{match.job_title}</div>
                </div>
                <Badge className={STAGES[match.stage].badge}>{STAGES[match.stage].label}</Badge>
                <span className="w-12 text-right text-lg font-bold text-gray-900">{match.ats_score}%</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Clock size={20} className="text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recent_activity.length === 0 && <p className="text-sm text-gray-500">No activity yet.</p>}
            <div className="space-y-4">
              {stats.recent_activity.map((item, index) => (
                <div key={index} className="flex items-start gap-3 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="bg-primary mt-2 size-2 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/recruiter/applications/${item.application_id}`} className="text-sm text-gray-900 hover:underline">
                      {item.from_stage ? (
                        <>
                          <span className="font-medium">{item.candidate_name}</span> moved to {STAGES[item.to_stage].label}
                          {item.actor_name && <span className="text-gray-500"> by {item.actor_name}</span>}
                        </>
                      ) : (
                        <>
                          <span className="font-medium">{item.candidate_name}</span> applied
                        </>
                      )}
                    </Link>
                    <div className="mt-1 text-xs text-gray-500">
                      {item.job_title} · {timeAgo(item.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function ChartCard({
  title,
  subtitle,
  empty,
  table,
  children,
}: {
  title: string
  subtitle: string
  empty: boolean
  table: { head: string[]; rows: (string | number)[][] }
  children: ReactNode
}) {
  const [showTable, setShowTable] = useState(false)
  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <TrendingUp size={20} className="text-primary" />
              {title}
            </CardTitle>
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          </div>
          {!empty && (
            <Button variant="ghost" size="sm" aria-pressed={showTable} onClick={() => setShowTable((value) => !value)}>
              {showTable ? 'Show chart' : 'Show table'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {empty ? (
          <p className="py-10 text-center text-sm text-gray-500">No applications yet. Data appears once candidates apply.</p>
        ) : showTable ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                {table.head.map((cell) => (
                  <th key={cell} className="py-2 font-medium">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => (
                <tr key={String(row[0])} className="border-b border-gray-100 last:border-0">
                  {row.map((cell, index) => (
                    <td key={index} className={cn('py-2', index === 0 ? 'text-gray-600' : 'font-medium text-gray-900')}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}

function ColumnChart({ title, points }: { title: string; points: { label: string; value: number }[] }) {
  const max = niceMax(Math.max(...points.map((point) => point.value)))
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-gray-700">{title}</p>
      <div className="relative h-40">
        {[1, 0.5, 0].map((tick) => (
          <div key={tick} className="absolute inset-x-0 border-t border-gray-100" style={{ bottom: `${tick * 100}%` }}>
            {tick !== 0.5 && <span className="absolute -top-2 left-0 text-[10px] text-gray-400">{tick * max}</span>}
          </div>
        ))}
        <div className="absolute inset-y-0 right-0 left-6 flex items-end justify-around">
          {points.map((point) => (
            <div
              key={point.label}
              tabIndex={0}
              aria-label={`${title} in ${point.label}: ${point.value}`}
              className="group relative flex h-full flex-1 items-end justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <div
                className="bg-primary w-full max-w-6 rounded-t-[4px] transition-opacity group-hover:opacity-80"
                style={{ height: `${(point.value / max) * 100}%` }}
              />
              <Tooltip value={String(point.value)} label={point.label} />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 ml-6 flex justify-around">
        {points.map((point) => (
          <span key={point.label} className="flex-1 text-center text-xs text-gray-500">
            {point.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function Tooltip({ value, label }: { value: string; label: string }) {
  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-md bg-gray-900 px-2.5 py-1.5 text-center whitespace-nowrap text-white shadow-lg group-hover:block group-focus-visible:block">
      <div className="text-sm font-semibold">{value}</div>
      <div className="text-xs text-gray-300">{label}</div>
    </div>
  )
}
