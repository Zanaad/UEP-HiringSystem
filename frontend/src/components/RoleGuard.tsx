import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { UserRole } from '../services/auth.service'
import { homePath, useAuthStore } from '../stores/auth.store'

export default function RoleGuard({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={homePath(user.role)} replace />
  }

  return <Outlet />
}
