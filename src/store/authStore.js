import { create } from 'zustand'

const parseJwt = (token) => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

const tokenFromStorage = localStorage.getItem('token')
const userFromToken = tokenFromStorage ? parseJwt(tokenFromStorage) : null

const initialUser = userFromToken
  ? {
      id: userFromToken.userId,
      email: userFromToken.sub,
      role: userFromToken.role,
      name: localStorage.getItem('userName') || '',
    }
  : null

const useAuthStore = create((set) => ({
  user: initialUser,
  token: tokenFromStorage,

  login: (user, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('userName', user.name || '')
    set({ user, token })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userName')
    set({ user: null, token: null })
  },

  isAuthenticated: () => !!localStorage.getItem('token'),
}))

export default useAuthStore
