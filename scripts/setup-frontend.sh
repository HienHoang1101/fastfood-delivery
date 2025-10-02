#!/bin/bash
# scripts/setup-frontend.sh

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        🎨 Frontend Setup - React Application          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is required. Please install Node.js first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js $(node -v) detected"
echo ""

# Create React App
echo -e "${YELLOW}📦 Creating React application...${NC}"

if [ -d "frontend" ]; then
    echo -e "${YELLOW}⚠ frontend directory already exists${NC}"
    read -p "Do you want to remove and recreate? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf frontend
    else
        echo "Skipping React app creation"
        exit 0
    fi
fi

npx create-react-app frontend --template minimal
cd frontend

echo ""
echo -e "${YELLOW}📦 Installing additional dependencies...${NC}"

# Install dependencies
npm install axios react-router-dom @mui/material @emotion/react @emotion/styled \
    @mui/icons-material formik yup react-toastify

# Install dev dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom \
    @testing-library/user-event

echo -e "${GREEN}✓${NC} Dependencies installed"
echo ""

# Create directory structure
echo -e "${YELLOW}📁 Creating directory structure...${NC}"

mkdir -p src/{components,pages,services,context,hooks,utils,assets}
mkdir -p src/components/{Auth,Layout,Products,Cart,Orders,Common}
mkdir -p src/pages/{Home,Login,Register,Products,Cart,Checkout,Orders,Profile}

echo -e "${GREEN}✓${NC} Directory structure created"
echo ""

# Create .env file
echo -e "${YELLOW}🔧 Creating environment file...${NC}"

cat > .env << 'EOF'
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_NAME=Fastfood Delivery
REACT_APP_VERSION=1.0.0
EOF

echo -e "${GREEN}✓${NC} .env file created"
echo ""

cd ..

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              ✅ Frontend Setup Complete!               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. cd frontend"
echo "2. npm start"
echo "3. Open http://localhost:3000"
echo ""