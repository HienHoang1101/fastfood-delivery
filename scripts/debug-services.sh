#!/bin/bash
# fix-services.sh - Fix common Docker services issues

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🔧 Fixing Fastfood Delivery Services              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Stop all running containers
echo -e "${YELLOW}1. Stopping all containers...${NC}"
docker-compose down
echo -e "${GREEN}✓${NC} Containers stopped"
echo ""

# Step 2: Verify .env file
echo -e "${YELLOW}2. Checking .env file...${NC}"
if [ ! -f .env ]; then
    echo -e "${RED}✗${NC} .env file not found!"
    echo "Creating .env file..."
    
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    
    cat > .env << EOF
# ==============================================
# GLOBAL CONFIGURATION
# ==============================================
NODE_ENV=development
LOG_LEVEL=info

# ==============================================
# SECURITY
# ==============================================
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=24h
POSTGRES_PASSWORD=password

# ==============================================
# PORTS
# ==============================================
API_GATEWAY_PORT=8080
USER_SERVICE_PORT=3001
PRODUCT_SERVICE_PORT=3002
ORDER_SERVICE_PORT=3003
PAYMENT_SERVICE_PORT=3004
PROMETHEUS_PORT=9090
GRAFANA_PORT=3005

# ==============================================
# CORS
# ==============================================
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3005

# ==============================================
# MICROSERVICES URLS (Docker)
# ==============================================
USER_SERVICE_URL=http://user:3000
PRODUCT_SERVICE_URL=http://product:3000
ORDER_SERVICE_URL=http://order:3000
PAYMENT_SERVICE_URL=http://payment:3000

# ==============================================
# DATABASE CONFIGURATION
# ==============================================
USER_DB_HOST=user-db
USER_DB_PORT=5432
USER_DB_NAME=user_db
USER_DB_USER=postgres
USER_DB_PASSWORD=password

PRODUCT_DB_HOST=product-db
PRODUCT_DB_PORT=5432
PRODUCT_DB_NAME=product_db
PRODUCT_DB_USER=postgres
PRODUCT_DB_PASSWORD=password

ORDER_DB_HOST=order-db
ORDER_DB_PORT=5432
ORDER_DB_NAME=order_db
ORDER_DB_USER=postgres
ORDER_DB_PASSWORD=password

PAYMENT_DB_HOST=payment-db
PAYMENT_DB_PORT=5432
PAYMENT_DB_NAME=payment_db
PAYMENT_DB_USER=postgres
PAYMENT_DB_PASSWORD=password

# ==============================================
# MONITORING
# ==============================================
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin
EOF
    echo -e "${GREEN}✓${NC} .env file created"
else
    echo -e "${GREEN}✓${NC} .env file exists"
fi
echo ""

# Step 3: Create/Update .env files for each service
echo -e "${YELLOW}3. Creating service .env files...${NC}"

services=("user" "product" "order" "payment" "api-gateway")

for service in "${services[@]}"; do
    if [ -d "services/$service" ]; then
        case $service in
            "user")
                cat > services/user/.env << EOF
PORT=3000
NODE_ENV=development
SERVICE_NAME=user-service

DB_HOST=user-db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=user_db

JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=24h

LOG_LEVEL=info
EOF
                ;;
            "product")
                cat > services/product/.env << EOF
PORT=3000
NODE_ENV=development
SERVICE_NAME=product-service

DB_HOST=product-db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=product_db

LOG_LEVEL=info
EOF
                ;;
            "order")
                cat > services/order/.env << EOF
PORT=3000
NODE_ENV=development
SERVICE_NAME=order-service

DB_HOST=order-db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=order_db

PRODUCT_URL=http://product:3000

LOG_LEVEL=info
EOF
                ;;
            "payment")
                cat > services/payment/.env << EOF
PORT=3000
NODE_ENV=development
SERVICE_NAME=payment-service

DB_HOST=payment-db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=payment_db

ORDER_URL=http://order:3000

LOG_LEVEL=info
EOF
                ;;
            "api-gateway")
                cat > services/api-gateway/.env << EOF
PORT=8080
NODE_ENV=development

JWT_SECRET=${JWT_SECRET}
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3005

USER_SERVICE_URL=http://user:3000
PRODUCT_SERVICE_URL=http://product:3000
ORDER_SERVICE_URL=http://order:3000
PAYMENT_SERVICE_URL=http://payment:3000
EOF
                ;;
        esac
        echo -e "${GREEN}✓${NC} Created services/$service/.env"
    fi
done
echo ""

# Step 4: Clean Docker resources
echo -e "${YELLOW}4. Cleaning Docker resources...${NC}"
docker-compose down -v
docker system prune -f
echo -e "${GREEN}✓${NC} Docker cleaned"
echo ""

# Step 5: Rebuild images
echo -e "${YELLOW}5. Building Docker images...${NC}"
docker-compose build --no-cache
echo -e "${GREEN}✓${NC} Images built"
echo ""

# Step 6: Start services
echo -e "${YELLOW}6. Starting services...${NC}"
docker-compose up -d
echo -e "${GREEN}✓${NC} Services started"
echo ""

# Step 7: Wait for services to be ready
echo -e "${YELLOW}7. Waiting for services to be ready (30s)...${NC}"
sleep 30
echo ""

# Step 8: Check service health
echo -e "${YELLOW}8. Checking service health...${NC}"
echo ""

services_health=(
    "api-gateway:8080"
    "user:3000"
    "product:3000"
    "order:3000"
    "payment:3000"
)

healthy=0
unhealthy=0

for service_port in "${services_health[@]}"; do
    IFS=':' read -r service port <<< "$service_port"
    
    if curl -s -f http://localhost:$port/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $service is healthy (port $port)"
        ((healthy++))
    else
        echo -e "${RED}✗${NC} $service is NOT healthy (port $port)"
        ((unhealthy++))
        echo -e "   ${YELLOW}Check logs:${NC} docker-compose logs $service"
    fi
done

echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Summary                             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Healthy services:   ${GREEN}$healthy${NC}"
echo -e "Unhealthy services: ${RED}$unhealthy${NC}"
echo ""

if [ $unhealthy -eq 0 ]; then
    echo -e "${GREEN}✅ All services are running successfully!${NC}"
    echo ""
    echo "Access points:"
    echo "  - API Gateway:  http://localhost:8080"
    echo "  - User Service: http://localhost:3001"
    echo "  - Product:      http://localhost:3002"
    echo "  - Order:        http://localhost:3003"
    echo "  - Payment:      http://localhost:3004"
    echo "  - Prometheus:   http://localhost:9090"
    echo "  - Grafana:      http://localhost:3005"
    echo "  - pgAdmin:      http://localhost:5050"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Run: ./scripts/seed-data.sh"
    echo "  2. Test: curl http://localhost:8080/health"
else
    echo -e "${RED}⚠ Some services failed to start${NC}"
    echo ""
    echo "Troubleshooting steps:"
    echo "  1. Check logs: docker-compose logs [service-name]"
    echo "  2. Check status: docker-compose ps"
    echo "  3. Restart: docker-compose restart [service-name]"
    echo ""
    echo "Common issues:"
    echo "  - Database connection: Wait 30s and check again"
    echo "  - Port conflicts: Check if ports are already in use"
    echo "  - Missing dependencies: docker-compose build --no-cache"
fi
echo ""