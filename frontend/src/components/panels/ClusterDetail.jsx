import { motion } from 'framer-motion'
import { useDispatch } from 'react-redux'
import { clearSelection } from '../../store/mapSlice'
import { useGetClusterQuery } from '../../api/clusterApi'
import { useCreateBookmarkMutation } from '../../api/bookmarkApi'
import { getScoreClass, formatPrice, renderStars } from '../../utils/helpers'

export default function ClusterDetail({ clusterId }) {
  const dispatch = useDispatch()
  const { data, isLoading, error } = useGetClusterQuery(clusterId)
  const [createBookmark, { isLoading: isBookmarking }] = useCreateBookmarkMutation()

  const cluster = data

  const handleBookmark = async () => {
    try {
      await createBookmark({ cluster: clusterId }).unwrap()
    } catch (err) {
      console.error('Bookmark failed:', err)
    }
  }

  return (
    <motion.div
      className="detail-panel"
      initial={{ x: 420, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 420, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="detail-header">
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>
            Cluster Analysis
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            #{clusterId}
          </p>
        </div>
        <button className="detail-close" onClick={() => dispatch(clearSelection())}>
          ✕
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-between p-lg">
          <span className="spinner" />
        </div>
      )}

      {error && (
        <p style={{ color: 'var(--accent-rose)', padding: 'var(--space-md)' }}>
          Failed to load cluster data.
        </p>
      )}

      {cluster && (
        <>
          {/* Viability Score */}
          <div
            className="glass-card"
            style={{
              padding: 'var(--space-lg)',
              textAlign: 'center',
              marginBottom: 'var(--space-lg)',
            }}
          >
            <div
              className={`score-badge ${getScoreClass(cluster.viability_score)}`}
              style={{
                '--score': cluster.viability_score,
                width: '72px',
                height: '72px',
                fontSize: '1.2rem',
                margin: '0 auto var(--space-md)',
              }}
            >
              {Math.round(cluster.viability_score)}
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              Market Viability Score
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
              {cluster.viability_score >= 65 ? 'High Potential' :
                cluster.viability_score >= 35 ? 'Moderate Potential' : 'Low Potential'}
            </div>
          </div>

          {/* Address */}
          {cluster.address && (
            <div className="glass-card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                📍 Location
              </div>
              <div style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                {cluster.address}
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="detail-stat">
            <span className="detail-stat-label">Restaurants</span>
            <span className="detail-stat-value">{cluster.restaurant_count}</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-label">Avg Rating</span>
            <span className="detail-stat-value">
              {cluster.avg_rating ? `${cluster.avg_rating.toFixed(1)} ★` : '—'}
            </span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-label">Avg Price</span>
            <span className="detail-stat-value">
              {cluster.avg_price_level != null ? formatPrice(Math.round(cluster.avg_price_level)) : '—'}
            </span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-label">Total Reviews</span>
            <span className="detail-stat-value">{cluster.total_reviews?.toLocaleString()}</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-label">Centroid</span>
            <span className="detail-stat-value" style={{ fontSize: '0.8rem' }}>
              {cluster.centroid_latitude?.toFixed(4)}, {cluster.centroid_longitude?.toFixed(4)}
            </span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-label">Epsilon (km)</span>
            <span className="detail-stat-value">{cluster.epsilon_used}</span>
          </div>

          {/* Nearby Restaurants */}
          {cluster.restaurants && cluster.restaurants.length > 0 && (
            <div style={{ marginTop: 'var(--space-lg)' }}>
              <div className="sidebar-section-title">Nearby Competitors</div>
              <div style={{ maxHeight: '250px', overflow: 'auto' }}>
                {cluster.restaurants.map((r) => (
                  <div key={r.id} className="restaurant-item">
                    <div>
                      <div className="restaurant-name">{r.name}</div>
                      <div className="restaurant-meta">
                        {r.rating ? `${r.rating}★` : ''}{' '}
                        {r.user_ratings_total ? `(${r.user_ratings_total} reviews)` : ''}{' '}
                        {formatPrice(r.price_level)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bookmark Button */}
          <button
            className="btn btn-primary w-full"
            onClick={handleBookmark}
            disabled={isBookmarking}
            style={{ marginTop: 'var(--space-lg)' }}
          >
            {isBookmarking ? 'Saving...' : '⭐ Bookmark This Location'}
          </button>
        </>
      )}
    </motion.div>
  )
}
