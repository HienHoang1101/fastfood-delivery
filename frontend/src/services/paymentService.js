// frontend/src/services/paymentService.js
// ==========================================
import api from './api';

const paymentService = {
  // Process payment
  processPayment: async (paymentData) => {
    const response = await api.post('/payments/payments', paymentData);
    return response.data;
  },

  // Get payment by ID
  getPaymentById: async (id) => {
    const response = await api.get(`/payments/payments/${id}`);
    return response.data;
  },

  // Get payments for an order
  getOrderPayments: async (orderId) => {
    const response = await api.get(`/payments/orders/${orderId}/payments`);
    return response.data;
  },

  // Get user's payments
  getPayments: async (page = 1, limit = 10, status = null) => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    
    const response = await api.get(`/payments/payments?${params}`);
    return response.data;
  },
};

export default paymentService;