import { createBrowserRouter } from 'react-router-dom'
import CandidateLayout from './layouts/CandidateLayout'
import RecruiterLayout from './layouts/RecruiterLayout'
import RoleGuard from './components/RoleGuard'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import CandidateDashboardPage from './pages/candidate/DashboardPage'
import CandidateJobsPage from './pages/candidate/JobsPage'
import MockInterviewsPage from './pages/candidate/MockInterviewsPage'
import CandidateSettingsPage from './pages/candidate/SettingsPage'
import RecruiterDashboardPage from './pages/recruiter/DashboardPage'
import RecruiterJobsPage from './pages/recruiter/JobsPage'
import RecruiterPipelinePage from './pages/recruiter/PipelinePage'
import RecruiterSettingsPage from './pages/recruiter/SettingsPage'
import LandingPage from './pages/shared/LandingPage'
import NotFoundPage from './pages/shared/NotFoundPage'

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <RoleGuard allowedRoles={['recruiter']} />,
    children: [
      {
        path: 'recruiter',
        element: <RecruiterLayout />,
        children: [
          { index: true, element: <RecruiterDashboardPage /> },
          { path: 'jobs', element: <RecruiterJobsPage /> },
          { path: 'pipeline', element: <RecruiterPipelinePage /> },
          { path: 'settings', element: <RecruiterSettingsPage /> },
        ],
      },
    ],
  },
  {
    element: <RoleGuard allowedRoles={['candidate']} />,
    children: [
      {
        path: 'candidate',
        element: <CandidateLayout />,
        children: [
          { index: true, element: <CandidateDashboardPage /> },
          { path: 'jobs', element: <CandidateJobsPage /> },
          { path: 'mock-interviews', element: <MockInterviewsPage /> },
          { path: 'settings', element: <CandidateSettingsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])