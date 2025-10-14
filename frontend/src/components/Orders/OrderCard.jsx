// ==========================================
// frontend/src/components/Orders/OrderCard.jsx
// ==========================================
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Button,
  Divider,
} from '@mui/material';
import {
  Schedule,
  CheckCircle,
  LocalShipping,
  Cancel,
  Restaurant,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const statusConfig = {
  pending: { color: 'warning', icon: Schedule, label: 'Pending' },
  confirmed: { color: 'info', icon: CheckCircle, label: 'Confirmed' },
  preparing: { color: 'primary', icon: Restaurant, label: 'Preparing' },
  delivering: { color: 'secondary', icon: LocalShipping, label: 'Delivering' },
  delivered: { color: 'success', icon: CheckCircle, label: 'Delivered' },
  cancelled: { color: 'error', icon: Cancel, label: 'Cancelled' },
};

const OrderCard = ({ order }) => {
  const navigate = useNavigate();
  const config = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Order #{order.id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDate(order.createdAt)}
            </Typography>
          </Box>
          <Chip
            icon={<StatusIcon />}
            label={config.label}
            color={config.color}
            variant="outlined"
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Order Items */}
        <Box mb={2}>
          {order.items && order.items.slice(0, 3).map((item, index) => (
            <Box key={index} display="flex" justifyContent="space-between" my={1}>
              <Typography variant="body2">
                {item.quantity}x {item.name}
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                ${parseFloat(item.lineTotal).toFixed(2)}
              </Typography>
            </Box>
          ))}
          {order.items && order.items.length > 3 && (
            <Typography variant="body2" color="text.secondary">
              +{order.items.length - 3} more items
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" color="primary" fontWeight="bold">
            Total: ${parseFloat(order.total_price).toFixed(2)}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate(`/orders/${order.id}`)}
          >
            View Details
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default OrderCard;