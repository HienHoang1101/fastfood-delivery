#!/bin/bash
# scripts/seed-data-with-images.sh

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🌱 Seeding Data with Images - Fastfood Delivery   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

API_URL="http://localhost:8080/api"

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 5

# ===== 1. CREATE ADMIN USER =====
echo -e "${YELLOW}👤 Creating admin user...${NC}"
ADMIN_RESPONSE=$(curl -s -X POST "$API_URL/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@fastfood.com",
    "password": "admin123",
    "phone": "0901234567"
  }')

echo "$ADMIN_RESPONSE" | jq '.' 2>/dev/null || echo "$ADMIN_RESPONSE"

# Get admin token
ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${YELLOW}Admin already exists, trying to login...${NC}"
    LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/users/login" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "admin@fastfood.com",
        "password": "admin123"
      }')
    ADMIN_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

echo -e "${GREEN}✓${NC} Admin user ready"
echo ""

# ===== 2. CREATE TEST USERS =====
echo -e "${YELLOW}👥 Creating test users...${NC}"

users=(
  '{"name":"John Doe","email":"john@test.com","password":"user123","phone":"0912345678"}'
  '{"name":"Jane Smith","email":"jane@test.com","password":"user123","phone":"0923456789"}'
  '{"name":"Bob Wilson","email":"bob@test.com","password":"user123","phone":"0934567890"}'
)

for user in "${users[@]}"; do
    curl -s -X POST "$API_URL/users/register" \
      -H "Content-Type: application/json" \
      -d "$user" > /dev/null
done

echo -e "${GREEN}✓${NC} Test users created"
echo ""

# ===== 3. CREATE PRODUCTS WITH REAL IMAGES =====
echo -e "${YELLOW}🍔 Creating products with images...${NC}"

# Burgers
products=(
  # BURGERS
  '{
    "name": "Classic Beef Burger",
    "description": "Juicy beef patty with lettuce, tomato, onion, and our special sauce",
    "price": 8.99,
    "category": "Burgers",
    "stock": 50,
    "image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=500&fit=crop"
  }'
  '{
    "name": "Cheeseburger Deluxe",
    "description": "Double beef patty with melted cheddar cheese and bacon",
    "price": 10.99,
    "category": "Burgers",
    "stock": 45,
    "image_url": "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=500&h=500&fit=crop"
  }'
  '{
    "name": "Chicken Burger",
    "description": "Crispy fried chicken breast with mayo and coleslaw",
    "price": 9.49,
    "category": "Burgers",
    "stock": 40,
    "image_url": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=500&h=500&fit=crop"
  }'
  '{
    "name": "Veggie Burger",
    "description": "Plant-based patty with avocado, lettuce, and tomato",
    "price": 9.99,
    "category": "Burgers",
    "stock": 35,
    "image_url": "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=500&h=500&fit=crop"
  }'
  
  # PIZZA
  '{
    "name": "Margherita Pizza",
    "description": "Classic Italian pizza with tomato sauce, mozzarella, and basil",
    "price": 12.99,
    "category": "Pizza",
    "stock": 30,
    "image_url": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&h=500&fit=crop"
  }'
  '{
    "name": "Pepperoni Pizza",
    "description": "Loaded with pepperoni and extra cheese",
    "price": 14.99,
    "category": "Pizza",
    "stock": 28,
    "image_url": "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&h=500&fit=crop"
  }'
  '{
    "name": "Hawaiian Pizza",
    "description": "Ham and pineapple with mozzarella cheese",
    "price": 13.99,
    "category": "Pizza",
    "stock": 25,
    "image_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&h=500&fit=crop"
  }'
  '{
    "name": "Veggie Supreme Pizza",
    "description": "Loaded with bell peppers, mushrooms, olives, and onions",
    "price": 13.49,
    "category": "Pizza",
    "stock": 22,
    "image_url": "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=500&h=500&fit=crop"
  }'
  
  # SIDES
  '{
    "name": "French Fries",
    "description": "Crispy golden fries with sea salt",
    "price": 3.99,
    "category": "Sides",
    "stock": 100,
    "image_url": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&h=500&fit=crop"
  }'
  '{
    "name": "Onion Rings",
    "description": "Crispy beer-battered onion rings",
    "price": 4.49,
    "category": "Sides",
    "stock": 80,
    "image_url": "https://images.unsplash.com/photo-1639024471283-03518883512d?w=500&h=500&fit=crop"
  }'
  '{
    "name": "Chicken Wings",
    "description": "Spicy buffalo wings with ranch dip",
    "price": 7.99,
    "category": "Sides",
    "stock": 60,
    "image_url": "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=500&h=500&fit=crop"
  }'
  '{
    "name": "Mozzarella Sticks",
    "description": "Breaded mozzarella with marinara sauce",
    "price": 5.99,
    "category": "Sides",
    "stock": 70,
    "image_url": "https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=500&h=500&fit=crop"
  }'
  
  # DRINKS
  '{
    "name": "Coca Cola",
    "description": "Classic Coca Cola - 500ml",
    "price": 2.49,
    "category": "Drinks",
    "stock": 200,
    "image_url": "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=500&h=500&fit=crop"
  }'
  '{
    "name": "Sprite",
    "description": "Refreshing lemon-lime soda - 500ml",
    "price": 2.49,
    "category": "Drinks",
    "stock": 180,
    "image_url": "https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=500&h=500&fit=crop"
  }'
  '{
    "name": "Orange Juice",
    "description": "Fresh squeezed orange juice - 350ml",
    "price": 3.99,
    "category": "Drinks",
    "stock": 90,
    "image_url": "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500&h=500&fit=crop"
  }'
  '{
    "name": "Iced Coffee",
    "description": "Cold brew coffee with ice - 450ml",
    "price": 4.49,
    "category": "Drinks",
    "stock": 75,
    "image_url": "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=500&h=500&fit=crop"
  }'
  
  # DESSERTS
  '{
    "name": "Chocolate Brownie",
    "description": "Warm chocolate brownie with vanilla ice cream",
    "price": 5.99,
    "category": "Desserts",
    "stock": 40,
    "image_url": "https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=500&h=500&fit=crop"
  }'
  '{
    "name": "Apple Pie",
    "description": "Classic apple pie with cinnamon",
    "price": 4.99,
    "category": "Desserts",
    "stock": 35,
    "image_url": "https://images.unsplash.com/photo-1535920527002-b35e96722eb9?w=500&h=500&fit=crop"
  }'
  '{
    "name": "Ice Cream Sundae",
    "description": "Vanilla ice cream with chocolate sauce and nuts",
    "price": 4.49,
    "category": "Desserts",
    "stock": 50,
    "image_url": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&h=500&fit=crop"
  }'
  '{
    "name": "Cheesecake",
    "description": "New York style cheesecake with berry compote",
    "price": 6.49,
    "category": "Desserts",
    "stock": 30,
    "image_url": "https://images.unsplash.com/photo-1533134486753-c833f0ed4866?w=500&h=500&fit=crop"
  }'
  
  # SALADS
  '{
    "name": "Caesar Salad",
    "description": "Crisp romaine lettuce with caesar dressing and croutons",
    "price": 7.99,
    "category": "Salads",
    "stock": 45,
    "image_url": "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=500&h=500&fit=crop"
  }'
  '{
    "name": "Greek Salad",
    "description": "Fresh vegetables with feta cheese and olives",
    "price": 8.49,
    "category": "Salads",
    "stock": 40,
    "image_url": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=500&h=500&fit=crop"
  }'
)

count=0
for product in "${products[@]}"; do
    response=$(curl -s -X POST "$API_URL/products/products" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -d "$product")
    
    if echo "$response" | grep -q "product"; then
        count=$((count + 1))
        echo -e "${GREEN}✓${NC} Product $count created"
    else
        echo -e "${YELLOW}⚠${NC} Product might already exist"
    fi
done

echo -e "${GREEN}✓${NC} $count products created"
echo ""

# ===== SUMMARY =====
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              ✅ Data Seeding Complete!                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Summary:${NC}"
echo "  • Admin user: admin@fastfood.com / admin123"
echo "  • Test users: john@test.com, jane@test.com, bob@test.com"
echo "  • Password for test users: user123"
echo "  • Products created: $count items with images"
echo ""
echo -e "${YELLOW}Categories:${NC}"
echo "  🍔 Burgers: 4 items"
echo "  🍕 Pizza: 4 items"
echo "  🍟 Sides: 4 items"
echo "  🥤 Drinks: 4 items"
echo "  🍰 Desserts: 4 items"
echo "  🥗 Salads: 2 items"
echo ""
echo -e "${BLUE}You can now:${NC}"
echo "  1. Login as admin to manage products"
echo "  2. Browse products with images"
echo "  3. Place orders as test users"
echo ""