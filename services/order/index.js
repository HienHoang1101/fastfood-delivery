const express = require('express');
const client = require('prom-client'); // npm install prom-client
const app = express();
const PORT = process.env.PORT || 3000;

// Counter metric
const requestCounter = new client.Counter({
  name: 'order_requests_total',
  help: 'Total requests to Order Service'
});

app.use(express.json());

// Middleware tăng counter
app.use((req, res, next) => {
  requestCounter.inc();
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
