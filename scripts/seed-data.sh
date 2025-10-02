#!/bin/bash

echo "🌱 Seeding initial data..."

API_URL="http://localhost:8080/api"

# Register admin user
echo "Creating admin user..."
ADMIN_RESPONSE=$(curl -s -X POST "$API_URL/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@fastfood.com",
    "password": "admin123",
    "phone": "0123456789"
  }')

echo "Admin created: $ADMIN_RESPONSE"

# Register test user
echo "Creating test user..."
USER_RESPONSE=$(curl -s -X POST "$API_URL/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "user@test.com",
    "password": "user123",
    "phone": "0987654321"
  }')

echo "Test user created: $USER_RESPONSE"

# Get admin token
ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
    echo "❌ Failed to get admin token. Trying to login..."
    LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/users/login" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "admin@fastfood.com",
        "password": "admin123"
      }')
    ADMIN_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

echo "Admin token: $ADMIN_TOKEN"

# Create products
echo "Creating products..."

products=(
  '{"name":"Burger Classic","description":"Delicious beef burger","price":5.99,"category":"Burgers","stock":50,"image_url":"https://example.com/burger.jpg"}'
  '{"name":"Cheeseburger","description":"Burger with cheese","price":6.99,"category":"Burgers","stock":45,"image_url":"https://example.com/cheeseburger.jpg"}'
  '{"name":"Chicken Burger","description":"Crispy chicken burger","price":6.49,"category":"Burgers","stock":40,"image_url":"https://example.com/chicken-burger.jpg"}'
  '{"name":"French Fries","description":"Crispy golden fries","price":2.99,"category":"Sides","stock":100,"image_url":"https://example.com/fries.jpg"}'
  '{"name":"Onion Rings","description":"Crispy onion rings","price":3.49,"category":"Sides","stock":80,"image_url":"https://example.com/onion-rings.jpg"}'
  '{"name":"Coca Cola","description":"500ml bottle","price":1.99,"category":"Drinks","stock":200,"image_url":"https://example.com/coke.jpg"}'
  '{"name":"Sprite","description":"500ml bottle","price":1.99,"category":"Drinks","stock":180,"image_url":"https://example.com/sprite.jpg"}'
  '{"name":"Ice Cream","description":"Vanilla ice cream","price":3.99,"category":"Desserts","stock":60,"image_url":"https://example.com/ice-cream.jpg"}'
  '{"name":"Apple Pie","description":"Warm apple pie","price":2.99,"category":"Desserts","stock":50,"image_url":"https://example.com/apple-pie.jpg"}'
  '{"name":"Pizza Margherita","description":"Classic Italian pizza","price":9.99,"category":"Pizza","stock":30,"image_url":"https://example.com/pizza.jpg"}'
)

for product in "${products[@]}"; do
    curl -s -X POST "$API_URL/products/products" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "X-User-Role: admin" \
      -d "$product"
    echo ""
done

echo "✅ Data seeding completed!"
echo ""
echo "Test accounts:"
echo "Admin: admin@fastfood.com / admin123"
echo "User: user@test.com / user123"