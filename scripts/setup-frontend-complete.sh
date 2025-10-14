#!/bin/bash
# scripts/setup-frontend-complete.sh - Complete Frontend Setup

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🎨 Complete Frontend Setup with All Files         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is required. Please install Node.js first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js $(node -v) detected"
echo ""

# Check if frontend exists
if [ -d "frontend" ]; then
    echo -e "${YELLOW}⚠ frontend directory already exists${NC}"
    read -p "Do you want to remove and recreate? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf frontend
    else
        echo "Using existing frontend directory"
        cd frontend
    fi
fi

# Create React App if not exists
if [ ! -d "frontend" ]; then
    echo -e "${YELLOW}📦 Creating React application...${NC}"
    npx create-react-app frontend
    cd frontend
else
    cd frontend
fi

echo ""
echo -e "${YELLOW}📦 Installing dependencies...${NC}"

# Install dependencies
npm install axios react-router-dom @mui/material @emotion/react @emotion/styled \
    @mui/icons-material formik yup react-toastify

echo -e "${GREEN}✓${NC} Dependencies installed"
echo ""

# Create directory structure
echo -e "${YELLOW}📁 Creating directory structure...${NC}"

mkdir -p src/components/{Auth,Layout,Products,Cart,Orders,Common}
mkdir -p src/pages/{Home,Login,Register,Products,Cart,Checkout,Orders,OrderDetail}
mkdir -p src/{services,context,hooks,utils}

echo -e "${GREEN}✓${NC} Directory structure created"
echo ""

# Create .env file
echo -e "${YELLOW}🔧 Creating environment files...${NC}"

cat > .env << 'EOF'
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_NAME=Fastfood Delivery
REACT_APP_VERSION=1.0.0
EOF

cat > .env.production << 'EOF'
REACT_APP_API_URL=https://api.yourdomain.com/api
REACT_APP_NAME=Fastfood Delivery
REACT_APP_VERSION=1.0.0
EOF

echo -e "${GREEN}✓${NC} Environment files created"
echo ""

# Create services
echo -e "${YELLOW}📝 Creating service files...${NC}"

# api.js
cat > src/services/api.js << 'EOF'
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
EOF

# authService.js
cat > src/services/authService.js << 'EOF'
import api from './api';

const authService = {
  register: async (userData) => {
    const response = await api.post('/users/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/users/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: () => localStorage.getItem('token'),

  isAuthenticated: () => !!localStorage.getItem('token'),

  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put('/users/profile', userData);
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
};

export default authService;
EOF

# productService.js
cat > src/services/productService.js << 'EOF'
import api from './api';

const productService = {
  getProducts: async (params = {}) => {
    const { page = 1, limit = 20, category, search, minPrice, maxPrice, inStock } = params;
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(category && { category }),
      ...(search && { search }),
      ...(minPrice && { minPrice }),
      ...(maxPrice && { maxPrice }),
      ...(inStock !== undefined && { inStock }),
    });
    const response = await api.get(`/products/products?${queryParams}`);
    return response.data;
  },

  getProductById: async (id) => {
    const response = await api.get(`/products/products/${id}`);
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/products/categories');
    return response.data;
  },

  searchProducts: async (searchTerm) => {
    const response = await api.get(`/products/products?search=${searchTerm}`);
    return response.data;
  },
};

export default productService;
EOF

# orderService.js
cat > src/services/orderService.js << 'EOF'
import api from './api';

const orderService = {
  createOrder: async (orderData) => {
    const response = await api.post('/orders/orders', orderData);
    return response.data;
  },

  getOrders: async (page = 1, limit = 10, status = null) => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    const response = await api.get(`/orders/orders?${params}`);
    return response.data;
  },

  getOrderById: async (id) => {
    const response = await api.get(`/orders/orders/${id}`);
    return response.data;
  },

  cancelOrder: async (id) => {
    const response = await api.delete(`/orders/orders/${id}`);
    return response.data;
  },
};

export default orderService;
EOF

# paymentService.js
cat > src/services/paymentService.js << 'EOF'
import api from './api';

const paymentService = {
  processPayment: async (paymentData) => {
    const response = await api.post('/payments/payments', paymentData);
    return response.data;
  },

  getPaymentById: async (id) => {
    const response = await api.get(`/payments/payments/${id}`);
    return response.data;
  },

  getOrderPayments: async (orderId) => {
    const response = await api.get(`/payments/orders/${orderId}/payments`);
    return response.data;
  },
};

export default paymentService;
EOF

echo -e "${GREEN}✓${NC} Service files created"
echo ""

# Create index.jsx for each page folder
echo -e "${YELLOW}📄 Creating page index files...${NC}"

# Create empty index.jsx in each page folder
for page in Home Login Register Products Cart Checkout Orders OrderDetail; do
    touch "src/pages/$page/index.jsx"
done

echo -e "${GREEN}✓${NC} Page index files created"
echo ""

# Create Dockerfile
echo -e "${YELLOW}🐳 Creating Dockerfile...${NC}"

cat > Dockerfile << 'EOF'
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
EOF

# Create nginx.conf
cat > nginx.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

echo -e "${GREEN}✓${NC} Docker files created"
echo ""

# Create .gitignore
cat > .gitignore << 'EOF'
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# production
/build

# misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*
EOF

# Update package.json scripts
echo -e "${YELLOW}📦 Updating package.json...${NC}"

node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.proxy = 'http://localhost:8080';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

echo -e "${GREEN}✓${NC} package.json updated"
echo ""

cd ..

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         ✅ Frontend Setup Complete!                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Created:${NC}"
echo "  ✓ React application"
echo "  ✓ Directory structure"
echo "  ✓ Service files (api, auth, product, order, payment)"
echo "  ✓ Page folders (Home, Login, Register, Products, Cart, etc.)"
echo "  ✓ Docker configuration"
echo "  ✓ Nginx configuration"
echo "  ✓ Environment files"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. cd frontend"
echo "  2. Add component code to src/pages/*/index.jsx"
echo "  3. Add component code to src/components/*/"
echo "  4. npm start"
echo ""
echo -e "${BLUE}Or copy all component code from the artifacts and paste into files${NC}"
echo ""