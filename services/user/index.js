// services/user/index.js
require('dotenv').config(); // <— Đặt lên hàng đầu để .env load trước khi require db

const express = require('express');
const client = require('prom-client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const sequelize = require('./db'); // <— KHÔNG destructure
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// ===== Metrics =====
client.collectDefaultMetrics();

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

app.use(express.json());
app.use((req, res, next) => {
  const end = requestDuration.startTimer();
  res.on('finish', () => {
    requestCounter.labels(req.method, req.path, res.statusCode).inc();
    end({ method: req.method, route: req.path, status: res.statusCode });
  });
  next();
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email, password are required' });
    }
    const existed = await User.findOne({ where: { email } });
    if (existed) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash: hash });
    res.status(201).json({ message: 'User registered', userId: user.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username, password are required' });

    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    app.listen(PORT, () => console.log(`User Service running on port ${PORT}`));
  } catch (e) {
    console.error('Failed to start:', e.message);
    process.exit(1);
  }
})();
