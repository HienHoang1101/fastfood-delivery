#!/bin/bash

# ================================================
# PgAdmin Setup Script
# ================================================

set -e

echo "🗄️  Setting up PgAdmin..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get password from .env
if [ -f .env ]; then
    source .env
    DB_PASSWORD=${POSTGRES_PASSWORD:-password}
else
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

# Create pgadmin directory
mkdir -p monitoring/pgadmin

# Create servers.json
cat > monitoring/pgadmin/servers.json << EOF
{
  "Servers": {
    "1": {
      "Name": "User Database",
      "Group": "Fastfood Delivery",
      "Host": "user-db",
      "Port": 5432,
      "MaintenanceDB": "user_db",
      "Username": "postgres",
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
      "SSLMode": "prefer",
      "Comment": "Payment service database"
    }
  }
}
EOF

echo -e "${GREEN}✅ PgAdmin configuration created${NC}"
echo ""
echo "📝 Database Connection Info:"
echo "   Email: admin@admin.com"
echo "   Password: admin"
echo ""
echo "🔐 Database Password: ${DB_PASSWORD}"
echo ""
echo -e "${YELLOW}⚠️  When PgAdmin asks for password, use: ${DB_PASSWORD}${NC}"
echo ""
echo "🌐 Access PgAdmin at: http://localhost:5050"