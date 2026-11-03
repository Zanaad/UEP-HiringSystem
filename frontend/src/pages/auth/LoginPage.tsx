import { Link, Navigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '../../components/ui/button'
import { FormField } from '../../components/ui/form-field'
import { Input } from '../../components/ui/input'
import AuthLayout from '../../layouts/AuthLayout'
import { getApiErrorMessage } from '../../services/api'
import { authService } from '../../services/auth.service'
import { homePath, useAuthStore } from '../../stores/auth.store'
import { loginSchema } from '../../utils/authValidation'

export default function LoginPage() {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const setSession = useAuthStore((state) => state.setSession)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  if (user) {
    const from = (location.state as { from?: string } | null)?.from
    const target = from?.startsWith(homePath(user.role)) ? from : homePath(user.role)
    return <Navigate to={target} replace />
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      setSession(await authService.login(values))
    } catch (error) {
      setError('root', { message: getApiErrorMessage(error, 'Invalid email or password.') })
    }
  })

  return (
    <AuthLayout
      title="Log in"
      subtitle="Welcome back! Please log in to your account."
      footer={
        <>
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormField id="email" label="Email" error={errors.email?.message}>
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
        <FormField id="password" label="Password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-11"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
        </FormField>
        {errors.root && <p className="text-destructive text-sm">{errors.root.message}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </AuthLayout>
  )
}
