import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { toast } from 'sonner'
import { BarChart3, Briefcase, Clock, GraduationCap, MapPin, Pencil, Plus, Search, Users, Wallet } from 'lucide-react'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { FormField } from '../../components/ui/form-field'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import { Textarea } from '../../components/ui/textarea'
import { cn } from '../../components/ui/utils'
import { getApiErrorMessage } from '../../services/api'
import {
  EDUCATION_LEVELS,
  EMPLOYMENT_TYPES,
  formatDate,
  jobsService,
  type EducationLevel,
  type EmploymentType,
  type Job,
  type JobStatus,
} from '../../services/jobs.service'

const QUERY_KEY = ['recruiter-jobs']

const STATUS_STYLES: Record<JobStatus, string> = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-700',
  closed: 'bg-red-100 text-red-700',
}

const STATUS_ACTIONS: Record<JobStatus, { label: string; next: JobStatus }> = {
  draft: { label: 'Publish', next: 'active' },
  active: { label: 'Close job', next: 'closed' },
  closed: { label: 'Reopen', next: 'active' },
}

const FILTERS: ('all' | JobStatus)[] = ['all', 'active', 'draft', 'closed']

const splitSkills = (value: string) =>
  value
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean)

const jobSchema = z.object({
  title: z.string().trim().min(2, 'Title is required.').max(120),
  department: z.string().trim().min(2, 'Department is required.').max(80),
  location: z.string().trim().min(2, 'Location is required.').max(120),
  employment_type: z.enum(Object.keys(EMPLOYMENT_TYPES) as [EmploymentType]),
  salary_range: z.string().trim().max(60, 'Keep it under 60 characters.'),
  description: z
    .string()
    .trim()
    .min(20, 'Describe the role in at least 20 characters.')
    .max(5000, 'Keep it under 5000 characters.'),
  skills: z.string().refine((value) => splitSkills(value).length <= 20, 'At most 20 skills.'),
  min_experience_years: z.number({ error: 'Enter a number.' }).int().min(0).max(50, 'At most 50 years.'),
  education_level: z.enum(Object.keys(EDUCATION_LEVELS) as [EducationLevel]),
})

type JobFormValues = z.infer<typeof jobSchema>

function upsertJob(jobs: Job[] | undefined, job: Job) {
  if (!jobs) return [job]
  return jobs.some((item) => item.id === job.id)
    ? jobs.map((item) => (item.id === job.id ? job : item))
    : [job, ...jobs]
}

export default function RecruiterJobsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | JobStatus>('all')
  const [dialog, setDialog] = useState<{ open: boolean; job: Job | null }>({ open: false, job: null })

  const { data: jobs, isPending, isError, refetch } = useQuery({ queryKey: QUERY_KEY, queryFn: jobsService.listMine })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: JobStatus }) => jobsService.update(id, { status }),
    onSuccess: (job) => {
      queryClient.setQueryData<Job[]>(QUERY_KEY, (current) => upsertJob(current, job))
      toast.success(job.status === 'active' ? 'Job is now live' : 'Job closed')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not update the job.')),
  })

  const counts = useMemo(() => {
    const result: Record<'all' | JobStatus, number> = { all: 0, active: 0, draft: 0, closed: 0 }
    jobs?.forEach((job) => {
      result.all++
      result[job.status]++
    })
    return result
  }, [jobs])

  const filteredJobs = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (jobs ?? []).filter(
      (job) =>
        (statusFilter === 'all' || job.status === statusFilter) &&
        (!term || [job.title, job.department, job.location].some((value) => value.toLowerCase().includes(term))),
    )
  }, [jobs, search, statusFilter])

  const openDialog = (job: Job | null) => setDialog({ open: true, job })

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Job Management</h1>
            <p className="text-gray-600">Manage your open positions and job postings</p>
          </div>
          <Button onClick={() => openDialog(null)}>
            <Plus size={20} />
            Create New Job
          </Button>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search jobs..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-11 pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <Button
                key={filter}
                variant={statusFilter === filter ? 'default' : 'outline'}
                className="h-11 capitalize"
                onClick={() => setStatusFilter(filter)}
              >
                {filter === 'all' ? 'All jobs' : filter} ({counts[filter]})
              </Button>
            ))}
          </div>
        </div>
      </div>

      {isPending && <p className="py-16 text-center text-gray-500">Loading jobs…</p>}

      {isError && (
        <div className="py-16 text-center">
          <p className="mb-4 text-gray-600">Could not load your jobs.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {jobs && (
        <div className="grid gap-4">
          {filteredJobs.map((job) => {
            const action = STATUS_ACTIONS[job.status]
            return (
              <Card key={job.id} className="border-gray-200 shadow-sm transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 sm:flex">
                      <Briefcase className="text-primary" size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                        <Badge className={cn('capitalize', STATUS_STYLES[job.status])}>{job.status}</Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Briefcase size={16} />
                          {job.department}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={16} />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={16} />
                          {EMPLOYMENT_TYPES[job.employment_type]}
                        </span>
                        {job.salary_range && (
                          <span className="flex items-center gap-1">
                            <Wallet size={16} />
                            {job.salary_range}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <GraduationCap size={16} />
                          {job.min_experience_years}+ yrs · {EDUCATION_LEVELS[job.education_level]}
                        </span>
                      </div>
                      {job.required_skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {job.required_skills.map((skill) => (
                            <span key={skill} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                      <Users size={16} className="text-gray-400" />
                      {job.applicant_count} applicant{job.applicant_count !== 1 ? 's' : ''}
                    </span>
                    <span className="mr-auto text-sm text-gray-500">Posted {formatDate(job.created_at)}</span>
                    <Button asChild variant="outline" size="sm" className="text-primary border-primary hover:bg-blue-50">
                      <Link to={`/recruiter/jobs/${job.id}/ats`}>
                        <BarChart3 size={15} />
                        ATS Screening
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/recruiter/pipeline?job=${job.id}`}>Pipeline</Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openDialog(job)}>
                      <Pencil size={15} />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={job.status === 'active' ? 'outline' : 'default'}
                      className={cn(job.status === 'active' && 'border-red-200 text-red-600 hover:bg-red-50')}
                      disabled={statusMutation.isPending && statusMutation.variables?.id === job.id}
                      onClick={() => statusMutation.mutate({ id: job.id, status: action.next })}
                    >
                      {action.label}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {filteredJobs.length === 0 && (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gray-100">
                <Briefcase size={32} className="text-gray-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                {jobs.length === 0 ? 'No jobs yet' : 'No jobs found'}
              </h3>
              <p className="mb-6 text-gray-600">
                {jobs.length === 0 ? 'Create your first job posting to start hiring.' : 'Try adjusting your search or filters.'}
              </p>
              {jobs.length === 0 && (
                <Button onClick={() => openDialog(null)}>
                  <Plus size={20} />
                  Create New Job
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <Dialog open={dialog.open} onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialog.job ? 'Edit Job Posting' : 'Create New Job Posting'}</DialogTitle>
          </DialogHeader>
          {dialog.open && (
            <JobForm
              key={dialog.job?.id ?? 'new'}
              job={dialog.job}
              onSaved={(job) => {
                queryClient.setQueryData<Job[]>(QUERY_KEY, (current) => upsertJob(current, job))
                // Requirement changes re-score this job's applicants.
                queryClient.invalidateQueries({ queryKey: ['applications', job.id] })
                toast.success(dialog.job ? 'Job updated' : job.status === 'active' ? 'Job published' : 'Draft saved')
                setDialog({ open: false, job: null })
              }}
              onCancel={() => setDialog({ open: false, job: null })}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function JobForm({ job, onSaved, onCancel }: { job: Job | null; onSaved: (job: Job) => void; onCancel: () => void }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: job?.title ?? '',
      department: job?.department ?? '',
      location: job?.location ?? '',
      employment_type: job?.employment_type ?? 'full-time',
      salary_range: job?.salary_range ?? '',
      description: job?.description ?? '',
      skills: job?.required_skills.join(', ') ?? '',
      min_experience_years: job?.min_experience_years ?? 0,
      education_level: job?.education_level ?? 'any',
    },
  })

  const save = (status?: JobStatus) =>
    handleSubmit(async ({ skills, salary_range, ...values }) => {
      const payload = { ...values, salary_range: salary_range || null, required_skills: splitSkills(skills) }
      try {
        onSaved(job ? await jobsService.update(job.id, payload) : await jobsService.create({ ...payload, status }))
      } catch (error) {
        setError('root', { message: getApiErrorMessage(error, 'Could not save the job.') })
      }
    })

  return (
    <form onSubmit={save('draft')} className="space-y-4" noValidate>
      <FormField id="title" label="Job Title *" error={errors.title?.message}>
        <Input id="title" placeholder="e.g. Senior Frontend Engineer" aria-invalid={!!errors.title} {...register('title')} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="department" label="Department *" error={errors.department?.message}>
          <Input id="department" placeholder="e.g. Engineering" aria-invalid={!!errors.department} {...register('department')} />
        </FormField>
        <FormField id="location" label="Location *" error={errors.location?.message}>
          <Input id="location" placeholder="e.g. Prishtina or Remote" aria-invalid={!!errors.location} {...register('location')} />
        </FormField>
        <FormField id="employment_type" label="Employment Type">
          <Select id="employment_type" {...register('employment_type')}>
            {Object.entries(EMPLOYMENT_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField id="salary_range" label="Salary Range" error={errors.salary_range?.message}>
          <Input id="salary_range" placeholder="e.g. €1,200 – €1,800 / month" {...register('salary_range')} />
        </FormField>
        <FormField id="min_experience_years" label="Minimum Experience (years)" error={errors.min_experience_years?.message}>
          <Input
            id="min_experience_years"
            type="number"
            min={0}
            max={50}
            aria-invalid={!!errors.min_experience_years}
            {...register('min_experience_years', { valueAsNumber: true })}
          />
        </FormField>
        <FormField id="education_level" label="Education">
          <Select id="education_level" {...register('education_level')}>
            {Object.entries(EDUCATION_LEVELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>
      <FormField
        id="skills"
        label="Required Skills"
        error={errors.skills?.message}
        hint="Comma separated, e.g. React, TypeScript, SQL. Used to score how well applicants match."
      >
        <Input id="skills" placeholder="React, TypeScript, SQL" aria-invalid={!!errors.skills} {...register('skills')} />
      </FormField>
      <FormField id="description" label="Job Description *" error={errors.description?.message}>
        <Textarea
          id="description"
          rows={6}
          placeholder="Describe the role, responsibilities, and requirements..."
          aria-invalid={!!errors.description}
          {...register('description')}
        />
      </FormField>

      {errors.root && <p className="text-destructive text-sm">{errors.root.message}</p>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        {job ? (
          <Button type="submit" disabled={isSubmitting}>
            Save Changes
          </Button>
        ) : (
          <>
            <Button type="submit" variant="outline" disabled={isSubmitting}>
              Save as Draft
            </Button>
            <Button type="button" disabled={isSubmitting} onClick={save('active')}>
              Publish
            </Button>
          </>
        )}
      </DialogFooter>
    </form>
  )
}
