import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { FormField } from './ui/form-field'
import { Input } from './ui/input'
import { getApiErrorMessage } from '../services/api'
import { accountService } from '../services/account.service'
import { useAuthStore } from '../stores/auth.store'
import { registerSchema } from '../utils/authValidation'

const accountSchema = z.object({ name: registerSchema.shape.name })

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Enter your current password.'),
    new_password: registerSchema.shape.password,
    confirm_password: z.string(),
  })
  .refine((values) => values.new_password === values.confirm_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match.',
  })

export function AccountCard() {
  const user = useAuthStore((state) => state.user)!
  const updateUser = useAuthStore((state) => state.updateUser)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({ resolver: zodResolver(accountSchema), defaultValues: { name: user.name } })

  const onSubmit = handleSubmit(async ({ name }) => {
    try {
      const updated = await accountService.updateName(name)
      updateUser(updated)
      reset({ name: updated.name })
      toast.success('Account updated')
    } catch (error) {
      setError('root', { message: getApiErrorMessage(error, 'Could not update your account.') })
    }
  })

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="account_name" label="Full Name" error={errors.name?.message}>
              <Input id="account_name" autoComplete="name" aria-invalid={!!errors.name} {...register('name')} />
            </FormField>
            <FormField id="account_email" label="Email" hint="Email changes aren't supported yet.">
              <Input id="account_email" value={user.email} disabled readOnly />
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

export function PasswordCard() {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  })

  const onSubmit = handleSubmit(async ({ current_password, new_password }) => {
    try {
      await accountService.changePassword(current_password, new_password)
      reset()
      toast.success('Password updated')
    } catch (error) {
      setError('root', { message: getApiErrorMessage(error, 'Could not update your password.') })
    }
  })

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Change Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField id="current_password" label="Current Password" error={errors.current_password?.message}>
            <Input
              id="current_password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.current_password}
              {...register('current_password')}
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="new_password"
              label="New Password"
              error={errors.new_password?.message}
              hint="At least 8 characters, with uppercase, lowercase, a number and a special character."
            >
              <Input
                id="new_password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.new_password}
                {...register('new_password')}
              />
            </FormField>
            <FormField id="confirm_password" label="Confirm New Password" error={errors.confirm_password?.message}>
              <Input
                id="confirm_password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.confirm_password}
                {...register('confirm_password')}
              />
            </FormField>
          </div>
          {errors.root && <p className="text-destructive text-sm">{errors.root.message}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating…' : 'Update Password'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
