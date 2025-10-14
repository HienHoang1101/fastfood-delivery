// ==========================================
// frontend/src/components/Cart/CartItem.jsx
// ==========================================
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  TextField,
} from '@mui/material';
import { Delete, Add, Remove } from '@mui/icons-material';
import { useCart } from '../../context/CartContext';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity > 0) {
      updateQuantity(item.id, newQuantity);
    }
  };

  return (
    <Card sx={{ display: 'flex', mb: 2 }}>
      <CardMedia
        component="img"
        sx={{ width: 120, objectFit: 'cover' }}
        image={item.image_url || 'https://via.placeholder.com/120'}
        alt={item.name}
      />

      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <CardContent sx={{ flex: '1 0 auto' }}>
          <Box display="flex" justifyContent="space-between" alignItems="start">
            <Box>
              <Typography variant="h6" component="div">
                {item.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ${parseFloat(item.price).toFixed(2)} each
              </Typography>
            </Box>
            <IconButton
              aria-label="delete"
              onClick={() => removeFromCart(item.id)}
              color="error"
            >
              <Delete />
            </IconButton>
          </Box>

          <Box display="flex" alignItems="center" mt={2} gap={1}>
            <IconButton
              size="small"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              <Remove />
            </IconButton>

            <TextField
              size="small"
              type="number"
              value={item.quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
              inputProps={{ min: 1, max: item.stock || 99 }}
              sx={{ width: 70 }}
            />

            <IconButton
              size="small"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={item.quantity >= (item.stock || 99)}
            >
              <Add />
            </IconButton>

            <Typography variant="h6" color="primary" ml="auto">
              ${(item.price * item.quantity).toFixed(2)}
            </Typography>
          </Box>
        </CardContent>
      </Box>
    </Card>
  );
};

export default CartItem;
