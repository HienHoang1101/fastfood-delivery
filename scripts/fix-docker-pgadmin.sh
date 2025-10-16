#!/bin/bash
# fix-docker-pgadmin.sh - Fix PgAdmin connection from Docker

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🔧 Fix PgAdmin (Docker) Connection Issues         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if databases are running
echo -e "${YELLOW}1. Checking database containers...${NC}"
all_running=true
for db in user-db product-db order-db payment-db; do
    if docker ps --format '{{.Names}}' | grep -q "^${db}$"; then
        echo -e "${GREEN}✓${NC} $db is running"
    else
        echo -e "${RED}✗${NC} $db is NOT running"
        all_running=false
    fi
done

if [ "$all_running" = false ]; then
    echo ""
    echo -e "${YELLOW}Starting database containers...${NC}"
    docker-compose up -d user-db product-db order-db payment-db
    echo -e "${YELLOW}Waiting 15 seconds for databases to start...${NC}"
    sleep 15
fi
echo ""

# Fix pg_hba.conf for all databases
echo -e "${YELLOW}2. Configuring PostgreSQL authentication...${NC}"
for db in user-db product-db order-db payment-db; do
    echo -e "  Configuring $db..."
    
    # Create new pg_hba.conf with trust authentication for local connections
    docker exec $db bash -c "cat > /tmp/pg_hba.conf << 'HBAEOF'
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     trust
host    all             all             0.0.0.0/0               md5
host    all             all             ::0/0                   md5
HBAEOF"
    
    # Copy to data directory
    docker exec $db cp /tmp/pg_hba.conf /var/lib/postgresql/data/pg_hba.conf
    docker exec $db chown postgres:postgres /var/lib/postgresql/data/pg_hba.conf
    docker exec $db chmod 600 /var/lib/postgresql/data/pg_hba.conf
done
echo -e "${GREEN}✓${NC} Authentication configured"
echo ""

# Restart databases to apply changes
echo -e "${YELLOW}3. Restarting databases to apply changes...${NC}"
docker-compose restart user-db product-db order-db payment-db
echo -e "${YELLOW}Waiting 15 seconds...${NC}"
sleep 15
echo ""

# Create databases and set passwords
echo -e "${YELLOW}4. Creating databases and setting passwords...${NC}"
declare -A db_map
db_map["user-db"]="user_db"
db_map["product-db"]="product_db"
db_map["order-db"]="order_db"
db_map["payment-db"]="payment_db"

for db in user-db product-db order-db payment-db; do
    dbname=${db_map[$db]}
    
    echo -e "  Processing $db..."
    
    # Wait for database to be ready
    for i in {1..10}; do
        if docker exec $db pg_isready -U postgres > /dev/null 2>&1; then
            break
        fi
        echo -e "    Waiting for $db to be ready... ($i/10)"
        sleep 2
    done
    
    # Check if database exists
    db_exists=$(docker exec $db psql -U postgres -lqt | cut -d \| -f 1 | grep -w $dbname | wc -l)
    
    if [ $db_exists -eq 0 ]; then
        echo -e "    Creating database $dbname..."
        docker exec $db psql -U postgres -c "CREATE DATABASE $dbname;" 2>/dev/null || echo "    Database might already exist"
    else
        echo -e "    ${GREEN}✓${NC} Database $dbname already exists"
    fi
    
    # Set password
    echo -e "    Setting password..."
    docker exec $db psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'password';" 2>/dev/null || true
    
    echo -e "    ${GREEN}✓${NC} $db configured"
done
echo ""

# Test connections
echo -e "${YELLOW}5. Testing database connections...${NC}"
for db in user-db product-db order-db payment-db; do
    dbname=${db_map[$db]}
    
    if docker exec $db psql -U postgres -d $dbname -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Connection to $db ($dbname) successful"
    else
        echo -e "${RED}✗${NC} Connection to $db ($dbname) FAILED"
    fi
done
echo ""

# Restart PgAdmin
echo -e "${YELLOW}6. Restarting PgAdmin...${NC}"
docker-compose restart pgadmin
echo -e "${YELLOW}Waiting 10 seconds for PgAdmin to start...${NC}"
sleep 10
echo -e "${GREEN}✓${NC} PgAdmin restarted"
echo ""

# Print connection info
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        📊 PgAdmin Connection Information               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}Access PgAdmin:${NC}"
echo "  URL: ${BLUE}http://localhost:5050${NC}"
echo "  Email: ${YELLOW}admin@admin.com${NC}"
echo "  Password: ${YELLOW}admin${NC}"
echo ""

echo -e "${GREEN}Add Servers with these settings:${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  User Database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  General Tab:"
echo "    Name: User Database"
echo "    Server Group: Fastfood Delivery"
echo ""
echo "  Connection Tab:"
echo "    Host name/address: ${YELLOW}user-db${NC}"
echo "    Port: ${YELLOW}5432${NC}"
echo "    Maintenance database: ${YELLOW}user_db${NC}"
echo "    Username: ${YELLOW}postgres${NC}"
echo "    Password: ${YELLOW}password${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  Product Database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  General Tab:"
echo "    Name: Product Database"
echo "    Server Group: Fastfood Delivery"
echo ""
echo "  Connection Tab:"
echo "    Host name/address: ${YELLOW}product-db${NC}"
echo "    Port: ${YELLOW}5432${NC}"
echo "    Maintenance database: ${YELLOW}product_db${NC}"
echo "    Username: ${YELLOW}postgres${NC}"
echo "    Password: ${YELLOW}password${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  Order Database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  General Tab:"
echo "    Name: Order Database"
echo "    Server Group: Fastfood Delivery"
echo ""
echo "  Connection Tab:"
echo "    Host name/address: ${YELLOW}order-db${NC}"
echo "    Port: ${YELLOW}5432${NC}"
echo "    Maintenance database: ${YELLOW}order_db${NC}"
echo "    Username: ${YELLOW}postgres${NC}"
echo "    Password: ${YELLOW}password${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  Payment Database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  General Tab:"
echo "    Name: Payment Database"
echo "    Server Group: Fastfood Delivery"
echo ""
echo "  Connection Tab:"
echo "    Host name/address: ${YELLOW}payment-db${NC}"
echo "    Port: ${YELLOW}5432${NC}"
echo "    Maintenance database: ${YELLOW}payment_db${NC}"
echo "    Username: ${YELLOW}postgres${NC}"
echo "    Password: ${YELLOW}password${NC}"
echo ""

echo -e "${YELLOW}⚠️  IMPORTANT NOTES:${NC}"
echo "1. ✅ Use container names (user-db, product-db, etc.) as hostname"
echo "2. ✅ Use port 5432 (internal Docker port)"
echo "3. ✅ Password is: password"
echo "4. ✅ Check 'Save password' to avoid re-entering"
echo "5. ❌ DO NOT use localhost or 127.0.0.1"
echo "6. ❌ DO NOT use external ports (5433, 5434, etc.)"
echo ""

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                 ✅ Setup Complete!                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}Next Steps:${NC}"
echo "1. Open PgAdmin: http://localhost:5050"
echo "2. Login with: admin@admin.com / admin"
echo "3. Right-click 'Servers' → Register → Server"
echo "4. Fill in the connection details above"
echo "5. Click 'Save'"
echo ""

echo -e "${YELLOW}Troubleshooting:${NC}"
echo "• If still getting password error:"
echo "  docker-compose restart user-db product-db order-db payment-db pgadmin"
echo ""
echo "• View database logs:"
echo "  docker-compose logs product-db"
echo ""
echo "• Test connection manually:"
echo "  docker exec product-db psql -U postgres -d product_db -c 'SELECT 1;'"
echo ""

# Create servers.json for PgAdmin auto-import
echo -e "${YELLOW}7. Creating PgAdmin servers configuration...${NC}"
mkdir -p ./pgadmin-config

cat > ./pgadmin-config/servers.json << 'JSONEOF'
{
  "Servers": {
    "1": {
      "Name": "User Database",
      "Group": "Fastfood Delivery",
      "Host": "user-db",
      "Port": 5432,
      "MaintenanceDB": "user_db",
      "Username": "postgres",
      "PassFile": "/pgpass",
      "SSLMode": "prefer",
      "Comment": "User service database"
    },
    "2": {
      "Name": "Product Database",
      "Group": "Fastfood Delivery",
      "Host": "product-db",
      "Port": 5432,
      "MaintenanceDB": "product_db",
      "Username": "postgres",
      "PassFile": "/pgpass",
      "SSLMode": "prefer",
      "Comment": "Product service database"
    },
    "3": {
      "Name": "Order Database",
      "Group": "Fastfood Delivery",
      "Host": "order-db",
      "Port": 5432,
      "MaintenanceDB": "order_db",
      "Username": "postgres",
      "PassFile": "/pgpass",
      "SSLMode": "prefer",
      "Comment": "Order service database"
    },
    "4": {
      "Name": "Payment Database",
      "Group": "Fastfood Delivery",
      "Host": "payment-db",
      "Port": 5432,
      "MaintenanceDB": "payment_db",
      "Username": "postgres",
      "PassFile": "/pgpass",
      "SSLMode": "prefer",
      "Comment": "Payment service database"
    }
  }
}
JSONEOF

# Create pgpass file
cat > ./pgadmin-config/pgpass << 'PGPASSEOF'
user-db:5432:user_db:postgres:password
product-db:5432:product_db:postgres:password
order-db:5432:order_db:postgres:password
payment-db:5432:payment_db:postgres:password
*:*:*:postgres:password
PGPASSEOF

chmod 600 ./pgadmin-config/pgpass

echo -e "${GREEN}✓${NC} Configuration files created"
echo ""
echo -e "${YELLOW}Note:${NC} Auto-import config created but may need manual setup in PgAdmin"
echo ""