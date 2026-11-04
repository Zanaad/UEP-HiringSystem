import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Building2, CheckCircle2, Clock, FileText, GraduationCap, MapPin, Search, Send, Users, Wallet } from 'lucide-react'
import { MatchBadge, MatchBar, SkillChips } from '../../components/Ats'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select } from '../../components/ui/select'
import { Textarea } from '../../components/ui/textarea'
import { getApiErrorMessage } from '../../services/api'
import { applicationsService } from '../../services/applications.service'
import {
  EDUCATION_LEVELS,
  EMPLOYMENT_TYPES,
  formatDate,
  jobsService,
  type EmploymentType,
  type JobPage,
  type JobSearchItem,
} from '../../services/jobs.service'
import { profileService } from '../../services/profile.service'

const PAGE_SIZE = 10

export default function CandidateJobsPage() {
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [employmentType, setEmploymentType] = useState<EmploymentType | ''>('')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [applyJob, setApplyJob] = useState<JobSearchItem | null>(null)

  // Debounce typing so we don't send a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data, isPending, isError, isPlaceholderData, refetch } = useQuery({
    queryKey: ['jobs', { query, employmentType, page }],
    queryFn: () =>
      jobsService.search({
        q: query || undefined,
        employment_type: employmentType || undefined,
        page,
        page_size: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  })

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Find Jobs</h1>
        <p className="text-gray-600">Browse open roles and see how your profile matches each one.</p>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search by title, company, department, or location…"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="h-11 pl-10"
              aria-label="Search jobs"
            />
          </div>
          <Select
            value={employmentType}
            onChange={(event) => {
              setEmploymentType(event.target.value as EmploymentType | '')
              setPage(1)
            }}
            className="h-11 lg:w-48"
            aria-label="Employment type"
          >
            <option value="">All types</option>
            {Object.entries(EMPLOYMENT_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isPending && <p className="py-16 text-center text-gray-500">Loading jobs…</p>}

      {isError && (
        <div className="py-16 text-center">
          <p className="mb-4 text-gray-600">Could not load jobs.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {data && (
        <>
          <p className="mb-4 text-sm text-gray-500">
            {data.total} role{data.total !== 1 ? 's' : ''} found
            {query && (
              <>
                {' '}
                for <span className="font-medium text-gray-800">"{query}"</span>
              </>
            )}
          </p>

          <div className={`grid gap-4 transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}>
            {data.items.map((job) => {
              const expanded = expandedId === job.id
              return (
                <Card key={job.id} className="border-gray-200 shadow-sm transition-all hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 sm:flex">
                        <Building2 className="text-primary" size={22} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                            <p className="text-sm font-medium text-gray-700">
                              {job.company_name} · {job.department}
                            </p>
                          </div>
                          {job.match && <MatchBadge ats={job.match} />}
                        </div>
                        {job.match && <MatchBar ats={job.match} className="mt-3 h-1.5" />}
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {EMPLOYMENT_TYPES[job.employment_type]}
                          </span>
                          {job.salary_range && (
                            <span className="flex items-center gap-1">
                              <Wallet size={14} />
                              {job.salary_range}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <GraduationCap size={14} />
                            {job.min_experience_years}+ yrs · {EDUCATION_LEVELS[job.education_level]}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {job.applicant_count} applicant{job.applicant_count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {job.match ? (
                          <div className="mt-3">
                            <SkillChips matched={job.match.matched} missing={job.match.missing} />
                          </div>
                        ) : job.required_skills.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {job.required_skills.map((skill) => (
                              <span key={skill} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                        {expanded && (
                          <p className="mt-4 text-sm whitespace-pre-line text-gray-700">{job.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4">
                      <span className="mr-auto text-sm text-gray-500">Posted {formatDate(job.created_at)}</span>
                      {job.applied ? (
                        <Button size="sm" disabled className="bg-green-600 disabled:opacity-100">
                          <CheckCircle2 size={14} />
                          Applied
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => setApplyJob(job)}>
                          <Send size={14} />
                          Apply Now
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-expanded={expanded}
                        onClick={() => setExpandedId(expanded ? null : job.id)}
                      >
                        {expanded ? 'Less detail' : 'More detail'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {data.items.length === 0 && (
              <div className="py-16 text-center">
                <Search size={40} className="mx-auto mb-3 text-gray-300" />
                <h3 className="mb-1 text-lg font-semibold text-gray-900">No roles found</h3>
                <p className="text-sm text-gray-500">Try adjusting your filters or search term.</p>
              </div>
            )}
          </div>

          {data.total > PAGE_SIZE && (
            <div className="mt-6 flex items-center justify-between">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                Previous
              </Button>
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= totalPages || isPlaceholderData}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={!!applyJob} onOpenChange={(open) => !open && setApplyJob(null)}>
        <DialogContent>
          {applyJob && <ApplyForm job={applyJob} onDone={() => setApplyJob(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ApplyForm({ job, onDone }: { job: JobSearchItem; onDone: () => void }) {
  const queryClient = useQueryClient()
  const [coverNote, setCoverNote] = useState('')
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: profileService.get })

  const apply = useMutation({
    mutationFn: () => applicationsService.apply(job.id, coverNote.trim()),
    onSuccess: () => {
      queryClient.setQueriesData<JobPage>({ queryKey: ['jobs'] }, (page) =>
        page && {
          ...page,
          items: page.items.map((item) =>
            item.id === job.id ? { ...item, applied: true, applicant_count: item.applicant_count + 1 } : item,
          ),
        },
      )
      queryClient.invalidateQueries({ queryKey: ['my-applications'] })
      toast.success(`Application sent to ${job.company_name}`)
      onDone()
    },
  })

  const profileIncomplete = profile && profile.skills.length === 0

  return (
    <>
      <DialogHeader>
        <DialogTitle>Apply to {job.title}</DialogTitle>
        <p className="text-sm text-gray-500">{job.company_name}</p>
      </DialogHeader>

      {job.match && (
        <div className="flex items-center gap-4 rounded-xl bg-gray-50 p-4">
          <div>
            <p className="mb-1 text-xs text-gray-500">Your ATS Match Score</p>
            <MatchBadge ats={job.match} />
          </div>
          <div className="flex-1">
            <MatchBar ats={job.match} />
            {job.match.missing.length > 0 && (
              <p className="mt-1.5 text-xs text-gray-400">Missing: {job.match.missing.join(', ')}</p>
            )}
          </div>
        </div>
      )}

      {profileIncomplete && (
        <p className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-700">
          Add your skills in{' '}
          <Link to="/candidate/settings" className="font-medium underline">
            Settings
          </Link>{' '}
          to improve your match score.
        </p>
      )}

      <div className="space-y-1.5">
        <Label>Resume</Label>
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <FileText size={16} className="shrink-0 text-red-600" />
          <p className="min-w-0 flex-1 truncate text-sm text-gray-900">
            {profile?.resume_filename ?? 'No resume uploaded'}
          </p>
          <Link to="/candidate/settings" className="text-primary text-sm font-medium hover:underline">
            {profile?.resume_filename ? 'Change' : 'Upload'}
          </Link>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cover_note">
          Cover Note <span className="font-normal text-gray-400">(optional)</span>
        </Label>
        <Textarea
          id="cover_note"
          rows={5}
          maxLength={3000}
          placeholder={`Hi, I'm excited to apply for the ${job.title} role…`}
          value={coverNote}
          onChange={(event) => setCoverNote(event.target.value)}
        />
      </div>

      {apply.isError && (
        <p className="text-destructive text-sm">{getApiErrorMessage(apply.error, 'Could not submit your application.')}</p>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button disabled={apply.isPending} onClick={() => apply.mutate()}>
          <Send size={15} />
          {apply.isPending ? 'Submitting…' : 'Submit Application'}
        </Button>
      </DialogFooter>
    </>
  )
}
