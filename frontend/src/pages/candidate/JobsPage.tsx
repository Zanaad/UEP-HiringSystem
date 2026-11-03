import { useEffect, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Building2, Clock, GraduationCap, MapPin, Search, Wallet } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import {
  EDUCATION_LEVELS,
  EMPLOYMENT_TYPES,
  formatDate,
  jobsService,
  type EmploymentType,
} from '../../services/jobs.service'

const PAGE_SIZE = 10

export default function CandidateJobsPage() {
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [employmentType, setEmploymentType] = useState<EmploymentType | ''>('')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<number | null>(null)

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
        <p className="text-gray-600">Browse open roles from companies hiring on HirePrep.</p>
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
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        <p className="text-sm font-medium text-gray-700">
                          {job.company_name} · {job.department}
                        </p>
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
                        {expanded && (
                          <p className="mt-4 text-sm whitespace-pre-line text-gray-700">{job.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4">
                      <span className="mr-auto text-sm text-gray-500">Posted {formatDate(job.created_at)}</span>
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
    </div>
  )
}
