const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { Op } = require('sequelize');
const Product = require('./models/Product');
const sequelize = require('./db');
const client = require('prom-client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ===== PROMETHEUS METRICS =====
client.collectDefaultMetrics();

const requestCounter = new client.Counter({
  name: 'product_requests_total',
  help: 'Total requests to Product Service',
  labelNames: ['method', 'route', 'status']
});

const productViewCounter = new client.Counter({
  name: 'product_views_total',
  help: 'Total product views',
  labelNames: ['product_id']
});

const productStockGauge = new client.Gauge({
  name: 'product_stock_level',
  help: 'Current stock level of products',
  labelNames: ['product_id', 'product_name']
});

// Middleware đo metrics
app.use((req, res, next) => {
  const end = () => {
    requestCounter.labels(req.method, req.route?.path || req.path, res.statusCode).inc();
  };
  res.on('finish', end);
  next();
});

// ===== VALIDATION MIDDLEWARE =====
const validateProduct = [
  body('name').trim().isLength({ min: 2, max: 200 }).withMessage('Name must be between 2-200 characters'),
  body('description').optional().trim(),
  body('price').isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be non-negative integer'),
  body('image_url').optional().isURL().withMessage('Invalid image URL')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ===== HELPER FUNCTIONS =====
const isAdmin = (req) => {
  return req.headers['x-user-role'] === 'admin';
};

const updateStockMetrics = async () => {
  try {
    const products = await Product.findAll();
    products.forEach(product => {
      productStockGauge.labels(product.id.toString(), product.name).set(product.stock);
    });
  } catch (error) {
    console.error('Failed to update stock metrics:', error);
  }
};

// ===== PRODUCT ROUTES =====

// Get all products with filtering, search, and pagination
app.get('/products', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().trim(),
  query('search').optional().trim(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('inStock').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      search,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'createdAt',
      order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;

    // Build where clause
    const where = {};

    if (category) {
      where.category = category;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }

    if (inStock === 'true') {
      where.stock = { [Op.gt]: 0 };
    }

    // Execute query
    const { count, rows } = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, order.toUpperCase()]]
    });

    res.json({
      products: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product by ID
app.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Track view
    productViewCounter.labels(product.id.toString()).inc();

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Get products by IDs (bulk endpoint for order service)
app.post('/products/bulk', [
  body('ids').isArray().withMessage('IDs must be an array'),
  body('ids.*').isInt().withMessage('Each ID must be an integer')
], handleValidationErrors, async (req, res) => {
  try {
    const { ids } = req.body;

    const products = await Product.findAll({
      where: {
        id: { [Op.in]: ids }
      }
    });

    res.json(products);
  } catch (error) {
    console.error('Bulk get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product categories
app.get('/categories', async (req, res) => {
  try {
    const categories = await Product.findAll({
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('category')), 'category']
      ],
      raw: true
    });

    res.json(categories.map(c => c.category));
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create new product (admin only)
app.post('/products', validateProduct, handleValidationErrors, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, description, price, category, stock, image_url } = req.body;

    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock,
      image_url
    });

    // Update metrics
    productStockGauge.labels(product.id.toString(), product.name).set(product.stock);

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product (admin only)
app.put('/products/:id', validateProduct, handleValidationErrors, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { name, description, price, category, stock, image_url } = req.body;

    await product.update({
      name,
      description,
      price,
      category,
      stock,
      image_url
    });

    // Update metrics
    productStockGauge.labels(product.id.toString(), product.name).set(product.stock);

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Update stock (internal use by order service)
app.patch('/products/:id/stock', [
  body('quantity').isInt().withMessage('Quantity must be an integer'),
  body('operation').isIn(['increment', 'decrement']).withMessage('Operation must be increment or decrement')
], handleValidationErrors, async (req, res) => {
  try {
    const { quantity, operation } = req.body;
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let newStock;
    if (operation === 'increment') {
      newStock = product.stock + quantity;
    } else {
      newStock = product.stock - quantity;
      if (newStock < 0) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }
    }

    await product.update({ stock: newStock });

    // Update metrics
    productStockGauge.labels(product.id.toString(), product.name).set(newStock);

    res.json({
      message: 'Stock updated successfully',
      product
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// Delete product (admin only)
app.delete('/products/:id', async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.destroy();

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ===== HEALTH CHECK =====
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ 
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      database: 'disconnected',
      error: error.message
    });
  }
});

// ===== METRICS ENDPOINT =====
app.get('/metrics', async (req, res) => {
  try {
    // Update stock metrics before serving
    await updateStockMetrics();
    
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (error) {
    res.status(500).json({ error: 'Failed to collect metrics' });
  }
});

// ===== START SERVER =====
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced');

    // Initialize stock metrics
    await updateStockMetrics();

    app.listen(PORT, () => {
      console.log(`🚀 Product Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
})();

module.exports = app;
