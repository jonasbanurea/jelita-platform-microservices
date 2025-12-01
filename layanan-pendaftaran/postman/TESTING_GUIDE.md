# Testing Guide for Application Service with Postman

## Table of Contents
1. [Preparation](#preparation)
2. [Import Collection & Environment](#import-collection--environment)
3. [Workflow Testing](#workflow-testing)
4. [Testing Each Endpoint](#testing-each-endpoint)
5. [Troubleshooting](#troubleshooting)

---

## Preparation

### 1. Install Dependencies
```powershell
cd d:\KULIAH\TESIS\prototype_eng\layanan-pendaftaran
npm install
```

### 2. Database Configuration
Ensure MySQL database is running and adjust the `.env` file:

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

### 3. Create Database and Tables
```sql
CREATE DATABASE IF NOT EXISTS jelita_permohonan;
USE jelita_permohonan;

-- Table permohonan
CREATE TABLE IF NOT EXISTS permohonan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  nomor_registrasi VARCHAR(100) UNIQUE,
  status VARCHAR(50) NOT NULL,
  data_pemohon JSON NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table dokumen
CREATE TABLE IF NOT EXISTS dokumen (
  id INT AUTO_INCREMENT PRIMARY KEY,
  permohonan_id INT NOT NULL,
  jenis_dokumen VARCHAR(100) NOT NULL,
  nama_file VARCHAR(255) NOT NULL,
  path_file VARCHAR(500) NOT NULL,
  ukuran_file INT NOT NULL,
  status_verifikasi ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  catatan_verifikasi TEXT,
  verified_by INT,
  verified_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (permohonan_id) REFERENCES permohonan(id) ON DELETE CASCADE
);
```

### 4. Run Server
```powershell
cd d:\KULIAH\TESIS\prototype_eng\layanan-pendaftaran
node server.js
```

Ensure the message appears: `Application Service is running on port 3010`

---

## Import Collection & Environment

### Import Files
1. Open Postman
2. Click **Import**
3. Select both files:
   - `postman/Application_Service.postman_collection.json`
   - `postman/Application_Service.postman_environment.json`
4. Click **Import**

### Activate Environment
1. Click Environment dropdown (top right)
2. Select **Application Service - Development**

---

## Workflow Testing

### Complete Scenario (Happy Path)

```mermaid
graph TD
    A[1. Login to User Service] --> B[2. Create Application]
    B --> C[3. Upload Dokumen]
    C --> D[4. Verify Dokumen Admin/OPD]
    D --> E{Dokumen Valid?}
    E -->|No| F[5. Send Correction Notification]
    F --> C
    E -->|Yes| G[6. Finalize & Register]
    G --> H[7. Generate Tanda Terima]
    H --> I[8. Trigger Workflow]
```

### Step-by-Step Testing Flow

**IMPORTANT:** Run endpoints in this order:

1. **Prerequisite**: Login to User Service (port 3005/3001)
   - Endpoint: `POST /api/auth/signin`
   - Obtain token and save to environment variable

2. Create New Application (Applicant)
3. Upload Document (Applicant)
4. Verify Document (Admin/OPD)
5. (Optional) Send Correction Notification if there are issues
6. Finalize & Register (Admin/OPD)
7. Generate PDF Receipt
8. Trigger Workflow Service
9. Check Application Status (anytime)

---

## Testing Each Endpoint

### Prerequisite: Obtaining Token

**IMPORTANT**: Before testing, you must obtain a token from **User & Auth Service**.

#### Method 1: Using Postman Collection User Service
```powershell
# Run User Service on different port
cd d:\KULIAH\TESIS\prototype_eng\layanan-manajemen-pengguna
$env:PORT=3001; node server.js
```

Then in Postman:
- Import collection User Auth Service
- Run **Sign In** with credentials: `demo / demo123`
- Token will be automatically saved to `AUTH_HEADER`

#### Method 2: Manual with PowerShell
```powershell
$body = @{ username='demo'; password='demo123' } | ConvertTo-Json
$response = Invoke-RestMethod -Method Post -Uri http://localhost:3001/api/auth/signin -Body $body -ContentType 'application/json'
$token = "Bearer " + $response.accessToken
Write-Host $token
```

Copy token and paste to environment variable `AUTH_HEADER`.

---

### 1. POST /api/permohonan - Create New Application

**Role:** Applicant (authenticated user)

**Request:**
```json
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

**Headers:**
- `Authorization`: `{{AUTH_HEADER}}`
- `Content-Type`: `application/json`

**Expected Response (201 Created):**
```json
{
    "message": "Application created successfully",
    "data": {
        "id": 1,
        "user_id": 1,
        "nomor_registrasi": null,
        "status": "draft",
        "data_pemohon": {
            "nama": "John Doe",
            "alamat": "Jl. Merdeka No. 123",
            ...
        },
        "created_at": "2025-11-11T10:00:00.000Z",
        "updated_at": "2025-11-11T10:00:00.000Z"
    }
}
```

**Auto-save:** `PERMOHONAN_ID` automatically saved to environment

---

### 2. PUT /api/permohonan/:id - Update Application

**Role:** Applicant (owner) or Admin/OPD

**URL:** `{{BASE_URL}}/api/permohonan/{{PERMOHONAN_ID}}`

**Request:**
```json
{
    "data_pemohon": {
        "nama": "John Doe Updated",
        "alamat": "Jl. Merdeka No. 123 (Revised)",
        "telepon": "081234567890",
        "email": "john.updated@example.com",
        "jenis_izin": "Izin Mendirikan Bangunan",
        "lokasi_izin": "Jl. Sudirman No. 45"
    }
}
```

**Expected Response (200 OK):**
```json
{
    "message": "Application updated successfully",
    "data": {
        "id": 1,
        "user_id": 1,
        "data_pemohon": { ... },
        "updated_at": "2025-11-11T10:05:00.000Z"
    }
}
```

**Access Control:**
- Owner can update their own application
- Admin/OPD can update all applications

---

### 3. POST /api/permohonan/:id/dokumen - Upload Document

**Role:** Pemohon (owner)

**URL:** `{{BASE_URL}}/api/permohonan/{{PERMOHONAN_ID}}/dokumen`

**Request Type:** `form-data`

**Form Data:**
- `file`: (Select file) - Image/PDF/DOC max 5MB
- `jenis_dokumen`: `KTP` (text)

**Headers:**
- `Authorization`: `{{AUTH_HEADER}}`

**Expected Response (201 Created):**
```json
{
    "message": "Document uploaded successfully",
    "data": {
        "id": 1,
        "permohonan_id": 1,
        "jenis_dokumen": "KTP",
        "nama_file": "ktp-scan.pdf",
        "path_file": "./uploads/file-1234567890-123456789.pdf",
        "ukuran_file": 245678,
        "status_verifikasi": "pending",
        "catatan_verifikasi": null,
        "verified_by": null,
        "verified_at": null
    }
}
```

**File Types Allowed:**
- Images: `.jpeg`, `.jpg`, `.png`
- Documents: `.pdf`, `.doc`, `.docx`

**Auto-save:** `DOKUMEN_ID` automatically saved

**How to Upload in Postman:**
1. Select tab **Body**
2. Select **form-data**
3. Key: `file`, Type: **File**, Value: [Select Files]
4. Key: `jenis_dokumen`, Type: **Text**, Value: `KTP`
5. Click **Send**

---

### 4. POST /api/dokumen/:id/verifikasi - Verify Document

**Role:** Admin or OPD only

**URL:** `{{BASE_URL}}/api/dokumen/{{DOKUMEN_ID}}/verifikasi`

**Request:**
```json
{
    "status_verifikasi": "verified",
    "catatan_verifikasi": "Dokumen lengkap dan sesuai"
}
```

**Status Options:**
- `verified` - Dokumen diterima
- `rejected` - Dokumen ditolak

**Expected Response (200 OK):**
```json
{
    "message": "Document verified successfully",
    "data": {
        "id": 1,
        "status_verifikasi": "verified",
        "catatan_verifikasi": "Documents are complete and appropriate",
        "verified_by": 2,
        "verified_at": "2025-11-11T10:10:00.000Z"
    }
}
```

**Note:** If role is not Admin/OPD, will return **403 Forbidden**

---

### 5. POST /api/permohonan/:id/notifikasi-perbaikan - Send Correction Notification

**Role:** Admin or OPD only

**URL:** `{{BASE_URL}}/api/permohonan/{{PERMOHONAN_ID}}/notifikasi-perbaikan`

**Request:**
```json
{
    "pesan": "Your application requires corrections",
    "catatan": "Please complete KTP document and Power of Attorney"
}
```

**Expected Response (200 OK):**
```json
{
    "message": "Notification sent successfully",
    "data": {
        "permohonan_id": 1,
        "user_id": 1,
        "pesan": "Your application requires corrections",
        "catatan": "Please complete KTP document and Power of Attorney",
        "dikirim_oleh": 2,
        "tanggal_kirim": "2025-11-11T10:15:00.000Z"
    }
}
```

**Side Effect:**
- Application status changes to `perlu_perbaikan`
- In real implementation, will send email/SMS to applicant

---

### 6. POST /api/permohonan/:id/registrasi - Finalize & Register

**Role:** Admin or OPD only

**URL:** `{{BASE_URL}}/api/permohonan/{{PERMOHONAN_ID}}/registrasi`

**Request:** (No body required)

**Expected Response (200 OK):**
```json
{
    "message": "Application registered successfully",
    "data": {
        "id": 1,
        "nomor_registrasi": "REG/2025/11/0123",
        "status": "terdaftar"
    }
}
```

**Registration Number Format:** `REG/YYYY/MM/XXXX`
- YYYY = Year
- MM = Month (01-12)
- XXXX = Random 4-digit number

**Auto-save:** `NOMOR_REGISTRASI` automatically saved

**Note:**
- Can only be done once per application
- If already registered, will return error

---

### 7. GET /api/permohonan/:id/tanda-terima - Generate PDF Receipt

**Role:** Applicant (owner) or Admin/OPD

**URL:** `{{BASE_URL}}/api/permohonan/{{PERMOHONAN_ID}}/tanda-terima`

**Request:** (No body, GET request)

**Headers:**
- `Authorization`: `{{AUTH_HEADER}}`

**Expected Response:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename=tanda-terima-REG-2025-11-0123.pdf`
- Binary PDF data

**How to Test in Postman:**
1. Click **Send**
2. Response will display PDF preview
3. Click **Save Response** → **Save to a file** to download

**How to Test via Browser:**
```
http://localhost:3010/api/permohonan/1/tanda-terima?token=YOUR_JWT_TOKEN
```

**Note:** Application must already have `nomor_registrasi` (already finalized)

---

### 8. GET /api/permohonan/:id/status - Get Application Status

**Role:** Applicant (owner) or Admin/OPD/Leadership

**URL:** `{{BASE_URL}}/api/permohonan/{{PERMOHONAN_ID}}/status`

**Request:** (No body, GET request)

**Expected Response (200 OK):**
```json
{
    "message": "Status retrieved successfully",
    "data": {
        "id": 1,
        "nomor_registrasi": "REG/2025/11/0123",
        "status": "terdaftar",
        "created_at": "2025-11-11T10:00:00.000Z",
        "updated_at": "2025-11-11T10:20:00.000Z"
    }
}
```

**Status Values:**
- `draft` - Newly created, not yet complete
- `perlu_perbaikan` - Requires revision from applicant
- `menunggu_verifikasi` - Documents in verification process
- `terdaftar` - Already finalized and received registration number
- `diproses` - In technical workflow process
- `selesai` - Process completed

---

### 9. POST /api/internal/trigger-workflow - Trigger Workflow Service

**Role:** Internal service (no auth required for internal endpoint)

**URL:** `{{BASE_URL}}/api/internal/trigger-workflow`

**Request:**
```json
{
    "permohonan_id": 1
}
```

**Expected Response (200 OK):**
```json
{
    "message": "Workflow triggered successfully",
    "workflow_data": {
        "workflow_id": "WF-001",
        "status": "initiated",
        "message": "Technical review workflow started"
    }
}
```

**Note:**
- This endpoint is for inter-microservice communication
- Will call Workflow Service at `http://localhost:3020`
- If Workflow Service is not running, will return error

---

## Troubleshooting

### Problem: 401 Unauthorized - No token provided
**Solution:**
- Ensure you have logged in to User Service first
- Copy token from signin response
- Paste to environment variable `AUTH_HEADER` with format: `Bearer <token>`

### Problem: 403 Forbidden - Access denied
**Solution:**
- Endpoint requires specific role (Admin/OPD)
- Login with user who has Admin or OPD role
- Check JWT payload to ensure role is correct

### Problem: 404 Not Found - Application not found
**Solution:**
- Ensure `PERMOHONAN_ID` is set in environment variable
- Check if application with that ID exists in database
- Create new application if it doesn't exist yet

### Problem: 400 Bad Request - File upload error
**Solution:**
- Ensure file size does not exceed 5MB
- File type must be: jpeg, jpg, png, pdf, doc, docx
- In Postman, select body type **form-data** not **raw**
- Key must be named `file` and type must be **File**

### Problem: 500 Internal Server Error - Database connection
**Solution:**
- Check if MySQL service is running
- Verify credentials in `.env` file
- Ensure database `jelita_permohonan` has been created
- Run SQL script to create tables

### Problem: Cannot generate PDF - No nomor_registrasi
**Solution:**
- Application must be finalized first
- Run endpoint **Finalize & Register** first
- Ensure status is already `terdaftar`

### Problem: File upload folder not found
**Solution:**
```powershell
cd d:\KULIAH\TESIS\prototype_eng\layanan-pendaftaran
mkdir uploads
```

---

## Testing Scenarios

### Scenario 1: Complete Happy Path
```
1. Login (User Service) ✓
2. Create Permohonan ✓
3. Upload KTP ✓
4. Upload Surat Kuasa ✓
5. Verify Documents (Admin) ✓
6. Finalize & Register (Admin) ✓
7. Generate PDF Receipt ✓
8. Check Status ✓
9. Trigger Workflow ✓
```

### Scenario 2: Revision Flow
```
1. Create Application ✓
2. Upload incomplete documents ✓
3. Admin sends correction notification ✓
4. Status changes to 'perlu_perbaikan' ✓
5. Applicant updates data ✓
6. Applicant uploads corrected documents ✓
7. Admin verifies again ✓
8. Proceed to registration ✓
```

### Scenario 3: Document Rejection
```
1. Upload document ✓
2. Admin rejects with reason ✓
3. Check document status = 'rejected' ✓
4. Upload new document ✓
5. Admin verifies new document ✓
```

---

## Environment Variables Reference

| Variable | Auto-Saved | Description |
|----------|------------|-------------|
| `BASE_URL` | No | Application service URL (default: http://localhost:3010) |
| `AUTH_HEADER` | No (manual) | Bearer token from User Service |
| `TOKEN` | No (manual) | Raw JWT token |
| `PERMOHONAN_ID` | Yes | Auto-saved after creating application |
| `DOKUMEN_ID` | Yes | Auto-saved after uploading document |
| `NOMOR_REGISTRASI` | Yes | Auto-saved after registration |

---

## API Summary

| Endpoint | Method | Auth | Role | Description |
|----------|--------|------|------|-------------|
| `/api/permohonan` | POST | ✓ | Any | Create application |
| `/api/permohonan/:id` | PUT | ✓ | Owner/Admin/OPD | Update application |
| `/api/permohonan/:id/dokumen` | POST | ✓ | Owner | Upload document |
| `/api/dokumen/:id/verifikasi` | POST | ✓ | Admin/OPD | Verify document |
| `/api/permohonan/:id/notifikasi-perbaikan` | POST | ✓ | Admin/OPD | Send notification |
| `/api/permohonan/:id/registrasi` | POST | ✓ | Admin/OPD | Finalize & register |
| `/api/permohonan/:id/tanda-terima` | GET | ✓ | Owner/Admin/OPD | Generate PDF |
| `/api/permohonan/:id/status` | GET | ✓ | Owner/Admin/OPD/Pimpinan | Get status |
| `/api/internal/trigger-workflow` | POST | ✗ | Internal | Trigger workflow |

---

**Last Updated:** November 11, 2025
**Version:** 1.0.0
