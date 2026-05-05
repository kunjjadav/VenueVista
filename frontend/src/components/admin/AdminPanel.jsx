import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../layout/Navbar'
import {
  useGetAdminStatsQuery,
  useGetAdminUsersQuery,
  useUpdateAdminUserMutation,
  useDeleteAdminUserMutation,
  useGetAdminRestaurantsQuery,
  useDeleteAdminRestaurantMutation,
  useGetAdminClustersQuery,
  useGetAdminTasksQuery,
} from '../../api/adminApi'

const TABS = [
  { key: 'users', label: '👥 Users' },
  { key: 'restaurants', label: '🍽️ Restaurants' },
  { key: 'clusters', label: '📍 Clusters' },
  { key: 'tasks', label: '⚡ Tasks' },
]

function StatCard({ label, value, sub, color }) {
  return (
    <motion.div
      className="glass-card admin-stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="admin-stat-value" style={{ color: color || 'var(--accent-cyan)' }}>
        {value}
      </div>
      <div className="admin-stat-label">{label}</div>
      {sub && <div className="admin-stat-sub">{sub}</div>}
    </motion.div>
  )
}

function StateTag({ state }) {
  const map = {
    COMPLETED: { cls: 'tag-success', label: 'Completed' },
    IN_PROGRESS: { cls: 'tag-info', label: 'In Progress' },
    FAILED: { cls: 'tag-danger', label: 'Failed' },
    PENDING: { cls: 'tag-muted', label: 'Pending' },
  }
  const m = map[state] || { cls: 'tag-muted', label: state }
  return <span className={`admin-tag ${m.cls}`}>{m.label}</span>
}

function BoolTag({ value, trueLabel = 'Yes', falseLabel = 'No' }) {
  return (
    <span className={`admin-tag ${value ? 'tag-success' : 'tag-muted'}`}>
      {value ? trueLabel : falseLabel}
    </span>
  )
}

function UsersTab() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useGetAdminUsersQuery({ search, page })
  const [updateUser] = useUpdateAdminUserMutation()
  const [deleteUser] = useDeleteAdminUserMutation()
  const [editingUser, setEditingUser] = useState(null)

  const users = data?.results || (Array.isArray(data) ? data : [])
  const hasNext = !!data?.next
  const hasPrev = !!data?.previous

  const handleToggle = async (user, field) => {
    await updateUser({ id: user.id, [field]: !user[field] })
  }

  const handleDeactivate = async (user) => {
    if (window.confirm(`Deactivate user ${user.email}?`)) {
      await deleteUser(user.id)
    }
  }

  return (
    <div>
      <div className="admin-toolbar">
        <input
          type="text"
          className="input-field admin-search"
          placeholder="Search users by email or username..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
        <div className="admin-count">
          {data?.count !== undefined ? `${data.count} users` : ''}
        </div>
      </div>

      {isLoading ? (
        <div className="admin-loading"><div className="spinner" /></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Username</th>
                <th>Joined</th>
                <th>API Calls</th>
                <th>Staff</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="admin-td-primary">{u.email}</td>
                  <td>{u.username}</td>
                  <td className="admin-td-mono">{new Date(u.date_joined).toLocaleDateString()}</td>
                  <td className="admin-td-mono">{u.profile?.api_calls_used ?? 0}</td>
                  <td>
                    <button
                      className={`admin-toggle ${u.is_staff ? 'active' : ''}`}
                      onClick={() => handleToggle(u, 'is_staff')}
                      title="Toggle staff status"
                    >
                      {u.is_staff ? '✓' : '✕'}
                    </button>
                  </td>
                  <td>
                    <BoolTag value={u.is_active} trueLabel="Active" falseLabel="Inactive" />
                  </td>
                  <td>
                    <div className="admin-actions">
                      {u.is_active && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeactivate(u)}
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={7} className="admin-td-empty">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {(hasNext || hasPrev) && (
        <div className="admin-pagination">
          <button className="btn btn-secondary btn-sm" disabled={!hasPrev} onClick={() => setPage((p) => p - 1)}>
            ← Previous
          </button>
          <span className="admin-page-num">Page {page}</span>
          <button className="btn btn-secondary btn-sm" disabled={!hasNext} onClick={() => setPage((p) => p + 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

function RestaurantsTab() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useGetAdminRestaurantsQuery({ search, page })
  const [deleteRestaurant] = useDeleteAdminRestaurantMutation()

  const restaurants = data?.results || (Array.isArray(data) ? data : [])
  const hasNext = !!data?.next
  const hasPrev = !!data?.previous

  const handleDelete = async (r) => {
    if (window.confirm(`Delete "${r.name}"? This cannot be undone.`)) {
      await deleteRestaurant(r.id)
    }
  }

  const priceLabels = ['Free', '$', '$$', '$$$', '$$$$']

  return (
    <div>
      <div className="admin-toolbar">
        <input
          type="text"
          className="input-field admin-search"
          placeholder="Search restaurants by name, address, or cuisine..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
        <div className="admin-count">
          {data?.count !== undefined ? `${data.count} restaurants` : ''}
        </div>
      </div>

      {isLoading ? (
        <div className="admin-loading"><div className="spinner" /></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Rating</th>
                <th>Price</th>
                <th>Cuisine</th>
                <th>Reviews</th>
                <th>Source</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r) => (
                <tr key={r.id}>
                  <td className="admin-td-primary">{r.name}</td>
                  <td>
                    <span className="admin-rating">
                      {r.rating ? `${r.rating}★` : '—'}
                    </span>
                  </td>
                  <td>{r.price_level !== null ? priceLabels[r.price_level] || '—' : '—'}</td>
                  <td className="admin-td-cuisine">{r.inferred_cuisine || '—'}</td>
                  <td className="admin-td-mono">{r.user_ratings_total}</td>
                  <td>
                    <span className={`admin-tag ${r.is_from_csv ? 'tag-info' : 'tag-success'}`}>
                      {r.is_from_csv ? 'CSV' : 'API'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {restaurants.length === 0 && (
                <tr><td colSpan={7} className="admin-td-empty">No restaurants found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {(hasNext || hasPrev) && (
        <div className="admin-pagination">
          <button className="btn btn-secondary btn-sm" disabled={!hasPrev} onClick={() => setPage((p) => p - 1)}>
            ← Previous
          </button>
          <span className="admin-page-num">Page {page}</span>
          <button className="btn btn-secondary btn-sm" disabled={!hasNext} onClick={() => setPage((p) => p + 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

function ClustersTab() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useGetAdminClustersQuery({ page })

  const clusters = data?.results || (Array.isArray(data) ? data : [])
  const hasNext = !!data?.next
  const hasPrev = !!data?.previous

  const getScoreColor = (score) => {
    if (score >= 70) return 'var(--accent-emerald)'
    if (score >= 40) return 'var(--accent-amber)'
    return 'var(--accent-rose)'
  }

  return (
    <div>
      {isLoading ? (
        <div className="admin-loading"><div className="spinner" /></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Viability</th>
                <th>Restaurants</th>
                <th>Avg Rating</th>
                <th>Avg Price</th>
                <th>Competition</th>
                <th>Cuisine</th>
                <th>Created By</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {clusters.map((c) => (
                <tr key={c.id}>
                  <td className="admin-td-mono">#{c.id}</td>
                  <td>
                    <span
                      className="admin-score-badge"
                      style={{ color: getScoreColor(c.viability_score), borderColor: getScoreColor(c.viability_score) }}
                    >
                      {c.viability_score?.toFixed(1)}
                    </span>
                  </td>
                  <td className="admin-td-mono">{c.restaurant_count}</td>
                  <td className="admin-td-mono">{c.avg_rating?.toFixed(1) ?? '—'}</td>
                  <td className="admin-td-mono">{c.avg_price_level?.toFixed(1) ?? '—'}</td>
                  <td className="admin-td-mono">{c.avg_nearby_competition?.toFixed(1)}</td>
                  <td className="admin-td-cuisine">{c.cuisine_filter || 'All'}</td>
                  <td>{c.created_by_email || '—'}</td>
                  <td className="admin-td-mono">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {clusters.length === 0 && (
                <tr><td colSpan={9} className="admin-td-empty">No clusters found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {(hasNext || hasPrev) && (
        <div className="admin-pagination">
          <button className="btn btn-secondary btn-sm" disabled={!hasPrev} onClick={() => setPage((p) => p - 1)}>
            ← Previous
          </button>
          <span className="admin-page-num">Page {page}</span>
          <button className="btn btn-secondary btn-sm" disabled={!hasNext} onClick={() => setPage((p) => p + 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

function TasksTab() {
  const [stateFilter, setStateFilter] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useGetAdminTasksQuery({ state: stateFilter, page })

  const tasks = data?.results || (Array.isArray(data) ? data : [])
  const hasNext = !!data?.next
  const hasPrev = !!data?.previous

  return (
    <div>
      <div className="admin-toolbar">
        <select
          className="input-field admin-filter-select"
          value={stateFilter}
          onChange={(e) => { setStateFilter(e.target.value); setPage(1) }}
        >
          <option value="">All States</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
        </select>
        <div className="admin-count">
          {data?.count !== undefined ? `${data.count} tasks` : ''}
        </div>
      </div>

      {isLoading ? (
        <div className="admin-loading"><div className="spinner" /></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Type</th>
                <th>State</th>
                <th>Progress</th>
                <th>Grid</th>
                <th>New Restaurants</th>
                <th>Created By</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td className="admin-td-mono admin-td-taskid" title={t.task_id}>
                    {t.task_id?.slice(0, 8)}…
                  </td>
                  <td>{t.task_type}</td>
                  <td><StateTag state={t.state} /></td>
                  <td>
                    <div className="admin-progress-bar">
                      <div
                        className="admin-progress-fill"
                        style={{ width: `${t.progress_percent || 0}%` }}
                      />
                    </div>
                    <span className="admin-td-mono" style={{ fontSize: '0.7rem' }}>
                      {t.progress_percent}%
                    </span>
                  </td>
                  <td className="admin-td-mono">
                    {t.grid_points_processed}/{t.grid_points_total}
                  </td>
                  <td className="admin-td-mono">{t.restaurants_new}</td>
                  <td>{t.created_by_email || '—'}</td>
                  <td className="admin-td-mono">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr><td colSpan={8} className="admin-td-empty">No tasks found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {(hasNext || hasPrev) && (
        <div className="admin-pagination">
          <button className="btn btn-secondary btn-sm" disabled={!hasPrev} onClick={() => setPage((p) => p - 1)}>
            ← Previous
          </button>
          <span className="admin-page-num">Page {page}</span>
          <button className="btn btn-secondary btn-sm" disabled={!hasNext} onClick={() => setPage((p) => p + 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

const TAB_COMPONENTS = {
  users: UsersTab,
  restaurants: RestaurantsTab,
  clusters: ClustersTab,
  tasks: TasksTab,
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users')
  const { data: stats, isLoading: statsLoading } = useGetAdminStatsQuery()
  const s = stats?.data || {}

  const ActiveComponent = TAB_COMPONENTS[activeTab]

  return (
    <div className="app-shell" style={{ overflow: 'auto' }}>
      <Navbar />

      <div className="admin-container">
        {/* Header */}
        <motion.div
          className="admin-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="admin-title">⚙️ Admin Panel</h1>
            <p className="admin-subtitle">
              Manage users, data, and monitor platform health
            </p>
          </div>
          <Link to="/" className="btn btn-secondary btn-sm">
            ← Back to Map
          </Link>
        </motion.div>

        {/* Stats Row */}
        <div className="admin-stats-grid">
          <StatCard
            label="Total Users"
            value={s.users?.total ?? '—'}
            sub={s.users?.new_this_week ? `+${s.users.new_this_week} this week` : null}
            color="var(--accent-cyan)"
          />
          <StatCard
            label="Restaurants"
            value={s.restaurants?.total ?? '—'}
            sub={s.restaurants?.total ? `${s.restaurants.from_csv} CSV · ${s.restaurants.from_api} API` : null}
            color="var(--accent-amber)"
          />
          <StatCard
            label="Clusters"
            value={s.clusters?.total ?? '—'}
            sub={s.clusters?.avg_viability ? `Avg viability: ${s.clusters.avg_viability}` : null}
            color="var(--accent-emerald)"
          />
          <StatCard
            label="Tasks"
            value={s.tasks?.total ?? '—'}
            sub={s.tasks?.total ? `✓${s.tasks.completed} · ✕${s.tasks.failed} · ⏳${s.tasks.pending}` : null}
            color="var(--accent-violet)"
          />
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          className="admin-tab-content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <ActiveComponent />
        </motion.div>
      </div>
    </div>
  )
}
