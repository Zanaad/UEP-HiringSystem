import { Link, Outlet } from 'react-router-dom'

export default function RecruiterLayout() {
  return (
    <div>
      <header>
        <nav>
          <Link to="/recruiter">Dashboard</Link>{' '}
          <Link to="/recruiter/jobs">Jobs</Link>{' '}
          <Link to="/recruiter/pipeline">Pipeline</Link>{' '}
          <Link to="/recruiter/settings">Settings</Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
