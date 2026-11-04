import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { toast } from 'sonner'
import { Download, FileText, Upload } from 'lucide-react'
import { AccountCard, PasswordCard } from '../../components/SettingsCards'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { FormField } from '../../components/ui/form-field'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import { getApiErrorMessage } from '../../services/api'
import { EDUCATION_LEVELS } from '../../services/jobs.service'
import { profileService, type CandidateEducation, type CandidateProfile } from '../../services/profile.service'

const MAX_RESUME_BYTES = 5 * 1024 * 1024

const optionalUrl = z.union([z.literal(''), z.url({ protocol: /^https?$/, error: 'Enter a full http(s) URL.' })])

const profileSchema = z.object({
  headline: z.string().trim().max(120),
  location: z.string().trim().max(120),
  phone: z.string().trim().regex(/^$|^[+0-9 ()-]{6,30}$/, 'Enter a valid phone number.'),
  experience_years: z.number({ error: 'Enter a number.' }).int().min(0).max(50, 'At most 50 years.'),
  education_level: z.enum(['', 'high-school', 'bachelor', 'master', 'phd']),
  skills: z.string().max(1000),
  linkedin_url: optionalUrl,
  github_url: optionalUrl,
  portfolio_url: optionalUrl,
})

type ProfileFormValues = z.infer<typeof profileSchema>

const splitSkills = (value: string) =>
  value
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean)

export default function CandidateSettingsPage() {
  const { data: profile, isPending, isError, refetch } = useQuery({ queryKey: ['profile'], queryFn: profileService.get })

  return (
    <div className="max-w-4xl p-4 md:p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account, resume and the profile used to match you with jobs.</p>
      </div>

      <div className="mb-6">
        <AccountCard />
      </div>
      {isPending && <p className="py-16 text-center text-gray-500">Loading profile…</p>}
      {isError && (
        <div className="py-16 text-center">
          <p className="mb-4 text-gray-600">Could not load your profile.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}
      {profile && (
        <div className="space-y-6">
          <ResumeCard profile={profile} />
          <ProfileForm profile={profile} />
        </div>
      )}
      <div className="mt-6">
        <PasswordCard />
      </div>
    </div>
  )
}

function ResumeCard({ profile }: { profile: CandidateProfile }) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  const upload = useMutation({
    mutationFn: profileService.uploadResume,
    onSuccess: (updated) => {
      queryClient.setQueryData(['profile'], updated)
      toast.success('Resume uploaded')
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Could not upload the resume.')),
  })

  const onFileSelected = (file: File | undefined) => {
    setError('')
    if (!file) return
    if (!/\.(pdf|docx)$/i.test(file.name)) return setError('Upload a PDF or DOCX file.')
    if (file.size > MAX_RESUME_BYTES) return setError('Resume must be 5 MB or smaller.')
    upload.mutate(file)
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Resume / CV</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-100">
            <FileText size={16} className="text-red-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{profile.resume_filename ?? 'No resume uploaded yet'}</p>
            <p className="text-xs text-gray-500">PDF or DOCX, up to 5 MB. Recruiters see it when you apply.</p>
          </div>
          {profile.resume_filename && (
            <Button variant="outline" size="sm" onClick={() => profileService.downloadResume(profile.resume_filename!)}>
              <Download size={15} />
              Download
            </Button>
          )}
          <Button size="sm" disabled={upload.isPending} onClick={() => inputRef.current?.click()}>
            <Upload size={15} />
            {upload.isPending ? 'Uploading…' : profile.resume_filename ? 'Replace' : 'Upload'}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={(event) => {
              onFileSelected(event.target.files?.[0])
              event.target.value = ''
            }}
          />
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
      </CardContent>
    </Card>
  )
}

function ProfileForm({ profile }: { profile: CandidateProfile }) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      headline: profile.headline ?? '',
      location: profile.location ?? '',
      phone: profile.phone ?? '',
      experience_years: profile.experience_years,
      education_level: profile.education_level ?? '',
      skills: profile.skills.join(', '),
      linkedin_url: profile.linkedin_url ?? '',
      github_url: profile.github_url ?? '',
      portfolio_url: profile.portfolio_url ?? '',
    },
  })

  const onSubmit = handleSubmit(async ({ skills, education_level, ...values }) => {
    try {
      const updated = await profileService.update({
        ...values,
        headline: values.headline || null,
        location: values.location || null,
        phone: values.phone || null,
        linkedin_url: values.linkedin_url || null,
        github_url: values.github_url || null,
        portfolio_url: values.portfolio_url || null,
        education_level: (education_level || null) as CandidateEducation | null,
        skills: splitSkills(skills),
      })
      queryClient.setQueryData(['profile'], updated)
      // Match scores depend on the profile.
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['my-applications'] })
      reset({ skills: updated.skills.join(', '), education_level, ...values })
      toast.success('Profile saved')
    } catch (error) {
      setError('root', { message: getApiErrorMessage(error, 'Could not save your profile.') })
    }
  })

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Professional Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField id="headline" label="Headline" error={errors.headline?.message}>
            <Input id="headline" placeholder="e.g. Junior Frontend Developer" {...register('headline')} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="location" label="Location" error={errors.location?.message}>
              <Input id="location" placeholder="e.g. Prishtina" {...register('location')} />
            </FormField>
            <FormField id="phone" label="Phone Number" error={errors.phone?.message}>
              <Input id="phone" type="tel" placeholder="+383 44 123 456" aria-invalid={!!errors.phone} {...register('phone')} />
            </FormField>
            <FormField id="experience_years" label="Years of Experience" error={errors.experience_years?.message}>
              <Input
                id="experience_years"
                type="number"
                min={0}
                max={50}
                aria-invalid={!!errors.experience_years}
                {...register('experience_years', { valueAsNumber: true })}
              />
            </FormField>
            <FormField id="education_level" label="Highest Education">
              <Select id="education_level" {...register('education_level')}>
                <option value="">Not specified</option>
                {Object.entries(EDUCATION_LEVELS)
                  .filter(([value]) => value !== 'any')
                  .map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
              </Select>
            </FormField>
          </div>
          <FormField id="skills" label="Skills" hint="Comma separated, e.g. React, TypeScript, SQL" error={errors.skills?.message}>
            <Input id="skills" placeholder="React, TypeScript, SQL" {...register('skills')} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField id="linkedin_url" label="LinkedIn URL" error={errors.linkedin_url?.message}>
              <Input id="linkedin_url" placeholder="https://linkedin.com/in/…" aria-invalid={!!errors.linkedin_url} {...register('linkedin_url')} />
            </FormField>
            <FormField id="github_url" label="GitHub URL" error={errors.github_url?.message}>
              <Input id="github_url" placeholder="https://github.com/…" aria-invalid={!!errors.github_url} {...register('github_url')} />
            </FormField>
            <FormField id="portfolio_url" label="Portfolio / Website" error={errors.portfolio_url?.message}>
              <Input id="portfolio_url" placeholder="https://…" aria-invalid={!!errors.portfolio_url} {...register('portfolio_url')} />
            </FormField>
          </div>
          {errors.root && <p className="text-destructive text-sm">{errors.root.message}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
