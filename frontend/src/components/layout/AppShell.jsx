import Navbar from './Navbar'
import Sidebar from './Sidebar'
import MapCanvas from '../map/MapCanvas'
import ClusterDetail from '../panels/ClusterDetail'
import { useSelector } from 'react-redux'
import { AnimatePresence } from 'framer-motion'

export default function AppShell() {
  const selectedClusterId = useSelector((s) => s.map.selectedClusterId)

  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-body">
        <Sidebar />
        <div className="map-container">
          <MapCanvas />
        </div>
        <AnimatePresence>
          {selectedClusterId && (
            <ClusterDetail clusterId={selectedClusterId} />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
