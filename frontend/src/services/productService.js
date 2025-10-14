import api from './api';

const productService = {
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

  getProductById: async (id) => {
    const response = await api.get(`/products/products/${id}`);
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/products/categories');
    return response.data;
  },

  searchProducts: async (searchTerm) => {
    const response = await api.get(`/products/products?search=${searchTerm}`);
    return response.data;
  },
};

export default productService;
