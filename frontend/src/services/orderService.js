import api from './api';

const orderService = {
  createOrder: async (orderData) => {
    const response = await api.post('/orders/orders', orderData);
    return response.data;
  },

  getOrders: async (page = 1, limit = 10, status = null) => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    const response = await api.get(`/orders/orders?${params}`);
    return response.data;
  },

  getOrderById: async (id) => {
    const response = await api.get(`/orders/orders/${id}`);
    return response.data;
  },

  cancelOrder: async (id) => {
    const response = await api.delete(`/orders/orders/${id}`);
    return response.data;
  },
};

export default orderService;
