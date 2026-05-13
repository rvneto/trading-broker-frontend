import api from './api'

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password })
  const data = response.data
  return {
    token: data.token,
    user: {
      id: data.userId,
      name: data.name,
      email: data.email,
      role: data.role,
    },
  }
}

export const register = async (name, email, password) => {
  const response = await api.post('/auth/register', { name, email, password })
  const data = response.data
  return {
    token: data.token,
    user: {
      id: data.userId,
      name: data.name,
      email: data.email,
      role: data.role,
    },
  }
}
