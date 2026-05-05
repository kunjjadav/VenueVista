import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useLoginMutation } from '../../api/authApi'
import { setCredentials } from '../../store/authSlice'
import { motion } from 'framer-motion'

export default function LoginForm() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [login, { isLoading }] = useLoginMutation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const result = await login({ email, password }).unwrap()
      dispatch(setCredentials({
        access: result.access,
        refresh: result.refresh,
        is_staff: result.is_staff,
        user: { email: result.email, username: result.username },
      }))
      navigate('/')
    } catch (err) {
      const data = err?.data
      const detail = data?.error?.detail?.detail || data?.error?.detail || data?.detail
      setError(typeof detail === 'string' ? detail : 'Invalid credentials. Please try again.')
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
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to VenueVista</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="input-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              className="input-field"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="input-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={isLoading}
            style={{ marginTop: 'var(--space-md)' }}
          >
            {isLoading ? (
              <><span className="spinner spinner-sm" /> Signing in...</>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: 'var(--space-xl)',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
        }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ fontWeight: 600 }}>Create one</Link>
        </p>
      </motion.div>
    </div>
  )
}
