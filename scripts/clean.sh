#!/bin/bash

echo "🧹 Cleaning Fastfood Delivery System..."

read -p "This will remove all containers, volumes, and data. Continue? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose down -v
    docker system prune -f
    echo "✅ All data cleaned"
else
    echo "❌ Cancelled"
fi