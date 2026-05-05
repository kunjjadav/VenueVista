import { apiSlice } from './apiSlice'

export const restaurantApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRestaurants: builder.query({
      query: (params) => ({
        url: '/restaurants/',
        params,
      }),
      providesTags: ['Restaurant'],
    }),
    getRestaurant: builder.query({
      query: (id) => `/restaurants/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Restaurant', id }],
    }),
    searchRestaurants: builder.mutation({
      query: (body) => ({
        url: '/restaurants/search/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Restaurant'],
    }),
    getCuisines: builder.query({
      query: () => '/restaurants/cuisines/',
    }),
  }),
})

export const {
  useGetRestaurantsQuery,
  useGetRestaurantQuery,
  useSearchRestaurantsMutation,
  useGetCuisinesQuery,
} = restaurantApi
