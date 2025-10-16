const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const winston = require('winston');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// ===== LOGGING SETUP =====
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
});

// ===== ENVIRONMENT VALIDATION =====
const requiredEnvVars = ['JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  logger.error('Missing required environment variables', { missing: missingEnvVars });
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  logger.error('JWT_SECRET must be at least 32 characters long');
  process.exit(1);
}

// ===== MIDDLEWARE =====
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
}));

app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3005'
    ];
    
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'X-User-Role', 'X-User-Email'],
  exposedHeaders: ['X-Request-Id'],
  maxAge: 86400
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID
app.use((req, res, next) => {
  req.id = require('crypto').randomBytes(16).toString('hex');
  res.setHeader('X-Request-Id', req.id);
  next();
});

app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// ===== HEALTH CHECK (BEFORE AUTH) =====
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ===== JWT AUTHENTICATION MIDDLEWARE =====
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
  if (isPublicRoute(req.path, req.method)) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn('Missing token', { path: req.path, ip: req.ip });
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('Invalid token', { error: err.message, path: req.path });
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

app.use(authenticateToken);

// Apply auth rate limiting AFTER authentication check
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);

// ===== PROXY CONFIGURATION =====
const proxyOptions = (target, serviceName) => ({
  target,
  changeOrigin: true,
  pathRewrite: (path) => {
    return path.replace(/^\/api\/[^/]+/, '');
  },
  onProxyReq: (proxyReq, req) => {
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.id);
      proxyReq.setHeader('X-User-Email', req.user.email);
      proxyReq.setHeader('X-User-Role', req.user.role || 'customer');
    }
    proxyReq.setHeader('X-Request-Id', req.id);
    proxyReq.setHeader('X-Forwarded-For', req.ip);
    
    logger.info('Proxying request', {
      service: serviceName,
      path: req.path,
      method: req.method,
      requestId: req.id
    });
  },
  onProxyRes: (proxyRes, req) => {
    logger.info('Proxy response', {
      service: serviceName,
      statusCode: proxyRes.statusCode,
      requestId: req.id
    });
  },
  onError: (err, req, res) => {
    logger.error('Proxy error', {
      service: serviceName,
      error: err.message,
      path: req.path,
      requestId: req.id
    });
    res.status(503).json({ 
      error: 'Service temporarily unavailable',
      message: err.message,
      requestId: req.id
    });
  },
  timeout: 30000,
  proxyTimeout: 30000
});

// ===== ROUTE PROXIES =====
app.use('/api/users', createProxyMiddleware(
  proxyOptions(process.env.USER_SERVICE_URL || 'http://user:3000', 'user-service')
));

app.use('/api/products', createProxyMiddleware(
  proxyOptions(process.env.PRODUCT_SERVICE_URL || 'http://product:3000', 'product-service')
));

app.use('/api/orders', createProxyMiddleware(
  proxyOptions(process.env.ORDER_SERVICE_URL || 'http://order:3000', 'order-service')
));

app.use('/api/payments', createProxyMiddleware(
  proxyOptions(process.env.PAYMENT_SERVICE_URL || 'http://payment:3000', 'payment-service')
));

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { 
    error: err.message, 
    stack: err.stack,
    path: req.path,
    requestId: req.id
  });
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    requestId: req.id,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  logger.warn('Route not found', { 
    path: req.originalUrl,
    method: req.method,
    requestId: req.id
  });
  res.status(404).json({ 
    error: 'Route not found',
    requestId: req.id
  });
});

// ===== GRACEFUL SHUTDOWN =====
const server = app.listen(PORT, () => {
  logger.info('API Gateway started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });
});

const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

module.exports = app;