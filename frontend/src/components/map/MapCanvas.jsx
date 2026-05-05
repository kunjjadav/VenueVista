import { useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { MapContainer, TileLayer, Circle, Polygon, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import { useTranslation } from 'react-i18next'
import { selectCluster, setCenter, setZoom, setPin } from '../../store/mapSlice'


const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const DARK_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'


const createPinIcon = () =>
  L.divIcon({
    className: 'leaflet-pin-marker',
    html: `<div class="pin-drop-marker">
      <div class="pin-drop-pulse"></div>
      <div class="pin-drop-dot"></div>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })


function HeatmapOverlay() {
  const map = useMap()
  const restaurants = useSelector((s) => s.map.restaurants)
  const showHeatmap = useSelector((s) => s.map.showHeatmap)
  const heatLayerRef = useRef(null)

  useEffect(() => {
    if (!map) return

    // Remove existing heat layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }

    if (showHeatmap && restaurants.length > 0) {
      const points = restaurants.map((d) => [
        d.latitude,
        d.longitude,
        (d.user_ratings_total || 1) / 100, // normalize weight
      ])

      heatLayerRef.current = L.heatLayer(points, {
        radius: 35,
        blur: 25,
        maxZoom: 17,
        max: 1.0,
        gradient: {
          0.0: '#001933',
          0.2: '#08415c',
          0.4: '#3b82f6',
          0.6: '#06b6d4',
          0.8: '#10b981',
          1.0: '#f59e0b',
        },
      }).addTo(map)
    }

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current)
        heatLayerRef.current = null
      }
    }
  }, [map, restaurants, showHeatmap])

  return null
}


function ClusterMarkers() {
  const dispatch = useDispatch()
  const map = useMap()
  const clusters = useSelector((s) => s.map.clusters)
  const showClusters = useSelector((s) => s.map.showClusters)
  const { t } = useTranslation()
  const markersRef = useRef([])

  useEffect(() => {
    if (!map) return

    // Clear previous markers
    markersRef.current.forEach((m) => map.removeLayer(m))
    markersRef.current = []

    if (!showClusters) return

    clusters.forEach((cluster) => {
      const pulseIcon = L.divIcon({
        className: 'leaflet-pulse-marker',
        html: `<div style="
          width: 20px; height: 20px;
          background: radial-gradient(circle, #f43f5e, #ff006e);
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.8);
          cursor: pointer;
          box-shadow: 0 0 12px rgba(244, 63, 94, 0.6);
          animation: pulse-ring 2s ease-out infinite;
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })

      const marker = L.marker(
        [cluster.centroid_latitude, cluster.centroid_longitude],
        { icon: pulseIcon }
      )
        .bindTooltip(
          `Cluster #${cluster.id} — Score: ${cluster.viability_score}`,
          { className: 'dark-tooltip', direction: 'top', offset: [0, -14] }
        )
        .on('click', () => dispatch(selectCluster(cluster.id)))
        .addTo(map)

      markersRef.current.push(marker)
    })

    return () => {
      markersRef.current.forEach((m) => map.removeLayer(m))
      markersRef.current = []
    }
  }, [map, clusters, showClusters, dispatch, t])

  return null
}


function BoundariesOverlay() {
  const clusters = useSelector((s) => s.map.clusters)
  const showRadius = useSelector((s) => s.map.showRadius)

  if (!showRadius) return null

  return clusters.map((cluster) => {
    if (cluster.polygon && cluster.polygon.coordinates) {
      let latLngs = [];
      const coords = cluster.polygon.coordinates;
      
      try {
        if (cluster.polygon.type === 'Polygon') {
          latLngs = coords[0].map(([lon, lat]) => [lat, lon]);
        } else if (cluster.polygon.type === 'MultiPolygon') {
          latLngs = coords[0][0].map(([lon, lat]) => [lat, lon]);
        }
      } catch (e) {
        console.warn("Failed to parse polygon for cluster", cluster.id);
      }

      if (latLngs.length > 0) {
        return (
          <Polygon
            key={`poly-${cluster.id}`}
            positions={latLngs}
            pathOptions={{
              fillColor: '#10b981',
              fillOpacity: 0.15,
              color: '#10b981',
              opacity: 0.6,
              weight: 2,
              dashArray: '5, 5',
            }}
          />
        );
      }
    }

    // Fallback if no polygon exists (e.g., small cluster)
    return (
      <Circle
        key={`radius-${cluster.id}`}
        center={[cluster.centroid_latitude, cluster.centroid_longitude]}
        radius={200}
        pathOptions={{
          fillColor: '#3b82f6',
          fillOpacity: 0.08,
          color: '#3b82f6',
          opacity: 0.3,
          weight: 1.5,
        }}
      />
    )
  })
}


function PinDropHandler() {
  const dispatch = useDispatch()
  const pinMode = useSelector((s) => s.map.pinMode)
  const map = useMap()

  useEffect(() => {
    if (!map) return
    const container = map.getContainer()
    if (pinMode) {
      container.style.cursor = 'crosshair'
    } else {
      container.style.cursor = ''
    }
    return () => { container.style.cursor = '' }
  }, [map, pinMode])

  useMapEvents({
    click: (e) => {
      if (pinMode) {
        dispatch(setPin({ lat: e.latlng.lat, lng: e.latlng.lng }))
      }
    },
  })

  return null
}


function PinnedMarker() {
  const pinnedLocation = useSelector((s) => s.map.pinnedLocation)
  const radius = useSelector((s) => s.filters.radius)

  if (!pinnedLocation) return null

  return (
    <>
      <Marker
        position={[pinnedLocation.lat, pinnedLocation.lng]}
        icon={createPinIcon()}
      />
      <Circle
        center={[pinnedLocation.lat, pinnedLocation.lng]}
        radius={radius}
        pathOptions={{
          fillColor: '#8b5cf6',
          fillOpacity: 0.08,
          color: '#8b5cf6',
          opacity: 0.5,
          weight: 2,
          dashArray: '8, 4',
        }}
      />
    </>
  )
}


function MapEventHandler() {
  const dispatch = useDispatch()

  useMapEvents({
    moveend: (e) => {
      const map = e.target
      const c = map.getCenter()
      dispatch(setCenter({ lat: c.lat, lng: c.lng }))
      dispatch(setZoom(map.getZoom()))
    },
  })

  return null
}


function MapCenterSync() {
  const map = useMap()
  const center = useSelector((s) => s.map.center)
  const prevCenter = useRef(center)

  useEffect(() => {
    // Only fly to new center if it was changed externally (e.g. search)
    if (
      prevCenter.current.lat !== center.lat ||
      prevCenter.current.lng !== center.lng
    ) {
      map.flyTo([center.lat, center.lng], map.getZoom(), { duration: 1.2 })
      prevCenter.current = center
    }
  }, [center, map])

  return null
}


export default function MapCanvas() {
  const center = useSelector((s) => s.map.center)
  const zoom = useSelector((s) => s.map.zoom)
  const { t } = useTranslation()

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
      aria-label={t('map.aria_map_container')}
    >
      <TileLayer url={DARK_TILES} attribution={DARK_ATTR} />
      <HeatmapOverlay />
      <ClusterMarkers />
      <BoundariesOverlay />
      <PinDropHandler />
      <PinnedMarker />
      <MapEventHandler />
      <MapCenterSync />
    </MapContainer>
  )
}
