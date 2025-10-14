// ==========================================
// frontend/src/components/Layout/Navbar.jsx
// ==========================================
import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Box,
  Container,
} from '@mui/material';
import {
  ShoppingCart,
  AccountCircle,
  Restaurant,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { getItemCount } = useCart();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/');
  };

  return (
    <AppBar position="sticky" elevation={2}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          {/* Logo */}
          <Restaurant sx={{ mr: 1 }} />
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              flexGrow: 1, 
              cursor: 'pointer',
              fontWeight: 'bold' 
            }}
            onClick={() => navigate('/')}
          >
            Fastfood Delivery
          </Typography>

          {/* Navigation Links */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, mr: 2 }}>
            <Button color="inherit" onClick={() => navigate('/')}>
              Home
            </Button>
            <Button color="inherit" onClick={() => navigate('/products')}>
              Menu
            </Button>
            {isAuthenticated && (
              <Button color="inherit" onClick={() => navigate('/orders')}>
                My Orders
              </Button>
            )}
          </Box>

          {/* Cart Icon */}
          <IconButton
            color="inherit"
            onClick={() => navigate('/cart')}
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={getItemCount()} color="error">
              <ShoppingCart />
            </Badge>
          </IconButton>

          {/* User Menu */}
          {isAuthenticated ? (
            <>
              <IconButton color="inherit" onClick={handleMenuOpen}>
                <AccountCircle />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem disabled>
                  <Typography variant="body2">
                    {user?.name || user?.email}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
                  Profile
                </MenuItem>
                <MenuItem onClick={() => { handleMenuClose(); navigate('/orders'); }}>
                  My Orders
                </MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <Button color="inherit" onClick={() => navigate('/login')}>
              Login
            </Button>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;