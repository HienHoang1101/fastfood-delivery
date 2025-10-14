import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
} from '@mui/material';
import OrderCard from '../../components/Orders/OrderCard';
import Loading from '../../components/Common/Loading';
import ErrorMessage from '../../components/Common/ErrorMessage';
import EmptyState from '../../components/Common/EmptyState';
import orderService from '../../services/orderService';
import { Receipt } from '@mui/icons-material';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const statusFilters = ['all', 'pending', 'confirmed', 'preparing', 'delivering', 'delivered'];

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = statusFilters[activeTab] === 'all' ? null : statusFilters[activeTab];
      const data = await orderService.getOrders(1, 20, status);
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [activeTab]); // Only depend on activeTab

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        My Orders
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
          <Tab label="All" />
          <Tab label="Pending" />
          <Tab label="Confirmed" />
          <Tab label="Preparing" />
          <Tab label="Delivering" />
          <Tab label="Delivered" />
        </Tabs>
      </Box>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchOrders} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No orders found"
          message="You haven't placed any orders yet"
        />
      ) : (
        orders.map((order) => <OrderCard key={order.id} order={order} />)
      )}
    </Container>
  );
};

export default Orders;