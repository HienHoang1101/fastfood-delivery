const express = require('express');
const client = require('prom-client');
const app = express();
const PORT = process.env.PORT || 3000;

// Counter metric
const requestCounter = new client.Counter({
  name: 'user_requests_total',
  help: 'Total requests to User Service'
});

app.use(express.json());

// Middleware tăng counter
app.use((req, res, next) => {
  requestCounter.inc();
  next();
});

// Dummy APIs
app.post('/register', (req, res) => res.json({ message: 'User registered (dummy)' }));
app.post('/login', (req, res) => res.json({ message: 'User logged in (dummy)' }));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Metrics cho Prometheus scrape
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Optional /
app.get('/', (req, res) => res.send('User Service is running!'));

app.listen(PORT, () => console.log(`User Service running on port ${PORT}`));
