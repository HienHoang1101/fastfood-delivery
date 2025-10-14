// ==========================================
// frontend/src/components/Products/ProductList.jsx
// ==========================================
import React from 'react';
import { Grid } from '@mui/material';
import ProductCard from './ProductCard';

const ProductList = ({ products }) => {
  return (
    <Grid container spacing={3}>
      {products.map((product) => (
        <Grid item key={product.id} xs={12} sm={6} md={4} lg={3}>
          <ProductCard product={product} />
        </Grid>
      ))}
    </Grid>
  );
};

export default ProductList;