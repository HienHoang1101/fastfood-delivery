// ==========================================
// frontend/src/pages/OrderDetail/index.jsx
// ==========================================
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Divider,
  Button,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import orderService from '../../services/orderService';
import OrderStatusStepper from '../../components/Orders/OrderStatusStepper';
import Loading from '../../components/Common/Loading';
import ErrorMessage from '../../components/Common/ErrorMessage';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import { toast } from 'react-toastify';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderService.getOrderById(id);
      setOrder(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      await orderService.cancelOrder(id);
      toast.success('Order cancelled successfully');
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel order');
    } finally {
      setCancelling(false);
      setCancelDialogOpen(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} onRetry={fetchOrder} />;
  if (!order) return null;

  const canCancel = ['pending', 'confirmed'].includes(order.status);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/orders')}
          sx={{ mr: 2 }}
        >
          Back to Orders
        </Button>
        <Typography variant="h4" fontWeight="bold">
          Order #{order.id}
        </Typography>
      </Box>

      {/* Order Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <OrderStatusStepper currentStatus={order.status} />
        </CardContent>
      </Card>

      {/* Order Details */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Order Items
              </Typography>
              {order.items && order.items.map((item, index) => (
                <Box key={index}>
                  <Box display="flex" justifyContent="space-between" my={2}>
                    <Box>
                      <Typography fontWeight="medium">{item.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        ${parseFloat(item.price).toFixed(2)} x {item.quantity}
                      </Typography>
                    </Box>
                    <Typography fontWeight="bold">
                      ${parseFloat(item.lineTotal).toFixed(2)}
                    </Typography>
                  </Box>
                  {index < order.items.length - 1 && <Divider />}
                </Box>
              ))}
            </CardContent>
          </Card>

          {order.delivery_address && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Delivery Address
                </Typography>
                <Typography>{order.delivery_address}</Typography>
              </CardContent>
            </Card>
          )}

          {order.notes && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Order Notes
                </Typography>
                <Typography>{order.notes}</Typography>
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Order Summary
              </Typography>

              <Box display="flex" justifyContent="space-between" my={1}>
                <Typography>Subtotal</Typography>
                <Typography>${parseFloat(order.total_price).toFixed(2)}</Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  Total
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  ${parseFloat(order.total_price).toFixed(2)}
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" mb={2}>
                Placed on {new Date(order.createdAt).toLocaleString()}
              </Typography>

              {canCancel && (
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={() => setCancelDialogOpen(true)}
                  disabled={cancelling}
                >
                  Cancel Order
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleCancelOrder}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        confirmText="Yes, Cancel Order"
        confirmColor="error"
      />
    </Container>
  );
};

export default OrderDetail;