import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Pagination,
  Alert,
  Button,
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import ProductList from '../../components/Products/ProductList';
import ProductFilters from '../../components/Products/ProductFilters';
import SearchBar from '../../components/Common/SearchBar';
import Loading from '../../components/Common/Loading';
import ErrorMessage from '../../components/Common/ErrorMessage';
import EmptyState from '../../components/Common/EmptyState';
import productService from '../../services/productService';
import { sanitizeSearchTerm, sanitizeNumber, sanitizeInteger } from '../../utils/sanitize';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [retryCount, setRetryCount] = useState(0);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);

  // ✅ Fetch categories with retry
  const fetchCategories = useCallback(async (retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const data = await productService.getCategories();
        setCategories(data);
        return;
      } catch (err) {
        console.error(`Failed to fetch categories (attempt ${i + 1}/${retries}):`, err);
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ✅ Fetch products with retry and sanitization
  const fetchProducts = useCallback(async (isRetry = false) => {
    if (!isRetry) {
      setLoading(true);
      setError(null);
    }

    const maxRetries = 3;
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
      try {
        // ✅ Sanitize all inputs
        const sanitizedParams = {
          page,
          limit: 12,
          ...(selectedCategory && { category: selectedCategory }),
          ...(searchTerm && { search: sanitizeSearchTerm(searchTerm) }),
          ...(minPrice && { minPrice: sanitizeNumber(minPrice, { min: 0 }) }),
          ...(maxPrice && { maxPrice: sanitizeNumber(maxPrice, { min: 0 }) }),
          ...(inStockOnly && { inStock: true }),
        };

        // Validate price range
        if (sanitizedParams.minPrice && sanitizedParams.maxPrice) {
          if (sanitizedParams.minPrice > sanitizedParams.maxPrice) {
            setError('Minimum price cannot be greater than maximum price');
            setLoading(false);
            return;
          }
        }

        const data = await productService.getProducts(sanitizedParams);
        setProducts(data.products);
        setTotalPages(data.pagination.pages);
        setError(null);
        setRetryCount(0);
        setLoading(false);
        return; // Success
      } catch (err) {
        lastError = err;
        console.error(`Failed to fetch products (attempt ${i + 1}/${maxRetries}):`, err);
        
        if (i < maxRetries - 1) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
      }
    }

    // All retries failed
    setError(
      lastError?.response?.data?.error || 
      lastError?.message || 
      'Failed to load products after multiple attempts. Please check your connection and try again.'
    );
    setRetryCount(prev => prev + 1);
    setLoading(false);
  }, [page, selectedCategory, searchTerm, minPrice, maxPrice, inStockOnly]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ✅ Handle search with sanitization
  const handleSearch = (term) => {
    const sanitized = sanitizeSearchTerm(term);
    if (sanitized.length > 100) {
      setError('Search term is too long');
      return;
    }
    setSearchTerm(sanitized);
    setPage(1);
  };

  // ✅ Handle price changes with validation
  const handleMinPriceChange = (value) => {
    const sanitized = sanitizeNumber(value, { min: 0, max: 999999 });
    setMinPrice(sanitized !== null ? sanitized.toString() : '');
  };

  const handleMaxPriceChange = (value) => {
    const sanitized = sanitizeNumber(value, { min: 0, max: 999999 });
    setMaxPrice(sanitized !== null ? sanitized.toString() : '');
  };

  // ✅ Handle page change with scroll
  const handlePageChange = (event, value) => {
    const sanitized = sanitizeInteger(value, { min: 1, max: totalPages });
    if (sanitized) {
      setPage(sanitized);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ✅ Manual retry handler
  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
    fetchProducts(true);
  };

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" fontWeight="bold">
          Our Menu
        </Typography>
        {error && (
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRetry}
            size="small"
          >
            Retry
          </Button>
        )}
      </Box>

      {/* Show retry warning */}
      {retryCount > 0 && !loading && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Connection issues detected. Retried {retryCount} time(s). 
          {retryCount >= 3 && ' Please check your internet connection.'}
        </Alert>
      )}

      <Box mb={3}>
        <SearchBar 
          onSearch={handleSearch} 
          placeholder="Search for food..." 
        />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <ProductFilters
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={(val) => { 
              setSelectedCategory(val); 
              setPage(1); 
            }}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onMinPriceChange={handleMinPriceChange}
            onMaxPriceChange={handleMaxPriceChange}
            inStockOnly={inStockOnly}
            onInStockChange={(val) => { 
              setInStockOnly(val); 
              setPage(1); 
            }}
          />
        </Grid>

        <Grid item xs={12} md={9}>
          {loading ? (
            <Loading />
          ) : error ? (
            <ErrorMessage message={error} onRetry={handleRetry} />
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
                    showFirstButton
                    showLastButton
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