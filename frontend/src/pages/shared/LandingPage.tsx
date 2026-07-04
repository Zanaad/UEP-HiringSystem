import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <main>
      <h1>HirePrep</h1>
      <p>Recruiter and candidate hiring platform.</p>
      <Link to="/login">Go to Login</Link>
    </main>
  )
}
