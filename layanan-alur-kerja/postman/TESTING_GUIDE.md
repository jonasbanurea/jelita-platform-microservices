# Testing Guide - Workflow Service

## 📋 Table of Contents
1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Workflow Architecture](#workflow-architecture)
5. [Endpoint Overview](#endpoint-overview)
6. [Step-by-Step Testing](#step-by-step-testing)
7. [Roles & Permissions](#roles--permissions)
8. [Troubleshooting](#troubleshooting)

---

## 1. Introduction

### 1.1 About Workflow Service
Workflow Service is a microservice that manages the **internal workflow** for permit application processing in the Jelita system. This service handles:

- **Disposition**: Assigning applications to OPD (Regional Apparatus Organization)
- **Technical Review**: Technical review by OPD
- **Permit Draft**: Creating and sending permit draft to Leadership
- **Draft Revision**: Revision requests from Leadership

### 1.2 Port & Database
- **Port**: 3020
- **Database**: `jelita_workflow`
- **Base URL**: `http://localhost:3020`

### 1.3 Integration with Other Services
```
┌─────────────────────┐       ┌─────────────────────┐       ┌─────────────────────┐
│  User & Auth        │       │  Application        │       │  Workflow           │
│  Service (3001)     │◄──────┤  Service (3010)     │◄──────┤  Service (3020)     │
│                     │       │                     │       │                     │
│  - JWT Generation   │       │  - Application       │       │  - Disposition        │
│  - User Validation  │       │  - Registration       │       │  - Technical Review    │
│                     │       │  - Trigger Workflow │       │  - Permit Draft       │
└─────────────────────┘       └─────────────────────┘       └─────────────────────┘
```

---

## 2. Prerequisites

### 2.1 Software Requirements
✅ Node.js v14+ installed  
✅ MySQL Server 8.0+ running  
✅ Postman Desktop App or Postman Web  
✅ User & Auth Service (Port 3001) running  
✅ Application Service (Port 3010) running  

### 2.2 Test Data Requirements
Ensure you have:
- ✅ User with role **Admin** (username: `demo`, password: `demo123`)
- ✅ User with role **OPD** (for testing technical review)
- ✅ User with role **Pimpinan** (for testing draft revision)
- ✅ At least 1 registered application from Application Service

### 2.3 Database Setup
```bash
# Navigate to layanan-alur-kerja directory
cd d:\KULIAH\TESIS\prototype_eng\layanan-alur-kerja

# Install dependencies
npm install

# Create database
node scripts/createDatabase.js

# Sync models (create tables)
node scripts/setupDatabase.js
```

**Expected Output**:
```
✓ Database connection has been established successfully.
✓ All models were synchronized successfully.

✓ Tables in database:
  1. disposisi
  2. kajian_teknis
  3. draft_izin
  4. revisi_draft

✓ Database setup completed!
```

---

## 3. Environment Setup

### 3.1 Import Collection & Environment to Postman

**Step 1: Import Collection**
1. Open Postman
2. Click **Import** (top left)
3. Drag & drop file: `postman/Workflow_Service.postman_collection.json`
4. Click **Import**

**Step 2: Import Environment**
1. Click **Import** again
2. Drag & drop file: `postman/Workflow_Service.postman_environment.json`
3. Click **Import**

**Step 3: Activate Environment**
1. Select dropdown at top right (No Environment)
2. Select **"Workflow Service Environment"**

### 3.2 Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `workflow_base_url` | `http://localhost:3020` | Base URL Workflow Service |
| `auth_base_url` | `http://localhost:3001` | Base URL Auth Service |
| `application_base_url` | `http://localhost:3010` | Base URL Application Service |
| `accessToken` | (auto-saved) | JWT token from login |
| `admin_username` | `demo` | Username for Admin |
| `admin_password` | `demo123` | Password for Admin |
| `permohonan_id` | (manual/auto) | Application ID from Application Service |
| `opd_user_id` | (manual) | User ID with OPD role |
| `disposisi_id` | (auto-saved) | ID of created disposition |
| `kajian_id` | (auto-saved) | ID of created technical review |
| `draft_id` | (auto-saved) | ID of created permit draft |
| `revisi_id` | (auto-saved) | ID of created revision |

---

## 4. Workflow Architecture

### 4.1 Workflow Diagram

```
┌──────────────┐
│  Application  │
│  Registered   │
│              │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  1. OPD DISPOSITION    │  ◄─── Admin creates disposition
│  (Admin)             │       to specific OPD
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  2. TECHNICAL REVIEW    │  ◄─── OPD conducts review
│  (OPD)               │       (approved/rejected/
└──────┬───────────────┘       needs_revision)
       │
       ▼
┌──────────────────────┐
│  3. PERMIT DRAFT       │  ◄─── Admin creates draft
│  (Admin)             │       & sends to Leadership
└──────┬───────────────┘
       │
       ├─────────────────────┐
       │                     │
       ▼                     ▼
┌──────────────┐      ┌─────────────────┐
│  DISETUJUI   │      │  4. REVISI      │  ◄─── Pimpinan minta
│  (Pimpinan)  │      │  (Pimpinan)     │       revisi draft
└──────────────┘      └─────┬───────────┘
                            │
                            ▼
                      ┌──────────────────┐
                      │  Admin perbaiki  │
                      │  draft (loop ke  │
                      │  step 3)         │
                      └──────────────────┘
```

### 4.2 Database Schema

**Table: `disposisi`**
```sql
CREATE TABLE disposisi (
  id INT PRIMARY KEY AUTO_INCREMENT,
  permohonan_id INT NOT NULL,
  nomor_registrasi VARCHAR(255),
  opd_id INT NOT NULL COMMENT 'User ID with OPD role',
  disposisi_dari INT NOT NULL COMMENT 'Admin User ID who created',
  catatan_disposisi TEXT,
  status ENUM('pending', 'dikerjakan', 'selesai', 'ditolak') DEFAULT 'pending',
  tanggal_disposisi DATETIME,
  created_at DATETIME,
  updated_at DATETIME
);
```

**Table: `kajian_teknis`**
```sql
CREATE TABLE kajian_teknis (
  id INT PRIMARY KEY AUTO_INCREMENT,
  permohonan_id INT NOT NULL,
  opd_id INT NOT NULL,
  reviewer_id INT NOT NULL COMMENT 'User ID of OPD reviewer',
  hasil_kajian ENUM('disetujui', 'ditolak', 'perlu_revisi'),
  rekomendasi TEXT,
  catatan_teknis TEXT,
  lampiran JSON COMMENT 'Array of attachment objects',
  tanggal_kajian DATETIME,
  created_at DATETIME,
  updated_at DATETIME
);
```

**Table: `draft_izin`**
```sql
CREATE TABLE draft_izin (
  id INT PRIMARY KEY AUTO_INCREMENT,
  permohonan_id INT NOT NULL,
  nomor_registrasi VARCHAR(255),
  nomor_draft VARCHAR(255) UNIQUE NOT NULL,
  isi_draft TEXT NOT NULL,
  dibuat_oleh INT NOT NULL COMMENT 'Admin User ID',
  status ENUM('draft', 'dikirim_ke_pimpinan', 'disetujui', 'perlu_revisi', 'ditolak') 
    DEFAULT 'draft',
  tanggal_kirim_pimpinan DATETIME,
  disetujui_oleh INT COMMENT 'User ID Pimpinan',
  tanggal_persetujuan DATETIME,
  created_at DATETIME,
  updated_at DATETIME
);
```

**Table: `revisi_draft`**
```sql
CREATE TABLE revisi_draft (
  id INT PRIMARY KEY AUTO_INCREMENT,
  draft_id INT NOT NULL REFERENCES draft_izin(id),
  diminta_oleh INT NOT NULL COMMENT 'User ID Pimpinan',
  catatan_revisi TEXT NOT NULL,
  status ENUM('pending', 'dikerjakan', 'selesai') DEFAULT 'pending',
  tanggal_revisi DATETIME DEFAULT CURRENT_TIMESTAMP,
  diselesaikan_oleh INT COMMENT 'User ID Admin',
  tanggal_selesai DATETIME,
  created_at DATETIME,
  updated_at DATETIME
);
```

---

## 5. Endpoint Overview

### 5.1 Summary Table

| # | Endpoint | Method | Role | Description |
|---|----------|--------|------|-------------|
| 1 | `/api/workflow/disposisi-opd` | POST | Admin | Create disposition to OPD |
| 2 | `/api/workflow/kajian-teknis` | POST | OPD | Input technical review results |
| 3 | `/api/workflow/forward-to-pimpinan` | POST | Admin | Send draft to Leadership |
| 4 | `/api/workflow/revisi-draft` | POST | Pimpinan | Request draft revision |
| 5 | `/api/internal/receive-trigger` | POST | Internal | Receive trigger from App Service |

### 5.2 Authentication
All endpoints (except #5) use JWT **Bearer Token** in header:
```
Authorization: Bearer <accessToken>
```

Token is obtained from endpoint `/api/auth/signin` in User & Auth Service (Port 3001).

---

## 6. Testing Step-by-Step

### 6.1 Preparation: Login & Get Token

**Step 1: Start All Services**
```bash
# Terminal 1 - Auth Service
cd d:\KULIAH\TESIS\prototype\layanan-manajemen-pengguna
npm start

# Terminal 2 - Application Service
cd d:\KULIAH\TESIS\prototype\layanan-pendaftaran
npm start

# Terminal 3 - Workflow Service
cd d:\KULIAH\TESIS\prototype\layanan-alur-kerja
npm start
```

**Step 2: Login as Admin**

Use the **User & Auth Service** collection in Postman:
- Request: `POST {{auth_base_url}}/api/auth/signin`
- Body:
```json
{
  "username": "demo",
  "password": "demo123"
}
```

**Expected Response** (200 OK):
```json
{
  "id": 1,
  "username": "demo",
  "nama_lengkap": "Demo Admin",
  "role": "Admin",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

✅ Token will be automatically saved to environment variable `accessToken`.

---

### 6.2 Test 1: Create Disposisi OPD

**Objective**: Admin assigns application to OPD for technical review.

**Prerequisites**:
- ✅ Login as Admin (token saved)
- ✅ Have `permohonan_id` from Application Service
- ✅ Have `opd_user_id` (user ID with OPD role)

**Request**:
```http
POST http://localhost:3020/api/workflow/disposisi-opd
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "permohonan_id": 1,
  "nomor_registrasi": "REG/2024/01/0001",
  "opd_id": 2,
  "catatan_disposisi": "Please conduct technical review for this application immediately"
}
```

**Expected Response** (201 Created):
```json
{
  "message": "OPD disposition created successfully",
  "data": {
    "id": 1,
    "permohonan_id": 1,
    "nomor_registrasi": "REG/2024/01/0001",
    "opd_id": 2,
    "disposisi_dari": 1,
    "catatan_disposisi": "Please conduct technical review for this application immediately",
    "status": "pending",
    "tanggal_disposisi": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Automated Tests** (Postman):
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Disposisi has correct structure", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('id');
    pm.expect(jsonData.data.status).to.equal('pending');
});

// Save disposisi_id
pm.environment.set("disposisi_id", pm.response.json().data.id);
```

**Validation Points**:
- ✅ Status code 201
- ✅ Response has `message` and `data`
- ✅ `status` value is `'pending'`
- ✅ `disposisi_dari` filled with logged-in user ID (Admin)
- ✅ `tanggal_disposisi` auto-filled
- ✅ `disposisi_id` saved to environment

---

### 6.3 Test 2: Input Kajian Teknis

**Objective**: OPD conducts technical review and provides recommendations.

**Prerequisites**:
- ✅ Logout from Admin, login as **OPD**
- ✅ Have `permohonan_id` to be reviewed

**Request**:
```http
POST http://localhost:3020/api/workflow/kajian-teknis
Authorization: Bearer {{accessToken}}  # Token OPD
Content-Type: application/json

{
  "permohonan_id": 1,
  "opd_id": 2,
  "hasil_kajian": "disetujui",
  "rekomendasi": "Application approved with note to pay attention to environmental aspects",
  "catatan_teknis": "Location meets zoning requirements. No significant technical constraints.",
  "lampiran": [
    {
      "nama_file": "peta_lokasi_survey.pdf",
      "url": "/uploads/peta_lokasi_survey.pdf"
    },
    {
      "nama_file": "foto_kondisi_eksisting.jpg",
      "url": "/uploads/foto_kondisi.jpg"
    }
  ]
}
```

**Expected Response** (201 Created):
```json
{
  "message": "Technical review created successfully",
  "data": {
    "id": 1,
    "permohonan_id": 1,
    "opd_id": 2,
    "reviewer_id": 2,
    "hasil_kajian": "disetujui",
    "rekomendasi": "Application approved with note to pay attention to environmental aspects",
    "catatan_teknis": "Location meets zoning requirements. No significant technical constraints.",
    "lampiran": [
      {
        "nama_file": "peta_lokasi_survey.pdf",
        "url": "/uploads/peta_lokasi_survey.pdf"
      },
      {
        "nama_file": "foto_kondisi_eksisting.jpg",
        "url": "/uploads/foto_kondisi.jpg"
      }
    ],
    "tanggal_kajian": "2024-01-15T11:00:00.000Z",
    "updated_at": "2024-01-15T11:00:00.000Z",
    "created_at": "2024-01-15T11:00:00.000Z"
  }
}
```

**Valid `hasil_kajian` Values**:
- `"disetujui"` - Application recommended for approval
- `"ditolak"` - Application does not meet requirements
- `"perlu_revisi"` - Needs document improvement/completion

**Automated Tests** (Postman):
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Reviewer ID filled automatically", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.reviewer_id).to.not.be.null;
});

pm.environment.set("kajian_id", pm.response.json().data.id);
```

**Validation Points**:
- ✅ Status code 201
- ✅ `reviewer_id` auto-filled from JWT token (logged-in user)
- ✅ `hasil_kajian` matches valid ENUM
- ✅ `lampiran` saved as JSON array
- ✅ `tanggal_kajian` auto-filled

---

### 6.4 Test 3: Forward Draft to Pimpinan

**Objective**: Admin creates permit draft and sends it to Leadership for review.

**Prerequisites**:
- ✅ Login as **Admin**
- ✅ Technical review completed with `"disetujui"` result

**Request**:
```http
POST http://localhost:3020/api/workflow/forward-to-pimpinan
Authorization: Bearer {{accessToken}}  # Token Admin
Content-Type: application/json

{
  "permohonan_id": 1,
  "nomor_registrasi": "REG/2024/01/0001",
  "nomor_draft": "DRAFT/2024/01/0001",
  "isi_draft": "KEPUTUSAN KEPALA DAERAH\nNOMOR: DRAFT/2024/01/0001\n\nTENTANG\nPERSETUJUAN IZIN MENDIRIKAN BANGUNAN\n\nKEPALA DAERAH,\n\nMenimbang:\na. Bahwa berdasarkan permohonan dari Pemohon tertanggal 10 Januari 2024...\nb. Bahwa berdasarkan hasil kajian teknis dari Dinas Terkait...\n\nMengingat:\n1. Undang-Undang Nomor 28 Tahun 2002 tentang Bangunan Gedung;\n2. Peraturan Daerah Nomor 5 Tahun 2020 tentang Izin Mendirikan Bangunan;\n\nMEMUTUSKAN:\n\nMenetapkan:\nKESATU: Menyetujui permohonan izin mendirikan bangunan...\nKEDUA: Izin berlaku selama 2 (dua) tahun sejak ditetapkan...\nKETIGA: Keputusan ini mulai berlaku pada tanggal ditetapkan.\n\nDitetapkan di: Kota XYZ\nPada tanggal: 15 Januari 2024\n\nKEPALA DAERAH,\n\n(Nama Pejabat)\nNIP. 19700101 199001 1 001"
}
```

**Expected Response** (201 Created):
```json
{
  "message": "Permit draft successfully sent to leadership",
  "data": {
    "id": 1,
    "permohonan_id": 1,
    "nomor_registrasi": "REG/2024/01/0001",
    "nomor_draft": "DRAFT/2024/01/0001",
    "isi_draft": "KEPUTUSAN KEPALA DAERAH...",
    "dibuat_oleh": 1,
    "status": "dikirim_ke_pimpinan",
    "tanggal_kirim_pimpinan": "2024-01-15T14:00:00.000Z",
    "disetujui_oleh": null,
    "tanggal_persetujuan": null,
    "updated_at": "2024-01-15T14:00:00.000Z",
    "created_at": "2024-01-15T14:00:00.000Z"
  }
}
```

**Automated Tests** (Postman):
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Draft status is dikirim_ke_pimpinan", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.status).to.equal('dikirim_ke_pimpinan');
    pm.expect(jsonData.data).to.have.property('tanggal_kirim_pimpinan');
});

pm.environment.set("draft_id", pm.response.json().data.id);
```

**Validation Points**:
- ✅ Status code 201
- ✅ `status` automatically becomes `'dikirim_ke_pimpinan'`
- ✅ `tanggal_kirim_pimpinan` auto-filled
- ✅ `dibuat_oleh` filled with logged-in Admin ID
- ✅ `nomor_draft` must be unique (no duplicates allowed)

---

### 6.5 Test 4: Request Revisi Draft

**Objective**: Leadership requests revision to the submitted permit draft.

**Prerequisites**:
- ✅ Logout from Admin, login as **Pimpinan**
- ✅ Have `draft_id` to be revised

**Request**:
```http
POST http://localhost:3020/api/workflow/revisi-draft
Authorization: Bearer {{accessToken}}  # Token Pimpinan
Content-Type: application/json

{
  "draft_id": 1,
  "catatan_revisi": "Please improve the legal consideration section in point b. Add reference to the latest Regional Regulation No. 5 of 2024. Also ensure the numbering format complies with the latest standard."
}
```

**Expected Response** (201 Created):
```json
{
  "message": "Draft revision request created successfully",
  "data": {
    "revisi": {
      "id": 1,
      "draft_id": 1,
      "diminta_oleh": 3,
      "catatan_revisi": "Please improve the legal consideration section in point b. Add reference to the latest Regional Regulation No. 5 of 2024. Also ensure the numbering format complies with the latest standard.",
      "status": "pending",
      "tanggal_revisi": "2024-01-15T15:00:00.000Z",
      "diselesaikan_oleh": null,
      "tanggal_selesai": null,
      "updated_at": "2024-01-15T15:00:00.000Z",
      "created_at": "2024-01-15T15:00:00.000Z"
    },
    "draft": {
      "id": 1,
      "permohonan_id": 1,
      "nomor_registrasi": "REG/2024/01/0001",
      "nomor_draft": "DRAFT/2024/01/0001",
      "isi_draft": "KEPUTUSAN KEPALA DAERAH...",
      "dibuat_oleh": 1,
      "status": "perlu_revisi",  // ← Status updated
      "tanggal_kirim_pimpinan": "2024-01-15T14:00:00.000Z",
      "disetujui_oleh": null,
      "tanggal_persetujuan": null,
      "updated_at": "2024-01-15T15:00:00.000Z",
      "created_at": "2024-01-15T14:00:00.000Z"
    }
  }
}
```

**Automated Tests** (Postman):
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Draft status updated to perlu_revisi", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.draft.status).to.equal('perlu_revisi');
});

pm.test("Revisi record created with pending status", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.revisi.status).to.equal('pending');
});

pm.environment.set("revisi_id", pm.response.json().data.revisi.id);
```

**Validation Points**:
- ✅ Status code 201
- ✅ Draft status changed to `'perlu_revisi'`
- ✅ New record created in `revisi_draft` table
- ✅ Revision status defaults to `'pending'`
- ✅ `diminta_oleh` filled with logged-in Pimpinan ID
- ✅ Response returns **both** revision record AND updated draft

**Business Logic**:
1. This endpoint performs **2 operations**:
   - Update draft status → `'perlu_revisi'`
   - Create new record in `revisi_draft` table
2. Admin will see the revision request and improve the draft
3. After improvement, Admin will send again to Pimpinan (loop to Test 3)

---

### 6.6 Test 5: Receive Trigger (Internal)

**Objective**: Application Service triggers workflow after application registration.

**Prerequisites**:
- ✅ Workflow Service running on port 3020

**Note**: 
⚠️ This endpoint is **NOT for manual testing** via Postman by users.  
⚠️ This endpoint is called **AUTOMATICALLY** by Application Service.

**How It Works**:
```javascript
// In Application Service (layanan-pendaftaran)
// routes/permohonanRoutes.js - registration endpoint

const axios = require('axios');

router.post('/api/permohonan/:id/registrasi', async (req, res) => {
  // ... generate registration number ...
  
  // Trigger workflow service
  try {
    await axios.post('http://localhost:3020/api/internal/receive-trigger', {
      permohonan_id: id,
      opd_id: assignedOpdId
    });
  } catch (error) {
    console.error('Failed to trigger workflow:', error.message);
  }
  
  // ... return response ...
});
```

**Request** (if want to test manually):
```http
POST http://localhost:3020/api/internal/receive-trigger
Content-Type: application/json
# NO AUTHORIZATION HEADER (internal communication)

{
  "permohonan_id": 1,
  "opd_id": 2
}
```

**Expected Response** (201 Created):
```json
{
  "id": 1,
  "permohonan_id": 1,
  "opd_id": 2,
  "status": "Pending",
  "updated_at": "2024-01-15T16:00:00.000Z",
  "created_at": "2024-01-15T16:00:00.000Z"
}
```

**Validation Points**:
- ✅ Status code 201
- ✅ **DOES NOT require authentication** (no Bearer token)
- ✅ Automatically creates Disposition record with status `'Pending'`
- ✅ Called by Application Service, not by user

---

## 7. Role & Permissions

### 7.1 Role Matrix

| Endpoint | Pemohon | Admin | OPD | Pimpinan |
|----------|---------|-------|-----|----------|
| `POST /api/workflow/disposisi-opd` | ❌ | ✅ | ❌ | ❌ |
| `POST /api/workflow/kajian-teknis` | ❌ | ❌ | ✅ | ❌ |
| `POST /api/workflow/forward-to-pimpinan` | ❌ | ✅ | ❌ | ❌ |
| `POST /api/workflow/revisi-draft` | ❌ | ❌ | ❌ | ✅ |
| `POST /api/internal/receive-trigger` | N/A | N/A | N/A | N/A |

### 7.2 Role Descriptions

**Admin**:
- Create disposition to OPD
- Create permit draft
- Send draft to Leadership
- Improve draft based on revisions

**OPD (Regional Organization)**:
- Conduct technical review
- Provide recommendations (approved/rejected/needs_revision)
- Upload survey result attachments

**Pimpinan**:
- Review permit draft
- Approve or request draft revision
- Provide revision notes

**Pemohon**:
- No access to Workflow Service
- Can only view status through Application Service

---

## 8. Troubleshooting

### 8.1 Common Errors

#### Error: "Token tidak valid atau sudah kadaluarsa"
**Cause**: JWT token expired (default 1 hour)  
**Solution**:
```bash
# Login again to get new token
POST {{auth_base_url}}/api/auth/signin
```

#### Error: "Access denied. Required role: Admin"
**Cause**: Trying to access endpoint with wrong role  
**Solution**:
- Ensure login with user that has appropriate role
- See Role Matrix in section 7.1

#### Error: "Duplicate entry for key 'nomor_draft'"
**Cause**: `nomor_draft` must be unique  
**Solution**:
```json
{
  "nomor_draft": "DRAFT/2024/01/0002"  // Increment number
}
```

#### Error: "Draft tidak ditemukan"
**Cause**: `draft_id` does not exist in database  
**Solution**:
- Ensure draft was created with forward-to-pimpinan endpoint
- Check `draft_id` in environment variable

#### Error: "Cannot read property 'id' of undefined"
**Cause**: Token unreadable or auth middleware error  
**Solution**:
```javascript
// Ensure Authorization header exists
Authorization: Bearer {{accessToken}}

// Ensure environment variable accessToken is filled
console.log(pm.environment.get("accessToken"));
```

---

### 8.2 Database Verification

**Check Disposisi**:
```sql
SELECT * FROM jelita_workflow.disposisi;
```

**Check Kajian Teknis**:
```sql
SELECT * FROM jelita_workflow.kajian_teknis;
```

**Check Draft Izin**:
```sql
SELECT * FROM jelita_workflow.draft_izin;
```

**Check Revisi**:
```sql
SELECT * FROM jelita_workflow.revisi_draft;
```

**Join Query - Full Workflow**:
```sql
SELECT 
  d.nomor_registrasi,
  d.status AS disposisi_status,
  kt.hasil_kajian,
  kt.rekomendasi,
  di.nomor_draft,
  di.status AS draft_status,
  rd.catatan_revisi
FROM disposisi d
LEFT JOIN kajian_teknis kt ON d.permohonan_id = kt.permohonan_id
LEFT JOIN draft_izin di ON d.permohonan_id = di.permohonan_id
LEFT JOIN revisi_draft rd ON di.id = rd.draft_id
WHERE d.permohonan_id = 1;
```

---

### 8.3 Server Logs

**Enable Debug Logs**:
```javascript
// server.js - add logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Body:', req.body);
  console.log('User:', req.user);
  next();
});
```

**Check Server Status**:
```bash
# Windows PowerShell
netstat -ano | findstr :3020

# If there's a process, kill with PID
taskkill /PID <PID> /F
```

---

## 9. Testing Checklist

### 9.1 Pre-Flight Checklist
- [ ] MySQL Server running
- [ ] Database `jelita_workflow` created
- [ ] All tables created (disposisi, kajian_teknis, draft_izin, revisi_draft)
- [ ] User & Auth Service running (port 3001)
- [ ] Application Service running (port 3010)
- [ ] Workflow Service running (port 3020)
- [ ] Postman collection imported
- [ ] Postman environment imported & activated
- [ ] Test users created (Admin, OPD, Pimpinan)
- [ ] At least 1 registered permohonan

### 9.2 Testing Flow Checklist
- [ ] **Test 1**: Login as Admin → Token saved
- [ ] **Test 2**: Create Disposisi OPD → `disposisi_id` saved
- [ ] **Test 3**: Login as OPD → Token saved
- [ ] **Test 4**: Input Kajian Teknis → `kajian_id` saved
- [ ] **Test 5**: Login as Admin → Token saved
- [ ] **Test 6**: Forward Draft to Pimpinan → `draft_id` saved
- [ ] **Test 7**: Login as Pimpinan → Token saved
- [ ] **Test 8**: Request Revisi Draft → `revisi_id` saved
- [ ] **Test 9**: Verify all data in database

### 9.3 Validation Checklist
- [ ] All responses have correct status codes
- [ ] All automated Postman tests pass
- [ ] Environment variables auto-saved correctly
- [ ] Role-based access control working
- [ ] Timestamps generated automatically
- [ ] Foreign keys properly linked
- [ ] JSON fields (lampiran) saved correctly
- [ ] ENUM values validated

---

## 10. Integration Testing

### 10.1 End-to-End Flow

**Full workflow from Permohonan to Permit Draft**:

```
1. [Application Service] POST /api/permohonan
   → Applicant creates application

2. [Application Service] POST /api/permohonan/:id/dokumen
   → Upload requirement documents

3. [Application Service] POST /api/dokumen/:id/verifikasi
   → Admin verifies documents

4. [Application Service] POST /api/permohonan/:id/registrasi
   → Admin registers → Generate number REG/YYYY/MM/XXXX
   → TRIGGER WORKFLOW SERVICE (automatic)

5. [Workflow Service] POST /api/workflow/disposisi-opd
   → Admin creates disposition to OPD

6. [Workflow Service] POST /api/workflow/kajian-teknis
   → OPD inputs review results

7. [Workflow Service] POST /api/workflow/forward-to-pimpinan
   → Admin sends draft to Leadership

8. [Workflow Service] POST /api/workflow/revisi-draft (optional)
   → Leadership requests revision
   → Loop to step 7 (draft improvement)

9. [Application Service] GET /api/permohonan/:id/status
   → Applicant checks application status
```

### 10.2 Testing Script (Run All)

Create Postman Collection Runner to run all tests sequentially:

1. Login Admin
2. Create Disposisi
3. Login OPD
4. Input Kajian Teknis
5. Login Admin
6. Forward to Pimpinan
7. Login Pimpinan
8. Request Revisi

**Run via Postman Runner**:
- Click **Collection** → **Run**
- Select all requests
- Set iterations: 1
- Click **Run Workflow Service**

---

## 11. Performance & Best Practices

### 11.1 Response Time Benchmarks
- Disposisi creation: < 100ms
- Kajian teknis creation: < 150ms (with JSON lampiran)
- Draft forward: < 200ms (with long text)
- Revisi request: < 150ms (2 DB operations)

### 11.2 Security Best Practices
✅ Always use HTTPS in production  
✅ JWT tokens expire in 1 hour  
✅ Role-based access enforced via middleware  
✅ Internal endpoints (`/api/internal/*`) must not be exposed to public  
✅ Validate ENUM values before DB insert  

### 11.3 Data Validation
✅ `nomor_draft` must be unique  
✅ `hasil_kajian` must be one of: disetujui, ditolak, perlu_revisi  
✅ `status` (disposisi) must be: pending, dikerjakan, selesai, ditolak  
✅ `lampiran` must be valid JSON array  
✅ Foreign keys (permohonan_id, opd_id, etc.) must exist  

---

## 12. Appendix

### 12.1 Sample Data

**Sample Disposisi**:
```json
{
  "permohonan_id": 1,
  "nomor_registrasi": "REG/2024/01/0001",
  "opd_id": 2,
  "catatan_disposisi": "Please conduct technical review for this application immediately. High priority."
}
```

**Sample Kajian Teknis**:
```json
{
  "permohonan_id": 1,
  "opd_id": 2,
  "hasil_kajian": "disetujui",
  "rekomendasi": "Application can be approved with the following conditions:\n1. Pay attention to environmental aspects\n2. Follow GSB (Building Boundary Line) regulations\n3. Complete IMB within 30 days",
  "catatan_teknis": "Based on field survey:\n- Location complies with RTRW\n- No technical constraints\n- Adequate road access",
  "lampiran": [
    {"nama_file": "survey_report.pdf", "url": "/uploads/survey_report.pdf"},
    {"nama_file": "foto_lokasi.jpg", "url": "/uploads/foto_lokasi.jpg"}
  ]
}
```

**Sample Draft Izin**:
```json
{
  "permohonan_id": 1,
  "nomor_registrasi": "REG/2024/01/0001",
  "nomor_draft": "DRAFT/IMB/2024/01/0001",
  "isi_draft": "REGIONAL HEAD DECISION NUMBER: DRAFT/IMB/2024/01/0001\n\nREGARDING BUILDING PERMIT APPROVAL\n\n[... full content ...]"
}
```

### 12.2 HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET request |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Validation error, missing fields |
| 401 | Unauthorized | No token or invalid token |
| 403 | Forbidden | Token valid but wrong role |
| 404 | Not Found | Resource not found (e.g., draft_id) |
| 500 | Internal Server Error | Database error, server crash |

### 12.3 Environment Variable Reference

```javascript
// {{workflow_base_url}}
"http://localhost:3020"

// {{accessToken}}
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJkZW1vIiwicm9sZSI6IkFkbWluIiwiaWF0IjoxNzA1MzIxMjAwLCJleHAiOjE3MDUzMjQ4MDB9.XXXXX"

// {{permohonan_id}}
1

// {{opd_user_id}}
2

// {{disposisi_id}}
1

// {{kajian_id}}
1

// {{draft_id}}
1

// {{revisi_id}}
1
```

---

## 📝 Conclusion

Congratulations! You have completed the setup and testing for **Workflow Service**.

**What's Next**:
- ✅ Integrate with frontend (if any)
- ✅ Add notification service (email/SMS) for disposisi
- ✅ Implement dashboard for workflow monitoring
- ✅ Add approval flow for Pimpinan (approve/reject draft)
- ✅ Export draft as PDF for official documents

**Support**:
- Documentation: `README.md`
- Postman Collection: `postman/Workflow_Service.postman_collection.json`
- Environment: `postman/Workflow_Service.postman_environment.json`

---

