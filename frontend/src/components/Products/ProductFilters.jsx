// ==========================================
// frontend/src/components/Products/ProductFilters.jsx
// ==========================================
import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
  Typography,
  Chip,
  Stack,
} from '@mui/material';

const ProductFilters = ({
  categories,
  selectedCategory,
  onCategoryChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  inStockOnly,
  onInStockChange,
}) => {
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom fontWeight="bold">
        Filters
      </Typography>

      <Stack spacing={2}>
        {/* Category Filter */}
        <FormControl fullWidth>
          <InputLabel>Category</InputLabel>
          <Select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            label="Category"
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Price Range */}
        <Box>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Price Range
          </Typography>
          <Box display="flex" gap={1}>
            <TextField
              type="number"
              label="Min"
              value={minPrice}
              onChange={(e) => onMinPriceChange(e.target.value)}
              size="small"
              fullWidth
            />
            <TextField
              type="number"
              label="Max"
              value={maxPrice}
              onChange={(e) => onMaxPriceChange(e.target.value)}
              size="small"
              fullWidth
            />
          </Box>
        </Box>

        {/* In Stock Filter */}
        <Box>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Availability
          </Typography>
          <Chip
            label="In Stock Only"
            onClick={() => onInStockChange(!inStockOnly)}
            color={inStockOnly ? 'primary' : 'default'}
            variant={inStockOnly ? 'filled' : 'outlined'}
          />
        </Box>
      </Stack>
    </Paper>
  );
};

export default ProductFilters;