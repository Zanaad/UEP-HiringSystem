import { Link, Outlet } from 'react-router-dom'

export default function CandidateLayout() {
  return (
    <div>
      <header>
        <nav>
          <Link to="/candidate">Dashboard</Link>{' '}
          <Link to="/candidate/jobs">Jobs</Link>{' '}
          <Link to="/candidate/mock-interviews">Mock Interviews</Link>{' '}
          <Link to="/candidate/settings">Settings</Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
