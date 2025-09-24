const express = require('express');
const client = require('prom-client'); // npm install prom-client
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ===== Default Metrics (CPU, memory, event loop, heap, etc.) =====
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

// Dummy API: danh sách sản phẩm
app.get('/products', (req, res) => {
  res.json([
    { id: 1, name: 'Burger', price: 5.99 },
    { id: 2, name: 'Fries', price: 2.99 }
  ]);
});

// Dummy API: thêm sản phẩm
app.post('/products', (req, res) => {
  const { name, price } = req.body;
  res.json({ message: `Product ${name} added (dummy)` });
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Optional /
app.get('/', (req, res) => res.send('Product Service is running!'));

app.listen(PORT, () => console.log(`Product Service running on port ${PORT}`));
