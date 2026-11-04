import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Download, ExternalLink, GraduationCap, Mail, MapPin, Phone, Send } from 'lucide-react'
import { MatchBadge, MatchBar, ScoreBreakdown, SkillChips } from '../../components/Ats'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Select } from '../../components/ui/select'
import { Textarea } from '../../components/ui/textarea'
import { getApiErrorMessage } from '../../services/api'
import {
  applicationsService,
  PIPELINE_STAGES,
  STAGES,
  type ApplicationDetail,
  type ApplicationSummary,
  type Stage,
} from '../../services/applications.service'
import { EDUCATION_LEVELS, formatDate } from '../../services/jobs.service'

export default function RecruiterApplicationPage() {
  const id = Number(useParams().id)
  const queryClient = useQueryClient()
  const [note, setNote] = useState('')
  const { data: app, isPending, isError } = useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationsService.get(id),
  })

  const changeStage = useMutation({
    mutationFn: (stage: Stage) => applicationsService.updateStage(id, stage),
    onSuccess: (detail) => {
      queryClient.setQueryData(['application', id], detail)
      queryClient.setQueryData<ApplicationSummary[]>(['applications', detail.job.id], (list) =>
        list?.map((item) => (item.id === id ? { ...item, stage: detail.stage } : item)),
      )
      toast.success(`Moved to ${STAGES[detail.stage].label}`)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not change the stage.')),
  })

  const addNote = useMutation({
    mutationFn: () => applicationsService.addNote(id, note.trim()),
    onSuccess: (created) => {
      queryClient.setQueryData<ApplicationDetail>(['application', id], (detail) =>
        detail && { ...detail, notes: [created, ...detail.notes] },
      )
      setNote('')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not save the note.')),
  })

  if (isPending) return <p className="p-8 text-center text-gray-500">Loading candidate…</p>
  if (isError || !app) {
    return (
      <div className="p-8 text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Application not found</h2>
        <Button asChild>
          <Link to="/recruiter/pipeline">Back to Pipeline</Link>
        </Button>
      </div>
    )
  }

  const { profile } = app
  const links = [
    { label: 'LinkedIn', url: profile.linkedin_url },
    { label: 'GitHub', url: profile.github_url },
    { label: 'Portfolio', url: profile.portfolio_url },
  ].filter((link) => link.url)

  return (
    <div className="p-4 md:p-8">
      <Button asChild variant="ghost" className="mb-6">
        <Link to={`/recruiter/pipeline?job=${app.job.id}`}>
          <ArrowLeft size={20} />
          Back to Pipeline
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white">
                  {app.candidate_name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join('')}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold text-gray-900">{app.candidate_name}</h2>
                  {profile.headline && <p className="text-sm text-gray-600">{profile.headline}</p>}
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <a href={`mailto:${app.candidate_email}`} className="flex items-center gap-2 hover:underline">
                  <Mail size={15} />
                  {app.candidate_email}
                </a>
                {profile.phone && (
                  <a href={`tel:${profile.phone}`} className="flex items-center gap-2 hover:underline">
                    <Phone size={15} />
                    {profile.phone}
                  </a>
                )}
                {profile.location && (
                  <p className="flex items-center gap-2">
                    <MapPin size={15} />
                    {profile.location}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <GraduationCap size={15} />
                  {profile.experience_years} yrs ·{' '}
                  {profile.education_level ? EDUCATION_LEVELS[profile.education_level] : 'Education not specified'}
                </p>
              </div>
              {links.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {links.map(({ label, url }) => (
                    <a
                      key={label}
                      href={url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
                    >
                      {label}
                      <ExternalLink size={13} />
                    </a>
                  ))}
                </div>
              )}
              {profile.resume_filename ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    applicationsService
                      .downloadResume(app.id, profile.resume_filename!)
                      .catch((error) => toast.error(getApiErrorMessage(error, 'Could not download the resume.')))
                  }
                >
                  <Download size={16} />
                  Download Resume
                </Button>
              ) : (
                <p className="text-sm text-gray-400">No resume uploaded</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="font-semibold">Stage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                aria-label="Stage"
                value={app.stage}
                disabled={changeStage.isPending}
                onChange={(event) => changeStage.mutate(event.target.value as Stage)}
              >
                {PIPELINE_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {STAGES[stage].label}
                  </option>
                ))}
              </Select>
              {app.stage !== 'rejected' && app.stage !== 'hired' && (
                <Button
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50"
                  disabled={changeStage.isPending}
                  onClick={() => changeStage.mutate('rejected')}
                >
                  Reject Candidate
                </Button>
              )}
              <p className="text-xs text-gray-500">
                Applied for{' '}
                <Link to={`/recruiter/jobs/${app.job.id}/ats`} className="text-primary font-medium hover:underline">
                  {app.job.title}
                </Link>{' '}
                on {formatDate(app.created_at)}
              </p>
            </CardContent>
          </Card>

          {profile.skills.length > 0 && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="font-semibold">Skills</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {profile.skills.map((skill) => (
                  <Badge key={skill} className="bg-secondary text-secondary-foreground">
                    {skill}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center justify-between gap-3 font-semibold">
                ATS Match
                <MatchBadge ats={app.ats} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MatchBar ats={app.ats} />
              <ScoreBreakdown ats={app.ats} />
              <div>
                <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">Required skills</p>
                <SkillChips matched={app.ats.matched} missing={app.ats.missing} />
                {app.job.required_skills.length === 0 && <p className="text-sm text-gray-400">None listed</p>}
              </div>
              <p className="text-xs text-gray-500">
                Role requires {app.job.min_experience_years}+ years · {EDUCATION_LEVELS[app.job.education_level]} ·{' '}
                {app.job.location}
              </p>
            </CardContent>
          </Card>

          {app.cover_note && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="font-semibold">Cover Note</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-line text-gray-700">{app.cover_note}</p>
              </CardContent>
            </Card>
          )}

          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="font-semibold">Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                className="space-y-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (note.trim()) addNote.mutate()
                }}
              >
                <Textarea
                  aria-label="New note"
                  rows={3}
                  maxLength={2000}
                  placeholder="Add a private note about this candidate…"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
                <div className="flex justify-end">
                  <Button type="submit" size="sm" disabled={!note.trim() || addNote.isPending}>
                    <Send size={14} />
                    Add Note
                  </Button>
                </div>
              </form>
              {app.notes.length === 0 && <p className="text-sm text-gray-400">No notes yet. Only your team can see notes.</p>}
              {app.notes.map((item) => (
                <div key={item.id} className="rounded-lg bg-gray-50 p-3">
                  <p className="text-sm whitespace-pre-line text-gray-800">{item.body}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {item.author_name ?? 'Former team member'} · {formatDate(item.created_at)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="font-semibold">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {[...app.events].reverse().map((event, index, events) => (
                <div key={index} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />
                    {index < events.length - 1 && <div className="h-8 w-px bg-gray-200" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-sm text-gray-800">
                      {event.from_stage
                        ? `Moved from ${STAGES[event.from_stage].label} to ${STAGES[event.to_stage].label}`
                        : 'Applied'}
                      {event.from_stage && event.actor_name && <span className="text-gray-500"> by {event.actor_name}</span>}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(event.created_at)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
