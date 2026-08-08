import { Navigate, Outlet } from 'react-router-dom'
import { authService, type UserRole } from '../services/auth.service'

type RoleGuardProps = {
  allowedRoles?: UserRole[]
}

export default function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const token = authService.getToken()
  const currentUser = authService.getCurrentUser()

  if (!token || !currentUser) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to={currentUser.role === 'recruiter' ? '/recruiter' : '/candidate'} replace />
  }

  return <Outlet />
}
