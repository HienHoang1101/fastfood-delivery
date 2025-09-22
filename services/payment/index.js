const express = require('express');
const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());

// API thanh toán đơn hàng (dummy)
app.post('/payments', (req, res) => {
  const { orderId, amount } = req.body;
  res.json({ message: `Payment of $${amount} for order ${orderId} processed` });
});

app.listen(PORT, () => console.log(`Payment Service running on port ${PORT}`));
