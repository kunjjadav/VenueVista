import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  cuisine: '',
  radius: 2000,
  minRating: 0,
  maxPriceLevel: 4,
  maxCompetition: null,
  competitionRadiusKm: 0.5,
  minSamples: 2,
}

const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setCuisine: (state, action) => { state.cuisine = action.payload },
    setRadius: (state, action) => { state.radius = action.payload },
    setMinRating: (state, action) => { state.minRating = action.payload },
    setMaxPriceLevel: (state, action) => { state.maxPriceLevel = action.payload },
    setMaxCompetition: (state, action) => { state.maxCompetition = action.payload },
    setCompetitionRadiusKm: (state, action) => { state.competitionRadiusKm = action.payload },
    setMinSamples: (state, action) => { state.minSamples = action.payload },
    resetFilters: () => initialState,
  },
})

export const {
  setCuisine, setRadius, setMinRating, setMaxPriceLevel,
  setMaxCompetition, setCompetitionRadiusKm, setMinSamples,
  resetFilters,
} = filterSlice.actions

export default filterSlice.reducer
