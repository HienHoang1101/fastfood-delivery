// services/order/index.js
const express = require('express');
const axios = require('axios');
const Order = require('./models/Order');
const OrderItem = require('./models/OrderItem');
const sequelize = require('./db');
const jwt = require('jsonwebtoken');
const client = require('prom-client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

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
    requestCounter.labels(req.method, req.path, res.statusCode).inc();
    end({ method: req.method, route: req.path, status: res.statusCode });
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

    // Lấy thông tin sản phẩm từ Product Service
    const productDetails = await Promise.all(items.map(async (item) => {
      const { data: product } = await axios.get(`http://product:3002/products/${item.productId}`);
      if (!product) throw new Error(`Product not found: ${item.productId}`);
      if (product.stock < item.quantity) throw new Error(`Out of stock: ${item.productId}`);
      const lineTotal = (product.price * item.quantity).toFixed(2);
      return { productId: product.id, name: product.name, price: product.price, quantity: item.quantity, lineTotal };
    }));

    // Tính tổng tiền
    const total = productDetails.reduce((acc, item) => acc + Number(item.lineTotal), 0).toFixed(2);

    // Lưu đơn hàng vào DB
    const order = await Order.create({ user_id: userId, total_price: total, status: 'pending' });

    // Lưu order items
    await OrderItem.bulkCreate(productDetails.map((item) => ({ ...item, order_id: order.id })));

    res.status(201).json({ orderId: order.id, total, status: order.status });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ===== Get Order List =====
app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.findAll({ where: { user_id: req.query.userId }, include: [OrderItem] });
    res.json(orders);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ===== Update Order Status =====
app.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = status;
    await order.save();
    res.json(order);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Route mặc định để kiểm tra nếu server đang chạy
app.get('/', (req, res) => {
  res.send('User Service is running');
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

// Start the server
(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();  // Ensure DB tables are created
    app.listen(PORT, () => console.log(`Order Service running on port ${PORT}`));
  } catch (e) {
    console.error('Unable to connect to the database:', e);
    process.exit(1);
  }
})();
