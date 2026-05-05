import { apiSlice } from './apiSlice'

export const adminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAdminStats: builder.query({
      query: () => '/admin/stats/',
      providesTags: ['AdminStats'],
    }),
    getAdminUsers: builder.query({
      query: (params) => ({
        url: '/admin/users/',
        params,
      }),
      providesTags: ['AdminUsers'],
    }),
    updateAdminUser: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/users/${id}/`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['AdminUsers', 'AdminStats'],
    }),
    deleteAdminUser: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminUsers', 'AdminStats'],
    }),
    getAdminRestaurants: builder.query({
      query: (params) => ({
        url: '/admin/restaurants/',
        params,
      }),
      providesTags: ['AdminRestaurants'],
    }),
    deleteAdminRestaurant: builder.mutation({
      query: (id) => ({
        url: `/admin/restaurants/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminRestaurants', 'AdminStats'],
    }),
    getAdminClusters: builder.query({
      query: (params) => ({
        url: '/admin/clusters/',
        params,
      }),
      providesTags: ['AdminClusters'],
    }),
    getAdminTasks: builder.query({
      query: (params) => ({
        url: '/admin/tasks/',
        params,
      }),
      providesTags: ['AdminTasks'],
    }),
  }),
})

export const {
  useGetAdminStatsQuery,
  useGetAdminUsersQuery,
  useUpdateAdminUserMutation,
  useDeleteAdminUserMutation,
  useGetAdminRestaurantsQuery,
  useDeleteAdminRestaurantMutation,
  useGetAdminClustersQuery,
  useGetAdminTasksQuery,
} = adminApi
