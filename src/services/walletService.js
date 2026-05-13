import api from './api'

export const getWalletSummary = async (userId) => {
  const response = await api.get(`/wallets/${userId}/summary`)
  return response.data
}

export const getPositions = async (userId) => {
  const response = await api.get(`/wallets/${userId}/positions`)
  return response.data
}

export const getTransactions = async (userId) => {
  const response = await api.get(`/wallets/${userId}/transactions`)
  return response.data
}
