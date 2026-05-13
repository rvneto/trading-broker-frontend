import api from './api'

export const getWallet = async (userId) => {
  const response = await api.get(`/wallets/${userId}`)
  return response.data
}

export const getPositions = async (userId) => {
  const response = await api.get(`/wallets/${userId}/positions`)
  return response.data
}
