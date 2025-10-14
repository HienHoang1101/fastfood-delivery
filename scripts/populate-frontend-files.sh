#!/bin/bash
# scripts/populate-frontend-files.sh - Populate all frontend files with code

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      📝 Populating Frontend Files with Code           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ ! -d "frontend" ]; then
    echo "Error: frontend directory not found. Run setup-frontend-complete.sh first"
    exit 1
fi

cd frontend/src

# Create Context files
echo -e "${YELLOW}Creating Context files...${NC}"

cat > context/AuthContext.jsx << 'AUTHEOF'
import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const currentUser = authService.getCurrentUser();
      const token = authService.getToken();
      if (currentUser && token) {
        setUser(currentUser);
        setIsAuthenticated(true);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const register = async (userData) => {
    try {
      const data = await authService.register(userData);
      setUser(data.user);
      setIsAuthenticated(true);
      toast.success('Registration successful!');
      return data;
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      setUser(data.user);
      setIsAuthenticated(true);
      toast.success('Login successful!');
      return data;
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    toast.info('Logged out successfully');
  };

  const updateProfile = async (userData) => {
    try {
      const data = await authService.updateProfile(userData);
      setUser(data.user);
      toast.success('Profile updated successfully');
      return data;
    } catch (error) {
      const message = error.response?.data?.error || 'Update failed';
      toast.error(message);
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    register,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
AUTHEOF

cat > context/CartContext.jsx << 'CARTEOF'
import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
    calculateTotal();
  }, [cartItems]);

  const calculateTotal = () => {
    const total = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    setCartTotal(total);
  };

  const addToCart = (product, quantity = 1) => {
    const existingItem = cartItems.find((item) => item.id === product.id);

    if (existingItem) {
      setCartItems(
        cartItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
      toast.success(`Updated ${product.name} quantity in cart`);
    } else {
      setCartItems([...cartItems, { ...product, quantity }]);
      toast.success(`Added ${product.name} to cart`);
    }
  };

  const removeFromCart = (productId) => {
    const item = cartItems.find((item) => item.id === productId);
    setCartItems(cartItems.filter((item) => item.id !== productId));
    if (item) {
      toast.info(`Removed ${item.name} from cart`);
    }
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(
      cartItems.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    toast.info('Cart cleared');
  };

  const getItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const isInCart = (productId) => {
    return cartItems.some((item) => item.id === productId);
  };

  const getItemQuantity = (productId) => {
    const item = cartItems.find((item) => item.id === productId);
    return item ? item.quantity : 0;
  };

  const value = {
    cartItems,
    cartTotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemCount,
    isInCart,
    getItemQuantity,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export default CartContext;
CARTEOF

echo -e "${GREEN}✓${NC} Context files created"

# Create README for instructions
cat > ../FRONTEND_SETUP.md << 'EOF'
# Frontend Setup Instructions

## Files Created

✅ Directory structure
✅ Service files (api, auth, product, order, payment)
✅ Context files (Auth, Cart)
✅ Page folders

## Next Steps

### 1. Copy Component Code

You need to copy the component code from the artifacts into these folders:

**Components to create:**
- `src/components/Auth/LoginForm.jsx`
- `src/components/Auth/RegisterForm.jsx`
- `src/components/Layout/Navbar.jsx`
- `src/components/Layout/Footer.jsx`
- `src/components/Layout/MainLayout.jsx`
- `src/components/Products/ProductCard.jsx`
- `src/components/Products/ProductList.jsx`
- `src/components/Products/ProductFilters.jsx`
- `src/components/Cart/CartItem.jsx`
- `src/components/Cart/CartSummary.jsx`
- `src/components/Orders/OrderCard.jsx`
- `src/components/Orders/OrderStatusStepper.jsx`
- `src/components/Common/Loading.jsx`
- `src/components/Common/ErrorMessage.jsx`
- `src/components/Common/EmptyState.jsx`
- `src/components/Common/ProtectedRoute.jsx`
- `src/components/Common/SearchBar.jsx`
- `src/components/Common/ConfirmDialog.jsx`

**Pages to create:**
- `src/pages/Home/index.jsx`
- `src/pages/Login/index.jsx`
- `src/pages/Register/index.jsx`
- `src/pages/Products/index.jsx`
- `src/pages/Cart/index.jsx`
- `src/pages/Checkout/index.jsx`
- `src/pages/Orders/index.jsx`
- `src/pages/OrderDetail/index.jsx`

**Main files:**
- `src/App.jsx`
- `src/index.jsx`
- `src/index.css`

### 2. Install Dependencies

```bash
cd frontend
npm install
```

### 3. Start Development Server

```bash
npm start
```

Frontend will run at http://localhost:3000

### 4. Build for Production

```bash
npm run build
```

### 5. Run with Docker

```bash
docker-compose build frontend
docker-compose up -d frontend
```

## Quick Reference

All the component code has been provided in the artifacts.
Simply copy each artifact content into the corresponding file.

Example:
- Artifact "frontend_auth_components" → Copy to LoginForm.jsx and RegisterForm.jsx
- Artifact "frontend_layout_components" → Copy to Navbar.jsx, Footer.jsx, MainLayout.jsx
- Etc.

EOF

cd ../..

echo -e "${GREEN}✓${NC} Context files populated"
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              ✅ Files Created!                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📝 Next: Copy component code from artifacts${NC}"
echo "   See frontend/FRONTEND_SETUP.md for instructions"
echo ""
echo -e "${GREEN}Quick commands:${NC}"
echo "   cd frontend"
echo "   npm start"
echo ""