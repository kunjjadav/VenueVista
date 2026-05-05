import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  accessToken: localStorage.getItem('access_token') || null,
  refreshToken: localStorage.getItem('refresh_token') || null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  isStaff: localStorage.getItem('is_staff') === 'true',
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, access, refresh, is_staff } = action.payload
      if (user) state.user = user
      if (access) {
        state.accessToken = access
        localStorage.setItem('access_token', access)
      }
      if (refresh) {
        state.refreshToken = refresh
        localStorage.setItem('refresh_token', refresh)
      }
      if (is_staff !== undefined) {
        state.isStaff = !!is_staff
        localStorage.setItem('is_staff', is_staff ? 'true' : 'false')
      }
      state.isAuthenticated = true
    },
    logout: (state) => {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.isStaff = false
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('is_staff')
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer

export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectCurrentUser = (state) => state.auth.user
export const selectAccessToken = (state) => state.auth.accessToken
export const selectRefreshToken = (state) => state.auth.refreshToken
export const selectIsStaff = (state) => state.auth.isStaff

