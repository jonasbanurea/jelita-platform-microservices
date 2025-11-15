# 🚀 Quick Start - Jelita Microservices Docker Deployment

Quick 10-minute guide to run and test the Jelita microservices system.

## ⚡ Quick Steps

### 1. Build & Run (3 minutes)

```powershell
# From folder d:\KULIAH\TESIS\prototype_eng
cd d:\KULIAH\TESIS\prototype_eng

# Build and run all services
docker-compose up -d --build
```

**Expected output:**
```
✔ Container jelita-mysql        Started
✔ Container jelita-phpmyadmin   Started
✔ Container jelita-auth         Started
✔ Container jelita-application  Started
✔ Container jelita-workflow     Started
✔ Container jelita-survey       Started
✔ Container jelita-archive      Started
```

### 2. Setup Database (1 minute)

```powershell
# Run setup script
.\docker\setup-databases.ps1
```

### 3. Verification (1 minute)

```powershell
# Check container status
docker-compose ps

# Test health endpoints
curl http://localhost:3001/health  # Auth
curl http://localhost:3010/health  # Application
curl http://localhost:3020/health  # Workflow
curl http://localhost:3030/health  # Survey
curl http://localhost:3040/health  # Archive
```

### 4. Test API (2 minutes)

```powershell
# Login test
curl -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"demo","password":"*****"}'

# Save token from response, then test other endpoints
```

### 5. Access phpMyAdmin (Optional)

Browser: **http://localhost:8080**
- Server: `mysql`
- Username: `root`
- Password: `********`

---

## 🧪 Testing

### Interoperability Test (Newman)

```powershell
# Install Newman (if not already installed)
npm install -g newman

# Run Archive Service tests
newman run layanan-arsip/postman/Archive_Service.postman_collection.json `
  -e layanan-arsip/postman/Archive_Service.postman_environment.json
```

### Scalability Test (k6)

```powershell
# Install k6 (if not already installed)
choco install k6

# Baseline test (10 VUs)
k6 run tests/loadtest-baseline.js

# Stress test (200+ VUs)
k6 run tests/loadtest-stress.js

# End-to-end integration
k6 run tests/test-e2e-integration.js
```

---

## 📊 Monitoring

### Real-time monitoring

```powershell
# Resource usage
docker stats

# Service logs
docker-compose logs -f

# Specific service
docker-compose logs -f auth-service
```

### Metrics

All services expose health endpoints:
```bash
GET /health
→ {"status":"healthy","service":"auth","timestamp":"2025-11-13T..."}
```

---

## 🛠️ Common Commands

### Start/Stop

```powershell
# Stop all services
docker-compose down

# Start all services
docker-compose up -d

# Restart specific service
docker-compose restart auth-service
```

### Logs

```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f archive-service

# Last 100 lines
docker-compose logs --tail=100 auth-service
```

### Clean Up

```powershell
# Stop and remove containers (keep data)
docker-compose down

# Remove containers and volumes (delete all data)
docker-compose down -v

# Full reset and rebuild
docker-compose down -v
docker-compose up -d --build
```

---

## 🆘 Troubleshooting

### Services not starting
```powershell
# Check logs
docker-compose logs

# Restart Docker Desktop
# Then try again
docker-compose up -d --build
```

### Port conflicts
```powershell
# Find process using port
netstat -ano | findstr ":3001"

# Kill process
taskkill /F /PID <PID>
```

### Database connection errors
```powershell
# Make sure MySQL is healthy
docker-compose ps

# Re-run database setup
.\docker\setup-databases.ps1
```

---

## 📚 Next Steps

1. **Read Full Documentation**: See [DOCKER_DEPLOYMENT_GUIDE.md](DOCKER_DEPLOYMENT_GUIDE.md)
2. **Run Tests**: See [TESTING_REPORT.md](TESTING_REPORT.md)
3. **API Documentation**: Check Postman collections in each service folder

---

**Happy Testing! 🚀**
