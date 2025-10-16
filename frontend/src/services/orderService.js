import api from './api';

const orderService = {
  createOrder: async (orderData) => {
  const transformedData = {
    ...orderData,
    items: orderData.items.map(item => ({
      productId: item.productId || item.product_id, // ✅ Ensure camelCase
      quantity: item.quantity
    }))
  };
  const response = await api.post('/orders/orders', transformedData);
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
  const response = await api.patch(`/orders/orders/${id}/status`, { // ✅ Use PATCH
    status: 'cancelled'
  });
  return response.data;
},
};

export default orderService;
