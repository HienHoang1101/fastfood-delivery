const axiosRetry = require('axios-retry');
const express = require('express');
const Payment = require('./models/Payment');
const sequelize = require('./db');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const client = require('prom-client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Cấu hình retry cho axios
axiosRetry(axios, {
  retries: 3, // Số lần thử lại
  retryDelay: axiosRetry.exponentialDelay, // Phương pháp delay theo exponential
  shouldResetTimeout: true, // Reset timeout khi retry
  retryCondition: (error) => error.response && error.response.status >= 500, // Retry khi gặp lỗi server (5xx)
});

// ===== Default Metrics =====
client.collectDefaultMetrics();

// Custom Metrics
const requestCounter = new client.Counter({
  name: 'payment_requests_total',
  help: 'Total requests to Payment Service',
  labelNames: ['method', 'route', 'status'],
});

const requestDuration = new client.Histogram({
  name: 'payment_request_duration_seconds',
  help: 'Request duration in seconds for Payment Service',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

// Middleware đo metrics
app.use((req, res, next) => {
  const end = requestDuration.startTimer();
  res.on('finish', () => {
    requestCounter.labels(req.method, req.path, String(res.statusCode)).inc();
    end({ method: req.method, route: req.path, status: String(res.statusCode) });
  });
  next();
});

// ===== Process Payment =====
app.post('/pay', async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    // Kiểm tra xem đơn hàng có tồn tại không (gọi từ Order Service)
    const { data: order } = await axios.get(
      `http://order:3003/orders/${orderId}`
    );
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Tạo Payment record trong DB
    const payment = await Payment.create({ order_id: orderId, amount, status: 'paid' });

    // Cập nhật trạng thái của Order (đơn hàng đã được thanh toán)
    try {
      await axios.put(`http://order:3003/orders/${orderId}/status`, { status: 'paid' });
      res.status(201).json({ message: 'Payment processed successfully', payment });
    } catch (err) {
    if (e.response && e.response.data) {
      // Upstream service error (e.g., Order Service)
      res.status(e.response.status || 502).json({
        error: 'Upstream service error',
        details: e.response.data,
      });
    } else if (e.name === 'SequelizeValidationError') {
      // Validation error from Sequelize
      res.status(400).json({
        error: 'Validation error',
        details: e.errors.map(err => err.message),
      });
    } else {
      // Other errors
      res.status(400).json({ error: e.message });
    }
      await payment.destroy();
      res.status(500).json({ error: 'Failed to update order status, payment rolled back', details: err.message });
    }
  } catch (e) {
    if (e.response && e.response.data) {
      // Upstream service error (e.g., Order Service)
      res.status(e.response.status || 502).json({
        error: 'Upstream service error',
        details: e.response.data,
      });
    } else if (e.name === 'SequelizeValidationError') {
      // Validation error from Sequelize
      res.status(400).json({
        error: 'Validation error',
        details: e.errors.map(err => err.message),
      });
    } else {
      // Other errors
      res.status(400).json({ error: e.message });
    }
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
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Start server
(async () => {
  try {
    await sequelize.authenticate();
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync(); // Ensure DB tables are created only in non-production
    }
    app.listen(PORT, () => console.log(`Payment Service running on port ${PORT}`));
  } catch (e) {
    console.error('Unable to connect to the database:', e);
    process.exit(1);
  }
})();
