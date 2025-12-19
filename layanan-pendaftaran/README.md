# Application Service - Quick Start Guide

## ✅ Setup Complete!

Application Service is ready to use with 9 complete endpoints.

---

## 🚀 How to Run

### 1. Install Dependencies (One time only)
```powershell
cd d:\KULIAH\TESIS\prototype_eng\layanan-pendaftaran
npm install
```

### 2. Setup Database (One time only)
```powershell
node scripts/createDatabase.js
node scripts/setupDatabase.js
```

### 3. Start Server
```powershell
node server.js
```

Server will run on: **http://localhost:3010**

---

## 📦 Postman Testing

### Import Collection
1. Open Postman
2. Import files from `postman/` folder:
   - `Application_Service.postman_collection.json`
   - `Application_Service.postman_environment.json`
3. Select environment: **Application Service - Development**

### Getting Token
**IMPORTANT:** Before testing, get token from User Service:

```powershell
# Run User Service in separate terminal
cd d:\KULIAH\TESIS\prototype_eng\layanan-manajemen-pengguna
$env:PORT=3001; node server.js
```

Then in Postman:
1. Import User Auth Service collection
2. Run **Sign In** (username: `demo`, password: `demo123`)
3. Token automatically saved to `AUTH_HEADER`

---

## 🧪 Testing Flow 

### Recommended Testing Sequence:

```
1. Login to User Service ✓
   ↓
2. POST /api/permohonan (Create)
   ↓
3. POST /api/permohonan/:id/dokumen (Upload KTP)
   ↓
4. POST /api/permohonan/:id/dokumen (Upload Power of Attorney)
   ↓
5. POST /api/dokumen/:id/verifikasi (Verify - Admin/OPD)
   ↓
6. POST /api/permohonan/:id/registrasi (Finalize - Admin/OPD)
   ↓
7. GET /api/permohonan/:id/tanda-terima (Generate PDF)
   ↓
8. GET /api/permohonan/:id/status (Check Status)
   ↓
9. POST /api/internal/trigger-workflow (Trigger Workflow)
```

---

## 📋 Endpoint Summary

| # | Endpoint | Method | Auth | Role | Description |
|---|----------|--------|------|------|-------------|
| 1 | `/api/permohonan` | POST | ✓ | Any | Create new application |
| 2 | `/api/permohonan/:id` | PUT | ✓ | Owner/Admin/OPD | Update application data |
| 3 | `/api/permohonan/:id/dokumen` | POST | ✓ | Owner | Upload document (max 5MB) |
| 4 | `/api/dokumen/:id/verifikasi` | POST | ✓ | Admin/OPD | Verify document |
| 5 | `/api/permohonan/:id/notifikasi-perbaikan` | POST | ✓ | Admin/OPD | Send correction notification |
| 6 | `/api/permohonan/:id/registrasi` | POST | ✓ | Admin/OPD | Finalize & create registration number |
| 7 | `/api/permohonan/:id/tanda-terima` | GET | ✓ | Owner/Admin/OPD | Generate PDF receipt |
| 8 | `/api/permohonan/:id/status` | GET | ✓ | Owner/Admin/OPD/Pimpinan | Check application status |
| 9 | `/api/internal/trigger-workflow` | POST | ✗ | Internal | Trigger workflow service |

---

## 📁 Struktur File

```
layanan-pendaftaran/
├── server.js                    # Main server
├── package.json                 # Dependencies
├── .env                         # Configuration
├── models/
│   ├── Permohonan.js           # Permohonan model
│   └── Dokumen.js              # Dokumen model
├── routes/
│   └── permohonanRoutes.js     # All 9 endpoints
├── middleware/
│   └── authMiddleware.js       # JWT validation & role check
├── utils/
│   └── database.js             # Sequelize config
├── scripts/
│   ├── createDatabase.js       # Create DB
│   └── setupDatabase.js        # Create tables
└── postman/
    ├── Application_Service.postman_collection.json
    ├── Application_Service.postman_environment.json
    └── TESTING_GUIDE.md        # Complete testing guide
└── uploads/                     # File upload folder (auto-created)
```

---

## 🔑 Environment Variables

`.env` file is already configured with:

```properties
PORT=3010
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Enter*123
DB_NAME=jelita_permohonan
JWT_SECRET=FFbdqS6NVE7ARw08MNUAj0+sqXo7ZCEbZF7igEbMUH6tni78oAjzSPqYXvoyP02N
WORKFLOW_SERVICE_URL=http://localhost:3020
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

---

## 🎯 Example Request

### Create Application
```json
POST http://localhost:3010/api/permohonan
Authorization: Bearer YOUR_TOKEN

{
    "data_pemohon": {
        "nama": "John Doe",
        "alamat": "Jl. Merdeka No. 123",
        "telepon": "081234567890",
        "email": "john@example.com",
        "jenis_izin": "Izin Mendirikan Bangunan",
        "lokasi_izin": "Jl. Sudirman No. 45"
    }
}
```

### Upload Document
```
POST http://localhost:3010/api/permohonan/1/dokumen
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

file: [Select your file]
jenis_dokumen: KTP
```

---

## 🐛 Common Issues

### 1. "401 Unauthorized - No token provided"
- Ensure you've logged in to User Service
- Copy token to environment variable `AUTH_HEADER`

### 2. "403 Forbidden - Access denied"
- Endpoint requires Admin/OPD role
- Login with Admin or OPD user

### 3. "File upload error"
- Max file size: 5MB
- Allowed types: jpeg, jpg, png, pdf, doc, docx
- Use body type `form-data` not `raw`

### 4. "Cannot generate PDF - No nomor_registrasi"
- Application must be finalized first
- Run "Finalize & Register" endpoint first

---

## 📖 Complete Documentation

See `postman/TESTING_GUIDE.md` file for:
- Detailed explanation of each endpoint
- Expected request & response
- Complete testing scenarios
- Troubleshooting guide
- API reference

---

## 🔄 Application Status

| Status | Description |
|--------|-----------||
| `draft` | Newly created, not complete |
| `perlu_perbaikan` | Needs revision from applicant |
| `menunggu_verifikasi` | Document under verification process |
| `terdaftar` | Already finalized and got registration number |
| `diproses` | In technical workflow process |
| `selesai` | Process completed |

---

## 🎉 Ready to Test!

Server is running on **http://localhost:3010**

Use Postman to test all endpoints. 

