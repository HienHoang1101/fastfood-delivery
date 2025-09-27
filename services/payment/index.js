// services/payment/index.js
const express = require('express');
const axios = require('axios');
const Payment = require('./models/Payment');
const sequelize = require('./db');
const client = require('prom-client'); // Prometheus Metrics
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ===== Prometheus Metrics =====
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics(); // CPU, memory, event loop, etc.

const counter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of requests',
  labelNames: ['method', 'route', 'status'],
});

const histogram = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

// Middleware đo request
app.use((req, res, next) => {
  const end = histogram.startTimer();
  res.on('finish', () => {
    counter.labels(req.method, req.path, res.statusCode).inc();
    end({ method: req.method, route: req.path, status: res.statusCode });
  });
  next();
});

// ===== Pay =====
app.post('/pay', async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    if (!orderId || !amount) return res.status(400).json({ error: 'OrderId and amount are required' });

    // Liên kết với Order Service để kiểm tra đơn hàng
    const { data: order } = await axios.get(`http://order:3003/orders/${orderId}`);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Giả lập thanh toán (hoặc tích hợp cổng thanh toán thực)
    const status = 'completed';  // Giả sử thanh toán thành công

    // Tạo thanh toán trong DB
    const payment = await Payment.create({ order_id: orderId, amount, status });

    res.status(201).json({ paymentId: payment.id, status: payment.status });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ===== Get Payments =====
app.get('/payments', async (req, res) => {
  try {
    const payments = await Payment.findAll();
    res.json(payments);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ===== Get Payment by ID =====
app.get('/payments/:id', async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (e) {
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
})

// Metrics endpoint cho Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Optional /
app.get('/', (req, res) => res.send('Payment Service is running!'));

// Start the server
(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); // Tạo bảng nếu chưa có
    app.listen(PORT, () => console.log(`Payment Service running on port ${PORT}`));
  } catch (e) {
    console.error('Unable to connect to the database:', e);
    process.exit(1);
  }
})();
