// ==========================================
// frontend/src/pages/Products/index.jsx
// ==========================================
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Pagination,
} from '@mui/material';
import ProductList from '../../components/Products/ProductList';
import ProductFilters from '../../components/Products/ProductFilters';
import SearchBar from '../../components/Common/SearchBar';
import Loading from '../../components/Common/Loading';
import ErrorMessage from '../../components/Common/ErrorMessage';
import EmptyState from '../../components/Common/EmptyState';
import productService from '../../services/productService';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await productService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 12,
        ...(selectedCategory && { category: selectedCategory }),
        ...(searchTerm && { search: searchTerm }),
        ...(minPrice && { minPrice }),
        ...(maxPrice && { maxPrice }),
        ...(inStockOnly && { inStock: true }),
      };

      const data = await productService.getProducts(params);
      setProducts(data.products);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategory, searchTerm, minPrice, maxPrice, inStockOnly]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Our Menu
      </Typography>

      <Box mb={3}>
        <SearchBar onSearch={handleSearch} placeholder="Search for food..." />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <ProductFilters
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={(val) => { setSelectedCategory(val); setPage(1); }}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            inStockOnly={inStockOnly}
            onInStockChange={(val) => { setInStockOnly(val); setPage(1); }}
          />
        </Grid>

        <Grid item xs={12} md={9}>
          {loading ? (
            <Loading />
          ) : error ? (
            <ErrorMessage message={error} onRetry={fetchProducts} />
          ) : products.length === 0 ? (
            <EmptyState
              title="No products found"
              message="Try adjusting your filters or search criteria"
            />
          ) : (
            <>
              <ProductList products={products} />
              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={4}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}
            </>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Products;