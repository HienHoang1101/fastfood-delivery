// services/product/index.js
const express = require('express');
const Product = require('./models/Product');  // Model cho sản phẩm
const sequelize = require('./db');
const axios = require('axios');
const client = require('prom-client'); // Giám sát Prometheus
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product:3002';

app.use(express.json());

// ===== Default Metrics =====
client.collectDefaultMetrics();

// ===== Custom Metrics =====
const requestCounter = new client.Counter({
  name: 'product_requests_total',
  help: 'Total requests to Product Service',
  labelNames: ['method', 'route', 'status'],
});

const requestDuration = new client.Histogram({
  name: 'product_request_duration_seconds',
  help: 'Request duration in seconds for Product Service',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5], // Thời gian xử lý request (s)
});

// ===== Middleware đo metrics =====
app.use((req, res, next) => {
  const end = requestDuration.startTimer();
  res.on('finish', () => {
    requestCounter.labels(req.method, req.path, res.statusCode).inc();
    end({ method: req.method, route: req.path, status: res.statusCode });
  });
  next();
});

// ===== Get All Products =====
app.get('/products', async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== Get Product by ID =====
app.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== Create Product =====
app.post('/products', async (req, res) => {
  try {
    const { name, description, price, category, stock, image_url } = req.body;
    const product = await Product.create({ name, description, price, category, stock, image_url });
    res.status(201).json(product);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== Update Product =====
app.put('/products/:id', async (req, res) => {
  try {
    const { name, description, price, category, stock, image_url, is_available } = req.body;
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = category || product.category;
    product.stock = stock || product.stock;
    product.image_url = image_url || product.image_url;
    product.is_available = is_available || product.is_available;

    await product.save();
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== Delete Product =====
app.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    await product.destroy();
    res.json({ message: 'Product deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
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

// Metrics endpoint cho Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Start the server
(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();  // Ensure DB tables are created
    app.listen(PORT, () => console.log(`Product Service running on port ${PORT}`));
  } catch (e) {
    console.error('Unable to connect to the database:', e);
    process.exit(1);
  }
})();