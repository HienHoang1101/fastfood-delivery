# Software Requirements Specification (SRS)
# Software Requirements Specification (SRS)

## 1. Introduction
The **Fastfood Delivery System** is a microservices-based application designed to simulate a food ordering and delivery platform.  
The main focus is on **CI/CD pipeline automation** and **service monitoring**.

## 2. System Requirements
- User management (customers, admins)
- Product management (fastfood items)
- Order management (create, update, track orders)
- Payment simulation (mock transactions)
- Notifications (real-time order updates)

## 3. Technology Stack
- Node.js (NestJS/Express) for backend microservices
- React for frontend
- PostgreSQL & Redis for data persistence and caching
- Docker & Kubernetes (or Docker Compose) for deployment
- GitHub Actions for CI/CD
- Prometheus & Grafana for monitoring

## 4. Scope
The system will be a simplified food delivery application with **4 core microservices**:
- User
- Product
- Order
- Payment
