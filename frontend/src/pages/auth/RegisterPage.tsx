import { Link, Navigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '../../components/ui/button'
import { FormField } from '../../components/ui/form-field'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { cn } from '../../components/ui/utils'
import AuthLayout from '../../layouts/AuthLayout'
import { getApiErrorMessage } from '../../services/api'
import { authService, type UserRole } from '../../services/auth.service'
import { homePath, useAuthStore } from '../../stores/auth.store'
import { registerSchema } from '../../utils/authValidation'

const roles: { value: UserRole; title: string; description: string }[] = [
  { value: 'recruiter', title: 'Hire Talent', description: "I'm a recruiter" },
  { value: 'candidate', title: 'Find a Job', description: "I'm a candidate" },
]

export default function RegisterPage() {
  const user = useAuthStore((state) => state.user)
  const setSession = useAuthStore((state) => state.setSession)
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', role: 'candidate' as UserRole },
  })
  const selectedRole = useWatch({ control, name: 'role' })

  if (user) return <Navigate to={homePath(user.role)} replace />

  const onSubmit = handleSubmit(async (values) => {
    try {
      setSession(await authService.register(values))
    } catch (error) {
      setError('root', { message: getApiErrorMessage(error, 'Unable to create account.') })
    }
  })

  return (
    <AuthLayout
      title="Create account"
      subtitle="Create your account and get started today."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <div className="mb-6">
        <Label className="mb-3 block">I want to:</Label>
        <div className="grid grid-cols-2 gap-3">
          {roles.map((role) => (
            <button
              key={role.value}
              type="button"
              aria-pressed={selectedRole === role.value}
              onClick={() => setValue('role', role.value)}
              className={cn(
                'rounded-xl border-2 p-4 text-left transition-all',
                selectedRole === role.value ? 'border-primary bg-blue-50' : 'border-gray-200 hover:border-gray-300',
              )}
            >
              <div className="font-semibold text-gray-900">{role.title}</div>
              <div className="text-sm text-gray-600">{role.description}</div>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormField id="name" label="Full Name" error={errors.name?.message}>
          <Input
            id="name"
            autoComplete="name"
            placeholder="John Doe"
            className="h-11"
            aria-invalid={!!errors.name}
            {...register('name')}
          />
        </FormField>
        <FormField id="email" label={selectedRole === 'recruiter' ? 'Work Email' : 'Email'} error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="h-11"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
        </FormField>
        <FormField
          id="password"
          label="Password"
          error={errors.password?.message}
          hint="At least 8 characters, with uppercase, lowercase, a number and a special character."
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className="h-11"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
        </FormField>
        {errors.root && <p className="text-destructive text-sm">{errors.root.message}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  )
}
