import { apiSlice } from './apiSlice'

export const discoverApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    startDiscovery: builder.mutation({
      query: (body) => ({
        url: '/restaurants/discover/',
        method: 'POST',
        body,
      }),
    }),
    getTaskStatus: builder.query({
      query: (taskId) => `/tasks/${taskId}/status/`,
    }),
    geocodeLocation: builder.query({
      query: (q) => `/geocode/?q=${encodeURIComponent(q)}`,
    }),
  }),
})

export const {
  useStartDiscoveryMutation,
  useLazyGetTaskStatusQuery,
  useLazyGeocodeLocationQuery,
} = discoverApi
