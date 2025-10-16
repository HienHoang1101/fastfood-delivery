#!/bin/bash
# fix-database-persistence.sh - Fix database persistence issues

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🗄️  Fixing Database Persistence Issues            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Stop all containers
echo -e "${YELLOW}1. Stopping all containers...${NC}"
docker-compose down
echo -e "${GREEN}✓${NC} Containers stopped"
echo ""

# Step 2: List existing volumes
echo -e "${YELLOW}2. Current Docker volumes:${NC}"
docker volume ls | grep fastfood || echo "No fastfood volumes found"
echo ""

# Step 3: Remove old volumes (DANGEROUS - will delete data)
read -p "Do you want to REMOVE all existing volumes? This will DELETE all data! (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Removing old volumes...${NC}"
    docker volume rm fastfood_user_db 2>/dev/null || echo "fastfood_user_db not found"
    docker volume rm fastfood_product_db 2>/dev/null || echo "fastfood_product_db not found"
    docker volume rm fastfood_order_db 2>/dev/null || echo "fastfood_order_db not found"
    docker volume rm fastfood_payment_db 2>/dev/null || echo "fastfood_payment_db not found"
    docker volume rm fastfood_prometheus 2>/dev/null || echo "fastfood_prometheus not found"
    docker volume rm fastfood_grafana 2>/dev/null || echo "fastfood_grafana not found"
    docker volume rm fastfood_alertmanager 2>/dev/null || echo "fastfood_alertmanager not found"
    docker volume rm fastfood_pgadmin 2>/dev/null || echo "fastfood_pgadmin not found"
    echo -e "${GREEN}✓${NC} Old volumes removed"
else
    echo -e "${YELLOW}Keeping existing volumes${NC}"
fi
echo ""

# Step 4: Create new volumes explicitly
echo -e "${YELLOW}3. Creating Docker volumes explicitly...${NC}"
docker volume create fastfood_user_db
docker volume create fastfood_product_db
docker volume create fastfood_order_db
docker volume create fastfood_payment_db
docker volume create fastfood_prometheus
docker volume create fastfood_grafana
docker volume create fastfood_alertmanager
docker volume create fastfood_pgadmin
echo -e "${GREEN}✓${NC} Volumes created"
echo ""

# Step 5: Verify volumes
echo -e "${YELLOW}4. Verifying volumes:${NC}"
docker volume ls | grep fastfood
echo ""

# Step 6: Start databases first
echo -e "${YELLOW}5. Starting database services...${NC}"
docker-compose up -d user-db product-db order-db payment-db
echo -e "${GREEN}✓${NC} Database services started"
echo ""

# Step 7: Wait for databases to be ready
echo -e "${YELLOW}6. Waiting for databases to be ready (20s)...${NC}"
sleep 20
echo ""

# Step 8: Check database health
echo -e "${YELLOW}7. Checking database health...${NC}"
dbs=("user-db:user_db" "product-db:product_db" "order-db:order_db" "payment-db:payment_db")

for db_info in "${dbs[@]}"; do
    IFS=':' read -r container dbname <<< "$db_info"
    
    for i in {1..5}; do
        if docker exec $container pg_isready -U postgres -d $dbname > /dev/null 2>&1; then
            echo -e "${GREEN}✓${NC} $container ($dbname) is ready"
            
            # Verify database exists
            result=$(docker exec $container psql -U postgres -lqt | cut -d \| -f 1 | grep -w $dbname | wc -l)
            if [ $result -eq 1 ]; then
                echo -e "${GREEN}  ✓${NC} Database $dbname exists"
            else
                echo -e "${RED}  ✗${NC} Database $dbname does NOT exist!"
            fi
            break
        else
            echo -e "${YELLOW}  ⏳${NC} $container not ready yet (attempt $i/5)..."
            sleep 3
        fi
    done
done
echo ""

# Step 9: Start application services
echo -e "${YELLOW}8. Starting application services...${NC}"
docker-compose up -d user product order payment api-gateway
echo -e "${GREEN}✓${NC} Application services started"
echo ""

# Step 10: Wait for services
echo -e "${YELLOW}9. Waiting for services to initialize (15s)...${NC}"
sleep 15
echo ""

# Step 11: Check service health
echo -e "${YELLOW}10. Checking service health...${NC}"
services=("user:3001" "product:3002" "order:3003" "payment:3004" "api-gateway:8080")

for service_port in "${services[@]}"; do
    IFS=':' read -r service port <<< "$service_port"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/health 2>&1)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✓${NC} $service is healthy"
    else
        echo -e "${RED}✗${NC} $service is NOT healthy (HTTP $response)"
    fi
done
echo ""

# Step 12: Start monitoring services
echo -e "${YELLOW}11. Starting monitoring services...${NC}"
docker-compose up -d prometheus grafana alertmanager pgadmin
echo -e "${GREEN}✓${NC} Monitoring services started"
echo ""

# Step 13: Final status
echo -e "${YELLOW}12. Final container status:${NC}"
docker-compose ps
echo ""

# Step 14: Database connection info
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           📊 Database Connection Info                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "PgAdmin Access: http://localhost:5050"
echo "Email: admin@admin.com"
echo "Password: admin"
echo ""
echo "Database Connections (add these in PgAdmin):"
echo ""
echo "1. User Database:"
echo "   Host: user-db"
echo "   Port: 5432"
echo "   Database: user_db"
echo "   Username: postgres"
echo "   Password: password"
echo ""
echo "2. Product Database:"
echo "   Host: product-db"
echo "   Port: 5432"
echo "   Database: product_db"
echo "   Username: postgres"
echo "   Password: password"
echo ""
echo "3. Order Database:"
echo "   Host: order-db"
echo "   Port: 5432"
echo "   Database: order_db"
echo "   Username: postgres"
echo "   Password: password"
echo ""
echo "4. Payment Database:"
echo "   Host: payment-db"
echo "   Port: 5432"
echo "   Database: payment_db"
echo "   Username: postgres"
echo "   Password: password"
echo ""
echo -e "${YELLOW}⚠️  Important Notes:${NC}"
echo "1. Use container hostnames (user-db, product-db, etc.) in PgAdmin"
echo "2. Do NOT use localhost or 127.0.0.1"
echo "3. All databases should now persist data between restarts"
echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Access PgAdmin: http://localhost:5050"
echo "2. Add database connections using info above"
echo "3. Run seed data: ./scripts/seed-data.sh"
echo ""