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

// ===== ENVIRONMENT VALIDATION =====
const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

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

app.use((req, res, next) => {
  const end = () => {
    requestCounter.labels(req.method, req.route?.path || req.path, res.statusCode).inc();
  };
  res.on('finish', end);
  next();
});

// ===== VALIDATION MIDDLEWARE (ENHANCED) =====
const validateCreateOrder = [
  body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
  body('items.*.productId').isInt({ min: 1 }).withMessage('Product ID must be a positive integer'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('deliveryAddress').optional().trim().notEmpty().withMessage('Delivery address cannot be empty'),
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
    }, {
      timeout: 5000
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
    }, {
      timeout: 5000
    });
  } catch (error) {
    console.error(`Failed to update stock for product ${productId}:`, error.message);
    throw new Error('Failed to update product stock');
  }
};

// ===== ORDER ROUTES =====

// ✅ Create new order (FIXED)
app.post('/orders', validateCreateOrder, handleValidationErrors, async (req, res) => {
  const endTimer = orderProcessingDuration.startTimer();
  const transaction = await sequelize.transaction();

  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const { items, deliveryAddress, notes } = req.body;

    // ✅ FIX 1: Check for duplicate product IDs
    const productIds = items.map(item => item.productId);
    const uniqueProductIds = new Set(productIds);
    
    if (uniqueProductIds.size !== productIds.length) {
      return res.status(400).json({ 
        error: 'Duplicate products in order',
        message: 'Each product can only appear once. Please combine quantities instead.'
      });
    }

    // ✅ FIX 2: Validate all quantities are positive
    const invalidQuantities = items.filter(item => item.quantity <= 0);
    if (invalidQuantities.length > 0) {
      return res.status(400).json({ 
        error: 'Invalid quantities',
        message: 'All product quantities must be greater than 0'
      });
    }

    // ✅ FIX 3: Validate reasonable quantity limits
    const maxQuantityPerItem = 100;
    const excessiveQuantities = items.filter(item => item.quantity > maxQuantityPerItem);
    if (excessiveQuantities.length > 0) {
      return res.status(400).json({ 
        error: 'Quantity limit exceeded',
        message: `Maximum ${maxQuantityPerItem} items per product`
      });
    }

    // Fetch product details
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
        throw new Error(`Product "${product.name}" is not available`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`);
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

    // ✅ Validate minimum order amount
    const minOrderAmount = 5;
    if (totalPrice < minOrderAmount) {
      return res.status(400).json({ 
        error: 'Minimum order amount not met',
        message: `Minimum order amount is $${minOrderAmount}`,
        currentTotal: totalPrice.toFixed(2)
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

    if (error.message.includes('not found') || 
        error.message.includes('stock') || 
        error.message.includes('available')) {
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

// ... continued from Part 1

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
    const userRole = req.headers['x-user-role'];
    const { status } = req.body;

    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check authorization
    if (order.user_id !== parseInt(userId) && userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
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
        error: `Cannot transition from ${order.status} to ${status}`,
        currentStatus: order.status,
        allowedTransitions: validTransitions[order.status]
      });
    }

    // If cancelling, restore product stock
    if (status === 'cancelled' && order.status !== 'cancelled') {
      const orderItems = await OrderItem.findAll({
        where: { order_id: order.id }
      });

      for (const item of orderItems) {
        try {
          await updateProductStock(item.productId, item.quantity, 'increment');
        } catch (error) {
          console.error(`Failed to restore stock for product ${item.productId}:`, error);
          // Continue with other items even if one fails
        }
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
        error: 'Cannot cancel order in current status',
        currentStatus: order.status,
        message: 'Only pending or confirmed orders can be cancelled'
      });
    }

    // Restore product stock
    const orderItems = await OrderItem.findAll({
      where: { order_id: order.id }
    });

    for (const item of orderItems) {
      try {
        await updateProductStock(item.productId, item.quantity, 'increment');
      } catch (error) {
        console.error(`Failed to restore stock for product ${item.productId}:`, error);
        // Continue with other items
      }
    }

    await order.update({ status: 'cancelled' });

    orderCounter.labels('cancelled').inc();

    res.json({ 
      message: 'Order cancelled successfully',
      orderId: order.id
    });
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
    let productServiceStatus = 'connected';
    try {
      await axios.get(`${PRODUCT_SERVICE_URL}/health`, { timeout: 3000 });
    } catch (error) {
      productServiceStatus = 'unreachable';
    }

    const status = productServiceStatus === 'connected' ? 'ok' : 'degraded';

    res.status(status === 'ok' ? 200 : 503).json({
      status,
      service: 'order-service',
      database: 'connected',
      productService: productServiceStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      service: 'order-service',
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
