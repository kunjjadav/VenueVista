import { configureStore } from '@reduxjs/toolkit'
import { apiSlice } from '../api/apiSlice'
import authReducer from './authSlice'
import filterReducer from './filterSlice'
import mapReducer from './mapSlice'

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
    filters: filterReducer,
    map: mapReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: import.meta.env.DEV,
})
