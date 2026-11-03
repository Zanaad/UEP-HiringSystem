import { createBrowserRouter } from 'react-router-dom'
import RoleGuard from './components/RoleGuard'
import AppLayout from './layouts/AppLayout'
import LandingPage from './pages/shared/LandingPage'

// Pages are code-split so each route only downloads what it needs.
const page = (load: () => Promise<{ default: React.ComponentType }>) => async () => ({
  Component: (await load()).default,
})

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', lazy: page(() => import('./pages/auth/LoginPage')) },
  { path: '/register', lazy: page(() => import('./pages/auth/RegisterPage')) },
  {
    element: <RoleGuard allowedRoles={['recruiter']} />,
    children: [
      {
        path: 'recruiter',
        element: <AppLayout />,
        children: [
          { index: true, lazy: page(() => import('./pages/recruiter/DashboardPage')) },
          { path: 'jobs', lazy: page(() => import('./pages/recruiter/JobsPage')) },
          { path: 'pipeline', lazy: page(() => import('./pages/recruiter/PipelinePage')) },
          { path: 'settings', lazy: page(() => import('./pages/recruiter/SettingsPage')) },
        ],
      },
    ],
  },
  {
    element: <RoleGuard allowedRoles={['candidate']} />,
    children: [
      {
        path: 'candidate',
        element: <AppLayout />,
        children: [
          { index: true, lazy: page(() => import('./pages/candidate/DashboardPage')) },
          { path: 'jobs', lazy: page(() => import('./pages/candidate/JobsPage')) },
          { path: 'mock-interviews', lazy: page(() => import('./pages/candidate/MockInterviewsPage')) },
          { path: 'settings', lazy: page(() => import('./pages/candidate/SettingsPage')) },
        ],
      },
    ],
  },
  { path: '*', lazy: page(() => import('./pages/shared/NotFoundPage')) },
])
