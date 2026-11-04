import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { toast } from 'sonner'
import { AccountCard, PasswordCard } from '../../components/SettingsCards'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { FormField } from '../../components/ui/form-field'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import { getApiErrorMessage } from '../../services/api'
import { accountService, COMPANY_SIZES, type Company } from '../../services/account.service'

const companySchema = z.object({
  name: z.string().trim().min(2, 'Company name is required.').max(120),
  website: z.union([z.literal(''), z.url({ protocol: /^https?$/, error: 'Enter a full http(s) URL.' })]),
  industry: z.string().trim().max(120),
  size: z.enum(['', ...COMPANY_SIZES]),
  location: z.string().trim().max(120),
})

export default function RecruiterSettingsPage() {
  const { data: company, isError, refetch } = useQuery({ queryKey: ['company'], queryFn: accountService.getCompany })

  return (
    <div className="max-w-4xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and company information.</p>
      </div>
      <AccountCard />
      {company && <CompanyCard company={company} />}
      {isError && (
        <Card className="border-gray-200 p-6 text-center">
          <p className="mb-4 text-gray-600">Could not load company information.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </Card>
      )}
      <PasswordCard />
    </div>
  )
}

function CompanyCard({ company }: { company: Company }) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<z.infer<typeof companySchema>>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company.name,
      website: company.website ?? '',
      industry: company.industry ?? '',
      size: company.size ?? '',
      location: company.location ?? '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const updated = await accountService.updateCompany({
        name: values.name,
        website: values.website || null,
        industry: values.industry || null,
        size: values.size || null,
        location: values.location || null,
      })
      queryClient.setQueryData(['company'], updated)
      // Job cards show the company name.
      queryClient.invalidateQueries({ queryKey: ['recruiter-jobs'] })
      reset({ ...values, website: updated.website ?? '' })
      toast.success('Company information saved')
    } catch (error) {
      setError('root', { message: getApiErrorMessage(error, 'Could not save company information.') })
    }
  })

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Company Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="company_name" label="Company Name" error={errors.name?.message}>
              <Input id="company_name" aria-invalid={!!errors.name} {...register('name')} />
            </FormField>
            <FormField id="website" label="Company Website" error={errors.website?.message}>
              <Input id="website" placeholder="https://…" aria-invalid={!!errors.website} {...register('website')} />
            </FormField>
            <FormField id="industry" label="Industry" error={errors.industry?.message}>
              <Input id="industry" placeholder="e.g. Software" {...register('industry')} />
            </FormField>
            <FormField id="size" label="Company Size">
              <Select id="size" {...register('size')}>
                <option value="">Not specified</option>
                {COMPANY_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} employees
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField id="company_location" label="Headquarters Location" error={errors.location?.message}>
              <Input id="company_location" placeholder="e.g. Prishtina" {...register('location')} />
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
