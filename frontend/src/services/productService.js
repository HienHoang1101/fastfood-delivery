// frontend/src/services/productService.js
import api from './api';

const productService = {
  // Get all products with filters
  getProducts: async (params = {}) => {
    const { page = 1, limit = 20, category, search, minPrice, maxPrice, inStock } = params;
    
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(category && { category }),
      ...(search && { search }),
      ...(minPrice && { minPrice }),
      ...(maxPrice && { maxPrice }),
      ...(inStock !== undefined && { inStock }),
    });

    const response = await api.get(`/products/products?${queryParams}`);
    return response.data;
  },

  // Get product by ID
  getProductById: async (id) => {
    const response = await api.get(`/products/products/${id}`);
    return response.data;
  },

  // Get product categories
  getCategories: async () => {
    const response = await api.get('/products/categories');
    return response.data;
  },

  // Search products
  searchProducts: async (searchTerm) => {
    const response = await api.get(`/products/products?search=${searchTerm}`);
    return response.data;
  },

  // Get products by category
  getProductsByCategory: async (category, page = 1, limit = 20) => {
    const response = await api.get(
      `/products/products?category=${category}&page=${page}&limit=${limit}`
    );
    return response.data;
  },
};

export default productService;