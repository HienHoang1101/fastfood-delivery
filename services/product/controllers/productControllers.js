// services/product/controllers/productController.js

const Product = require('../models/Product');

// @desc    Fetch all products
// @route   GET /products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// @desc    Fetch a single product by ID
// @route   GET /products/:id
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (product) {
      res.status(200).json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// @desc    Create a new product
// @route   POST /products
// @access  Admin only (logic to be added in gateway)
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, imageUrl } = req.body;
    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock,
      imageUrl,
    });
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};