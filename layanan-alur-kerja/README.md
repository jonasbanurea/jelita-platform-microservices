# Workflow Service

Service for managing internal workflow for permit application processing in the Jelita system.

## 📋 Description

Workflow Service is a microservice that manages internal workflow for permit application processing, including:

- **Disposition to OPD**: Admin assigns application to Regional Apparatus Organization
- **Technical Review**: OPD conducts technical review and provides recommendations
- **Permit Draft**: Admin creates permit letter draft and sends it to Leadership
- **Draft Revision**: Leadership requests revision to permit draft

## 🚀 Quick Start

### Prerequisites

- Node.js v14 or higher
- MySQL 8.0 or higher
- User & Auth Service running on port 3001
- Application Service running on port 3010

### Installation

```bash
# Clone repository
cd d:\KULIAH\TESIS\prototype_eng\layanan-alur-kerja

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env according to your database configuration

# Create database
node scripts/createDatabase.js

# Sync database schema
node scripts/setupDatabase.js

# Start server
npm start
```

Server will run at `http://localhost:3020`

## 📁 Project Structure

```
layanan-alur-kerja/
├── middleware/
│   └── authMiddleware.js       # JWT validation & role-based access
├── models/
│   ├── Disposisi.js            # Disposisi model
│   ├── KajianTeknis.js         # Kajian teknis model
│   ├── DraftIzin.js            # Draft izin model
│   └── RevisiDraft.js          # Revisi draft model
├── routes/
│   └── workflowRoutes.js       # API routes
├── scripts/
│   ├── createDatabase.js       # Database creation script
│   └── setupDatabase.js        # Table creation script
├── utils/
│   └── database.js             # Sequelize configuration
├── postman/
│   ├── Workflow_Service.postman_collection.json
│   ├── Workflow_Service.postman_environment.json
│   └── TESTING_GUIDE.md        # Comprehensive testing guide
├── .env                        # Environment configuration
├── package.json
├── server.js                   # Main application
└── README.md
```

## 🔌 API Endpoints

### 1. Create OPD Disposition
**POST** `/api/workflow/disposisi-opd`  
**Role**: Admin  
**Description**: Create disposition to assign application to OPD

**Request Body**:
```json
{
  "permohonan_id": 1,
  "nomor_registrasi": "REG/2024/01/0001",
  "opd_id": 2,
  "catatan_disposisi": "Please conduct technical review immediately"
}
```

### 2. Input Technical Review
**POST** `/api/workflow/kajian-teknis`  
**Role**: OPD  
**Description**: OPD inputs technical review results

**Request Body**:
```json
{
  "permohonan_id": 1,
  "opd_id": 2,
  "hasil_kajian": "disetujui",
  "rekomendasi": "Application approved with notes...",
  "catatan_teknis": "Location meets zoning requirements...",
  "lampiran": [
    {"nama_file": "survey.pdf", "url": "/uploads/survey.pdf"}
  ]
}
```

**`hasil_kajian` values**: `disetujui` | `ditolak` | `perlu_revisi`

### 3. Forward Draft to Leadership
**POST** `/api/workflow/forward-to-pimpinan`  
**Role**: Admin  
**Description**: Send permit draft to Leadership for review

**Request Body**:
```json
{
  "permohonan_id": 1,
  "nomor_registrasi": "REG/2024/01/0001",
  "nomor_draft": "DRAFT/2024/01/0001",
  "isi_draft": "REGIONAL HEAD DECISION..."
}
```

### 4. Request Draft Revision
**POST** `/api/workflow/revisi-draft`  
**Role**: Pimpinan  
**Description**: Leadership requests revision to permit draft

**Request Body**:
```json
{
  "draft_id": 1,
  "catatan_revisi": "Please revise the legal considerations section..."
}
```

### 5. Receive Trigger (Internal)
**POST** `/api/internal/receive-trigger`  
**Auth**: No auth required (internal)  
**Description**: Internal endpoint to receive triggers from Application Service

**Request Body**:
```json
{
  "permohonan_id": 1,
  "opd_id": 2
}
```

## 🔐 Authentication & Authorization

### JWT Token
All endpoints (except internal) require JWT token in header:
```
Authorization: Bearer <token>
```

Token obtained from User & Auth Service:
```http
POST http://localhost:3001/api/auth/signin
Content-Type: application/json

{
  "username": "demo",
  "password": "demo123"
}
```

### Role-Based Access Control

| Endpoint | Admin | OPD | Pimpinan |
|----------|-------|-----|----------|
| Create Disposisi | ✅ | ❌ | ❌ |
| Input Kajian Teknis | ❌ | ✅ | ❌ |
| Forward to Pimpinan | ✅ | ❌ | ❌ |
| Request Revisi | ❌ | ❌ | ✅ |

## 🗄️ Database Schema

### Table: `disposisi`
```sql
CREATE TABLE disposisi (
  id INT PRIMARY KEY AUTO_INCREMENT,
  permohonan_id INT NOT NULL,
  nomor_registrasi VARCHAR(255),
  opd_id INT NOT NULL,
  disposisi_dari INT NOT NULL,
  catatan_disposisi TEXT,
  status ENUM('pending', 'dikerjakan', 'selesai', 'ditolak'),
  tanggal_disposisi DATETIME,
  created_at DATETIME,
  updated_at DATETIME
);
```

### Table: `kajian_teknis`
```sql
CREATE TABLE kajian_teknis (
  id INT PRIMARY KEY AUTO_INCREMENT,
  permohonan_id INT NOT NULL,
  opd_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  hasil_kajian ENUM('disetujui', 'ditolak', 'perlu_revisi'),
  rekomendasi TEXT,
  catatan_teknis TEXT,
  lampiran JSON,
  tanggal_kajian DATETIME,
  created_at DATETIME,
  updated_at DATETIME
);
```

### Table: `draft_izin`
```sql
CREATE TABLE draft_izin (
  id INT PRIMARY KEY AUTO_INCREMENT,
  permohonan_id INT NOT NULL,
  nomor_registrasi VARCHAR(255),
  nomor_draft VARCHAR(255) UNIQUE,
  isi_draft TEXT,
  dibuat_oleh INT NOT NULL,
  status ENUM('draft', 'dikirim_ke_pimpinan', 'disetujui', 'perlu_revisi', 'ditolak'),
  tanggal_kirim_pimpinan DATETIME,
  disetujui_oleh INT,
  tanggal_persetujuan DATETIME,
  created_at DATETIME,
  updated_at DATETIME
);
```

### Table: `revisi_draft`
```sql
CREATE TABLE revisi_draft (
  id INT PRIMARY KEY AUTO_INCREMENT,
  draft_id INT NOT NULL,
  diminta_oleh INT NOT NULL,
  catatan_revisi TEXT,
  status ENUM('pending', 'dikerjakan', 'selesai'),
  tanggal_revisi DATETIME,
  diselesaikan_oleh INT,
  tanggal_selesai DATETIME,
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (draft_id) REFERENCES draft_izin(id)
);
```

## 🔄 Workflow Flow

```
1. Application Service triggers workflow
   ↓
2. Admin creates Disposition to OPD
   ↓
3. OPD performs Technical Review
   ↓
4. Admin creates Permit Draft
   ↓
5. Admin forwards Draft to Leadership
   ↓
6a. Leadership approves (DONE)
   OR
6b. Leadership requests revision → back to step 4
```

## 🧪 Testing

### Postman Collection
Import the following files to Postman:
- Collection: `postman/Workflow_Service.postman_collection.json`
- Environment: `postman/Workflow_Service.postman_environment.json`

### Testing Guide
Read complete documentation at: `postman/TESTING_GUIDE.md`

### Manual Testing
```bash
# Start server
npm start

# Test endpoint (use Postman or curl)
curl -X POST http://localhost:3020/api/workflow/disposisi-opd \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{"permohonan_id":1,"nomor_registrasi":"REG/2024/01/0001","opd_id":2,"catatan_disposisi":"Test"}'
```

## ⚙️ Configuration

### Environment Variables (.env)
```env
# Server Configuration
PORT=3020
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Enter*123
DB_NAME=jelita_workflow

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-1234567890abcdef
```

### Dependencies
```json
{
  "express": "^4.18.2",
  "sequelize": "^6.31.1",
  "mysql2": "^3.3.3",
  "dotenv": "^16.0.3",
  "jsonwebtoken": "^9.0.0",
  "axios": "^1.4.0"
}
```

## 🐛 Troubleshooting

### Server won't start
```bash
# Check port availability
netstat -ano | findstr :3020

# Kill process if exists
taskkill /PID <PID> /F
```

### Database connection error
```bash
# Verify MySQL is running
mysql -u root -p

# Check database exists
SHOW DATABASES LIKE 'jelita_workflow';

# Recreate if needed
node scripts/createDatabase.js
node scripts/setupDatabase.js
```

### Token validation error
- Ensure User & Auth Service is running on port 3001
- Ensure JWT_SECRET is the same as Auth Service
- Token expired? Login again to get new token

## 📚 Related Services

- **User & Auth Service**: `http://localhost:3001` - Authentication & user management
- **Application Service**: `http://localhost:3010` - Application submission & registration

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## 📄 License

MIT License

## 👤 Author

Jelita System - Integrated Licensing Service

---

