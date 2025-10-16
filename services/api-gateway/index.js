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

// ===== ENVIRONMENT VALIDATION =====
const requiredEnvVars = ['JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

if (process.env.NODE_ENV === 'production' && 
    process.env.JWT_SECRET === 'your-secret-key-change-in-production') {
  console.error('❌ SECURITY: Change JWT_SECRET in production!');
  process.exit(1);
}

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
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// ===== JWT AUTHENTICATION MIDDLEWARE (FIXED) =====

// ✅ Define public routes with specific HTTP methods
const PUBLIC_ROUTES = [
  { path: '/api/users/login', methods: ['POST'] },
  { path: '/api/users/register', methods: ['POST'] },
  { path: '/api/products/products', methods: ['GET'] },
  { path: '/api/products/categories', methods: ['GET'] },
  { path: '/health', methods: ['GET'] },
  { path: '/metrics', methods: ['GET'] }
];

const isPublicRoute = (path, method) => {
  return PUBLIC_ROUTES.some(route => 
    path.startsWith(route.path) && route.methods.includes(method)
  );
};

const authenticateToken = (req, res, next) => {
  // Check if route is public
  if (isPublicRoute(req.path, req.method)) {
    return next();
  }

  // Require authentication for all other routes
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ✅ Apply authentication globally
app.use(authenticateToken);

// ===== PROXY CONFIGURATION =====

const proxyOptions = (target) => ({
  target,
  changeOrigin: true,
  pathRewrite: (path, req) => {
    return path.replace(/^\/api\/[^/]+/, '');
  },
  onProxyReq: (proxyReq, req) => {
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.id);
      proxyReq.setHeader('X-User-Email', req.user.email);
      proxyReq.setHeader('X-User-Role', req.user.role || 'customer');
    }
  },
  onError: (err, req, res) => {
    console.error('Proxy Error:', err.message);
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
    service: 'api-gateway',
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
  console.log(`✅ JWT Authentication enabled`);
});

module.exports = app;