// ==========================================
// frontend/src/pages/Cart/index.jsx
// ==========================================
import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
} from '@mui/material';
import { ArrowBack, ShoppingBag } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import CartItem from '../../components/Cart/CartItem';
import CartSummary from '../../components/Cart/CartSummary';
import EmptyState from '../../components/Common/EmptyState';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal } = useCart();
  const { isAuthenticated } = useAuth();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          message="Add some delicious food to your cart and come back!"
          actionLabel="Browse Menu"
          onAction={() => navigate('/products')}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" fontWeight="bold">
          Shopping Cart ({cartItems.length} items)
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {cartItems.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
        </Grid>

        <Grid item xs={12} md={4}>
          <CartSummary
            subtotal={cartTotal}
            onCheckout={handleCheckout}
            disabled={cartItems.length === 0}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Cart;