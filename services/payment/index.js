const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const Payment = require('./models/Payment');
const sequelize = require('./db');
const client = require('prom-client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ORDER_SERVICE_URL = process.env.ORDER_URL || 'http://order:3000';

app.use(express.json());

// ===== PROMETHEUS METRICS =====
client.collectDefaultMetrics();

const requestCounter = new client.Counter({
  name: 'payment_requests_total',
  help: 'Total requests to Payment Service',
  labelNames: ['method', 'route', 'status']
});

const paymentCounter = new client.Counter({
  name: 'payments_total',
  help: 'Total number of payments',
  labelNames: ['status', 'method']
});

const paymentAmountHistogram = new client.Histogram({
  name: 'payment_amount_dollars',
  help: 'Payment amounts in dollars',
  buckets: [10, 25, 50, 100, 250, 500, 1000]
});

const paymentProcessingDuration = new client.Histogram({
  name: 'payment_processing_duration_seconds',
  help: 'Time to process payments',
  labelNames: ['status'],
  buckets: [0.1, 0.5, 1, 2, 5]
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
const validatePayment = [
  body('orderId').isInt().withMessage('Order ID must be an integer'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('paymentMethod').isIn(['credit_card', 'debit_card', 'cash', 'e_wallet'])
    .withMessage('Invalid payment method'),
  body('cardDetails').optional().isObject()
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

const verifyOrder = async (orderId, userId) => {
  try {
    const response = await axios.get(
      `${ORDER_SERVICE_URL}/orders/${orderId}`,
      {
        headers: { 'X-User-Id': userId },
        timeout: 5000
      }
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Order not found');
    }
    throw new Error('Failed to verify order');
  }
};

const updateOrderPaymentStatus = async (orderId, paymentId, userId) => {
  try {
    await axios.patch(
      `${ORDER_SERVICE_URL}/orders/${orderId}/status`,
      { status: 'confirmed' },
      {
        headers: { 
          'X-User-Id': userId,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );
  } catch (error) {
    console.error('Failed to update order status:', error.message);
    // Don't throw - payment is already processed
  }
};

// Simulate payment processing
const processPayment = async (paymentMethod, amount, cardDetails = null) => {
  // Simulate payment gateway delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

  // Simulate payment failures (10% failure rate)
  if (Math.random() < 0.1) {
    throw new Error('Payment declined by payment gateway');
  }

  // Generate transaction ID
  const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  return {
    success: true,
    transactionId,
    message: 'Payment processed successfully'
  };
};

// ===== PAYMENT ROUTES =====

// Create payment
app.post('/payments', validatePayment, handleValidationErrors, async (req, res) => {
  const endTimer = paymentProcessingDuration.startTimer();
  const transaction = await sequelize.transaction();

  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const { orderId, amount, paymentMethod, cardDetails } = req.body;

    // Verify order exists and belongs to user
    const order = await verifyOrder(orderId, userId);

    if (order.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Order is not in pending status',
        currentStatus: order.status 
      });
    }

    // Verify amount matches order total
    if (parseFloat(amount).toFixed(2) !== parseFloat(order.total_price).toFixed(2)) {
      return res.status(400).json({ 
        error: 'Payment amount does not match order total',
        expected: order.total_price,
        provided: amount
      });
    }

    // Check for existing payment
    const existingPayment = await Payment.findOne({
      where: { 
        order_id: orderId,
        status: { [require('sequelize').Op.in]: ['completed', 'pending'] }
      }
    });

    if (existingPayment) {
      return res.status(409).json({ 
        error: 'Payment already exists for this order',
        payment: existingPayment
      });
    }

    // Create payment record
    const payment = await Payment.create({
      order_id: orderId,
      user_id: userId,
      amount,
      payment_method: paymentMethod,
      status: 'pending'
    }, { transaction });

    // Process payment with payment gateway
    let paymentResult;
    try {
      paymentResult = await processPayment(paymentMethod, amount, cardDetails);
    } catch (error) {
      // Update payment as failed
      await payment.update({ 
        status: 'failed',
        transaction_id: null,
        error_message: error.message
      }, { transaction });

      await transaction.commit();

      paymentCounter.labels('failed', paymentMethod).inc();
      endTimer({ status: 'failed' });

      return res.status(402).json({ 
        error: 'Payment failed',
        message: error.message,
        paymentId: payment.id
      });
    }

    // Update payment as completed
    await payment.update({
      status: 'completed',
      transaction_id: paymentResult.transactionId,
      completed_at: new Date()
    }, { transaction });

    await transaction.commit();

    // Update order status to confirmed (don't wait for this)
    updateOrderPaymentStatus(orderId, payment.id, userId).catch(err => {
      console.error('Failed to update order:', err);
    });

    // Update metrics
    paymentCounter.labels('completed', paymentMethod).inc();
    paymentAmountHistogram.observe(parseFloat(amount));
    endTimer({ status: 'success' });

    res.status(201).json({
      message: 'Payment processed successfully',
      payment: {
        id: payment.id,
        orderId: payment.order_id,
        amount: payment.amount,
        status: payment.status,
        transactionId: payment.transaction_id,
        paymentMethod: payment.payment_method,
        completedAt: payment.completed_at
      }
    });

  } catch (error) {
    await transaction.rollback();
    endTimer({ status: 'error' });
    console.error('Payment processing error:', error);

    if (error.message === 'Order not found') {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// Get payment by ID
app.get('/payments/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const payment = await Payment.findOne({
      where: {
        id: req.params.id,
        user_id: userId
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// Get payments for a specific order
app.get('/orders/:orderId/payments', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const payments = await Payment.findAll({
      where: {
        order_id: req.params.orderId,
        user_id: userId
      },
      order: [['createdAt', 'DESC']]
    });

    res.json(payments);
  } catch (error) {
    console.error('Get order payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Get all payments for user
app.get('/payments', async (req, res) => {
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

    const { count, rows } = await Payment.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      payments: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Refund payment (admin only)
app.post('/payments/:id/refund', async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const payment = await Payment.findByPk(req.params.id);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ 
        error: 'Only completed payments can be refunded',
        currentStatus: payment.status
      });
    }

    // Simulate refund processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    await payment.update({
      status: 'refunded',
      refunded_at: new Date()
    }, { transaction });

    await transaction.commit();

    paymentCounter.labels('refunded', payment.payment_method).inc();

    res.json({
      message: 'Payment refunded successfully',
      payment
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Refund payment error:', error);
    res.status(500).json({ error: 'Failed to refund payment' });
  }
});

// Get payment statistics (admin only)
app.get('/statistics/payments', async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate && endDate) {
      where.createdAt = {
        [require('sequelize').Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const [totalPayments, completedPayments, failedPayments, totalRevenue, paymentMethods] = await Promise.all([
      Payment.count({ where }),
      Payment.count({ where: { ...where, status: 'completed' } }),
      Payment.count({ where: { ...where, status: 'failed' } }),
      Payment.sum('amount', { where: { ...where, status: 'completed' } }),
      Payment.findAll({
        where: { ...where, status: 'completed' },
        attributes: [
          'payment_method',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'total']
        ],
        group: ['payment_method']
      })
    ]);

    res.json({
      totalPayments,
      completedPayments,
      failedPayments,
      totalRevenue: totalRevenue || 0,
      successRate: totalPayments > 0 ? ((completedPayments / totalPayments) * 100).toFixed(2) : 0,
      paymentMethodBreakdown: paymentMethods
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// ===== HEALTH CHECK =====
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();

    // Check order service connectivity
    try {
      await axios.get(`${ORDER_SERVICE_URL}/health`, { timeout: 3000 });
    } catch (error) {
      return res.status(503).json({
        status: 'degraded',
        database: 'connected',
        orderService: 'unreachable'
      });
    }

    res.json({ 
      status: 'ok',
      database: 'connected',
      orderService: 'connected',
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
      console.log(`🚀 Payment Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
})();

module.exports = app;