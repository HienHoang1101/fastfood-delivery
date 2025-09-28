// services/user/index.js
require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const client = require('prom-client');
const sequelize = require('./db');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

app.use(express.json());

// ===== Prometheus Default Metrics =====
client.collectDefaultMetrics();

// ===== Custom Metrics =====
const requestCounter = new client.Counter({
  name: 'user_requests_total',
  help: 'Total requests to User Service',
  labelNames: ['method', 'route', 'status'],
});
const requestDuration = new client.Histogram({
  name: 'user_request_duration_seconds',
  help: 'Request duration in seconds for User Service',
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

// ===== Register Endpoint =====
app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const existed = await User.findOne({ where: { email } });
    if (existed) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password_hash: hash });

    res.status(201).json({ message: 'User registered', userId: user.id });
  } catch (e) {
    console.error('Registration error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ===== Login Endpoint =====
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: 'Login successful', token });
  } catch (e) {
    console.error('Login error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ===== Health Check =====
app.get('/health', async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok' });
  } catch (e) {
    res.status(500).json({ status: 'down', error: e.message });
  }
});

// ===== Metrics Endpoint =====
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// ===== Default Route =====
app.get('/', (_req, res) => {
  res.send('User Service is running');
});

// ===== Start Server & Sync DB =====
(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true }); // Tạo bảng users nếu chưa có
    app.listen(PORT, () => console.log(`User Service running on port ${PORT}`));
  } catch (e) {
    console.error('Unable to connect to the database:', e);
    process.exit(1);
  }
})();