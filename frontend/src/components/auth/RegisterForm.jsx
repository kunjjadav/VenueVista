import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useRegisterMutation } from '../../api/authApi'
import { motion } from 'framer-motion'

export default function RegisterForm() {
  const navigate = useNavigate()
  const [register, { isLoading }] = useRegisterMutation()

  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    password_confirm: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.password_confirm) {
      setError('Passwords do not match.')
      return
    }

    try {
      await register(form).unwrap()
      setSuccess(true)
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      const data = err?.data
      const detail = data?.error?.detail || data?.detail || data
      if (typeof detail === 'object' && detail !== null) {
        const messages = Object.entries(detail).map(([k, v]) =>
          `${k}: ${Array.isArray(v) ? v.join(', ') : v}`
        )
        setError(messages.join(' | '))
      } else {
        setError(detail || 'Registration failed. Please try again.')
      }
    }
  }

  return (
    <div className="auth-container">
      <motion.div
        className="auth-card glass-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }}>◆</div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Create your account</p>
        </div>

        {success ? (
          <div className="glass-card" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-md)' }}>✅</div>
            <p style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
              Account created! Redirecting to login...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="input-label" htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                type="email"
                name="email"
                className="input-field"
                placeholder="you@company.com"
                value={form.email}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="input-label" htmlFor="reg-username">Username</label>
              <input
                id="reg-username"
                type="text"
                name="username"
                className="input-field"
                placeholder="johndoe"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="input-label" htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                type="password"
                name="password"
                className="input-field"
                placeholder="Min 8 characters"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
              />
            </div>

            <div className="form-group">
              <label className="input-label" htmlFor="reg-password-confirm">Confirm Password</label>
              <input
                id="reg-password-confirm"
                type="password"
                name="password_confirm"
                className="input-field"
                placeholder="••••••••"
                value={form.password_confirm}
                onChange={handleChange}
                required
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <button
              id="register-submit"
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={isLoading}
              style={{ marginTop: 'var(--space-md)' }}
            >
              {isLoading ? (
                <><span className="spinner spinner-sm" /> Creating account...</>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        )}

        <p style={{
          textAlign: 'center',
          marginTop: 'var(--space-xl)',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
        }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
