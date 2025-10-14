import api from './api';

const paymentService = {
  processPayment: async (paymentData) => {
    const response = await api.post('/payments/payments', paymentData);
    return response.data;
  },

  getPaymentById: async (id) => {
    const response = await api.get(`/payments/payments/${id}`);
    return response.data;
  },

  getOrderPayments: async (orderId) => {
    const response = await api.get(`/payments/orders/${orderId}/payments`);
    return response.data;
  },
};

export default paymentService;
