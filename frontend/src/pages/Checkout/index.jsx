// ==========================================
// frontend/src/pages/Checkout/index.jsx
// ==========================================
import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import orderService from '../../services/orderService';
import paymentService from '../../services/paymentService';
import { toast } from 'react-toastify';
import Loading from '../../components/Common/Loading';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    deliveryAddress: '',
    notes: '',
    paymentMethod: 'credit_card',
  });

  const tax = cartTotal * 0.1;
  const shipping = cartTotal > 50 ? 0 : 5;
  const total = cartTotal + tax + shipping;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.deliveryAddress.trim()) {
      toast.error('Please enter delivery address');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create order
      const orderData = {
  items: getOrderItems(), // ✅ Use helper method
  deliveryAddress: formData.deliveryAddress,
  notes: formData.notes,
};

// ✅ Better error handling
let errorMessage = 'Failed to place order';

if (error.response?.data?.error) {
  errorMessage = error.response.data.error;
} else if (error.response?.data?.errors) {
  errorMessage = error.response.data.errors.map(e => e.msg).join(', ');
};

      const orderResponse = await orderService.createOrder(orderData);
      const orderId = orderResponse.order.id;

      // Step 2: Process payment
      const paymentData = {
        orderId,
        amount: total,
        paymentMethod: formData.paymentMethod,
      };

      await paymentService.processPayment(paymentData);

      // Step 3: Clear cart and redirect
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/orders/${orderId}`);
    } catch (error) {
      console.error('Checkout failed:', error);
      toast.error(error.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Processing your order..." />;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Checkout
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Delivery Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Delivery Information
                </Typography>

                <TextField
                  fullWidth
                  label="Full Name"
                  value={user?.name || ''}
                  disabled
                  margin="normal"
                />

                <TextField
                  fullWidth
                  label="Email"
                  value={user?.email || ''}
                  disabled
                  margin="normal"
                />

                <TextField
                  fullWidth
                  label="Delivery Address"
                  name="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={handleChange}
                  required
                  multiline
                  rows={2}
                  margin="normal"
                />

                <TextField
                  fullWidth
                  label="Order Notes (Optional)"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  multiline
                  rows={2}
                  margin="normal"
                  placeholder="Any special instructions..."
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Payment Method */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Payment Method
                </Typography>

                <FormControl fullWidth margin="normal">
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    label="Payment Method"
                  >
                    <MenuItem value="credit_card">Credit Card</MenuItem>
                    <MenuItem value="debit_card">Debit Card</MenuItem>
                    <MenuItem value="e_wallet">E-Wallet</MenuItem>
                    <MenuItem value="cash">Cash on Delivery</MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>

          {/* Order Summary */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Order Summary
                </Typography>

                {cartItems.map((item) => (
                  <Box
                    key={item.id}
                    display="flex"
                    justifyContent="space-between"
                    my={1}
                  >
                    <Typography>
                      {item.quantity}x {item.name}
                    </Typography>
                    <Typography>
                      ${(item.price * item.quantity).toFixed(2)}
                    </Typography>
                  </Box>
                ))}

                <Divider sx={{ my: 2 }} />

                <Box display="flex" justifyContent="space-between" my={1}>
                  <Typography>Subtotal</Typography>
                  <Typography>${cartTotal.toFixed(2)}</Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" my={1}>
                  <Typography>Tax (10%)</Typography>
                  <Typography>${tax.toFixed(2)}</Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" my={1}>
                  <Typography>Shipping</Typography>
                  <Typography color={shipping === 0 ? 'success.main' : 'inherit'}>
                    {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6" fontWeight="bold">
                    Total
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    ${total.toFixed(2)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/cart')}
                fullWidth
              >
                Back to Cart
              </Button>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                fullWidth
              >
                {loading ? 'Processing...' : `Place Order ($${total.toFixed(2)})`}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
};

export default Checkout;