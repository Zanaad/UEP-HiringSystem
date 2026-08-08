import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { authService } from '../../services/auth.service'
import { validateEmail, validatePassword } from '../../utils/authValidation'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    try {
      const response = await authService.login({ email, password })
      authService.saveToken(response.data.access_token)
      navigate(response.data.user.role === 'recruiter' ? '/recruiter' : '/candidate')
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.detail) {
        setError(error.response.data.detail)
        return
      }
      setError('Invalid email or password')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #eff6ff, #e0edff)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '2rem', margin: 0, color: '#111827' }}>HirePrep</h1>
          <p style={{ color: '#4b5563' }}>Welcome back! Please login to your account.</p>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '2rem' }}>
          <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Log in</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gap: '0.4rem' }}>
              <label htmlFor="login-email" style={{ color: '#374151', fontWeight: 500 }}>Email</label>
              <input id="login-email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" type="email" autoComplete="email" required style={{ height: 44, padding: '0 0.75rem', border: '1px solid #d1d5db', borderRadius: 10 }} />
            </div>
            <div style={{ display: 'grid', gap: '0.4rem' }}>
              <label htmlFor="login-password" style={{ color: '#374151', fontWeight: 500 }}>Password</label>
              <input id="login-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" type="password" autoComplete="current-password" required style={{ height: 44, padding: '0 0.75rem', border: '1px solid #d1d5db', borderRadius: 10 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.92rem' }}>
              <label htmlFor="remember-me" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#4b5563' }}>
                <input id="remember-me" type="checkbox" />
                Remember me
              </label>
              <a href="#" style={{ color: '#3182ce', textDecoration: 'none' }}>Forgot password?</a>
            </div>
            {error ? <p style={{ color: 'crimson', margin: 0 }}>{error}</p> : null}
            <button type="submit" style={{ height: 44, border: 0, borderRadius: 10, background: '#3182ce', color: '#fff', fontWeight: 600 }}>
              Log in
            </button>
          </form>
          <p style={{ marginTop: '1rem', textAlign: 'center', color: '#4b5563' }}>
            Don't have an account? <Link to="/register" style={{ color: '#3182ce', fontWeight: 600 }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
