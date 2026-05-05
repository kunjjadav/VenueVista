import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { logout, selectIsAuthenticated, selectCurrentUser, selectRefreshToken, selectIsStaff } from '../../store/authSlice'
import { useLogoutMutation } from '../../api/authApi'

export default function Navbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user = useSelector(selectCurrentUser)
  const refreshToken = useSelector(selectRefreshToken)
  const isStaff = useSelector(selectIsStaff)
  const [logoutMutation] = useLogoutMutation()

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await logoutMutation({ refresh: refreshToken }).unwrap()
      }
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      dispatch(logout())
      navigate('/login')
    }
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span className="navbar-logo">◆ VenueVista</span>
        </Link>
        <span className="navbar-tagline">Location Intelligence</span>
      </div>

      <div className="navbar-actions">
        {isAuthenticated && (
          <>
            {isStaff && (
              <Link to="/admin-panel" className="btn btn-secondary btn-sm" id="admin-panel-link">
                ⚙️ Admin
              </Link>
            )}
            <Link to="/dashboard" className="btn btn-secondary btn-sm">
              📊 Dashboard
            </Link>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              {user?.email || ''}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  )
}

