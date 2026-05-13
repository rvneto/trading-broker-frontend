import api from './api'

export const getAssets = async () => {
  const response = await api.get('/assets')
  return response.data
}
