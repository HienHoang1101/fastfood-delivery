const express = require('express');
const app = express();
// const PORT = process.env.PORT || 3003;
const PORT = process.env.PORT || 3000; // 3000 để CI đồng nhất

app.use(express.json());

// API tạo đơn hàng (dummy)
app.post('/payments', (req, res) => {
  const { orderId, amount } = req.body || {};
  if (!orderId || !amount) {
    return res.status(400).json({ error: 'orderId and amount are required' });
  }
  res.json({ message: `Payment of $${amount} for order ${orderId} processed` });
});


// API lấy danh sách đơn hàng (dummy)
app.get('/orders', (req, res) => {
  res.json([
    { id: 1, userId: 1, products: [{ id: 1, name: 'Burger' }] },
    { id: 2, userId: 2, products: [{ id: 2, name: 'Fries' }] }
  ]);
});

app.listen(PORT, () => console.log(`Order Service running on port ${PORT}`));
