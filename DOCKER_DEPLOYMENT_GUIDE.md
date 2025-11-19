# 🐳 Panduan Docker Deployment - Jelita Microservices

Panduan lengkap untuk deploy, menguji, dan menskalakan sistem Layanan Perizinan Jelita menggunakan Docker & Docker Compose.

## 📋 Daftar Isi

1. [Arsitektur System](#arsitektur-system)
2. [Prasyarat](#prasyarat)
3. [Quick Start](#quick-start)
4. [Langkah Detail Deployment](#langkah-detail-deployment)
5. [Testing Interoperabilitas](#testing-interoperabilitas)
6. [Testing Skalabilitas](#testing-skalabilitas)
7. [Monitoring & Observability](#monitoring--observability)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ Arsitektur System

Sistem Jelita terdiri dari 5 microservices yang independent:

```
┌─────────────────────────────────────────────────────────────┐
│                    Jelita Microservices                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth Service │  │ Pendaftaran  │  │   Workflow   │      │
│  │  Port 3001   │  │  Port 3010   │  │  Port 3020   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                           │                                  │
│         ┌─────────────────┴─────────────────┐               │
│         │                                    │               │
│  ┌──────▼───────┐              ┌────────────▼─┐            │
│  │Survey Service│              │Archive Service│            │
│  │  Port 3030   │              │  Port 3040    │            │
│  └──────────────┘              └───────────────┘            │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           MySQL Database (Shared Host)                │  │
│  │  - jelita_users      - jelita_survei                  │  │
│  │  - jelita_pendaftaran - jelita_arsip                  │  │
│  │  - jelita_workflow                                    │  │
│  │                    Port 3306                           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              phpMyAdmin (Optional)                     │  │
│  │                    Port 8080                           │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Services:
- **Auth Service (3001)**: Autentikasi, JWT token, user management
- **Pendaftaran Service (3010)**: Submit dan manage permohonan izin
- **Workflow Service (3020)**: Proses internal (disposisi, kajian teknis)
- **Survey Service (3030)**: Kelola SKM (Survei Kepuasan Masyarakat)
- **Archive Service (3040)**: Digital archiving dengan access control OPD

---

## ✅ Prasyarat

### Software Required:
- **Docker Desktop** (Windows/Mac) atau Docker Engine (Linux)
  - Download: https://www.docker.com/products/docker-desktop
  - Versi minimal: 20.10+
- **Docker Compose** v2.0+
  - Biasanya sudah include di Docker Desktop
- **Git** (untuk clone/update kode)
- **Postman** atau **Newman** (untuk testing API)
- **k6** (optional, untuk load testing)

### Verifikasi Instalasi:

```powershell
# Cek Docker
docker --version
# Output: Docker version 24.0.x

# Cek Docker Compose
docker-compose --version
# Output: Docker Compose version v2.x.x

# Cek k6 (optional)
k6 version
```

---

## 🚀 Quick Start (5 Menit)

### 1. Build dan Jalankan Semua Services

```powershell
# Navigasi ke folder prototype
cd d:\KULIAH\TESIS\prototype

# Build dan jalankan semua container
docker-compose up -d --build
```

**Output yang diharapkan:**
```
[+] Building 120.5s (65/65) FINISHED
[+] Running 7/7
 ✔ Network jelita-network       Created
 ✔ Volume "mysql_data"           Created
 ✔ Container jelita-mysql        Started
 ✔ Container jelita-phpmyadmin   Started
 ✔ Container jelita-auth         Started
 ✔ Container jelita-pendaftaran  Started
 ✔ Container jelita-workflow     Started
 ✔ Container jelita-survey       Started
 ✔ Container jelita-archive      Started
```

### 2. Setup Database Tables & Seed Data

```powershell
# Jalankan script setup database
.\docker\setup-databases.ps1
```

### 3. Verifikasi Services Running

```powershell
# Cek status containers
docker-compose ps

# Cek logs service tertentu
docker-compose logs auth-service
docker-compose logs archive-service

# Cek semua logs (follow mode)
docker-compose logs -f
```

### 4. Test API (Manual Quick Check)

```powershell
# Test Auth Service - Login
curl -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"demo","password":"******"}'

# Option 3: Gunakan curl.exe (bukan alias PowerShell)
curl.exe -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"demo","password":"******"}'

# Output: {"success":true,"token":"eyJhbGc..."}
```

### 5. Akses phpMyAdmin (Optional)

Buka browser: **http://localhost:8080**
- Server: `mysql`
- Username: `root`
- Password: `*******`

---

## 📝 Langkah Detail Deployment

### Step 1: Persiapan Environment

Pastikan semua file `.env` di setiap service sudah di-update untuk Docker:

**Catatan**: Environment variables sudah di-set di `docker-compose.yml`, tapi jika Anda ingin override, edit file `.env` di masing-masing service folder.

```env
# Contoh .env untuk container (sudah ada di docker-compose.yml)
DB_HOST=mysql          # Bukan localhost!
DB_PORT=3306
DB_USER=root
DB_PASSWORD=*******
JWT_SECRET=FFbdqS6NVE7ARw08MNUAj0+sqXo7ZCEbZF7igEbMUH6tni78oAjzSPqYXvoyP02N
```

### Step 2: Build Images

```powershell
# Build semua images tanpa cache (fresh build)
docker-compose build --no-cache

# Atau build service tertentu
docker-compose build auth-service
```

### Step 3: Jalankan Stack

```powershell
# Jalankan semua services (detached mode)
docker-compose up -d

# Atau jalankan dengan logs visible
docker-compose up

# Jalankan service tertentu saja
docker-compose up -d mysql auth-service
```

### Step 4: Setup Database Schema

**Opsi A: Menggunakan Script (Recommended)**
```powershell
.\docker\setup-databases.ps1
```

**Opsi B: Manual per Service**
```powershell
# Auth Service
docker exec jelita-auth node scripts/setupDatabase.js
docker exec jelita-auth node scripts/createPemohonUser.js

# Pendaftaran Service
docker exec jelita-pendaftaran node scripts/setupDatabase.js

# Workflow Service
docker exec jelita-workflow node scripts/setupDatabase.js

# Survey Service
docker exec jelita-survey node scripts/setupDatabase.js

# Archive Service
docker exec jelita-archive node scripts/setupDatabase.js
```

### Step 5: Verifikasi Health

```powershell
# Cek health status semua containers
docker-compose ps

# Output yang sehat:
# NAME              STATUS                    PORTS
# jelita-auth       Up (healthy)              0.0.0.0:3001->3001/tcp
# jelita-archive    Up (healthy)              0.0.0.0:3040->3040/tcp
# ...

# Cek logs untuk errors
docker-compose logs --tail=50 auth-service
```

### Step 6: Test Konektivitas Antar Service

```powershell
# Test dari dalam container (network internal)
docker exec jelita-survey sh -c "wget -qO- http://archive-service:3040/health"

# Test dari host (localhost)
curl http://localhost:3001/health
curl http://localhost:3010/health
curl http://localhost:3020/health
curl http://localhost:3030/health
curl http://localhost:3040/health
```

---

## 🧪 Testing Interoperabilitas

### Tujuan
Membuktikan bahwa sistem microservices dapat berkomunikasi antar layanan (service-to-service) dan memenuhi alur bisnis end-to-end.

### Test Case 1: End-to-End Flow (Manual via Postman)

**Skenario**: Pemohon submit aplikasi → Workflow proses → Survey → Archive

1. **Login sebagai Admin**
   ```
   POST http://localhost:3001/api/auth/login
   Body: {"username":"demo","password":"*******"}
   ```
   Simpan `token` dari response.

2. **Submit Permohonan**
   ```
   POST http://localhost:3010/api/permohonan
   Headers: Authorization: Bearer {token}
   Body: {
     "nama_pemohon": "Test Docker",
     "jenis_izin": "IMB",
     "lokasi": "Jakarta"
   }
   ```
   Simpan `permohonan_id`.

3. **Trigger Workflow (Simulasi Approval)**
   ```
   POST http://localhost:3020/api/workflow/disposisi
   Headers: Authorization: Bearer {token}
   Body: {
     "permohonan_id": {permohonan_id},
     "catatan": "Disetujui"
   }
   ```

4. **Trigger Survey (SKM)**
   ```
   POST http://localhost:3030/api/internal/trigger-pengarsipan
   Headers: Content-Type: application/json
   Body: {
     "permohonan_id": {permohonan_id},
     "nomor_registrasi": "REG-001",
     "user_id": 4,
     "triggered_from": "survei"
   }
   ```
   ✅ **Expected**: Archive Service dipanggil secara internal.

5. **Verifikasi Archive Created**
   ```
   GET http://localhost:3040/api/arsip/1
   Headers: Authorization: Bearer {token}
   ```
   ✅ **Expected**: Data arsip tersimpan dengan status "pending".

### Test Case 2: Automated via Newman

```powershell
# Install Newman (jika belum)
npm install -g newman

# Jalankan collection Archive Service
newman run layanan-arsip/postman/Archive_Service.postman_collection.json `
  -e layanan-arsip/postman/Archive_Service.postman_environment.json `
  --reporters cli,json `
  --reporter-json-export reports/interop-test.json

# Cek hasil
cat reports/interop-test.json
```

**Kriteria Sukses Interoperabilitas:**
- ✅ Semua endpoint return status 200/201
- ✅ Token JWT valid di semua services
- ✅ Service-to-service call berhasil (Survey → Archive)
- ✅ Database entries konsisten (foreign keys, timestamps)

---

## ⚡ Testing Skalabilitas

### Tujuan
Mengukur kemampuan sistem untuk menangani load tinggi dan scaling horizontal.

### Persiapan Load Testing

**Install k6** (jika belum):
```powershell
# Windows (via Chocolatey)
choco install k6

# Atau download dari https://k6.io/docs/get-started/installation/
```

### Test Case 3: Baseline Performance (Light Load)

Buat file `tests/loadtest-baseline.js`:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '10s', target: 0 },   // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95) < 500'],  // 95% < 500ms
    'http_req_failed': ['rate < 0.01'],     // Error < 1%
  }
};

export default function() {
  // Login
  let loginRes = http.post('http://localhost:3001/api/auth/login', 
    JSON.stringify({username: 'demo', password: '*******'}),
    { headers: { 'Content-Type': 'application/json' }}
  );
  
  check(loginRes, {
    'login success': (r) => r.status === 200,
    'has token': (r) => r.json('token') !== undefined
  });

  sleep(1);
}
```

**Jalankan Test:**
```powershell
k6 run tests/loadtest-baseline.js
```

**Analisis Output:**
```
scenarios: (100.00%) 1 scenario, 10 max VUs, 1m40s max duration
     data_received..................: 1.2 MB 12 kB/s
     data_sent......................: 156 kB 1.6 kB/s
     http_req_duration..............: avg=45ms  p(95)=120ms
     http_req_failed................: 0.00%  ✓ 0  ✗ 600
     http_reqs......................: 600    6/s
```

✅ **Baseline Metrics Dicatat**: avg latency, p95, throughput (req/s)

### Test Case 4: Stress Test (Heavy Load)

Buat file `tests/loadtest-stress.js` dengan options:

```javascript
export let options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp to 50 users
    { duration: '3m', target: 100 },  // Ramp to 100 users
    { duration: '2m', target: 200 },  // Ramp to 200 users (stress)
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95) < 2000'],  // 95% < 2s
    'http_req_failed': ['rate < 0.05'],      // Error < 5%
  }
};
```

**Jalankan:**
```powershell
k6 run tests/loadtest-stress.js
```

**Observasi:**
- Apakah latency meningkat linear atau eksponensial?
- Pada titik mana error rate mulai naik?
- CPU/Memory usage container (lihat `docker stats`)

### Test Case 5: Scaling Horizontal (Multiple Instances)

**Scale Auth Service ke 3 instances:**

```powershell
# Edit docker-compose.yml (tambahkan deploy section atau gunakan --scale)
docker-compose up -d --scale auth-service=3

# Verifikasi
docker-compose ps auth-service
```

**⚠️ Catatan**: Untuk load balancing, Anda perlu tambahkan **nginx** atau **Traefik** sebagai reverse proxy. Contoh sederhana dengan nginx:

Buat `docker/nginx.conf`:
```nginx
upstream auth_backend {
    server auth-service:3001;
    # Jika scale, Docker Compose DNS round-robin otomatis
}

server {
    listen 80;
    location /api/auth/ {
        proxy_pass http://auth_backend;
    }
}
```

Tambahkan di `docker-compose.yml`:
```yaml
nginx:
  image: nginx:alpine
  volumes:
    - ./docker/nginx.conf:/etc/nginx/nginx.conf
  ports:
    - "80:80"
  depends_on:
    - auth-service
  networks:
    - jelita-network
```

**Jalankan load test lagi** dan bandingkan:
- Throughput meningkat?
- Latency p95 turun?
- Error rate tetap rendah?

### Test Case 6: Database Bottleneck

Jika performa buruk, cek MySQL:

```powershell
# Masuk ke MySQL container
docker exec -it jelita-mysql mysql -uroot -pEnter*123

# Cek slow queries
SHOW VARIABLES LIKE 'slow_query_log';
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;

# Lihat process list
SHOW FULL PROCESSLIST;
```

**Solusi**:
- Tambahkan indexing di kolom yang sering di-query
- Gunakan connection pooling (sudah ada di Sequelize)
- Scale MySQL (read replicas, sharding)

---

## 📊 Monitoring & Observability

### Quick Metrics dengan Docker Stats

```powershell
# Real-time resource usage
docker stats

# Output:
# CONTAINER       CPU %    MEM USAGE / LIMIT     NET I/O
# jelita-auth     2.5%     150MiB / 8GiB         1.2MB / 800kB
# jelita-mysql    8.3%     450MiB / 8GiB         5MB / 3MB
```

### Setup Prometheus + Grafana (Advanced)

Buat `docker-compose.observability.yml`:

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: jelita-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./docker/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - jelita-network

  grafana:
    image: grafana/grafana:latest
    container_name: jelita-grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - jelita-network

volumes:
  prometheus_data:
  grafana_data:

networks:
  jelita-network:
    external: true
```

Buat `docker/prometheus.yml`:
```yaml
scrape_configs:
  - job_name: 'nodejs-services'
    static_configs:
      - targets: 
        - 'auth-service:3001'
        - 'pendaftaran-service:3010'
        - 'workflow-service:3020'
        - 'survey-service:3030'
        - 'archive-service:3040'
```

**Jalankan**:
```powershell
docker-compose -f docker-compose.observability.yml up -d

# Akses Grafana: http://localhost:3000
# Login: admin / admin
```

---

## 🛠️ Troubleshooting

### Problem 1: Container Tidak Start

```powershell
# Cek logs
docker-compose logs auth-service

# Common issues:
# - Port sudah digunakan → ubah port mapping
# - Database belum ready → tunggu healthcheck
```

**Solusi**:
```powershell
# Stop semua
docker-compose down

# Hapus volume (reset DB)
docker-compose down -v

# Restart
docker-compose up -d --build
```

### Problem 2: Database Connection Failed

**Error**: `ECONNREFUSED mysql:3306`

**Solusi**:
```powershell
# Pastikan MySQL healthy
docker-compose ps mysql

# Tunggu beberapa detik untuk healthcheck
timeout 30

# Restart service yang error
docker-compose restart auth-service
```

### Problem 3: Service Cannot Communicate

**Error**: `getaddrinfo ENOTFOUND archive-service`

**Debugging**:
```powershell
# Exec ke container
docker exec -it jelita-survey sh

# Ping service lain
ping archive-service

# Cek DNS resolution
nslookup archive-service
```

**Solusi**: Pastikan semua container di network yang sama (`jelita-network`).

### Problem 4: High Memory Usage

```powershell
# Lihat usage detail
docker stats --no-stream

# Jika MySQL terlalu besar
docker exec jelita-mysql mysql -uroot -pEnter*123 -e "SHOW ENGINE INNODB STATUS\G" | grep "Buffer pool size"
```

**Solusi**: Set resource limits di `docker-compose.yml`:
```yaml
services:
  mysql:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
```

---

## 🔐 Security Best Practices (Production)

1. **Jangan hardcode credentials**:
   ```powershell
   # Gunakan Docker secrets atau .env file
   docker secret create mysql_root_password -
   ```

2. **Gunakan non-root user** di Dockerfile:
   ```dockerfile
   RUN addgroup -S appgroup && adduser -S appuser -G appgroup
   USER appuser
   ```

3. **Scan images untuk vulnerabilities**:
   ```powershell
   docker scan jelita-auth:latest
   ```

---

## 📈 Kriteria Keberhasilan Testing

### Interoperabilitas ✅
- [ ] Semua 5 services dapat berkomunikasi via Docker network
- [ ] JWT token valid di semua services
- [ ] End-to-end flow berhasil (Submit → Workflow → Survey → Archive)
- [ ] Service-to-service internal calls berhasil (tanpa token)
- [ ] Database foreign key relationships konsisten

### Skalabilitas ✅
- [ ] Baseline: 10 VUs → avg latency < 100ms, p95 < 500ms
- [ ] Stress: 200 VUs → p95 < 2s, error rate < 5%
- [ ] Horizontal scaling: 3 instances → throughput meningkat 2-3x
- [ ] Database tidak menjadi bottleneck (connection pool optimal)
- [ ] Memory/CPU usage stabil di bawah load

### Resilience ✅
- [ ] Service restart otomatis jika crash (restart: unless-stopped)
- [ ] Healthcheck deteksi service unhealthy dan restart
- [ ] Idempotency: duplicate request tidak duplikasi data
- [ ] Timeout dan retry mechanism berfungsi
- [ ] Graceful degradation saat satu service down

---

## 📚 Referensi & Next Steps

### Dokumentasi Terkait:
- `layanan-arsip/postman/QUICK_START.md` - Testing Archive Service
- `layanan-survei/TESTING_GUIDE.md` - Testing Survey Service
- Individual service `README.md` files

### Advanced Topics:
- **Kubernetes Deployment** - Untuk production scale
- **CI/CD Pipeline** - GitHub Actions untuk auto deploy
- **Distributed Tracing** - OpenTelemetry + Jaeger
- **API Gateway** - Kong/Traefik untuk centralized routing

### Perintah Berguna:

```powershell
# Start semua
docker-compose up -d

# Stop semua
docker-compose down

# Rebuild semua
docker-compose up -d --build --force-recreate

# Lihat logs semua services
docker-compose logs -f

# Hapus semua (termasuk volumes)
docker-compose down -v

# Exec ke container
docker exec -it jelita-auth sh

# Scale service
docker-compose up -d --scale auth-service=3
```

---

## 👨‍💻 Kontributor & Support

Dibuat untuk Tesis: **Transformasi Sistem Monolith ke Microservices**

Pertanyaan atau issues? Buka issue di repository atau hubungi maintainer.

---

**Selamat Testing! 🚀**
