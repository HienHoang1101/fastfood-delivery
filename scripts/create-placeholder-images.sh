#!/bin/bash
# scripts/create-placeholder-images.sh

# Tạo thư mục public/images trong frontend
mkdir -p frontend/public/images/products

# Download hoặc tạo placeholder images
# Option 1: Sử dụng placeholder services
echo "Creating placeholder images..."

# Burger images
curl -o frontend/public/images/products/burger-1.jpg "https://via.placeholder.com/500x500/FF6B6B/FFFFFF?text=Classic+Burger"
curl -o frontend/public/images/products/burger-2.jpg "https://via.placeholder.com/500x500/FF6B6B/FFFFFF?text=Cheeseburger"
curl -o frontend/public/images/products/burger-3.jpg "https://via.placeholder.com/500x500/FF6B6B/FFFFFF?text=Chicken+Burger"
curl -o frontend/public/images/products/burger-4.jpg "https://via.placeholder.com/500x500/FF6B6B/FFFFFF?text=Veggie+Burger"

# Pizza images
curl -o frontend/public/images/products/pizza-1.jpg "https://via.placeholder.com/500x500/FFA500/FFFFFF?text=Margherita"
curl -o frontend/public/images/products/pizza-2.jpg "https://via.placeholder.com/500x500/FFA500/FFFFFF?text=Pepperoni"
curl -o frontend/public/images/products/pizza-3.jpg "https://via.placeholder.com/500x500/FFA500/FFFFFF?text=Hawaiian"
curl -o frontend/public/images/products/pizza-4.jpg "https://via.placeholder.com/500x500/FFA500/FFFFFF?text=Veggie"

# Sides images
curl -o frontend/public/images/products/fries.jpg "https://via.placeholder.com/500x500/FFD700/FFFFFF?text=French+Fries"
curl -o frontend/public/images/products/onion-rings.jpg "https://via.placeholder.com/500x500/FFD700/FFFFFF?text=Onion+Rings"
curl -o frontend/public/images/products/wings.jpg "https://via.placeholder.com/500x500/FFD700/FFFFFF?text=Chicken+Wings"
curl -o frontend/public/images/products/mozz-sticks.jpg "https://via.placeholder.com/500x500/FFD700/FFFFFF?text=Mozzarella"

# Drinks
curl -o frontend/public/images/products/coke.jpg "https://via.placeholder.com/500x500/4ECDC4/FFFFFF?text=Coca+Cola"
curl -o frontend/public/images/products/sprite.jpg "https://via.placeholder.com/500x500/4ECDC4/FFFFFF?text=Sprite"
curl -o frontend/public/images/products/oj.jpg "https://via.placeholder.com/500x500/4ECDC4/FFFFFF?text=Orange+Juice"
curl -o frontend/public/images/products/coffee.jpg "https://via.placeholder.com/500x500/4ECDC4/FFFFFF?text=Iced+Coffee"

# Desserts
curl -o frontend/public/images/products/brownie.jpg "https://via.placeholder.com/500x500/8B4513/FFFFFF?text=Brownie"
curl -o frontend/public/images/products/apple-pie.jpg "https://via.placeholder.com/500x500/8B4513/FFFFFF?text=Apple+Pie"
curl -o frontend/public/images/products/sundae.jpg "https://via.placeholder.com/500x500/8B4513/FFFFFF?text=Ice+Cream"
curl -o frontend/public/images/products/cheesecake.jpg "https://via.placeholder.com/500x500/8B4513/FFFFFF?text=Cheesecake"

echo "✓ Placeholder images created in frontend/public/images/products/"