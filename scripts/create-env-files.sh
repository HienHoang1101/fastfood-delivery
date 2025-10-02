#!/bin/bash
# scripts/create-env-files.sh

echo "í´§ Creating .env files for all services..."

# Generate a random JWT secret
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# Root .env file
# ============================================
cat > .env << EOF
# Global Configuration
NODE_ENV=development
LOG_LEVEL=info

# Security
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=24h

# Database
POSTGRES_PASSWORD=postgres_secure_password_change_me

# Ports
API_GATEWAY_PORT=8080
USER_SERVICE_PORT=3001
PRODUCT_SERVICE_PORT=3002
ORDER_SERVICE_PORT=3003
PAYMENT_SERVICE_PORT=3004

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3005
EOF

echo -e "${GREEN}âœ“${NC} Created .env"

# ============================================
# API Gateway .env
# ============================================
mkdir -p services/api-gateway
cat > services/api-gateway/.env << EOF
# API Gateway Configuration
PORT=8080
NODE_ENV=development

# Security
JWT_SECRET=${JWT_SECRET}
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3005

# Internal Service URLs (Docker network)
USER_SERVICE_URL=http://user:3000
PRODUCT_SERVICE_URL=http://product:3000
ORDER_SERVICE_URL=http://order:3000
PAYMENT_SERVICE_URL=http://payment:3000

# Logging
LOG_LEVEL=info
EOF

echo -e "${GREEN}âœ“${NC} Created services/api-gateway/.env"

# ============================================
# User Service .env
# ============================================
mkdir -p services/user
cat > services/user/.env << EOF
# User Service Configuration
PORT=3000
NODE_ENV=development
SERVICE_NAME=user-service

# Database
DB_HOST=user-db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=user_db

# Security
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=24h

# ORM
SEQUELIZE_LOGGING=false

# Monitoring
METRICS_PORT=9100

# Logging
LOG_LEVEL=info

# Email (Optional - configure when needed)
# EMAIL_SERVICE_API_KEY=
# EMAIL_SERVICE_DOMAIN=
# EMAIL_FROM=noreply@fastfood.com
EOF

echo -e "${GREEN}âœ“${NC} Created services/user/.env"

# ============================================
# Product Service .env
# ============================================
mkdir -p services/product
cat > services/product/.env << EOF
# Product Service Configuration
PORT=3000
NODE_ENV=development
SERVICE_NAME=product-service

# Database
DB_HOST=product-db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=product_db

# ORM
SEQUELIZE_LOGGING=false

# Monitoring
METRICS_PORT=9101

# Logging
LOG_LEVEL=info
EOF

echo -e "${GREEN}âœ“${NC} Created services/product/.env"

# ============================================
# Order Service .env
# ============================================
mkdir -p services/order
cat > services/order/.env << EOF
# Order Service Configuration
PORT=3000
NODE_ENV=development
SERVICE_NAME=order-service

# Database
DB_HOST=order-db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=order_db

# ORM
SEQUELIZE_LOGGING=false

# Internal Service URLs
PRODUCT_URL=http://product:3000
USER_SERVICE_URL=http://user:3000

# Monitoring
METRICS_PORT=9102

# Logging
LOG_LEVEL=info
EOF

echo -e "${GREEN}âœ“${NC} Created services/order/.env"

# ============================================
# Payment Service .env
# ============================================
mkdir -p services/payment
cat > services/payment/.env << EOF
# Payment Service Configuration
PORT=3000
NODE_ENV=development
SERVICE_NAME=payment-service

# Database
DB_HOST=payment-db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=payment_db

# ORM
SEQUELIZE_LOGGING=false

# Internal Service URLs
ORDER_URL=http://order:3000

# Monitoring
METRICS_PORT=9103

# Logging
LOG_LEVEL=info

# Payment Gateway (Configure when integrating real payment)
# PAYMENT_GATEWAY_API_KEY=
# PAYMENT_GATEWAY_API_SECRET=
# PAYMENT_GATEWAY_URL=https://api.paymentgateway.com
# PAYMENT_SUCCESS_URL=http://localhost:3000/payment/success
# PAYMENT_CANCEL_URL=http://localhost:3000/payment/cancel

# Notifications (Optional)
# EMAIL_SERVICE_API_KEY=
# EMAIL_SERVICE_DOMAIN=
# SMS_SERVICE_API_KEY=
# SMS_SERVICE_URL=
EOF

echo -e "${GREEN}âœ“${NC} Created services/payment/.env"

# ============================================
# Create .env.example
# ============================================
cat > .env.example << EOF
# Copy this file to .env and update with your values

# Global Configuration
NODE_ENV=development
LOG_LEVEL=info

# Security - CHANGE THIS IN PRODUCTION
JWT_SECRET=generate-a-random-32-character-secret
JWT_EXPIRES_IN=24h

# Database - CHANGE THIS IN PRODUCTION
POSTGRES_PASSWORD=your-secure-password-here

# Ports
API_GATEWAY_PORT=8080
USER_SERVICE_PORT=3001
PRODUCT_SERVICE_PORT=3002
ORDER_SERVICE_PORT=3003
PAYMENT_SERVICE_PORT=3004

# CORS - Add your frontend URL
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3005
EOF

echo -e "${GREEN}âœ“${NC} Created .env.example"

# ============================================
# Create .gitignore entry
# ============================================
if [ ! -f .gitignore ]; then
    touch .gitignore
fi

if ! grep -q "\.env$" .gitignore; then
    cat >> .gitignore << EOF

# Environment variables
.env
.env.local
.env.*.local
services/*/.env
EOF
    echo -e "${GREEN}âœ“${NC} Updated .gitignore"
fi

# ============================================
# Summary
# ============================================
echo ""
echo -e "${GREEN}âœ… All .env files created successfully!${NC}"
echo ""
echo -e "${YELLOW}âš ï¸  IMPORTANT SECURITY NOTES:${NC}"
echo "1. Generated JWT_SECRET: ${JWT_SECRET}"
echo "2. Change all passwords in production!"
echo "3. Never commit .env files to Git"
echo "4. Update .env.example when adding new variables"
echo ""
echo -e "${GREEN}í³ Next steps:${NC}"
echo "1. Review all .env files"
echo "2. Update passwords and secrets"
echo "3. Configure optional services (email, SMS, payment gateway)"
echo ""

# Make script executable
chmod +x scripts/create-env-files.sh#!/bin/bash
# scripts/create-env-files.sh

echo "í´§ Creating .env files for all services..."

# Generate a random JWT secret
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# Root .env file
# ============================================
cat > .env << EOF
# Global Configuration
NODE_ENV=development
LOG_LEVEL=info

# Security
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=24h

# Database
POSTGRES_PASSWORD=postgres_secure_password_change_me

# Ports
API_GATEWAY_PORT=8080
USER_SERVICE_PORT=3001
PRODUCT_SERVICE_PORT=3002
ORDER_SERVICE_PORT=3003
PAYMENT_SERVICE_PORT=3004

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3005
EOF

echo -e "${GREEN}âœ“${NC} Created .env"

# ============================================
# API Gateway .env
# ============================================
mkdir -p services/api-gateway
cat > services/api-gateway/.env << EOF
# API Gateway Configuration
PORT=8080
NODE_ENV=development

# Security
JWT_SECRET=${JWT_SECRET}
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3005

# Internal Service URLs (Docker network)
USER_SERVICE_URL=http://user:3000
PRODUCT_SERVICE_URL=http://product:3000
ORDER_SERVICE_URL=http://order:3000
PAYMENT_SERVICE_URL=http://payment:3000

# Logging
LOG_LEVEL=info
EOF

echo -e "${GREEN}âœ“${NC} Created services/api-gateway/.env"

# ============================================
# User Service .env
# ============================================
mkdir -p services/user
cat > services/user/.env << EOF
# User Service Configuration
PORT=3000
NODE_ENV=development
SERVICE_NAME=user-service

# Database
DB_HOST=user-db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=user_db

# Security
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=24h

# ORM
SEQUELIZE_LOGGING=false

# Monitoring
METRICS_PORT=9100

# Logging
LOG_LEVEL=info

# Email (Optional - configure when needed)
# EMAIL_SERVICE_API_KEY=
# EMAIL_SERVICE_DOMAIN=
# EMAIL_FROM=noreply@fastfood.com
EOF

echo -e "${GREEN}âœ“${NC} Created services/user/.env"

# ============================================
# Product Service .env
# ============================================
mkdir -p services/product
cat > services/product/.env << EOF
# Product Service Configuration
PORT=3000
NODE_ENV=development
SERVICE_NAME=product-service

# Database
DB_HOST=product-db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=product_db

# ORM
SEQUELIZE_LOGGING=false

# Monitoring
METRICS_PORT=9101

# Logging
LOG_LEVEL=info
EOF

echo -e "${GREEN}âœ“${NC} Created services/product/.env"

# ============================================
# Order Service .env
# ============================================
mkdir -p services/order
cat > services/order/.env << EOF
# Order Service Configuration
PORT=3000
NODE_ENV=development
SERVICE_NAME=order-service

# Database
DB_HOST=order-db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=order_db

# ORM
SEQUELIZE_LOGGING=false

# Internal Service URLs
PRODUCT_URL=http://product:3000
USER_SERVICE_URL=http://user:3000

# Monitoring
METRICS_PORT=9102

# Logging
LOG_LEVEL=info
EOF

echo -e "${GREEN}âœ“${NC} Created services/order/.env"

# ============================================
# Payment Service .env
# ============================================
mkdir -p services/payment
cat > services/payment/.env << EOF
# Payment Service Configuration
PORT=3000
NODE_ENV=development
SERVICE_NAME=payment-service

# Database
DB_HOST=payment-db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=payment_db

# ORM
SEQUELIZE_LOGGING=false

# Internal Service URLs
ORDER_URL=http://order:3000

# Monitoring
METRICS_PORT=9103

# Logging
LOG_LEVEL=info

# Payment Gateway (Configure when integrating real payment)
# PAYMENT_GATEWAY_API_KEY=
# PAYMENT_GATEWAY_API_SECRET=
# PAYMENT_GATEWAY_URL=https://api.paymentgateway.com
# PAYMENT_SUCCESS_URL=http://localhost:3000/payment/success
# PAYMENT_CANCEL_URL=http://localhost:3000/payment/cancel

# Notifications (Optional)
# EMAIL_SERVICE_API_KEY=
# EMAIL_SERVICE_DOMAIN=
# SMS_SERVICE_API_KEY=
# SMS_SERVICE_URL=
EOF

echo -e "${GREEN}âœ“${NC} Created services/payment/.env"

# ============================================
# Create .env.example
# ============================================
cat > .env.example << EOF
# Copy this file to .env and update with your values

# Global Configuration
NODE_ENV=development
LOG_LEVEL=info

# Security - CHANGE THIS IN PRODUCTION
JWT_SECRET=generate-a-random-32-character-secret
JWT_EXPIRES_IN=24h

# Database - CHANGE THIS IN PRODUCTION
POSTGRES_PASSWORD=your-secure-password-here

# Ports
API_GATEWAY_PORT=8080
USER_SERVICE_PORT=3001
PRODUCT_SERVICE_PORT=3002
ORDER_SERVICE_PORT=3003
PAYMENT_SERVICE_PORT=3004

# CORS - Add your frontend URL
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3005
EOF

echo -e "${GREEN}âœ“${NC} Created .env.example"

# ============================================
# Create .gitignore entry
# ============================================
if [ ! -f .gitignore ]; then
    touch .gitignore
fi

if ! grep -q "\.env$" .gitignore; then
    cat >> .gitignore << EOF

# Environment variables
.env
.env.local
.env.*.local
services/*/.env
EOF
    echo -e "${GREEN}âœ“${NC} Updated .gitignore"
fi

# ============================================
# Summary
# ============================================
echo ""
echo -e "${GREEN}âœ… All .env files created successfully!${NC}"
echo ""
echo -e "${YELLOW}âš ï¸  IMPORTANT SECURITY NOTES:${NC}"
echo "1. Generated JWT_SECRET: ${JWT_SECRET}"
echo "2. Change all passwords in production!"
echo "3. Never commit .env files to Git"
echo "4. Update .env.example when adding new variables"
echo ""
echo -e "${GREEN}í³ Next steps:${NC}"
echo "1. Review all .env files"
echo "2. Update passwords and secrets"
echo "3. Configure optional services (email, SMS, payment gateway)"
echo ""

# Make script executable
chmod +x scripts/create-env-files.sh#!/bin/bash
# scripts/create-env-files.sh

echo "í´§ Creating .env files for all services..."

# Generate a random JWT secret
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# Root .env file
# ============================================
cat > .env << EOF
# Global Configuration
NODE_ENV=development
LOG_LEVEL=info

# Security
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=24h

# Database
POSTGRES_PASSWORD=postgres_secure_password_change_me

# Ports
API_GATEWAY_PORT=8080
USER_SERVICE_PORT=3001
PRODUCT_SERVICE_PORT=3002
ORDER_SERVICE_PORT=3003
PAYMENT_SERVICE_PORT=3004

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3005
EOF

echo -e "${GREEN}âœ“${NC} Created .env"

# ============================================
# API Gateway .env
# ============================================
mkdir -p services/api-gateway
cat > services/api-gateway/.env << EOF
# API Gateway Configuration
PORT=8080
NODE_ENV=development

# Security
JWT_SECRET=${JWT_SECRET}
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3005

# Internal Service URLs (Docker network)
USER_SERVICE_URL=http://user:3000
PRODUCT_SERVICE_URL=http://product:3000
ORDER_SERVICE_URL=http://order:3000
PAYMENT_SERVICE_URL=http://payment:3000

# Logging
LOG_LEVEL=info
EOF

echo -e "${GREEN}âœ“${NC} Created services/api-gateway/.env"

# ============================================
# User Service .env
# ============================================
mkdir -p services/user
cat > services/user/.env << EOF
# User Service Configuration
PORT=3000
NODE_ENV=development
SERVICE_NAME=user-service

# Database
DB_HOST=user-db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=user_db

# Security
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=24h

# ORM
SEQUELIZE_LOGGING=false

# Monitoring
METRICS_PORT=9100

# Logging
LOG_LEVEL=info

# Email (Optional - configure when needed)
# EMAIL_SERVICE_API_KEY=
# EMAIL_SERVICE_DOMAIN=
# EMAIL_FROM=noreply@fastfood.com
EOF

echo -e "${GREEN}âœ“${NC} Created services/user/.env"

# ============================================
# Product Service .env
# ============================================
mkdir -p services/product
cat > services/product/.env << EOF
# Product Service Configuration
PORT=3000
NODE_ENV=development
SERVICE_NAME=product-service

# Database
DB_HOST=product-db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=product_db

# ORM
SEQUELIZE_LOGGING=false

# Monitoring
METRICS_PORT=9101

# Logging
LOG_LEVEL=info
EOF

echo -e "${GREEN}âœ“${NC} Created services/product/.env"

# ============================================
# Order Service .env
# ============================================
mkdir -p services/order
cat > services/order/.env << EOF
# Order Service Configuration
PORT=3000
NODE_ENV=development
SERVICE_NAME=order-service

# Database
DB_HOST=order-db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=order_db

# ORM
SEQUELIZE_LOGGING=false

# Internal Service URLs
PRODUCT_URL=http://product:3000
USER_SERVICE_URL=http://user:3000

# Monitoring
METRICS_PORT=9102

# Logging
LOG_LEVEL=info
EOF

echo -e "${GREEN}âœ“${NC} Created services/order/.env"

# ============================================
# Payment Service .env
# ============================================
mkdir -p services/payment
cat > services/payment/.env << EOF
# Payment Service Configuration
PORT=3000
NODE_ENV=development
SERVICE_NAME=payment-service

# Database
DB_HOST=payment-db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=payment_db

# ORM
SEQUELIZE_LOGGING=false

# Internal Service URLs
ORDER_URL=http://order:3000

# Monitoring
METRICS_PORT=9103

# Logging
LOG_LEVEL=info

# Payment Gateway (Configure when integrating real payment)
# PAYMENT_GATEWAY_API_KEY=
# PAYMENT_GATEWAY_API_SECRET=
# PAYMENT_GATEWAY_URL=https://api.paymentgateway.com
# PAYMENT_SUCCESS_URL=http://localhost:3000/payment/success
# PAYMENT_CANCEL_URL=http://localhost:3000/payment/cancel

# Notifications (Optional)
# EMAIL_SERVICE_API_KEY=
# EMAIL_SERVICE_DOMAIN=
# SMS_SERVICE_API_KEY=
# SMS_SERVICE_URL=
EOF

echo -e "${GREEN}âœ“${NC} Created services/payment/.env"

# ============================================
# Create .env.example
# ============================================
cat > .env.example << EOF
# Copy this file to .env and update with your values

# Global Configuration
NODE_ENV=development
LOG_LEVEL=info

# Security - CHANGE THIS IN PRODUCTION
JWT_SECRET=generate-a-random-32-character-secret
JWT_EXPIRES_IN=24h

# Database - CHANGE THIS IN PRODUCTION
POSTGRES_PASSWORD=your-secure-password-here

# Ports
API_GATEWAY_PORT=8080
USER_SERVICE_PORT=3001
PRODUCT_SERVICE_PORT=3002
ORDER_SERVICE_PORT=3003
PAYMENT_SERVICE_PORT=3004

# CORS - Add your frontend URL
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3005
EOF

echo -e "${GREEN}âœ“${NC} Created .env.example"

# ============================================
# Create .gitignore entry
# ============================================
if [ ! -f .gitignore ]; then
    touch .gitignore
fi

if ! grep -q "\.env$" .gitignore; then
    cat >> .gitignore << EOF

# Environment variables
.env
.env.local
.env.*.local
services/*/.env
EOF
    echo -e "${GREEN}âœ“${NC} Updated .gitignore"
fi

# ============================================
# Summary
# ============================================
echo ""
echo -e "${GREEN}âœ… All .env files created successfully!${NC}"
echo ""
echo -e "${YELLOW}âš ï¸  IMPORTANT SECURITY NOTES:${NC}"
echo "1. Generated JWT_SECRET: ${JWT_SECRET}"
echo "2. Change all passwords in production!"
echo "3. Never commit .env files to Git"
echo "4. Update .env.example when adding new variables"
echo ""
echo -e "${GREEN}í³ Next steps:${NC}"
echo "1. Review all .env files"
echo "2. Update passwords and secrets"
echo "3. Configure optional services (email, SMS, payment gateway)"
echo ""

# Make script executable
chmod +x scripts/create-env-files.sh
