// frontend/src/services/orderService.js
// ==========================================
import api from './api';

const orderService = {
  // Create new order
  createOrder: async (orderData) => {
    const response = await api.post('/orders/orders', orderData);
    return response.data;
  },

  // Get user's orders
  getOrders: async (page = 1, limit = 10, status = null) => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    
    const response = await api.get(`/orders/orders?${params}`);
    return response.data;
  },

  // Get order by ID
  getOrderById: async (id) => {
    const response = await api.get(`/orders/orders/${id}`);
    return response.data;
  },

  // Cancel order
  cancelOrder: async (id) => {
    const response = await api.delete(`/orders/orders/${id}`);
    return response.data;
  },

  // Update order status (admin)
  updateOrderStatus: async (id, status) => {
    const response = await api.patch(`/orders/orders/${id}/status`, { status });
    return response.data;
  },
};

export default orderService;