# Fastfood Delivery - Microservices
# Fastfood Delivery - Microservices

This project is a **Food Delivery System** built with a **Microservices Architecture**.  
It is part of a university software engineering course project, with a focus on **CI/CD pipelines** and **service monitoring**.

## Services
- **User Service** – Manage users and authentication
- **Product Service** – Manage food products
- **Order Service** – Handle order placement and tracking
- **Payment Service** – Simulate payment processing

## Tech Stack
- **Backend**: Node.js (NestJS/Express)
- **Frontend**: React
- **Database**: PostgreSQL
- **Cache**: Redis
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana

## Structure

## CI/CD Pipeline

The project will use **GitHub Actions** for Continuous Integration and Continuous Deployment.

### Continuous Integration (CI)
- Triggered on **pull requests** and **push to main**
- Steps:
  1. Checkout repository
  2. Install dependencies
  3. Run lint checks (ESLint, Prettier)
  4. Run unit tests
  5. Build Docker images for each microservice

### Continuous Deployment (CD)
- Triggered on **push to main branch**
- Steps:
  1. Push Docker images to Docker Hub / GitHub Container Registry
  2. Deploy services to environment (Docker Compose for local, Kubernetes for cloud)
  3. Run database migrations (if any)
  4. Health check for all services

### Monitoring & Observability
- **Prometheus**: Collect service metrics
- **Grafana**: Visualize dashboards
- **Alertmanager**: Send alerts when a service fails or metrics exceed thresholds
