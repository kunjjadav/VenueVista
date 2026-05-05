import { useEffect, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  setCuisine, setRadius, setMinRating, setMaxPriceLevel,
  setMaxCompetition, setCompetitionRadiusKm, setMinSamples,
  resetFilters,
} from '../../store/filterSlice'
import {
  toggleHeatmap, toggleClusters, toggleRadius,
  setRestaurants, setClusters, selectCluster, clearPin,
  startDiscovery, updateDiscoveryProgress, completeDiscovery,
  failDiscovery, resetDiscovery,
} from '../../store/mapSlice'
import { useStartDiscoveryMutation, useLazyGetTaskStatusQuery } from '../../api/discoverApi'
import { CUISINE_OPTIONS, PRICE_LABELS } from '../../utils/constants'

const POLL_INTERVAL = 2000

export default function FilterPanel() {
  const dispatch = useDispatch()
  const filters = useSelector((s) => s.filters)
  const {
    showHeatmap, showClusters, showRadius,
    restaurants, clusters,
    pinnedLocation, pinMode, geocodedName,
    discoveryState, discoveryTaskId, discoveryProgress, discoveryError,
  } = useSelector((s) => s.map)

  const [triggerDiscover, { isLoading: isSubmitting }] = useStartDiscoveryMutation()
  const [fetchStatus] = useLazyGetTaskStatusQuery()
  const pollRef = useRef(null)


  useEffect(() => {
    if (discoveryState === 'polling' && discoveryTaskId) {
      pollRef.current = setInterval(async () => {
        try {
          const result = await fetchStatus(discoveryTaskId, true).unwrap()
          if (result?.success) {
            dispatch(updateDiscoveryProgress({
              percent: result.progress_percent,
              message: result.progress_message,
              grid_total: result.grid_points_total,
              grid_processed: result.grid_points_processed,
              grid_cached: result.grid_points_cached,
              restaurants_new: result.restaurants_new,
            }))
            if (result.state === 'COMPLETED') {
              clearInterval(pollRef.current)
              pollRef.current = null
              if (result.result_data) {
                dispatch(setRestaurants(result.result_data.restaurants || []))
                dispatch(setClusters(result.result_data.clusters || []))
                if (result.result_data.clusters?.length > 0) {
                  dispatch(selectCluster(result.result_data.clusters[0].id))
                }
              }
              dispatch(completeDiscovery())
            } else if (result.state === 'FAILED') {
              clearInterval(pollRef.current)
              pollRef.current = null
              dispatch(failDiscovery(result.error_message || 'Discovery failed.'))
            }
          }
        } catch (err) {
          console.error('Poll error:', err)
        }
      }, POLL_INTERVAL)
    }
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }
  }, [discoveryState, discoveryTaskId, fetchStatus, dispatch])


  const handleSubmit = useCallback(async () => {
    if (!pinnedLocation) return
    try {
      const result = await triggerDiscover({
        latitude: pinnedLocation.lat,
        longitude: pinnedLocation.lng,
        radius: filters.radius,
        cuisine: filters.cuisine,
        min_cluster_size: filters.minSamples,
        max_competition: filters.maxCompetition,
        competition_radius_km: filters.competitionRadiusKm,
      }).unwrap()
      if (result?.success && result.task_id) {
        dispatch(startDiscovery(result.task_id))
      } else {
        dispatch(failDiscovery(result?.error || 'Failed to start.'))
      }
    } catch (err) {
      dispatch(failDiscovery(err?.data?.error || err?.message || 'Failed to start.'))
    }
  }, [pinnedLocation, filters, triggerDiscover, dispatch])

  const handleReset = () => {
    dispatch(resetFilters())
    dispatch(clearPin())
    dispatch(resetDiscovery())
  }

  const isPolling = discoveryState === 'polling'
  const isCompleted = discoveryState === 'completed'
  const isFailed = discoveryState === 'failed'
  const canSubmit = !!pinnedLocation && !isPolling


  const gridPts = Math.max(1, Math.ceil(Math.PI * Math.pow(filters.radius / 1500, 2)))

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>

      {/* Pin Status */}
      <div className="sidebar-section">
        {!pinnedLocation && !pinMode && (
          <div className="status-banner status-info">
            🌍 Search a location, then click the map to drop a pin
          </div>
        )}
        {pinMode && !pinnedLocation && (
          <div className="status-banner status-active">
            📍 Click on the map to place your analysis pin
          </div>
        )}
        {pinnedLocation && (
          <div className="status-banner status-success">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                📍 {geocodedName || `${pinnedLocation.lat.toFixed(4)}°, ${pinnedLocation.lng.toFixed(4)}°`}
              </span>
              <button
                className="btn-icon-sm"
                onClick={() => { dispatch(clearPin()); dispatch(resetDiscovery()); }}
                title="Remove pin"
              >✕</button>
            </div>
          </div>
        )}
      </div>

      {/* Data Summary */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Data Summary</div>
        <div className="flex gap-md">
          <div className="glass-card" style={{ flex: 1, padding: 'var(--space-md)', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-data)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
              {restaurants.length}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Restaurants
            </div>
          </div>
          <div className="glass-card" style={{ flex: 1, padding: 'var(--space-md)', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-data)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
              {clusters.length}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Clusters
            </div>
          </div>
        </div>
      </div>

      {/* Cuisine */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Cuisine Type</div>
        <select
          id="cuisine-filter"
          className="input-field"
          value={filters.cuisine}
          onChange={(e) => dispatch(setCuisine(e.target.value))}
        >
          <option value="">All Cuisines</option>
          {CUISINE_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Discovery Radius (live on map) */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">
          Discovery Radius: <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-data)' }}>
            {filters.radius >= 1000 ? `${(filters.radius / 1000).toFixed(1)} km` : `${filters.radius} m`}
          </span>
        </div>
        <input
          id="radius-slider"
          type="range"
          className="range-slider"
          min={500}
          max={10000}
          step={500}
          value={filters.radius}
          onChange={(e) => dispatch(setRadius(Number(e.target.value)))}
        />
        <div className="flex justify-between" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          <span>500m</span>
          <span>10km</span>
        </div>
        {pinnedLocation && (
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Est. grid points: <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-data)' }}>~{gridPts}</span>
          </div>
        )}
      </div>

      {/* Min Rating */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">
          Min Rating: <span style={{ color: 'var(--accent-amber)' }}>
            {filters.minRating > 0 ? `${filters.minRating}★` : 'Any'}
          </span>
        </div>
        <input
          id="rating-slider"
          type="range"
          className="range-slider"
          min={0}
          max={5}
          step={0.5}
          value={filters.minRating}
          onChange={(e) => dispatch(setMinRating(Number(e.target.value)))}
        />
      </div>

      {/* Max Price Level */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Max Price Level</div>
        <div className="flex gap-sm">
          {PRICE_LABELS.map((label, i) => (
            <button
              key={i}
              className={`btn btn-sm ${filters.maxPriceLevel >= i ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => dispatch(setMaxPriceLevel(i))}
              style={{ flex: 1, fontSize: '0.75rem' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Max Competition */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">
          Max Competition: <span style={{ color: 'var(--accent-rose)' }}>
            {filters.maxCompetition ?? 'Unlimited'}
          </span>
        </div>
        <input
          id="competition-slider"
          type="range"
          className="range-slider"
          min={0}
          max={50}
          step={1}
          value={filters.maxCompetition ?? 50}
          onChange={(e) => {
            const v = Number(e.target.value)
            dispatch(setMaxCompetition(v >= 50 ? null : v))
          }}
        />
        <div className="flex justify-between" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          <span>0</span>
          <span>50+</span>
        </div>
      </div>

      {/* Clustering Settings */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Clustering Settings</div>
        <label className="input-label" style={{ marginTop: 'var(--space-sm)' }}>
          Min Cluster Size
        </label>
        <input
          type="number"
          className="input-field"
          min={2}
          max={20}
          value={filters.minSamples}
          onChange={(e) => dispatch(setMinSamples(Number(e.target.value)))}
        />
        <label className="input-label" style={{ marginTop: 'var(--space-md)' }}>
          Competition Radius (km)
        </label>
        <input
          type="number"
          className="input-field"
          min={0.1}
          max={5}
          step={0.1}
          value={filters.competitionRadiusKm}
          onChange={(e) => dispatch(setCompetitionRadiusKm(Number(e.target.value)))}
        />
      </div>

      {/* Map Layers */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Map Layers</div>
        <div className="flex flex-col gap-sm">
          <label className="flex items-center gap-sm" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
            <input type="checkbox" checked={showHeatmap} onChange={() => dispatch(toggleHeatmap())} />
            <span>🌡️ Heatmap</span>
          </label>
          <label className="flex items-center gap-sm" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
            <input type="checkbox" checked={showClusters} onChange={() => dispatch(toggleClusters())} />
            <span>📍 Cluster Markers</span>
          </label>
          <label className="flex items-center gap-sm" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
            <input type="checkbox" checked={showRadius} onChange={() => dispatch(toggleRadius())} />
            <span>⭕ Zone Boundaries</span>
          </label>
        </div>
      </div>

      {/* Discovery Progress (inline) */}
      {isPolling && (
        <div className="sidebar-section">
          <div className="sidebar-section-title">Discovery Progress</div>
          {discoveryProgress ? (
            <>
              <div className="discovery-progress-bar-container">
                <div
                  className="discovery-progress-bar-fill"
                  style={{ width: `${discoveryProgress.percent || 0}%` }}
                />
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                {discoveryProgress.message}
              </p>
              <div className="inline-stats">
                <div className="inline-stat">
                  <span className="inline-stat-val">{discoveryProgress.grid_processed || 0}</span>
                  <span className="inline-stat-lbl">/ {discoveryProgress.grid_total || 0}</span>
                </div>
                <div className="inline-stat">
                  <span className="inline-stat-val">{discoveryProgress.grid_cached || 0}</span>
                  <span className="inline-stat-lbl">cached</span>
                </div>
                <div className="inline-stat">
                  <span className="inline-stat-val">{discoveryProgress.restaurants_new || 0}</span>
                  <span className="inline-stat-lbl">new</span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-md)' }}>
              <div className="spinner spinner-sm" style={{ margin: '0 auto' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '8px' }}>
                Starting task...
              </p>
            </div>
          )}
        </div>
      )}

      {isCompleted && (
        <div className="sidebar-section">
          <div className="status-banner status-success">
            ✅ {discoveryProgress?.message || 'Discovery complete!'}
          </div>
        </div>
      )}

      {isFailed && (
        <div className="sidebar-section">
          <div className="status-banner status-error">
            ❌ {discoveryError || 'Discovery failed.'}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="sidebar-section sidebar-actions">
        <button
          id="discover-btn"
          className="btn btn-discover-sidebar w-full"
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          {isPolling ? (
            <>
              <span className="spinner spinner-sm" />
              Discovering...
            </>
          ) : (
            '🚀 Discover Restaurants'
          )}
        </button>

        <button
          className="btn btn-secondary w-full"
          onClick={handleReset}
          style={{ marginTop: 'var(--space-sm)' }}
        >
          ↺ Reset All
        </button>
      </div>
    </div>
  )
}
