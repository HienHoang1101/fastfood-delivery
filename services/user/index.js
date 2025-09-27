require('dotenv').config();  // Load các biến môi trường từ .env
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const client = require('prom-client'); // Giám sát Prometheus

const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(
  process.env.DB_NAME || 'user_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    port: process.env.DB_PORT || 5432,
    logging: false,
  }
);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Lấy JWT_SECRET từ môi trường
const MAX_LOGIN_ATTEMPTS = 5; // Giới hạn số lần thử đăng nhập

app.use(express.json());

// ===== Default Metrics =====
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

// ===== Register =====
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
    console.error('Error in registration:', e.message);
    res.status(400).json({ error: e.message });
  }
});

// ===== Login =====
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    // Thêm cơ chế giới hạn số lần đăng nhập
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login successful', token });
  } catch (e) {
    console.error('Error in login:', e.message);
    res.status(400).json({ error: e.message });
  }
});

// Route mặc định để kiểm tra nếu server đang chạy
app.get('/', (req, res) => {
  res.send('User Service is running');
});


// ===== Health check =====
app.get('/health', async (_req, res) => {
  try {
    await sequelize.authenticate(); // Kiểm tra kết nối tới DB
    res.json({ status: 'ok' });
  } catch (e) {
    res.status(500).json({ status: 'down', error: e.message });
  }
});

// ===== Metrics endpoint for Prometheus =====
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Start the server with DB synchronization
(async () => {
  try {
    await sequelize.authenticate(); // Kiểm tra kết nối DB
    await sequelize.sync(); // Đồng bộ hóa bảng trong DB
    app.listen(PORT, () => console.log(`User Service running on port ${PORT}`));
  } catch (e) {
    console.error('Unable to connect to the database:', e);
    process.exit(1);
  }
})();
