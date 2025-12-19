# Jelita Monolithic Architecture

## Deskripsi

Sistem Jelita versi **Monolithic Architecture** - sebuah aplikasi tunggal yang mengintegrasikan semua layanan (User Management, Application Registration, Workflow, Survey, dan Archive) dalam satu codebase dan satu proses runtime.

Sistem ini dibuat untuk **perbandingan langsung** dengan arsitektur microservices untuk penelitian/jurnal tentang performa, skalabilitas, dan kompleksitas deployment.

## Arsitektur Monolith

```
┌─────────────────────────────────────────────────┐
│         Jelita Monolithic Application           │
│                (Single Process)                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │   Authentication & User Management       │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │   Application/Registration Service       │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │   Workflow Management Service            │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │   Survey/SKM Service                     │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │   Archive Management Service             │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
└─────────────────────────────────────────────────┘
                      │
                      ▼
          ┌────────────────────┐
          │   MySQL Database   │
          │  (jelita_monolith) │
          └────────────────────┘
```

## Struktur Folder

```
jelita-monolith/
├── models/                    # Semua database models
│   ├── User.js
│   ├── Permohonan.js
│   ├── Dokumen.js
│   ├── Disposisi.js
│   ├── KajianTeknis.js
│   ├── DraftIzin.js
│   ├── SKM.js
│   └── Arsip.js
├── routes/                    # Semua API routes
│   ├── authRoutes.js
│   ├── permohonanRoutes.js
│   ├── workflowRoutes.js
│   ├── surveyRoutes.js
│   └── archiveRoutes.js
├── middleware/
│   └── authMiddleware.js
├── utils/
│   └── database.js
├── scripts/
│   ├── setupDatabase.js
│   └── createTestUsers.js
├── server.js                  # Main application entry point
├── package.json
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Fitur Lengkap

### 1. Authentication & User Management
- Sign in / Sign up
- JWT authentication
- Role-based access control (Pemohon, Admin, OPD, Pimpinan)
- Token validation

### 2. Application/Registration
- Create application
- Submit application
- Get application list
- Get application by ID
- Update application status

### 3. Workflow Management
- Create disposition (Admin → OPD)
- Submit technical review (OPD)
- Create draft permit (Admin)
- Send draft to leadership
- Approve/reject draft (Pimpinan)

### 4. Survey/SKM
- Create survey notification
- Submit survey response
- Check download access
- Get survey by user/application

### 5. Archive Management
- Archive approved documents
- Search archives
- Update access rights
- Retrieve archived documents

## Instalasi & Setup

### Prasyarat
- Node.js 18+
- MySQL 8.0
- Docker & Docker Compose (opsional)

### Setup Manual (Tanpa Docker)

1. **Install dependencies**
```bash
cd jelita-monolith
npm install
```

2. **Setup database**
```bash
# Buat database MySQL
mysql -u root -p
CREATE DATABASE jelita_monolith;
exit;
```

3. **Konfigurasi environment**
```bash
cp .env.example .env
# Edit .env dengan kredensial database Anda
```

4. **Setup database tables**
```bash
node scripts/setupDatabase.js
```

5. **Create test users**
```bash
node scripts/createTestUsers.js
```

6. **Jalankan aplikasi**
```bash
npm start
```

Aplikasi akan berjalan di: http://localhost:3000

### Setup dengan Docker

1. **Build dan jalankan**
```bash
cd jelita-monolith
docker-compose up -d
```

2. **Setup database (di dalam container)**
```bash
docker exec -it jelita-monolith-app node scripts/setupDatabase.js
docker exec -it jelita-monolith-app node scripts/createTestUsers.js
```

3. **Akses aplikasi**
- API: http://localhost:3000
- Health Check: http://localhost:3000/health

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Login
- `POST /api/auth/signup` - Register
- `GET /api/auth/validate` - Validate token

### Application
- `POST /api/permohonan` - Create application
- `GET /api/permohonan` - Get all applications
- `GET /api/permohonan/:id` - Get application by ID
- `POST /api/permohonan/:id/submit` - Submit application
- `PUT /api/permohonan/:id/status` - Update status

### Workflow
- `POST /api/disposisi` - Create disposition
- `GET /api/disposisi` - Get dispositions
- `POST /api/kajian-teknis` - Submit technical review
- `POST /api/draft-izin` - Create draft permit
- `PUT /api/draft-izin/:id/kirim` - Send to leadership
- `PUT /api/draft-izin/:id/setujui` - Approve draft

### Survey
- `POST /api/skm/notify` - Create survey notification
- `POST /api/skm/:id/submit` - Submit survey
- `GET /api/skm/user/:user_id` - Get surveys by user

### Archive
- `POST /api/arsip` - Create archive
- `GET /api/arsip` - Get all archives
- `GET /api/arsip/:id` - Get archive by ID

## Test Credentials

```
Pemohon:  pemohon1 / password123
Admin:    admin1 / password123
OPD:      opd1 / password123
Pimpinan: pimpinan1 / password123
```

## Karakteristik Monolith

### Kelebihan
✅ **Sederhana dalam development** - Semua kode dalam satu repository
✅ **Mudah di-deploy** - Hanya satu aplikasi yang perlu di-deploy
✅ **Debugging lebih mudah** - Stack trace lengkap dalam satu aplikasi
✅ **Testing lebih straightforward** - Tidak perlu mock inter-service calls
✅ **Transaction management** - ACID transactions lebih mudah
✅ **Latency rendah** - Tidak ada network overhead antar service

### Kekurangan
❌ **Scaling terbatas** - Harus scale seluruh aplikasi
❌ **Tight coupling** - Perubahan satu modul bisa affect modul lain
❌ **Deployment risk** - Bug di satu modul bisa crash seluruh aplikasi
❌ **Technology lock-in** - Semua modul harus pakai tech stack yang sama
❌ **Large codebase** - Semakin besar, semakin sulit di-maintain
❌ **Startup time** - Aplikasi besar = startup time lebih lama

## Perbandingan dengan Microservices

| Aspek | Monolith | Microservices |
|-------|----------|---------------|
| **Deployment** | 1 container/server | 5+ containers |
| **Database** | 1 database | 5 databases |
| **Complexity** | Low | High |
| **Scalability** | Vertical only | Horizontal per service |
| **Fault Isolation** | None | High |
| **Network Latency** | None (in-process) | High (HTTP calls) |
| **Memory Usage** | Lower | Higher (multiple processes) |
| **Development Speed** | Fast (initially) | Slow (initially) |

## Load Testing & Performance

Untuk melakukan load testing pada monolith:

```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery quick --count 100 --num 50 http://localhost:3000/api/permohonan
```

## Monitoring

### Health Check
```bash
curl http://localhost:3000/health
```

### Database Connections
```bash
# Check MySQL connections
docker exec jelita-mysql-monolith mysql -uroot -prootpassword -e "SHOW PROCESSLIST;"
```

### Docker Stats
```bash
docker stats jelita-monolith-app
```

## Troubleshooting

### Port sudah digunakan
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Database connection error
```bash
# Cek status MySQL
docker logs jelita-mysql-monolith

# Restart database
docker-compose restart mysql-monolith
```

## Development

### Menambah endpoint baru
1. Tambahkan route di file routes yang sesuai
2. Restart server
3. Test endpoint

### Menambah model baru
1. Buat file model di folder `models/`
2. Import di `scripts/setupDatabase.js`
3. Jalankan `node scripts/setupDatabase.js`

## Production Deployment

### Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Change JWT secret
- [ ] Setup proper database credentials
- [ ] Enable SSL/HTTPS
- [ ] Setup logging (Winston, Morgan)
- [ ] Configure rate limiting
- [ ] Setup monitoring (PM2, New Relic)
- [ ] Database backup strategy

## Lisensi

MIT License - Same as main Jelita project

## Kontak

Untuk pertanyaan atau issues, silakan buat issue di repository utama.
