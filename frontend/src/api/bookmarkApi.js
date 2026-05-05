import { apiSlice } from './apiSlice'

export const bookmarkApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBookmarks: builder.query({
      query: () => '/bookmarks/',
      providesTags: ['Bookmark'],
    }),
    createBookmark: builder.mutation({
      query: (body) => ({
        url: '/bookmarks/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Bookmark'],
    }),
    deleteBookmark: builder.mutation({
      query: (id) => ({
        url: `/bookmarks/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Bookmark'],
    }),
    getSearchHistory: builder.query({
      query: () => '/bookmarks/history/',
      providesTags: ['History'],
    }),
  }),
})

export const {
  useGetBookmarksQuery,
  useCreateBookmarkMutation,
  useDeleteBookmarkMutation,
  useGetSearchHistoryQuery,
} = bookmarkApi
