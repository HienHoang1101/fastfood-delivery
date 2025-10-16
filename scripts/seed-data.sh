#!/bin/bash

# Dừng ngay lập tức nếu có lỗi
set -e

# URL của API Gateway
API_URL="http://localhost:8080/api"

echo "🌱 Seeding initial data..."

# --- 1. Tạo người dùng ---

echo "Creating admin user..."
ADMIN_RESPONSE=$(curl -s -w "%{http_code}" -X POST -H "Content-Type: application/json" \
  -d '{
    "fullName": "Admin User",
    "email": "admin@fastfood.com",
    "password": "admin123",
    "address": "123 Admin St",
    "phone": "111222333",
    "role": "admin"
  }' \
  ${API_URL}/auth/register)
echo "Admin creation response: $ADMIN_RESPONSE"


echo "Creating test user..."
USER_RESPONSE=$(curl -s -w "%{http_code}" -X POST -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "user@test.com",
    "password": "user123",
    "address": "456 User Ave",
    "phone": "444555666"
  }' \
  ${API_URL}/auth/register)
echo "User creation response: $USER_RESPONSE"


# --- 2. Chờ service ổn định ---

echo "⏳ Waiting 5 seconds for services to process..."
sleep 5


# --- 3. Đăng nhập để lấy Token ---

echo "Logging in as admin to get token..."
LOGIN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
    -d '{"email": "admin@fastfood.com", "password": "admin123"}' \
    ${API_URL}/auth/login)

# Cố gắng trích xuất token. jq là một công cụ dòng lệnh để xử lý JSON.
# Lỗi 'jq: command not found' có thể xảy ra nếu chưa cài, nhưng chúng ta sẽ xử lý.
ADMIN_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)


if [ -z "$ADMIN_TOKEN" ]; then
    echo "❌ Failed to get admin token from login response."
    echo "Login Response Body: $LOGIN_RESPONSE"
    echo "Please check if the user service is running and if the credentials are correct."
    exit 1
fi

echo "✅ Admin token obtained successfully."


# --- 4. Tạo sản phẩm ---

echo "Creating products..."

PRODUCTS=(
  '{"name":"Cheeseburger","description":"Classic beef burger with cheese, lettuce, and tomato","price":5.99,"category":"Burgers","stock":100,"imageUrl":"/images/cheeseburger.jpg"}'
  '{"name":"Bacon Burger","description":"Juicy beef patty with crispy bacon and BBQ sauce","price":7.49,"category":"Burgers","stock":80,"imageUrl":"/images/bacon-burger.jpg"}'
  '{"name":"Veggie Burger","description":"A delicious plant-based patty with fresh vegetables","price":6.99,"category":"Burgers","stock":50,"imageUrl":"/images/veggie-burger.jpg"}'
  '{"name":"French Fries","description":"Golden crispy french fries","price":2.99,"category":"Sides","stock":200,"imageUrl":"/images/fries.jpg"}'
  '{"name":"Onion Rings","description":"Battered and fried onion rings","price":3.49,"category":"Sides","stock":150,"imageUrl":"/images/onion-rings.jpg"}'
  '{"name":"Coca-Cola","description":"Classic Coca-Cola","price":1.99,"category":"Drinks","stock":300,"imageUrl":"/images/coke.jpg"}'
  '{"name":"Sprite","description":"Lemon-lime flavored soft drink","price":1.99,"category":"Drinks","stock":300,"imageUrl":"/images/sprite.jpg"}'
  '{"name":"Chicken Nuggets","description":"Crispy chicken nuggets served with your choice of sauce","price":4.99,"category":"Sides","stock":120,"imageUrl":"/images/nuggets.jpg"}'
  '{"name":"Milkshake","description":"Thick and creamy vanilla milkshake","price":3.99,"category":"Drinks","stock":100,"imageUrl":"/images/milkshake.jpg"}'
  '{"name":"Spicy Chicken Sandwich","description":"A fiery chicken sandwich for those who like it hot","price":6.49,"category":"Burgers","stock":70,"imageUrl":"/images/spicy-chicken.jpg"}'
)

for product_data in "${PRODUCTS[@]}"; do
  curl -s -X POST -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -d "${product_data}" \
    "${API_URL}/products"
  echo "" # Newline for cleaner output
done

echo "✅ Data seeding completed!"
echo ""
echo "Test accounts:"
echo "Admin: admin@fastfood.com / admin123"
echo "User:  user@test.com / user123"