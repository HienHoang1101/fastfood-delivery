const axiosRetry = require('axios-retry');
const express = require('express');
const axios = require('axios');
const Order = require('./models/Order');
const OrderItem = require('./models/OrderItem');
const sequelize = require('./db');
const client = require('prom-client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ===== Axios Retry Configuration =====
axiosRetry(axios, {
  retries: 3, // Số lần thử lại
  retryDelay: axiosRetry.exponentialDelay, // Chờ theo phương pháp exponential
  shouldResetTimeout: true, // Reset timeout khi retry
  retryCondition: (error) => {
    return error.response && error.response.status >= 500; // Retry khi gặp lỗi server (5xx)
  },
});

// ===== Default Metrics =====
client.collectDefaultMetrics();

// Custom Metrics
const requestCounter = new client.Counter({
  name: 'order_requests_total',
  help: 'Total requests to Order Service',
  labelNames: ['method', 'route', 'status'],
});

const requestDuration = new client.Histogram({
  name: 'order_request_duration_seconds',
  help: 'Request duration in seconds for Order Service',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

// Middleware đo metrics
app.use((req, res, next) => {
  const end = requestDuration.startTimer();
  res.on('finish', () => {
    const routePath = req.route?.path || req.path;
    requestCounter.labels(req.method, routePath, res.statusCode).inc();
    end({ method: req.method, route: routePath, status: res.statusCode });
  });
  next();
});

// ===== Create Order =====
app.post('/orders', async (req, res) => {
  try {
    const { userId, items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    // Lấy thông tin sản phẩm từ Product Service bằng bulk endpoint
    const productIds = items.map(item => item.productId);
    const { data: products } = await axios.post(
      'http://product:3002/products/bulk',
      { ids: productIds }
    );
    if (!Array.isArray(products) || products.length !== items.length) {
      throw new Error('Some products not found');
    }
    let errorStatus = null;
    let errorMessage = null;
    const productDetails = items.map((item) => {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        errorStatus = 404;
        errorMessage = `Product not found: ${item.productId}`;
        return null;
      }
      if (product.stock < item.quantity) {
        errorStatus = 409;
        errorMessage = `Out of stock: ${item.productId}`;
        return null;
      }
      const lineTotal = (product.price * item.quantity).toFixed(2);
      return {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        lineTotal,
      };
    }).filter(Boolean);

    if (errorStatus) {
      return res.status(errorStatus).json({ error: errorMessage });
    }
    // Tính tổng tiền
    const total = productDetails
      .reduce((acc, item) => acc + Number(item.lineTotal), 0)
      .toFixed(2);

    // Lưu đơn hàng vào DB
    const order = await Order.create({
      user_id: userId,
      total_price: total,
      status: 'pending',
    });

    // Lưu order items
    await OrderItem.bulkCreate(
      productDetails.map((item) => ({ ...item, order_id: order.id }))
    );

    res.status(201).json({ orderId: order.id, total, status: order.status });
  } catch (e) {
    if (e.message && e.message.startsWith('Product not found')) {
      return res.status(404).json({ error: e.message });
    }
    if (e.message && e.message.startsWith('Out of stock')) {
      return res.status(409).json({ error: e.message });
    }
    res.status(400).json({ error: e.message });
  }
});

// ===== Health check =====
app.get('/health', async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok' });
  } catch (e) {
    res.status(500).json({ status: 'down', error: e.message });
  }
});
// Metrics endpoint
app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (e) {
    res.status(500).json({ error: 'Failed to collect metrics', details: e.message });
  }
});

// Start the server
(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); // Ensure DB tables are created
    app.listen(PORT, () => console.log(`Order Service running on port ${PORT}`));
  } catch (e) {
    console.error('Unable to connect to the database:', e);
    process.exit(1);
  }
})();
