import { create } from 'zustand'
import { _setToken } from '../api/client'

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,

  setAuth: (user, token) => {
    _setToken(token)
    set({ user, accessToken: token })
  },

  logout: () => {
    _setToken(null)
    set({ user: null, accessToken: null })
  },
}))
