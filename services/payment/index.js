const express = require('express');
const client = require('prom-client'); // npm install prom-client
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ===== Prometheus Metrics =====
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics(); // CPU, memory, event loop, etc.

const counter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of requests',
  labelNames: ['method', 'route', 'status'],
});

const histogram = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

// Middleware đo request
app.use((req, res, next) => {
  const end = histogram.startTimer();
  res.on('finish', () => {
    counter.labels(req.method, req.path, res.statusCode).inc();
    end({ method: req.method, route: req.path, status: res.statusCode });
  });
  next();
});

// Dummy API: thanh toán đơn hàng
app.post('/payments', (req, res) => {
  const { orderId, amount } = req.body || {};
  if (!orderId || !amount) {
    return res.status(400).json({ error: 'orderId and amount are required' });
  }
  res.json({ message: `Payment of $${amount} for order ${orderId} processed` });
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Metrics endpoint cho Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Optional /
app.get('/', (req, res) => res.send('Payment Service is running!'));

// Start server
app.listen(PORT, () => console.log(`Payment Service running on port ${PORT}`));
