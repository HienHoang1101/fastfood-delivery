const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// ===== MIDDLEWARE =====

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// ===== JWT AUTHENTICATION MIDDLEWARE =====

const authenticateToken = (req, res, next) => {
  // Bypass authentication for public routes
  const publicRoutes = ['/api/users/login', '/api/users/register', '/api/products', '/health'];
  const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));
  
  if (isPublicRoute && req.method === 'GET') {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Apply authentication to protected routes
app.use('/api/orders', authenticateToken);
app.use('/api/payments', authenticateToken);

// ===== PROXY CONFIGURATION =====

const proxyOptions = (target) => ({
  target,
  changeOrigin: true,
  pathRewrite: (path, req) => {
    // Remove /api prefix for internal services
    return path.replace(/^\/api\/[^/]+/, '');
  },
  onProxyReq: (proxyReq, req) => {
    // Forward user info to services
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.id);
      proxyReq.setHeader('X-User-Email', req.user.email);
    }
  },
  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    res.status(503).json({ 
      error: 'Service temporarily unavailable',
      message: err.message 
    });
  }
});

// ===== ROUTE PROXIES =====

// User Service
app.use('/api/users', createProxyMiddleware(
  proxyOptions(process.env.USER_SERVICE_URL || 'http://user:3000')
));

// Product Service
app.use('/api/products', createProxyMiddleware(
  proxyOptions(process.env.PRODUCT_SERVICE_URL || 'http://product:3000')
));

// Order Service
app.use('/api/orders', createProxyMiddleware(
  proxyOptions(process.env.ORDER_SERVICE_URL || 'http://order:3000')
));

// Payment Service
app.use('/api/payments', createProxyMiddleware(
  proxyOptions(process.env.PAYMENT_SERVICE_URL || 'http://payment:3000')
));

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;