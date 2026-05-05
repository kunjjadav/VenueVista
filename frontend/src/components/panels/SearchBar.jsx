import { useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLazyGeocodeLocationQuery } from '../../api/discoverApi'
import {
  setCenter, setZoom, enterPinMode,
  setSearchQuery, setGeocodedName,
} from '../../store/mapSlice'

export default function SearchBar() {
  const dispatch = useDispatch()
  const [query, setQuery] = useState('')
  const [geocode, { isFetching: isGeocoding }] = useLazyGeocodeLocationQuery()
  const [error, setError] = useState('')

  const handleSearch = useCallback(async () => {
    const q = query.trim()
    if (!q) return
    setError('')

    try {
      const result = await geocode(q).unwrap()

      if (result?.success && result.results?.length > 0) {
        const loc = result.results[0]
        dispatch(setCenter({ lat: loc.latitude, lng: loc.longitude }))
        dispatch(setZoom(14))
        dispatch(setSearchQuery(q))
        dispatch(setGeocodedName(loc.name))
        dispatch(enterPinMode())
      } else {
        setError(`Could not find "${q}". Try a different search.`)
      }
    } catch (err) {
      console.error('Geocoding failed:', err)
      setError('Search failed. Please try again.')
    }
  }, [query, dispatch, geocode])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div>
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          id="search-input"
          type="text"
          className="input-field"
          placeholder="Search any location worldwide..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isGeocoding}
        />
      </div>

      <button
        id="search-button"
        className="btn btn-primary w-full"
        onClick={handleSearch}
        disabled={isGeocoding || !query.trim()}
        style={{ marginTop: 'var(--space-sm)' }}
      >
        {isGeocoding ? (
          <>
            <span className="spinner spinner-sm" />
            Searching...
          </>
        ) : (
          '🌍 Search Location'
        )}
      </button>

      {error && (
        <div style={{
          marginTop: 'var(--space-xs)',
          color: 'var(--accent-rose)',
          fontSize: '0.75rem',
        }}>
          {error}
        </div>
      )}
    </div>
  )
}
