const express = require('express');
const client = require('prom-client'); // npm install prom-client
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ===== Default Metrics (CPU, memory, event loop, heap, etc.) =====
client.collectDefaultMetrics();

// === Custom Metric ===
const requestCounter = new client.Counter({
  name: 'user_requests_total',
  help: 'Total requests to User Service',
  labelNames: ['method', 'route', 'status'],
});

const requestDuration = new client.Histogram({
  name: 'user_request_duration_seconds',
  help: 'Request duration in seconds for User Service',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5], // thời gian xử lý request (s)
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

// API tạo đơn hàng (dummy)
app.post('/orders', (req, res) => {
  const { userId, products } = req.body || {};
  if (!userId || !products) {
    return res.status(400).json({ error: 'userId and products are required' });
  }
  res.json({ message: `Order created for user ${userId} (dummy)` });
});

// API lấy danh sách đơn hàng (dummy)
app.get('/orders', (req, res) => {
  res.json([
    { id: 1, userId: 1, products: [{ id: 1, name: 'Burger' }] },
    { id: 2, userId: 2, products: [{ id: 2, name: 'Fries' }] }
  ]);
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Metrics endpoint cho Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Optional /
app.get('/', (req, res) => res.send('Order Service is running!'));

// Start server
app.listen(PORT, () => console.log(`Order Service running on port ${PORT}`));
