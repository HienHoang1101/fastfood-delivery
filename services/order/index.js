const express = require('express');
const axios = require('axios');
const axiosRetry = require('axios-retry');
const { body, validationResult } = require('express-validator');
const Order = require('./models/Order');
const OrderItem = require('./models/OrderItem');
const sequelize = require('./db');
const client = require('prom-client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const PRODUCT_SERVICE_URL = process.env.PRODUCT_URL || 'http://product:3000';

app.use(express.json());

// ===== AXIOS RETRY CONFIGURATION =====
axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  shouldResetTimeout: true,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
           (error.response && error.response.status >= 500);
  }
});

// ===== PROMETHEUS METRICS =====
client.collectDefaultMetrics();

const requestCounter = new client.Counter({
  name: 'order_requests_total',
  help: 'Total requests to Order Service',
  labelNames: ['method', 'route', 'status']
});

const orderCounter = new client.Counter({
  name: 'orders_total',
  help: 'Total number of orders',
  labelNames: ['status']
});

const orderValueHistogram = new client.Histogram({
  name: 'order_value_dollars',
  help: 'Order values in dollars',
  buckets: [10, 25, 50, 100, 250, 500, 1000]
});

const orderProcessingDuration = new client.Histogram({
  name: 'order_processing_duration_seconds',
  help: 'Time to process orders',
  labelNames: ['status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
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
const validateCreateOrder = [
  body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
  body('items.*.productId').isInt().withMessage('Product ID must be an integer'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('deliveryAddress').optional().trim().notEmpty(),
  body('notes').optional().trim()
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ===== HELPER FUNCTIONS =====
const getUserId = (req) => {
  return req.headers['x-user-id'];
};

const fetchProductDetails = async (productIds) => {
  try {
    const response = await axios.post(`${PRODUCT_SERVICE_URL}/products/bulk`, {
      ids: productIds
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch products:', error.message);
    throw new Error('Unable to fetch product details');
  }
};

const updateProductStock = async (productId, quantity, operation = 'decrement') => {
  try {
    await axios.patch(`${PRODUCT_SERVICE_URL}/products/${productId}/stock`, {
      quantity,
      operation
    });
  } catch (error) {
    console.error(`Failed to update stock for product ${productId}:`, error.message);
    throw new Error('Failed to update product stock');
  }
};

// ===== ORDER ROUTES =====

// Create new order
app.post('/orders', validateCreateOrder, handleValidationErrors, async (req, res) => {
  const endTimer = orderProcessingDuration.startTimer();
  const transaction = await sequelize.transaction();

  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const { items, deliveryAddress, notes } = req.body;

    // Fetch product details
    const productIds = items.map(item => item.productId);
    const products = await fetchProductDetails(productIds);

    if (!Array.isArray(products) || products.length !== items.length) {
      throw new Error('Some products not found');
    }

    // Validate stock and calculate totals
    const orderItems = [];
    let totalPrice = 0;

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      if (!product.isActive) {
        throw new Error(`Product ${product.name} is not available`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
      }

      const lineTotal = parseFloat(product.price) * item.quantity;
      totalPrice += lineTotal;

      orderItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        lineTotal: lineTotal.toFixed(2)
      });
    }

    // Create order
    const order = await Order.create({
      user_id: userId,
      total_price: totalPrice.toFixed(2),
      status: 'pending',
      delivery_address: deliveryAddress,
      notes
    }, { transaction });

    // Create order items
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id
    }));

    await OrderItem.bulkCreate(orderItemsWithOrderId, { transaction });

    // Update product stocks
    for (const item of items) {
      await updateProductStock(item.productId, item.quantity, 'decrement');
    }

    await transaction.commit();

    // Update metrics
    orderCounter.labels('pending').inc();
    orderValueHistogram.observe(parseFloat(totalPrice));
    endTimer({ status: 'success' });

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: order.id,
        total: totalPrice.toFixed(2),
        status: order.status,
        items: orderItems,
        createdAt: order.createdAt
      }
    });

  } catch (error) {
    await transaction.rollback();
    endTimer({ status: 'failed' });
    console.error('Create order error:', error);

    if (error.message.includes('not found') || error.message.includes('stock')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get all orders for user
app.get('/orders', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const where = { user_id: userId };
    if (status) {
      where.status = status;
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [{
        model: OrderItem,
        as: 'items'
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      orders: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get order by ID
app.get('/orders/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const order = await Order.findOne({
      where: { 
        id: req.params.id,
        user_id: userId 
      },
      include: [{
        model: OrderItem,
        as: 'items'
      }]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status
app.patch('/orders/:id/status', [
  body('status').isIn(['pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled'])
    .withMessage('Invalid status')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { status } = req.body;

    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check authorization
    if (order.user_id !== parseInt(userId)) {
      // Allow admin to update any order (check role from header)
      const userRole = req.headers['x-user-role'];
      if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    // Validate status transitions
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['delivering', 'cancelled'],
      'delivering': ['delivered'],
      'delivered': [],
      'cancelled': []
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({ 
        error: `Cannot transition from ${order.status} to ${status}` 
      });
    }

    // If cancelling, restore product stock
    if (status === 'cancelled' && order.status !== 'cancelled') {
      const orderItems = await OrderItem.findAll({
        where: { order_id: order.id }
      });

      for (const item of orderItems) {
        await updateProductStock(item.productId, item.quantity, 'increment');
      }
    }

    await order.update({ status });

    // Update metrics
    orderCounter.labels(status).inc();

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Cancel order
app.delete('/orders/:id', async (req, res) => {
  try {
    const userId = getUserId(req);

    const order = await Order.findOne({
      where: {
        id: req.params.id,
        user_id: userId
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Can only cancel if order is pending or confirmed
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ 
        error: 'Cannot cancel order in current status' 
      });
    }

    // Restore product stock
    const orderItems = await OrderItem.findAll({
      where: { order_id: order.id }
    });

    for (const item of orderItems) {
      await updateProductStock(item.productId, item.quantity, 'increment');
    }

    await order.update({ status: 'cancelled' });

    orderCounter.labels('cancelled').inc();

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// ===== HEALTH CHECK =====
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    
    // Check product service connectivity
    try {
      await axios.get(`${PRODUCT_SERVICE_URL}/health`, { timeout: 3000 });
    } catch (error) {
      return res.status(503).json({
        status: 'degraded',
        database: 'connected',
        productService: 'unreachable'
      });
    }

    res.json({ 
      status: 'ok',
      database: 'connected',
      productService: 'connected',
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

    app.listen(PORT, () => {
      console.log(`🚀 Order Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
})();

module.exports = app;
