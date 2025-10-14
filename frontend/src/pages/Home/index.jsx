// ==========================================
// frontend/src/pages/Home/index.jsx
// ==========================================
import React from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Restaurant,
  DeliveryDining,
  Payment,
  Star,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Restaurant,
      title: 'Fresh Food',
      description: 'Quality ingredients, prepared fresh daily',
    },
    {
      icon: DeliveryDining,
      title: 'Fast Delivery',
      description: 'Get your food delivered in 30 minutes or less',
    },
    {
      icon: Payment,
      title: 'Easy Payment',
      description: 'Multiple payment options for your convenience',
    },
    {
      icon: Star,
      title: 'Top Rated',
      description: '4.8 stars from thousands of happy customers',
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 10,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
            Delicious Food, Delivered Fast
          </Typography>
          <Typography variant="h5" paragraph>
            Order from your favorite restaurants and get it delivered to your doorstep
          </Typography>
          <Button
            variant="contained"
            size="large"
            color="secondary"
            onClick={() => navigate('/products')}
            sx={{ mt: 3, px: 4, py: 1.5 }}
          >
            Order Now
          </Button>
        </Container>
      </Box>

      {/* Features Section */}
      <Container sx={{ py: 8 }}>
        <Typography variant="h4" align="center" gutterBottom fontWeight="bold">
          Why Choose Us
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                  <CardContent>
                    <Icon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
};

export default Home;