const express = require('express');
const Product = require('./models/Product'); // Import Product model
const sequelize = require('./db'); // Import sequelize for DB connection
const client = require('prom-client'); // Prometheus metrics
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ===== Default Metrics (CPU, memory, event loop, heap, etc.) =====
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

// ===== CRUD API =====
// Create Product
app.post('/products', async (req, res) => {
  try {
    const { name, description, price, category, image_url, stock } = req.body;
    const product = await Product.create({ name, description, price, category, image_url, stock });
    res.status(201).json(product);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Get all Products with pagination and filter
const { Sequelize } = require('sequelize'); // Đảm bảo import Sequelize đúng

app.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 10, q, category, minPrice, maxPrice } = req.query;
    const where = {};

    if (q) where.name = { [Sequelize.Op.iLike]: `%${q}%` }; // Dùng Sequelize.Op.iLike để tìm kiếm theo tên
    if (category) where.category = category;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Sequelize.Op.gte] = minPrice;
      if (maxPrice) where.price[Sequelize.Op.lte] = maxPrice;
    }

    const { rows, count } = await Product.findAndCountAll({
      where,
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
    });

    res.json({ items: rows, page: Number(page), limit: Number(limit), total: count });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});


// Get Product by ID
app.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    return product ? res.json(product) : res.status(404).json({ error: 'Product not found' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Update Product by ID
app.put('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    await product.update(req.body);
    res.json(product);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Delete Product by ID
app.delete('/products/:id', async (req, res) => {
  try {
    const deleted = await Product.destroy({ where: { id: req.params.id } });
    res.json({ deleted });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Health check
app.get('/health', async (req, res) => {
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
    await sequelize.sync(); // Tạo bảng nếu chưa có
    app.listen(PORT, () => console.log(`Product Service running on port ${PORT}`));
  } catch (e) {
    console.error('Unable to connect to the database:', e);
    process.exit(1);
  }
})();
