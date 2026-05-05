import { apiSlice } from './apiSlice'

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (body) => ({
        url: '/auth/register/',
        method: 'POST',
        body,
      }),
    }),
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login/',
        method: 'POST',
        body: credentials,
      }),
    }),
    getProfile: builder.query({
      query: () => '/auth/profile/',
      providesTags: ['Profile'],
    }),
    updateProfile: builder.mutation({
      query: (body) => ({
        url: '/auth/profile/',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Profile'],
    }),
    logout: builder.mutation({
      query: (body) => ({
        url: '/auth/logout/',
        method: 'POST',
        body,
      }),
    }),
  }),
})

export const {
  useRegisterMutation,
  useLoginMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useLogoutMutation,
} = authApi
