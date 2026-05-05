import { Link } from 'react-router-dom'
import { useGetBookmarksQuery, useDeleteBookmarkMutation } from '../../api/bookmarkApi'
import { useGetSearchHistoryQuery } from '../../api/bookmarkApi'
import { useGetProfileQuery } from '../../api/authApi'
import Navbar from '../layout/Navbar'
import { getScoreClass } from '../../utils/helpers'
import { motion } from 'framer-motion'

export default function Dashboard() {
  const { data: profile } = useGetProfileQuery()
  const { data: bookmarksData } = useGetBookmarksQuery()
  const { data: historyData } = useGetSearchHistoryQuery()
  const [deleteBookmark] = useDeleteBookmarkMutation()

  const bookmarks = Array.isArray(bookmarksData) ? bookmarksData : (bookmarksData?.results || [])
  const history = Array.isArray(historyData) ? historyData : (historyData?.results || [])
  const profileData = profile?.data || profile

  return (
    <div className="app-shell" style={{ overflow: 'auto' }}>
      <Navbar />

      <div style={{ padding: 'var(--space-xl)', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 'var(--space-xl)' }}
        >
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 'var(--space-xs)' }}>
            📊 Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Your search history, saved locations, and analytics.
          </p>
        </motion.div>

        {/* Stats Row */}
        <div className="dashboard-grid" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="glass-card dashboard-stat-card">
            <div className="dashboard-stat-value">{bookmarks.length}</div>
            <div className="dashboard-stat-label">Saved Locations</div>
          </div>
          <div className="glass-card dashboard-stat-card">
            <div className="dashboard-stat-value">{history.length}</div>
            <div className="dashboard-stat-label">Total Searches</div>
          </div>
          <div className="glass-card dashboard-stat-card">
            <div className="dashboard-stat-value">{profileData?.api_calls_used || 0}</div>
            <div className="dashboard-stat-label">API Calls Used</div>
          </div>
        </div>

        {/* Bookmarks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ marginBottom: 'var(--space-xl)' }}
        >
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
            ⭐ Bookmarked Locations
          </h2>

          {bookmarks.length === 0 ? (
            <div className="glass-card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>
                No bookmarks yet. Search and analyze clusters, then bookmark the best ones!
              </p>
              <Link to="/" className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }}>
                🗺️ Go to Map
              </Link>
            </div>
          ) : (
            <div className="dashboard-grid">
              {bookmarks.map((bm) => (
                <div key={bm.id} className="glass-card" style={{ padding: 'var(--space-lg)' }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
                    <div
                      className={`score-badge ${getScoreClass(bm.cluster_detail?.viability_score || 0)}`}
                      style={{ '--score': bm.cluster_detail?.viability_score || 0 }}
                    >
                      {Math.round(bm.cluster_detail?.viability_score || 0)}
                    </div>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteBookmark(bm.id)}
                    >
                      Remove
                    </button>
                  </div>
                  <div style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                    <strong>{bm.cluster_detail?.restaurant_count || 0}</strong> restaurants
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {bm.cluster_detail?.address || `${bm.cluster_detail?.centroid_latitude?.toFixed(4)}, ${bm.cluster_detail?.centroid_longitude?.toFixed(4)}`}
                  </div>
                  {bm.notes && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 'var(--space-sm)', fontStyle: 'italic' }}>
                      "{bm.notes}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Search History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
            🕐 Search History
          </h2>

          {history.length === 0 ? (
            <div className="glass-card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>No searches yet.</p>
            </div>
          ) : (
            <div className="glass-card" style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: 'var(--space-md)', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Query</th>
                    <th style={{ padding: 'var(--space-md)', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Location</th>
                    <th style={{ padding: 'var(--space-md)', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 20).map((h) => (
                    <tr key={h.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: 'var(--space-md)', color: 'var(--text-primary)' }}>
                        {h.query || '—'}
                      </td>
                      <td style={{ padding: 'var(--space-md)', fontFamily: 'var(--font-data)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {h.latitude?.toFixed(4)}, {h.longitude?.toFixed(4)}
                      </td>
                      <td style={{ padding: 'var(--space-md)', color: 'var(--text-muted)' }}>
                        {new Date(h.searched_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
