const express = require('express');
const client = require('prom-client'); // npm install prom-client
const app = express();
const PORT = process.env.PORT || 3000;

// Metric counter
const requestCounter = new client.Counter({
  name: 'product_requests_total',
  help: 'Total requests to Product Service'
});

app.use(express.json());

// Middleware tăng counter cho mọi request
app.use((req, res, next) => {
  requestCounter.inc();
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
