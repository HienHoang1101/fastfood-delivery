const express = require('express');
const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

// API lấy danh sách sản phẩm (dummy)
app.get('/products', (req, res) => {
  res.json([
    { id: 1, name: 'Burger', price: 5.99 },
    { id: 2, name: 'Fries', price: 2.99 }
  ]);
});

// API thêm sản phẩm mới (dummy)
app.post('/products', (req, res) => {
  const { name, price } = req.body;
  res.json({ message: `Product ${name} added (dummy)` });
});

app.listen(PORT, () => console.log(`Product Service running on port ${PORT}`));
