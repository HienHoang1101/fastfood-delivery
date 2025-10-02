#!/bin/bash
# scripts/complete-setup.sh - Complete project setup

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🍔 Fastfood Delivery - Complete Setup            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Docker installed"

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Docker Compose installed"

if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠${NC} Node.js not found (optional for local dev)"
else
    echo -e "${GREEN}✓${NC} Node.js $(node -v)"
fi

echo ""

# Create directory structure
echo -e "${YELLOW}📁 Creating directory structure...${NC}"

directories=(
    "services/api-gateway"
    "services/user/models"
    "services/product/models"
    "services/order/models"
    "services/payment/models"
    "monitoring/grafana/dashboards"
    "monitoring/grafana/datasources"
    "scripts"
    "tests"
    "docs"
    "backups"
)

for dir in "${directories[@]}"; do
    mkdir -p "$dir"
    echo -e "${GREEN}✓${NC} Created $dir"
done

echo ""

# Create .env files
echo -e "${YELLOW}🔧 Creating environment files...${NC}"

# Check if create-env-files.sh exists
if [ -f "scripts/create-env-files.sh" ]; then
    chmod +x scripts/create-env-files.sh
    ./scripts/create-env-files.sh
else
    echo -e "${YELLOW}⚠${NC} create-env-files.sh not found, creating manually..."
    
    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    
    # Root .env
    cat > .env << EOF
NODE_ENV=development
LOG_LEVEL=info
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=24h
POSTGRES_PASSWORD=password
API_GATEWAY_PORT=8080
ALLOWED_ORIGINS=http://localhost:3000
EOF
    echo -e "${GREEN}✓${NC} Created .env"
    
    # API Gateway
    cat > services/api-gateway/.env << EOF
PORT=8080
NODE_ENV=development
JWT_SECRET=${JWT_SECRET}
ALLOWED_ORIGINS=http://localhost:3000
USER_SERVICE_URL=http://user:3000
PRODUCT_SERVICE_URL=http://product:3000
ORDER_SERVICE_URL=http://order:3000
PAYMENT_SERVICE_URL=http://payment:3000
EOF
    echo -e "${GREEN}✓${NC} Created services/api-gateway/.env"
fi

echo ""

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"

services=("api-gateway" "user" "product" "order" "payment")

for service in "${services[@]}"; do
    if [ -f "services/$service/package.json" ]; then
        echo -e "${BLUE}Installing $service dependencies...${NC}"
        (cd "services/$service" && npm install --silent) && \
        echo -e "${GREEN}✓${NC} $service dependencies installed" || \
        echo -e "${RED}✗${NC} Failed to install $service dependencies"
    fi
done

echo ""

# Create Grafana datasource
echo -e "${YELLOW}📊 Configuring Grafana...${NC}"

cat > monitoring/grafana/datasources/prometheus.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF

echo -e "${GREEN}✓${NC} Grafana datasource configured"

echo ""

# Update .gitignore
echo -e "${YELLOW}🔒 Updating .gitignore...${NC}"

cat > .gitignore << EOF
# Environment variables
.env
.env.local
.env.*.local
services/*/.env

# Dependencies
node_modules/
package-lock.json

# Logs
logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Docker
.docker/

# Backups
backups/

# Test coverage
coverage/
.nyc_output/

# Build
dist/
build/
EOF

echo -e "${GREEN}✓${NC} .gitignore updated"

echo ""

# Create initial package.json files if missing
echo -e "${YELLOW}📝 Creating package.json files...${NC}"

for service in "${services[@]}"; do
    if [ ! -f "services/$service/package.json" ]; then
        cat > "services/$service/package.json" << EOF
{
  "name": "$service-service",
  "version": "1.0.0",
  "description": "$service service for Fastfood Delivery",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.3.1",
    "prom-client": "^15.1.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0"
  }
}
EOF
        echo -e "${GREEN}✓${NC} Created services/$service/package.json"
    fi
done

echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    ✅ Setup Complete                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Review .env files in each service"
echo "2. Run: ${YELLOW}docker-compose build${NC}"
echo "3. Run: ${YELLOW}docker-compose up -d${NC}"
echo "4. Run: ${YELLOW}./scripts/seed-data.sh${NC}"
echo "5. Access: ${YELLOW}http://localhost:8080${NC}"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  make start          - Start all services"
echo "  make logs           - View all logs"
echo "  make health         - Check service health"
echo "  make stop           - Stop all services"
echo ""