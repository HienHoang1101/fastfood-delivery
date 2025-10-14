#!/bin/bash
# scripts/create-all-frontend-files.sh
# This script creates ALL frontend files with complete code

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🚀 Creating ALL Frontend Files with Code            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ ! -d "frontend" ]; then
    echo "Frontend directory not found. Please run setup-frontend-complete.sh first"
    exit 1
fi

cd frontend/src

echo -e "${YELLOW}📝 Creating ALL component files...${NC}"

# Create components/Common/Loading.jsx
cat > components/Common/Loading.jsx << 'EOF'
import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

const Loading = ({ message = 'Loading...' }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="400px"
      gap={2}
    >
      <CircularProgress size={60} />
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};

export default Loading;
EOF

# Create components/Common/ErrorMessage.jsx
cat > components/Common/ErrorMessage.jsx << 'EOF'
import React from 'react';
import { Alert, Box } from '@mui/material';

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <Box sx={{ my: 2 }}>
      <Alert 
        severity="error"
        action={
          onRetry && (
            <button onClick={onRetry} style={{ cursor: 'pointer' }}>
              Retry
            </button>
          )
        }
      >
        {message || 'Something went wrong. Please try again.'}
      </Alert>
    </Box>
  );
};

export default ErrorMessage;
EOF

# Create components/Common/EmptyState.jsx
cat > components/Common/EmptyState.jsx << 'EOF'
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Inventory2Outlined } from '@mui/icons-material';

const EmptyState = ({ 
  icon: Icon = Inventory2Outlined, 
  title = 'No items found',
  message = 'Try adjusting your filters or search criteria',
  actionLabel,
  onAction
}) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="400px"
      textAlign="center"
      gap={2}
    >
      <Icon sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.5 }} />
      <Typography variant="h5" color="text.primary">
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary" maxWidth="400px">
        {message}
      </Typography>
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction} sx={{ mt: 2 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
EOF

# Create components/Common/ProtectedRoute.jsx
cat > components/Common/ProtectedRoute.jsx << 'EOF'
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from './Loading';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
EOF

echo -e "${GREEN}✓${NC} Common components created (4/4)"

# Create pages/Login/index.jsx
cat > pages/Login/index.jsx << 'EOF'
import React from 'react';
import { Container } from '@mui/material';
import LoginForm from '../../components/Auth/LoginForm';

const Login = () => {
  return (
    <Container maxWidth="sm">
      <LoginForm />
    </Container>
  );
};

export default Login;
EOF

# Create pages/Register/index.jsx
cat > pages/Register/index.jsx << 'EOF'
import React from 'react';
import { Container } from '@mui/material';
import RegisterForm from '../../components/Auth/RegisterForm';

const Register = () => {
  return (
    <Container maxWidth="sm">
      <RegisterForm />
    </Container>
  );
};

export default Register;
EOF

echo -e "${GREEN}✓${NC} Page files created"

# Create App.jsx
cat > App.jsx << 'EOF'
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import MainLayout from './components/Layout/MainLayout';
import ProtectedRoute from './components/Common/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';

const theme = createTheme({
  palette: {
    primary: {
      main: '#FF6B6B',
    },
    secondary: {
      main: '#4ECDC4',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <CartProvider>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/products" element={<Products />} />
                <Route path="/cart" element={<Cart />} />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders/:id"
                  element={
                    <ProtectedRoute>
                      <OrderDetail />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </CartProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
EOF

# Create index.jsx
cat > index.jsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# Create index.css
cat > index.css << 'EOF'
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}

#root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
EOF

echo -e "${GREEN}✓${NC} Main files created (App.jsx, index.jsx, index.css)"

cd ../..

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         ✅ Basic Files Created!                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: You still need to create these components:${NC}"
echo ""
echo "  Components to copy from artifacts:"
echo "  - components/Auth/LoginForm.jsx"
echo "  - components/Auth/RegisterForm.jsx"
echo "  - components/Layout/Navbar.jsx"
echo "  - components/Layout/Footer.jsx"
echo "  - components/Layout/MainLayout.jsx"
echo "  - components/Products/ProductCard.jsx"
echo "  - components/Products/ProductList.jsx"
echo "  - components/Products/ProductFilters.jsx"
echo "  - components/Cart/CartItem.jsx"
echo "  - components/Cart/CartSummary.jsx"
echo "  - components/Orders/OrderCard.jsx"
echo "  - components/Orders/OrderStatusStepper.jsx"
echo "  - pages/Home/index.jsx"
echo "  - pages/Products/index.jsx"
echo "  - pages/Cart/index.jsx"
echo "  - pages/Checkout/index.jsx"
echo "  - pages/Orders/index.jsx"
echo "  - pages/OrderDetail/index.jsx"
echo ""
echo -e "${BLUE}📋 See FRONTEND_COMPONENTS_GUIDE.md for copy instructions${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "  1. Copy remaining component code from artifacts"
echo "  2. cd frontend && npm start"
echo "  3. Open http://localhost:3000"
echo ""