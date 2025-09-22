const express = require('express');
const client = require('prom-client'); // npm install prom-client
const app = express();
const PORT = process.env.PORT || 3000;

// Counter metric
const requestCounter = new client.Counter({
  name: 'payment_requests_total',
  help: 'Total requests to Payment Service'
});

app.use(express.json());

// Middleware tăng counter cho mọi request
app.use((req, res, next) => {
  requestCounter.inc();
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
