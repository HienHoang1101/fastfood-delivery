// ==========================================
// frontend/src/components/Products/ProductCard.jsx
// ==========================================
import React from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
} from '@mui/material';
import { AddShoppingCart, Remove, Add, Inventory } from '@mui/icons-material';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart, isInCart, getItemQuantity, updateQuantity } = useCart();
  const inCart = isInCart(product.id);
  const quantity = getItemQuantity(product.id);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    updateQuantity(product.id, quantity + 1);
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    updateQuantity(product.id, quantity - 1);
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
      onClick={() => navigate(`/products/${product.id}`)}
    >
      <CardMedia
        component="img"
        height="200"
        image={product.image_url || 'https://via.placeholder.com/400x200?text=No+Image'}
        alt={product.name}
        sx={{ objectFit: 'cover' }}
      />

      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
          <Typography variant="h6" component="h2" fontWeight="bold">
            {product.name}
          </Typography>
          <Chip
            label={product.category}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            mb: 2,
          }}
        >
          {product.description}
        </Typography>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" color="primary" fontWeight="bold">
            ${parseFloat(product.price).toFixed(2)}
          </Typography>
          {product.stock > 0 ? (
            <Typography variant="body2" color="text.secondary">
              Stock: {product.stock}
            </Typography>
          ) : (
            <Chip
              label="Out of Stock"
              size="small"
              color="error"
              icon={<Inventory />}
            />
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
        {product.stock === 0 ? (
          <Button disabled fullWidth variant="outlined">
            Out of Stock
          </Button>
        ) : inCart ? (
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            onClick={(e) => e.stopPropagation()}
          >
            <IconButton
              size="small"
              color="primary"
              onClick={handleDecrement}
            >
              <Remove />
            </IconButton>
            <Typography variant="h6" sx={{ minWidth: 30, textAlign: 'center' }}>
              {quantity}
            </Typography>
            <IconButton
              size="small"
              color="primary"
              onClick={handleIncrement}
              disabled={quantity >= product.stock}
            >
              <Add />
            </IconButton>
          </Box>
        ) : (
          <Button
            variant="contained"
            startIcon={<AddShoppingCart />}
            onClick={handleAddToCart}
            fullWidth
          >
            Add to Cart
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default ProductCard;