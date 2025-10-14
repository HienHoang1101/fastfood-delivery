// ==========================================
// frontend/src/components/Cart/CartSummary.jsx
// ==========================================
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Divider,
  Box,
  Button,
} from '@mui/material';
import { ShoppingCartCheckout } from '@mui/icons-material';

const CartSummary = ({ subtotal, onCheckout, disabled }) => {
  const tax = subtotal * 0.1; // 10% tax
  const shipping = subtotal > 50 ? 0 : 5; // Free shipping over $50
  const total = subtotal + tax + shipping;

  return (
    <Card sx={{ position: 'sticky', top: 90 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Order Summary
        </Typography>

        <Box display="flex" justifyContent="space-between" my={1}>
          <Typography variant="body1">Subtotal</Typography>
          <Typography variant="body1">${subtotal.toFixed(2)}</Typography>
        </Box>

        <Box display="flex" justifyContent="space-between" my={1}>
          <Typography variant="body1">Tax (10%)</Typography>
          <Typography variant="body1">${tax.toFixed(2)}</Typography>
        </Box>

        <Box display="flex" justifyContent="space-between" my={1}>
          <Typography variant="body1">Shipping</Typography>
          <Typography variant="body1" color={shipping === 0 ? 'success.main' : 'inherit'}>
            {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
          </Typography>
        </Box>

        {shipping > 0 && (
          <Typography variant="caption" color="text.secondary">
            Free shipping on orders over $50
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <Box display="flex" justifyContent="space-between" mb={3}>
          <Typography variant="h6" fontWeight="bold">
            Total
          </Typography>
          <Typography variant="h6" fontWeight="bold" color="primary">
            ${total.toFixed(2)}
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={<ShoppingCartCheckout />}
          onClick={onCheckout}
          disabled={disabled}
        >
          Proceed to Checkout
        </Button>
      </CardContent>
    </Card>
  );
};

export default CartSummary;