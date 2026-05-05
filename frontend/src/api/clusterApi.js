import { apiSlice } from './apiSlice'

export const clusterApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getClusters: builder.query({
      query: () => '/clusters/',
      providesTags: ['Cluster'],
    }),
    getCluster: builder.query({
      query: (id) => `/clusters/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Cluster', id }],
    }),
    analyzeCluster: builder.mutation({
      query: (body) => ({
        url: '/clusters/analyze/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Cluster'],
    }),
  }),
})

export const {
  useGetClustersQuery,
  useGetClusterQuery,
  useAnalyzeClusterMutation,
} = clusterApi
