import api from './api'

export const getOrders = async (userId) => {
  const response = await api.get(`/orders/user/${userId}`)
  return response.data
}

export const createOrder = async (order) => {
  const response = await api.post('/orders', order)
  return response.data
}
