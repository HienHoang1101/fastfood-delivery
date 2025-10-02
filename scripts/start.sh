#!/bin/bash

echo "🚀 Starting Fastfood Delivery System..."

# Start services
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

services=("api-gateway:8080" "user:3000" "product:3000" "order:3000" "payment:3000")
for service in "${services[@]}"; do
    IFS=':' read -r name port <<< "$service"
    if curl -s http://localhost:$port/health > /dev/null; then
        echo "✅ $name is healthy"
    else
        echo "❌ $name is not responding"
    fi
done

echo ""
echo "✅ All services started!"
echo ""
echo "Access points:"
echo "- API Gateway: http://localhost:8080"
echo "- User Service: http://localhost:3001"
echo "- Product Service: http://localhost:3002"
echo "- Order Service: http://localhost:3003"
echo "- Payment Service: http://localhost:3004"
echo "- Prometheus: http://localhost:9090"
echo "- Grafana: http://localhost:3005"
echo "- AlertManager: http://localhost:9093"
echo "- pgAdmin: http://localhost:5050"