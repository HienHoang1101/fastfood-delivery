// services/product/routes/products.js

const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
} = require('../controllers/productController');

// Route for getting all products and creating a new one
router.route('/')
  .get(getProducts)
  .post(createProduct);

// Route for a single product
router.route('/:id')
  .get(getProductById);
  // You can add .put(updateProduct) and .delete(deleteProduct) here later

module.exports = router;