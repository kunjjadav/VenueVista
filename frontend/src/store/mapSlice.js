import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  center: { lat: 23.0225, lng: 72.5714 }, // Ahmedabad
  zoom: 12,
  selectedClusterId: null,
  showHeatmap: true,
  showClusters: true,
  showRadius: true,
  restaurants: [],
  clusters: [],

  pinMode: false,
  pinnedLocation: null,
  searchQuery: '',
  geocodedName: '',

  discoveryTaskId: null,
  discoveryState: 'idle',
  discoveryProgress: null,
  discoveryError: null,
}

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setCenter: (state, action) => { state.center = action.payload },
    setZoom: (state, action) => { state.zoom = action.payload },
    selectCluster: (state, action) => { state.selectedClusterId = action.payload },
    clearSelection: (state) => { state.selectedClusterId = null },
    toggleHeatmap: (state) => { state.showHeatmap = !state.showHeatmap },
    toggleClusters: (state) => { state.showClusters = !state.showClusters },
    toggleRadius: (state) => { state.showRadius = !state.showRadius },
    setRestaurants: (state, action) => { state.restaurants = action.payload },
    setClusters: (state, action) => { state.clusters = action.payload },


    enterPinMode: (state) => {
      state.pinMode = true
      state.pinnedLocation = null
      state.discoveryState = 'idle'
      state.discoveryTaskId = null
      state.discoveryProgress = null
      state.discoveryError = null
    },
    exitPinMode: (state) => {
      state.pinMode = false
    },
    setPin: (state, action) => {
      state.pinnedLocation = action.payload // { lat, lng }
      state.pinMode = false
    },
    clearPin: (state) => {
      state.pinnedLocation = null
      state.pinMode = false
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload
    },
    setGeocodedName: (state, action) => {
      state.geocodedName = action.payload
    },


    startDiscovery: (state, action) => {
      state.discoveryTaskId = action.payload // task_id
      state.discoveryState = 'polling'
      state.discoveryProgress = null
      state.discoveryError = null
    },
    updateDiscoveryProgress: (state, action) => {
      state.discoveryProgress = action.payload
    },
    completeDiscovery: (state) => {
      state.discoveryState = 'completed'
    },
    failDiscovery: (state, action) => {
      state.discoveryState = 'failed'
      state.discoveryError = action.payload
    },
    resetDiscovery: (state) => {
      state.discoveryState = 'idle'
      state.discoveryTaskId = null
      state.discoveryProgress = null
      state.discoveryError = null
      state.pinnedLocation = null
    },
  },
})

export const {
  setCenter, setZoom, selectCluster, clearSelection,
  toggleHeatmap, toggleClusters, toggleRadius,
  setRestaurants, setClusters,
  enterPinMode, exitPinMode, setPin, clearPin,
  setSearchQuery, setGeocodedName,
  startDiscovery, updateDiscoveryProgress,
  completeDiscovery, failDiscovery, resetDiscovery,
} = mapSlice.actions

export default mapSlice.reducer
