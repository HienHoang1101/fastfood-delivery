#!/bin/bash

echo "🧪 Running tests..."

services=("user" "product" "order" "payment")

for service in "${services[@]}"; do
    echo "Testing $service service..."
    if [ -f "services/$service/package.json" ]; then
        (cd services/$service && npm test)
    else
        echo "No tests found for $service"
    fi
done

echo "✅ All tests completed"