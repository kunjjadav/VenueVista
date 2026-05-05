import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return headers
  },
})


const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions)

  if (result?.error?.status === 401) {
    const refreshToken = api.getState().auth.refreshToken
    if (refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: '/auth/token/refresh/',
          method: 'POST',
          body: { refresh: refreshToken },
        },
        api,
        extraOptions
      )

      if (refreshResult?.data) {
        const { setCredentials } = await import('../store/authSlice')
        api.dispatch(setCredentials({ access: refreshResult.data.access }))
        result = await baseQuery(args, api, extraOptions)
      } else {
        const { logout } = await import('../store/authSlice')
        api.dispatch(logout())
      }
    }
  }

  return result
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Restaurant', 'Cluster', 'Bookmark', 'History', 'Profile', 'AdminStats', 'AdminUsers', 'AdminRestaurants', 'AdminClusters', 'AdminTasks'],
  endpoints: () => ({}),
})
