#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: ./scripts/logs.sh [service-name]"
    echo "Available services: api-gateway, user, product, order, payment, prometheus, grafana"
    echo "Or use 'all' to see all logs"
    exit 1
fi

if [ "$1" = "all" ]; then
    docker-compose logs -f
else
    docker-compose logs -f "$1"
fi