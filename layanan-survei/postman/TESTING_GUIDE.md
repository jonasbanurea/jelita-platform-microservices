# Testing Guide - Survey (SKM) Service

## 📋 Table of Contents
1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [SKM Flow Architecture](#skm-flow-architecture)
5. [Endpoint Overview](#endpoint-overview)
6. [Step-by-Step Testing](#step-by-step-testing)
7. [SKM Calculation](#skm-calculation)
8. [Troubleshooting](#troubleshooting)

---

## 1. Introduction

### 1.1 About Survey (SKM) Service
Survey Service is a microservice that manages **Community Satisfaction Survey (SKM)** which must be filled out by applicants after permit approval. This service handles:

- **SKM Notification**: Send survey notification to applicants
- **SKM Form**: Provides 9 standard SKM questions
- **Submit SKM**: Applicants fill out and submit survey
- **SKM Summary**: Admin views survey statistics
- **Unlock Download**: Unlock permit download access after SKM completion
- **Trigger Archive**: Trigger archiving after download

### 1.2 Port & Database
- **Port**: 3030
- **Database**: `jelita_survei`
- **Base URL**: `http://localhost:3030`

### 1.3 National SKM Standard
Based on **Permenpan RB No. 14 of 2017**, SKM measures 9 elements of public services:

1. Persyaratan
2. Prosedur
3. Waktu Pelayanan
4. Biaya/Tarif
5. Produk Spesifikasi Jenis Pelayanan
6. Kompetensi Pelaksana
7. Perilaku Pelaksana
8. Sarana dan Prasarana
9. Penanganan Pengaduan, Saran, dan Masukan

### 1.4 Integration with Other Services
```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│  Application     │       │  Survey (SKM)    │       │  Archive         │
│  Service         │──────►│  Service         │──────►│  Service         │
│  (3010)          │       │  (3030)          │       │  (3040)          │
└──────────────────┘       └──────────────────┘       └──────────────────┘
      │                            │                            │
      │ 1. Permit Approved         │ 4. SKM Completed           │
      │ 2. Send Notification       │ 5. Unlock Download         │
      │                            │ 6. Trigger Archive         │
      │ 3. Applicant Fill SKM      │                            │
      └────────────────────────────┘ 7. Download Permit        │
                                                                 │
                                     8. Archive Documents ────────┘
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
- ✅ User with role **Applicant** (for testing submit SKM)
- ✅ At least 1 application that has been approved from Workflow Service

### 2.3 Database Setup
```bash
# Enter layanan-survei directory
cd d:\KULIAH\TESIS\prototype_eng\layanan-survei

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
  1. skm

✓ Database setup completed!
```

---

## 3. Setup Environment

### 3.1 Import Collection & Environment to Postman

**Step 1: Import Collection**
1. Open Postman
2. Click **Import** (top left)
3. Drag & drop file: `postman/Survey_Service.postman_collection.json`
4. Click **Import**

**Step 2: Import Environment**
1. Click **Import** again
2. Drag & drop file: `postman/Survey_Service.postman_environment.json`
3. Click **Import**

**Step 3: Activate Environment**
1. Select dropdown on top right (No Environment)
2. Select **"Survey Service Environment"**

### 3.2 Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `survey_base_url` | `http://localhost:3030` | Base URL Survey Service |
| `auth_base_url` | `http://localhost:3001` | Base URL Auth Service |
| `application_base_url` | `http://localhost:3010` | Base URL Application Service |
| `archive_base_url` | `http://localhost:3040` | Base URL Archive Service |
| `accessToken` | (auto-saved) | JWT token from login |
| `admin_username` | `demo` | Username for Admin |
| `admin_password` | `demo123` | Password for Admin |
| `permohonan_id` | (manual/auto) | ID application from Application Service |
| `pemohon_user_id` | (manual) | ID user applicant |
| `skm_id` | (auto-saved) | SKM ID created |

---

## 4. Arsitektur SKM Flow

### 4.1 Complete SKM Workflow

```
┌────────────────────────────────────────────────────────────────┐
│                    COMPLETE SKM FLOW                            │
└────────────────────────────────────────────────────────────────┘

1. APPLICATION APPROVED
   ├─ Workflow Service: Draft permit approved by Leadership
   └─ Application Service: Update application status = "Approved"

2. SEND SKM NOTIFICATION
   ├─ Admin/OPD: POST /api/skm/notifikasi
   ├─ Create SKM record (status: pending)
   └─ Send email/SMS with survey link (production)

3. APPLICANT ACCESS SKM FORM
   ├─ GET /api/skm/form (no auth)
   ├─ Display 9 standard SKM questions
   └─ Answer scale: 1-4 for each question

4. APPLICANT SUBMIT SKM
   ├─ Applicant: POST /api/skm/submit
   ├─ Update SKM record (status: completed)
   ├─ Calculate SKM value (0-100)
   └─ Determine category (Excellent, Good, Fair, Poor)

5. UNLOCK DOWNLOAD ACCESS
   ├─ Auto: POST /api/internal/buka-akses-download
   ├─ Update download_unlocked = true
   └─ Notify Application Service

6. APPLICANT DOWNLOAD PERMIT
   ├─ Applicant: GET /api/permohonan/:id/download-izin
   └─ Application Service return PDF permit

7. TRIGGER ARCHIVING
   ├─ Auto: POST /api/internal/trigger-pengarsipan
   ├─ Survey Service → Archive Service
   └─ Archive Service: Save documents to archive

8. ADMIN VIEW SKM SUMMARY
   └─ Admin: GET /api/skm/rekap
```

### 4.2 Database Schema

**Table: `skm`**
```sql
CREATE TABLE skm (
  id INT PRIMARY KEY AUTO_INCREMENT,
  permohonan_id INT NOT NULL,
  user_id INT NOT NULL COMMENT 'ID applicant',
  nomor_registrasi VARCHAR(255),
  jawaban_json JSON NOT NULL COMMENT 'Survey answers',
  status ENUM('pending', 'completed') DEFAULT 'pending',
  submitted_at DATETIME,
  notified_at DATETIME,
  download_unlocked BOOLEAN DEFAULT FALSE,
  download_unlocked_at DATETIME,
  created_at DATETIME,
  updated_at DATETIME
);
```

---

## 5. Endpoint Overview

### 5.1 Summary Table

| # | Endpoint | Method | Role | Description |
|---|----------|--------|------|-------------|
| 1 | `/api/skm/notifikasi` | POST | Admin, OPD | Send SKM notification |
| 2 | `/api/skm/form` | GET | Public | Get SKM form |
| 3 | `/api/skm/submit` | POST | Applicant | Submit SKM answers |
| 4 | `/api/skm/rekap` | GET | Admin, OPD, Leadership | Summary of SKM results |
| 5 | `/api/internal/buka-akses-download` | POST | Internal | Unlock download |
| 6 | `/api/internal/trigger-pengarsipan` | POST | Internal | Trigger archive |

### 5.2 Authentication
- Endpoint 1, 3, 4: Requires **Bearer Token** JWT
- Endpoint 2: **Public** (no auth)
- Endpoint 5, 6: **Internal** (no auth, service-to-service)

---

## 6. Testing Step-by-Step

### 6.1 Preparation: Start Services

```bash
# Terminal 1 - Auth Service
cd d:\KULIAH\TESIS\prototype_eng\layanan-manajemen-pengguna
npm start

# Terminal 2 - Application Service
cd d:\KULIAH\TESIS\prototype_eng\layanan-pendaftaran
npm start

# Terminal 3 - Survey Service
cd d:\KULIAH\TESIS\prototype_eng\layanan-survei
npm start
```

### 6.2 Test 1: Send SKM Notification

**Objective**: Admin sends notification to applicant to fill out SKM.

**Prerequisites**:
- ✅ Login as Admin (token saved)
- ✅ Have `permohonan_id` that has been approved
- ✅ Have `pemohon_user_id`

**Request**:
```http
POST http://localhost:3030/api/skm/notifikasi
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "permohonan_id": 1,
  "user_id": 5,
  "nomor_registrasi": "REG/2024/01/0001"
}
```

**Expected Response** (200 OK):
```json
{
  "message": "SKM notification sent successfully",
  "data": {
    "permohonan_id": 1,
    "nomor_registrasi": "REG/2024/01/0001",
    "survey_link": "http://localhost:3030/survey/1",
    "skm_id": 1,
    "notified_at": "2024-01-20T10:00:00.000Z"
  }
}
```

**Validation Points**:
- ✅ Status code 200
- ✅ Response has `survey_link`
- ✅ `skm_id` saved in environment
- ✅ SKM record created with status `'pending'`

---

### 6.3 Test 2: Get SKM Form

**Objective**: Applicant accesses form to view SKM questions.

**Prerequisites**:
- ✅ **Does NOT need login** (public endpoint)

**Request:**
```http
GET http://localhost:3030/api/skm/form
# NO AUTHORIZATION HEADER
```

**Expected Response** (200 OK):
```json
{
  "message": "SKM form retrieved successfully",
  "data": {
    "title": "Community Satisfaction Survey (SKM)",
    "description": "Please take your time to fill out our service satisfaction survey",
    "questions": [
      {
        "id": 1,
        "pertanyaan": "What is your opinion about the suitability of service requirements with its service type?",
        "unsur": "Requirements",
        "skala": [
          { "nilai": 1, "label": "Not Suitable" },
          { "nilai": 2, "label": "Less Suitable" },
          { "nilai": 3, "label": "Suitable" },
          { "nilai": 4, "label": "Very Suitable" }
        ]
      },
      {
        "id": 2,
        "pertanyaan": "What is your understanding about the ease of service procedures at this unit?",
        "unsur": "Procedure",
        "skala": [
          { "nilai": 1, "label": "Not Easy" },
          { "nilai": 2, "label": "Less Easy" },
          { "nilai": 3, "label": "Easy" },
          { "nilai": 4, "label": "Very Easy" }
        ]
      }
      // ... 7 other questions
    ],
    "additional": {
      "saran": "Suggestions and input for improving service (optional)"
    }
  }
}
```

**Validation Points**:
- ✅ Status code 200
- ✅ Form has 9 questions
- ✅ Each question has scale 1-4
- ✅ Does not require authentication

---

### 6.4 Test 3: Submit SKM

**Objective**: Applicant submits survey answers.

**Prerequisites**:
- ✅ Login as **Applicant** (token saved)
- ✅ Have `permohonan_id`

**Request**:
```http
POST http://localhost:3030/api/skm/submit
Authorization: Bearer {{accessToken}}  # Applicant Token
Content-Type: application/json

{
  "permohonan_id": 1,
  "jawaban_json": {
    "answers": [
      {"id": 1, "nilai": 4, "unsur": "Persyaratan"},
      {"id": 2, "nilai": 4, "unsur": "Prosedur"},
      {"id": 3, "nilai": 3, "unsur": "Waktu Pelayanan"},
      {"id": 4, "nilai": 4, "unsur": "Biaya/Tarif"},
      {"id": 5, "nilai": 4, "unsur": "Produk Spesifikasi"},
      {"id": 6, "nilai": 4, "unsur": "Kompetensi Pelaksana"},
      {"id": 7, "nilai": 4, "unsur": "Perilaku Pelaksana"},
      {"id": 8, "nilai": 3, "unsur": "Sarana dan Prasarana"},
      {"id": 9, "nilai": 3, "unsur": "Penanganan Pengaduan"}
    ],
    "saran": "Service is very good, only needs improvement in infrastructure"
  }
}
```

**Expected Response** (201 Created):
```json
{
  "message": "SKM survey submitted successfully",
  "data": {
    "skm_id": 1,
    "permohonan_id": 1,
    "status": "completed",
    "submitted_at": "2024-01-20T10:30:00.000Z",
    "score": {
      "total": 33,
      "average": "3.67",
      "skm_value": "91.67",
      "category": "Excellent"
    }
  }
}
```

**Validation Points**:
- ✅ Status code 201
- ✅ Status changes to `'completed'`
- ✅ SKM value calculated (0-100)
- ✅ Category determined based on SKM value

---

### 6.5 Test 4: Get SKM Summary

**Objective**: Admin views summary and statistics of SKM results.

**Prerequisites**:
- ✅ Login as **Admin/OPD/Leadership**
- ✅ At least 1 SKM has been submitted

**Request**:
```http
GET http://localhost:3030/api/skm/rekap?status=completed
Authorization: Bearer {{accessToken}}  # Token Admin
```

**Expected Response** (200 OK):
```json
{
  "message": "SKM summary retrieved successfully",
  "data": {
    "total_surveys": 5,
    "completed": 4,
    "pending": 1,
    "average_skm_value": "87.50",
    "category_distribution": {
      "Excellent": 2,
      "Good": 2,
      "Fair": 0,
      "Poor": 0
    },
    "surveys": [
      {
        "id": 1,
        "permohonan_id": 1,
        "nomor_registrasi": "REG/2024/01/0001",
        "status": "completed",
        "submitted_at": "2024-01-20T10:30:00.000Z",
        "skm_value": "91.67"
      },
      {
        "id": 2,
        "permohonan_id": 2,
        "nomor_registrasi": "REG/2024/01/0002",
        "status": "completed",
        "submitted_at": "2024-01-20T11:00:00.000Z",
        "skm_value": "83.33"
      }
    ]
  }
}
```

**Query Parameters**:
- `status`: Filter by status (`pending` or `completed`)
- `startDate`: Filter by start date (YYYY-MM-DD)
- `endDate`: Filter by end date (YYYY-MM-DD)

**Validation Points**:
- ✅ Status code 200
- ✅ Statistics displays average SKM value
- ✅ Category distribution available
- ✅ List surveys with individual SKM values

---

### 6.6 Test 5: Unlock Download Access (Internal)

**Objective**: System automatically unlocks download access after SKM completed.

**Prerequisites**:
- ✅ SKM has been submitted (status: completed)

**Request**:
```http
POST http://localhost:3030/api/internal/buka-akses-download
Content-Type: application/json
# NO AUTHORIZATION HEADER (internal)

{
  "permohonan_id": 1
}
```

**Expected Response** (200 OK):
```json
{
  "message": "Download access successfully unlocked",
  "data": {
    "permohonan_id": 1,
    "download_unlocked": true,
    "download_unlocked_at": "2024-01-20T10:35:00.000Z"
  }
}
```

**Business Logic**:
1. Check SKM record for `permohonan_id`
2. Validate SKM status = `'completed'`
3. Update `download_unlocked` = true
4. Notify Application Service (via axios)
5. Applicant can download permit

**Validation Points**:
- ✅ Status code 200
- ✅ `download_unlocked` = true
- ✅ Timestamp `download_unlocked_at` filled
- ✅ Does not require authentication

---

### 6.7 Test 6: Trigger Archiving (Internal)

**Objective**: System triggers Archive Service after applicant downloads permit.

**Prerequisites**:
- ✅ Applicant has downloaded permit
- ✅ Archive Service running on port 3040

**Request**:
```http
POST http://localhost:3030/api/internal/trigger-pengarsipan
Content-Type: application/json
# NO AUTHORIZATION HEADER (internal)

{
  "permohonan_id": 1,
  "nomor_registrasi": "REG/2024/01/0001",
  "user_id": 5
}
```

**Expected Response** (200 OK):
```json
{
  "message": "Archiving successfully triggered",
  "data": {
    "permohonan_id": 1,
    "archive_response": {
      "message": "Documents successfully archived",
      "arsip_id": 1
    }
  }
}
```

**Business Logic**:
1. Survey Service receives request from Application Service
2. Survey Service calls Archive Service `/api/internal/arsipkan-dokumen`
3. Archive Service saves documents to database
4. Return response to caller

**Validation Points**:
- ✅ Status code 200
- ✅ Archive Service triggered
- ✅ Response from Archive Service displayed
- ✅ Does not require authentication

---

## 7. SKM Calculation

### 7.1 Formula Calculation

**Step 1: Calculate Total Score**
```
Total Score = Σ (Score of each question)
Example: 4 + 4 + 3 + 4 + 4 + 4 + 4 + 3 + 3 = 33
```

**Step 2: Calculate Average Score**
```
Average Score = Total Score / Number of Questions
Example: 33 / 9 = 3.67
```

**Step 3: Convert to Scale 0-100**
```
SKM Value = (Average Score / 4) × 100
Example: (3.67 / 4) × 100 = 91.67
```

### 7.2 SKM Value Category

Based on Permenpan RB No. 14 of 2017:

| SKM Value | Category | Service Quality | Service Unit Performance |
|-----------|----------|----------------|------------------------|
| 88.31 - 100.00 | **Excellent** | A | Excellent |
| 76.61 - 88.30 | **Good** | B | Good |
| 65.00 - 76.60 | **Fair** | C | Fair |
| 25.00 - 64.99 | **Poor** | D | Poor |

### 7.3 Calculation Examples

**Scenario 1: Perfect Score**
```json
{
  "answers": [
    {"nilai": 4}, {"nilai": 4}, {"nilai": 4}, 
    {"nilai": 4}, {"nilai": 4}, {"nilai": 4},
    {"nilai": 4}, {"nilai": 4}, {"nilai": 4}
  ]
}
```
- Total: 36
- Average: 36/9 = 4.00
- SKM Value: (4/4) × 100 = **100.00** → **Excellent**

**Scenario 2: Average Score**
```json
{
  "answers": [
    {"nilai": 3}, {"nilai": 3}, {"nilai": 3},
    {"nilai": 3}, {"nilai": 3}, {"nilai": 3},
    {"nilai": 3}, {"nilai": 3}, {"nilai": 3}
  ]
}
```
- Total: 27
- Average: 27/9 = 3.00
- SKM Value: (3/4) × 100 = **75.00** → **Fair**

**Scenario 3: Mixed Score**
```json
{
  "answers": [
    {"nilai": 4}, {"nilai": 4}, {"nilai": 3},
    {"nilai": 4}, {"nilai": 4}, {"nilai": 4},
    {"nilai": 4}, {"nilai": 3}, {"nilai": 3}
  ]
}
```
- Total: 33
- Average: 33/9 = 3.67
- SKM Value: (3.67/4) × 100 = **91.67** → **Excellent**

---

## 8. Troubleshooting

### 8.1 Common Errors

#### Error: "SKM has not been completed"
**Cause**: Trying to unlock download before SKM completed  
**Solution**:
- Ensure applicant has submitted SKM
- Check SKM status in database: `SELECT status FROM skm WHERE permohonan_id = 1;`

#### Error: "SKM not found"
**Cause**: No SKM record for permohonan_id  
**Solution**:
- Send notification first with endpoint `/api/skm/notifikasi`
- Or submit SKM will auto-create new record

#### Error: "Failed to trigger Archive Service"
**Cause**: Archive Service not running or URL is wrong  
**Solution**:
```bash
# Check Archive Service
netstat -ano | findstr :3040

# Check .env
ARCHIVE_SERVICE_URL=http://localhost:3040
```

#### Error: "Access denied. Required role: Applicant"
**Cause**: Login with role other than Applicant to submit SKM  
**Solution**:
- Login with user role Applicant
- Submit SKM endpoint is only for Applicant

---

### 8.2 Database Verification

**Check SKM Records**:
```sql
SELECT * FROM jelita_survei.skm;
```

**Check SKM by Status**:
```sql
SELECT 
  id, 
  permohonan_id, 
  nomor_registrasi,
  status,
  download_unlocked,
  submitted_at
FROM jelita_survei.skm
WHERE status = 'completed';
```

**Calculate Manual SKM Value**:
```sql
SELECT 
  permohonan_id,
  jawaban_json,
  status,
  submitted_at
FROM jelita_survei.skm
WHERE permohonan_id = 1;
```

---

### 8.3 Testing Checklist

#### Pre-Flight Checklist
- [ ] MySQL Server running
- [ ] Database `jelita_survei` created
- [ ] Table `skm` created
- [ ] User & Auth Service running (port 3001)
- [ ] Application Service running (port 3010)
- [ ] Survey Service running (port 3030)
- [ ] Postman collection imported
- [ ] Postman environment imported & activated
- [ ] Test users created (Admin, Applicant)
- [ ] At least 1 application approved

#### Testing Flow Checklist
- [ ] **Test 1**: Login as Admin → Token saved
- [ ] **Test 2**: Send SKM Notification → `skm_id` saved
- [ ] **Test 3**: Get SKM Form → 9 questions displayed
- [ ] **Test 4**: Login as Applicant → Token saved
- [ ] **Test 5**: Submit SKM → SKM value calculated
- [ ] **Test 6**: Get SKM Summary → Statistics displayed
- [ ] **Test 7**: Unlock Download Access → download_unlocked = true
- [ ] **Test 8**: Trigger Archiving → Archive Service triggered
- [ ] **Test 9**: Verify all data in database

#### Validation Checklist
- [ ] All responses have correct status codes
- [ ] All automated Postman tests pass
- [ ] Environment variables auto-saved correctly
- [ ] Role-based access control working
- [ ] SKM calculation accurate
- [ ] Internal endpoints work without auth
- [ ] Service-to-service communication working

---

## 9. Integration Testing

### 9.1 End-to-End Flow

**Complete flow from Permit Approved to Archive**:

```
1. [Workflow Service] POST /api/workflow/forward-to-pimpinan
   → Admin sends draft to Leadership
   
2. [Workflow Service] Leadership approves draft
   → Draft status = "approved"

3. [Application Service] Update application status
   → Status = "Approved"

4. [Survey Service] POST /api/skm/notifikasi
   → Admin sends SKM notification to applicant

5. [Survey Service] GET /api/skm/form
   → Applicant accesses SKM form

6. [Survey Service] POST /api/skm/submit
   → Applicant submits SKM answers
   → SKM value calculated

7. [Survey Service] POST /api/internal/buka-akses-download (auto)
   → Unlock download access
   → Notify Application Service

8. [Application Service] GET /api/permohonan/:id/download-izin
   → Applicant downloads permit (PDF)

9. [Survey Service] POST /api/internal/trigger-pengarsipan (auto)
   → Trigger Archive Service

10. [Archive Service] POST /api/internal/arsipkan-dokumen
    → Documents saved to archive
```

### 9.2 Performance Benchmarks
- SKM Notification: < 100ms
- Get SKM Form: < 50ms (static data)
- Submit SKM: < 150ms (with calculation)
- SKM Summary: < 200ms (with stats calculation)
- Unlock Download: < 100ms
- Trigger Archive: < 150ms (network call)

---

## 10. Appendix

### 10.1 Sample SKM JSON

**Perfect Score (100)**:
```json
{
  "permohonan_id": 1,
  "jawaban_json": {
    "answers": [
      {"id": 1, "nilai": 4, "unsur": "Requirements"},
      {"id": 2, "nilai": 4, "unsur": "Procedure"},
      {"id": 3, "nilai": 4, "unsur": "Service Time"},
      {"id": 4, "nilai": 4, "unsur": "Cost/Fee"},
      {"id": 5, "nilai": 4, "unsur": "Product Specification"},
      {"id": 6, "nilai": 4, "unsur": "Implementer Competence"},
      {"id": 7, "nilai": 4, "unsur": "Implementer Behavior"},
      {"id": 8, "nilai": 4, "unsur": "Facilities and Infrastructure"},
      {"id": 9, "nilai": 4, "unsur": "Complaint Handling"}
    ],
    "saran": "Service is very satisfying!"
  }
}
```

**Average Score (75)**:
```json
{
  "permohonan_id": 2,
  "jawaban_json": {
    "answers": [
      {"id": 1, "nilai": 3, "unsur": "Requirements"},
      {"id": 2, "nilai": 3, "unsur": "Procedure"},
      {"id": 3, "nilai": 3, "unsur": "Service Time"},
      {"id": 4, "nilai": 3, "unsur": "Cost/Fee"},
      {"id": 5, "nilai": 3, "unsur": "Product Specification"},
      {"id": 6, "nilai": 3, "unsur": "Implementer Competence"},
      {"id": 7, "nilai": 3, "unsur": "Implementer Behavior"},
      {"id": 8, "nilai": 3, "unsur": "Facilities and Infrastructure"},
      {"id": 9, "nilai": 3, "unsur": "Complaint Handling"}
    ],
    "saran": "Service is already good, needs more improvement"
  }
}
```

### 10.2 HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET/POST request |
| 201 | Created | Successful POST (SKM created) |
| 400 | Bad Request | SKM not completed, validation error |
| 401 | Unauthorized | No token or invalid token |
| 403 | Forbidden | Token valid but wrong role |
| 404 | Not Found | SKM not found |
| 500 | Internal Server Error | Database error, archive service down |

---

## 📝 Conclusion

Congratulations! You have completed setup and testing for **Survey (SKM) Service**.

**What's Next**:
- ✅ Integrate with Archive Service
- ✅ Add email/SMS notification (production)
- ✅ Implement dashboard monitoring for SKM
- ✅ Export SKM statistics to Excel/PDF
- ✅ Add reminder notification for pending SKM

**Support**:
- Documentation: `README.md`
- Postman Collection: `postman/Survey_Service.postman_collection.json`
- Environment: `postman/Survey_Service.postman_environment.json`

---

