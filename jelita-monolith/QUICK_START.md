# Quick Start Guide - Jelita Monolith

Panduan cepat untuk menjalankan Sistem Jelita versi Monolith dalam 5 menit.

## Prerequisites

- Docker & Docker Compose installed
- Port 3000 dan 3307 tersedia

## Step 1: Navigate to Monolith Directory

```bash
cd jelita-monolith
```

## Step 2: Start Services with Docker Compose

```bash
docker-compose up -d
```

Output yang diharapkan:
```
Creating network "jelita-monolith_jelita-monolith-network" ... done
Creating jelita-mysql-monolith ... done
Creating jelita-monolith-app   ... done
```

## Step 3: Wait for Services to be Healthy

```bash
# Check status
docker-compose ps
```

Tunggu hingga semua services menunjukkan status "healthy" (~30 detik).

## Step 4: Setup Database

```bash
# Create tables
docker exec jelita-monolith-app node scripts/setupDatabase.js

# Create test users
docker exec jelita-monolith-app node scripts/createTestUsers.js
```

## Step 5: Test the Application

### Check Health
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "architecture": "monolith",
  "service": "jelita-monolith",
  "timestamp": "2024-12-19T..."
}
```

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"pemohon1","password":"password123"}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "pemohon1",
    "nama_lengkap": "Test Pemohon",
    "peran": "Pemohon",
    "accessToken": "eyJhbGc..."
  }
}
```

## Test Credentials

```
Pemohon:  pemohon1  / password123
Admin:    admin1    / password123
OPD:      opd1      / password123
Pimpinan: pimpinan1 / password123
```

## Common Endpoints

### Authentication
- **POST** `/api/auth/signin` - Login
- **POST** `/api/auth/signup` - Register
- **GET** `/api/auth/validate` - Validate token

### Application
- **POST** `/api/permohonan` - Create application
- **GET** `/api/permohonan` - Get all applications
- **GET** `/api/permohonan/:id` - Get by ID
- **POST** `/api/permohonan/:id/submit` - Submit

### Workflow
- **POST** `/api/disposisi` - Create disposition
- **POST** `/api/kajian-teknis` - Submit review
- **POST** `/api/draft-izin` - Create draft
- **PUT** `/api/draft-izin/:id/setujui` - Approve

## Useful Commands

### View Logs
```bash
# Application logs
docker logs -f jelita-monolith-app

# Database logs
docker logs -f jelita-mysql-monolith
```

### Stop Services
```bash
docker-compose down
```

### Stop and Remove Data
```bash
docker-compose down -v
```

### Restart Services
```bash
docker-compose restart
```

### Access Database
```bash
docker exec -it jelita-mysql-monolith mysql -uroot -prootpassword jelita_monolith
```

## Troubleshooting

### Port 3000 already in use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Database connection error
```bash
# Check if MySQL is running
docker ps | grep mysql

# Restart MySQL
docker-compose restart mysql-monolith

# Wait 10 seconds then retry
```

### Container won't start
```bash
# View detailed logs
docker-compose logs jelita-monolith

# Rebuild container
docker-compose build --no-cache
docker-compose up -d
```

## Next Steps

1. **Read Full Documentation:** `README.md`
2. **Compare with Microservices:** `../COMPARISON_MICROSERVICES_VS_MONOLITH.md`
3. **Run Load Tests:** See testing section in README
4. **Develop Features:** See Development section in README

## Support

For issues or questions, check the main project documentation or create an issue in the repository.

---

**Ready to compare with microservices?** See the comparison guide in the root directory.
