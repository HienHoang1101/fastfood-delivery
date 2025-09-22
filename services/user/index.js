const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// API đăng ký user (dummy)
app.post('/register', (req, res) => {
  res.json({ message: 'User registered (dummy)' });
});

// API login (dummy)
app.post('/login', (req, res) => {
  res.json({ message: 'User logged in (dummy)' });
});

app.listen(PORT, () => console.log(`User Service running on port ${PORT}`));
