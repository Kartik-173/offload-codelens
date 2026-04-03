# CodeLens Backend
 
A Node.js/Express-based API server for cloud infrastructure management, security scanning, and Application Load Balancer (ALB) operations.
 
## Overview
 
CodeLens Backend provides comprehensive cloud infrastructure management capabilities:
 
- **ALB Management**: Real-time and cached AWS Load Balancer data with health monitoring
- **Security Scanning**: Prowler-based AWS/Azure compliance scanning
- **Repository Scanning**: SonarQube code quality analysis
- **Auto-Deregistration**: Automated unhealthy target removal from ALBs
- **Health Monitoring**: Continuous ALB health checks with email alerts
- **Credential Management**: Secure storage of AWS, GitHub, Bitbucket, and Azure credentials
- **Performance Testing**: Load testing with Vegeta
 
## Features
 
### Core Functionality
- Real-time ALB metrics and target health monitoring
- Automated deregistration of unhealthy targets
- Security compliance scanning (AWS/Azure)
- Code quality analysis with SonarQube
- Performance testing and load generation
- Multi-cloud credential management
 
### Security & Authentication
- AWS Cognito-based JWT authentication
- HashiCorp Vault for secrets management
- Role-based access control
- Secure credential storage
 
### Observability
- OpenTelemetry distributed tracing
- Prometheus metrics collection
- Structured logging with Pino + Loki
- Service health monitoring
 
## Tech Stack
 
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Authentication | AWS Cognito (JWT) |
| Database | Apache Cassandra |
| Secrets | HashiCorp Vault |
| Observability | OpenTelemetry + Prometheus + Loki |
| Email | AWS SES |
| Testing | Vegeta (Load Testing) |
 
## Installation
 
### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- Apache Cassandra instance
- AWS Cognito User Pool
- HashiCorp Vault (optional)
 
### Setup
 
1. **Clone the repository**
```bash
git clone <repository-url>
cd terraform-ca
```
 
2. **Install dependencies**
```bash
npm install
```
 
3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration (see Environment Variables section)
```
 
4. **Start the application**
```bash
# Using Docker Compose (recommended)
docker-compose up -d --build
 
# Or directly with Node.js
npm start
```
 
## Environment Variables
 
### Required Variables
 
```bash
# Application
NODE_ENV=development
PORT=3000
 
# AWS Configuration
ACCESSKEYID=your-aws-access-key
SECRETACCESSKEY=your-aws-secret-key
AWS_REGION=us-east-1
 
# AWS Cognito
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
 
# Cassandra
CASSANDRA_CONTACT_POINTS=5.223.42.164
CASSANDRA_PORT=9042
CASSANDRA_DATACENTER=datacenter1
CASSANDRA_USERNAME=cassandra
CASSANDRA_PASSWORD=your-cassandra-password
CASSANDRA_KEYSPACE=codelens_alb
 
# Email (AWS SES)
SES_REGION=ap-south-1
SES_FROM_EMAIL=team@cloudsanalytics.ai
ENABLE_HEALTH_CHECK_EMAILS=true
HEALTH_CHECK_INTERVAL_MINUTES=1
```
 
### Optional Variables
 
```bash
# HashiCorp Vault
VAULT_ADDR=https://vault.cloudsanalytics.ai
VAULT_TOKEN=your-vault-token
 
# SonarQube
SONAR_HOST_URL=https://sonar-ca.cloudsanalytics.ai
SONAR_TOKEN=your-sonar-token
 
# OpenSearch
OPEN_SEARCH_URL=https://opensearch-home.cloudsanalytics.ai
OPEN_SEARCH_USERNAME=admin
OPEN_SEARCH_PASSWORD=your-opensearch-password
 
# Performance Testing
VEGETA_API_URL=https://vegeta.cloudsanalytics.ai
 
# Slack Integration
SLACK_OAUTH_NAME=cloudsanalytics-slack-dev
 
# OpenTelemetry
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=codelens-backend
OTEL_RESOURCE_ATTRIBUTES=service.version=1.0.0
```
 
## Running Locally
 
### Development Mode
 
```bash
# Start with nodemon for auto-restart
npm run dev
 
# Or with Docker Compose
docker-compose up -d --build
docker-compose logs -f backend
```
 
### Production Mode
 
```bash
# Set production environment
export NODE_ENV=production
 
# Start the application
npm start
 
# Or with Docker Compose
docker-compose -f docker-compose.prod.yml up -d --build
```
 
### Health Checks
 
```bash
# Application health
curl http://localhost:3000/healthcheck
 
# Service status
curl http://localhost:3000/service-status
 
# Prometheus metrics
curl http://localhost:3000/metrics
```
 
## API Overview
 
### Base URL
- Development: `http://localhost:3000`
- Production: `https://api.cloudsanalytics.ai`
 
### Authentication
 
All API endpoints (except public ones) require a Bearer token:
 
```http
Authorization: Bearer <cognito_jwt_token>
```
 
### Public Endpoints
- `GET /healthcheck` - Application health status
- `GET /service-status` - External service connectivity
- `GET /metrics` - Prometheus metrics
 
### Core APIs
 
#### Authentication (`/api/auth`)
- OAuth flows with AWS Cognito
- Token refresh and validation
 
#### ALB Management (`/api/alb`)
- Real-time ALB data fetching
- Target group health metrics
- Auto-deregistration management
 
#### Security Scanning (`/api/security-scan`)
- AWS Prowler compliance scans
- Azure security assessments
- CVE vulnerability scanning
 
#### Repository Operations (`/api/repo`)
- SonarQube code quality analysis
- Dependency scanning
- Git repository integration
 
#### Credentials (`/api/credential`)
- AWS, GitHub, Bitbucket, Azure credential management
- Secure storage with Vault integration
 
#### Performance Testing (`/api/performance`)
- Load testing with Vegeta
- Performance metrics collection
 
### Response Format
 
**Success Response:**
```json
{
  "status": "success",
  "data": { ... }
}
```
 
**Error Response:**
```json
{
  "status": "error",
  "error": {
    "message": "Error description",
    "code": 400
  }
}
```
 
## Documentation
 
For detailed API documentation and architecture information:
 
- [Architecture Documentation](docs/architecture.md)
- [API Reference](docs/api/)
- [Database Schema](docs/database.md)
- [Configuration Guide](docs/configuration.md)
- [Request Flow](docs/request-flow.md)
 
## Deployment
 
### Docker Compose (Recommended)
 
```bash
# Start all services
docker-compose up -d --build
 
# View logs
docker-compose logs -f backend
 
# Stop services
docker-compose down
```
 
### Manual Deployment
 
```bash
# Install dependencies
npm ci --production
 
# Set environment variables
export NODE_ENV=production
 
# Start application
npm start
```
 
## Monitoring & Observability
 
### Metrics
- Prometheus metrics available at `/metrics`
- Custom application metrics for ALB operations
- Service health monitoring
 
### Logging
- Structured JSON logging with Pino
- Loki integration for log aggregation
- Request/response tracing
 
### Tracing
- OpenTelemetry distributed tracing
- Automatic instrumentation for Node.js modules
- Custom spans for business operations
 
## Support
 
For issues and support:
- Check the [documentation](docs/) for detailed guides
- Review application logs for error details
- Monitor service health via `/service-status` endpoint
 
## License
 
© CloudSAnalytics. All rights reserved.