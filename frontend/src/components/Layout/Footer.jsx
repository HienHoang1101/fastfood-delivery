// ==========================================
// frontend/src/components/Layout/Footer.jsx
// ==========================================
import React from 'react';
import { Box, Container, Typography, Link, Grid } from '@mui/material';
import { Restaurant, Email, Phone, LocationOn } from '@mui/icons-material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 6,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <Box display="flex" alignItems="center" mb={2}>
              <Restaurant sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                Fastfood Delivery
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Delicious food delivered to your doorstep. Fast, fresh, and affordable!
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Quick Links
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <Link href="/" underline="hover" color="inherit">
                Home
              </Link>
              <Link href="/products" underline="hover" color="inherit">
                Menu
              </Link>
              <Link href="/orders" underline="hover" color="inherit">
                My Orders
              </Link>
              <Link href="/about" underline="hover" color="inherit">
                About Us
              </Link>
            </Box>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Contact Us
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <Phone fontSize="small" />
                <Typography variant="body2">+84 123 456 789</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Email fontSize="small" />
                <Typography variant="body2">support@fastfood.com</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <LocationOn fontSize="small" />
                <Typography variant="body2">Ho Chi Minh City, Vietnam</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Box mt={4} pt={3} borderTop={1} borderColor="divider">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Fastfood Delivery. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
