import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { authService, type UserRole } from '../../services/auth.service'
import { validateEmail, validateName, validatePassword } from '../../utils/authValidation'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('candidate')
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const nameError = validateName(name)
    if (nameError) {
      setError(nameError)
      return
    }

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
      const response = await authService.register({ name, email, password, role })
      authService.saveSession(response.data)
      navigate(response.data.user.role === 'recruiter' ? '/recruiter' : '/candidate')
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.detail) {
        setError(error.response.data.detail)
        return
      }
      setError('Unable to create account')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #eff6ff, #e0edff)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '2rem', margin: 0, color: '#111827' }}>HirePrep</h1>
          <p style={{ color: '#4b5563' }}>Create your account and get started today.</p>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '2rem' }}>
          <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Create account</h2>

          <p style={{ marginTop: 0, color: '#374151' }}>I want to:</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <button
              type="button"
              onClick={() => setRole('recruiter')}
              style={{
                padding: '0.75rem',
                borderRadius: 10,
                border: role === 'recruiter' ? '2px solid #3182ce' : '1px solid #d1d5db',
                background: role === 'recruiter' ? '#eff6ff' : '#fff',
                fontWeight: 600,
              }}
            >
              Hire Talent
            </button>
            <button
              type="button"
              onClick={() => setRole('candidate')}
              style={{
                padding: '0.75rem',
                borderRadius: 10,
                border: role === 'candidate' ? '2px solid #3182ce' : '1px solid #d1d5db',
                background: role === 'candidate' ? '#eff6ff' : '#fff',
                fontWeight: 600,
              }}
            >
              Find a Job
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gap: '0.4rem' }}>
              <label htmlFor="register-name" style={{ color: '#374151', fontWeight: 500 }}>Full Name</label>
              <input id="register-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="John Doe" autoComplete="name" required style={{ height: 44, padding: '0 0.75rem', border: '1px solid #d1d5db', borderRadius: 10 }} />
            </div>
            <div style={{ display: 'grid', gap: '0.4rem' }}>
              <label htmlFor="register-email" style={{ color: '#374151', fontWeight: 500 }}>Work Email</label>
              <input id="register-email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" type="email" autoComplete="email" required style={{ height: 44, padding: '0 0.75rem', border: '1px solid #d1d5db', borderRadius: 10 }} />
            </div>
            <div style={{ display: 'grid', gap: '0.4rem' }}>
              <label htmlFor="register-password" style={{ color: '#374151', fontWeight: 500 }}>Password</label>
              <input id="register-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" type="password" autoComplete="new-password" required style={{ height: 44, padding: '0 0.75rem', border: '1px solid #d1d5db', borderRadius: 10 }} />
            </div>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '0.85rem' }}>
              Password must be 8+ chars and include uppercase, lowercase, number, and special character.
            </p>
            <label htmlFor="terms" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#4b5563', fontSize: '0.92rem' }}>
              <input id="terms" type="checkbox" required style={{ marginTop: 2 }} />
              <span>
                I agree to the <a href="#" style={{ color: '#3182ce', textDecoration: 'none' }}>Terms of Service</a> and <a href="#" style={{ color: '#3182ce', textDecoration: 'none' }}>Privacy Policy</a>
              </span>
            </label>
            {error ? <p style={{ color: 'crimson', margin: 0 }}>{error}</p> : null}
            <button type="submit" style={{ height: 44, border: 0, borderRadius: 10, background: '#3182ce', color: '#fff', fontWeight: 600 }}>
              Create account
            </button>
          </form>

          <p style={{ marginTop: '1rem', textAlign: 'center', color: '#4b5563' }}>
            Already have an account? <Link to="/login" style={{ color: '#3182ce', fontWeight: 600 }}>Log in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
