# 📊 Survey (SKM) Service - Jelita System

Microservice untuk mengelola **Survei Kepuasan Masyarakat (SKM)** pada sistem perizinan Jelita.

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [API Endpoints](#api-endpoints)
- [SKM Standards](#skm-standards)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [Integration](#integration)

---

## 🎯 Overview

Survey Service manages the Public Satisfaction Survey (SKM) process which is **mandatory** for applicants after permit application is approved. This service implements SKM standards based on **Permenpan RB No. 14 of 2017** with 9 public service elements.

### Business Flow
```
Permit Approved → SKM Notification → Applicant Fills SKM → 
Unlock Download → Download Permit → Trigger Archive
```

### Port & Database
- **Port**: 3030
- **Database**: `jelita_survei`
- **Base URL**: `http://localhost:3030`

---

## ✨ Features

### 1. SKM Notification
- Admin/OPD sends survey notification to applicant
- Generate unique survey link
- Track notification status (notified_at)

### 2. SKM Form
- Public endpoint (no authentication)
- 9 standard questions based on Permenpan RB
- 1-4 rating scale for each element

### 3. Submit SKM
- Applicant submits survey answers
- Auto-calculate SKM value (0-100)
- Categorization: Excellent, Good, Fair, Poor

### 4. SKM Recap
- Admin/OPD/Leadership views statistics
- Filter by status, date
- Average SKM value & category distribution

### 5. Unlock Download
- Auto-unlock download access after SKM completed
- Notify Application Service

### 6. Trigger Archiving
- Trigger Archive Service after download
- Service-to-service communication

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 14+ | Runtime environment |
| Express.js | 4.21.2 | Web framework |
| Sequelize | 6.31.1 | ORM for MySQL |
| MySQL | 8.0+ | Database |
| JWT | 9.0.2 | Authentication |
| Axios | 1.7.9 | HTTP client |
| dotenv | 16.4.7 | Environment config |

---

## 📦 Installation

### Prerequisites
- Node.js v14 or higher
- MySQL Server 8.0+
- User & Auth Service running (port 3001)
- Application Service running (port 3010)

### Step 1: Clone & Install Dependencies
```bash
cd layanan-survei
npm install
```

### Step 2: Configure Environment
Create `.env` file:
```env
# Server Configuration
PORT=3030
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Enter*123
DB_NAME=jelita_survei
DB_PORT=3306

# JWT Configuration
JWT_SECRET=jelita_secret_key_2024_very_secure

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
APPLICATION_SERVICE_URL=http://localhost:3010
ARCHIVE_SERVICE_URL=http://localhost:3040
```

### Step 3: Setup Database
```bash
# Create database
node scripts/createDatabase.js

# Create tables
node scripts/setupDatabase.js
```

### Step 4: Start Server
```bash
npm start
# Or with nodemon
npm run dev
```

**Expected Output**:
```
✓ Database connection established
✓ Survey Service is running on port 3030
```

---

## 🚀 API Endpoints

### Base URL
```
http://localhost:3030
```

### Endpoint Summary

| Endpoint | Method | Auth | Role | Description |
|----------|--------|------|------|-------------|
| `/api/skm/notifikasi` | POST | ✅ | Admin, OPD | Send SKM notification |
| `/api/skm/form` | GET | ❌ | Public | Get SKM form |
| `/api/skm/submit` | POST | ✅ | Pemohon | Submit SKM answers |
| `/api/skm/rekap` | GET | ✅ | Admin, OPD, Pimpinan | Get SKM statistics |
| `/api/internal/buka-akses-download` | POST | ❌ | Internal | Unlock download |
| `/api/internal/trigger-pengarsipan` | POST | ❌ | Internal | Trigger archive |

---

### 1. Send Notifikasi SKM

**Endpoint**: `POST /api/skm/notifikasi`  
**Auth**: Required (Admin, OPD)

**Request Body**:
```json
{
  "permohonan_id": 1,
  "user_id": 5,
  "nomor_registrasi": "REG/2024/01/0001"
}
```

**Response** (200):
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

---

### 2. Get Form SKM

**Endpoint**: `GET /api/skm/form`  
**Auth**: Not Required (Public)

**Response** (200):
```json
{
  "message": "SKM form retrieved successfully",
  "data": {
    "title": "Public Satisfaction Survey (SKM)",
    "questions": [
      {
        "id": 1,
        "pertanyaan": "What do you think about the suitability of service requirements...",
        "unsur": "Requirements",
        "skala": [
          { "nilai": 1, "label": "Not Suitable" },
          { "nilai": 2, "label": "Less Suitable" },
          { "nilai": 3, "label": "Suitable" },
          { "nilai": 4, "label": "Very Suitable" }
        ]
      }
      // ... 8 other questions
    ]
  }
}
```

---

### 3. Submit SKM

**Endpoint**: `POST /api/skm/submit`  
**Auth**: Required (Pemohon)

**Request Body**:
```json
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
    "saran": "Service is very good"
  }
}
```

**Response** (201):
```json
{
  "message": "SKM survey successfully submitted",
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

---

### 4. Get Rekap SKM

**Endpoint**: `GET /api/skm/rekap`  
**Auth**: Required (Admin, OPD, Pimpinan)

**Query Parameters**:
- `status`: Filter by status (`pending` or `completed`)
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

**Example**: `GET /api/skm/rekap?status=completed&startDate=2024-01-01`

**Response** (200):
```json
{
  "message": "SKM recap retrieved successfully",
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
      }
    ]
  }
}
```

---

### 5. Buka Akses Download

**Endpoint**: `POST /api/internal/buka-akses-download`  
**Auth**: Not Required (Internal)

**Request Body**:
```json
{
  "permohonan_id": 1
}
```

**Response** (200):
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

---

### 6. Trigger Pengarsipan

**Endpoint**: `POST /api/internal/trigger-pengarsipan`  
**Auth**: Not Required (Internal)

**Request Body**:
```json
{
  "permohonan_id": 1,
  "nomor_registrasi": "REG/2024/01/0001",
  "user_id": 5
}
```

**Response** (200):
```json
{
  "message": "Archiving successfully triggered",
  "data": {
    "permohonan_id": 1,
    "archive_response": {
      "message": "Document successfully archived",
      "arsip_id": 1
    }
  }
}
```

---

## 📊 SKM Standards

### Permenpan RB No. 14 of 2017

SKM measures **9 Public Service Elements**:

1. **Requirements** - Suitability of requirements with service type
2. **Procedure** - Ease of service procedure
3. **Service Time** - Speed of service time
4. **Cost/Fee** - Fairness of service cost/fee
5. **Product Specification** - Suitability of service product
6. **Executor Competence** - Service staff capability
7. **Executor Behavior** - Staff attitude and behavior
8. **Facilities and Infrastructure** - Quality of facilities and infrastructure
9. **Complaint Handling** - Effectiveness of complaint handling

### Rating Scale
Each element is rated with scale **1-4**:
- **1** = Poor
- **2** = Fair
- **3** = Good
- **4** = Excellent

### SKM Value Calculation

**Formula**:
```
SKM Value = (Average Score / 4) × 100
```

**Example**:
- Answers: [4, 4, 3, 4, 4, 4, 4, 3, 3]
- Total: 33
- Average: 33/9 = 3.67
- **SKM Value**: (3.67/4) × 100 = **91.67**

### Service Quality Category

| SKM Value | Category | Quality | Performance |
|-----------|----------|------|---------||
| 88.31 - 100.00 | **Excellent** | A | Excellent |
| 76.61 - 88.30 | **Good** | B | Good |
| 65.00 - 76.60 | **Fair** | C | Fair |
| 25.00 - 64.99 | **Poor** | D | Poor |

---

## 💾 Database Schema

### Table: `skm`

```sql
CREATE TABLE skm (
  id INT PRIMARY KEY AUTO_INCREMENT,
  permohonan_id INT NOT NULL,
  user_id INT NOT NULL COMMENT 'ID pemohon yang mengisi SKM',
  nomor_registrasi VARCHAR(255),
  jawaban_json JSON NOT NULL COMMENT 'Jawaban survei dalam format JSON',
  status ENUM('pending', 'completed') DEFAULT 'pending',
  submitted_at DATETIME COMMENT 'Waktu submit SKM',
  notified_at DATETIME COMMENT 'Waktu notifikasi dikirim',
  download_unlocked BOOLEAN DEFAULT FALSE COMMENT 'Status unlock download',
  download_unlocked_at DATETIME COMMENT 'Waktu unlock download',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | INT | Primary key |
| `permohonan_id` | INT | Application ID from Application Service |
| `user_id` | INT | Applicant user ID |
| `nomor_registrasi` | VARCHAR(255) | Application registration number |
| `jawaban_json` | JSON | Survey answers with 9 elements |
| `status` | ENUM | SKM status: 'pending' or 'completed' |
| `submitted_at` | DATETIME | SKM submission timestamp |
| `notified_at` | DATETIME | Notification sent timestamp |
| `download_unlocked` | BOOLEAN | Permit download unlock flag |
| `download_unlocked_at` | DATETIME | Download unlock timestamp |
| `created_at` | DATETIME | Created timestamp |
| `updated_at` | DATETIME | Updated timestamp |

### Sample Data

```sql
INSERT INTO skm (
  permohonan_id, 
  user_id, 
  nomor_registrasi,
  jawaban_json,
  status,
  submitted_at,
  notified_at,
  download_unlocked
) VALUES (
  1,
  5,
  'REG/2024/01/0001',
  '{"answers":[{"id":1,"nilai":4,"unsur":"Persyaratan"},{"id":2,"nilai":4,"unsur":"Prosedur"}]}',
  'completed',
  '2024-01-20 10:30:00',
  '2024-01-20 10:00:00',
  TRUE
);
```

---

## 🧪 Testing

### Postman Collection
Import collection dari:
```
postman/Survey_Service.postman_collection.json
postman/Survey_Service.postman_environment.json
```

### Testing Steps

1. **Import Collection & Environment**
   ```
   - Open Postman
   - Import collection & environment
   - Select "Survey Service Environment"
   ```

2. **Login to Get Token**
   ```
   Folder: "0. Setup - Login"
   Request: "Login as Admin"
   → accessToken auto-saved
   ```

3. **Test All Endpoints**
   ```
   1. Send Notifikasi SKM → skm_id auto-saved
   2. Get Form SKM → Verify 9 questions
   3. Submit SKM → Verify SKM calculation
   4. Get Rekap SKM → Verify statistics
   5. Unlock Download → Verify unlock status
   6. Trigger Archive → Verify archive call
   ```

### Automated Tests
Each request has automated tests:
- ✅ Status code validation
- ✅ Response structure validation
- ✅ Auto-save environment variables
- ✅ SKM calculation verification
- ✅ Category validation

### Manual Database Check
```sql
-- Check all SKM records
SELECT * FROM jelita_survei.skm;

-- Check completed SKM with scores
SELECT 
  id,
  permohonan_id,
  nomor_registrasi,
  status,
  jawaban_json,
  submitted_at
FROM jelita_survei.skm
WHERE status = 'completed';

-- Calculate average SKM manually
SELECT 
  AVG(
    (JSON_EXTRACT(jawaban_json, '$.answers[0].nilai') +
     JSON_EXTRACT(jawaban_json, '$.answers[1].nilai') +
     JSON_EXTRACT(jawaban_json, '$.answers[2].nilai') +
     JSON_EXTRACT(jawaban_json, '$.answers[3].nilai') +
     JSON_EXTRACT(jawaban_json, '$.answers[4].nilai') +
     JSON_EXTRACT(jawaban_json, '$.answers[5].nilai') +
     JSON_EXTRACT(jawaban_json, '$.answers[6].nilai') +
     JSON_EXTRACT(jawaban_json, '$.answers[7].nilai') +
     JSON_EXTRACT(jawaban_json, '$.answers[8].nilai')) / 9 / 4 * 100
  ) as average_skm_value
FROM jelita_survei.skm
WHERE status = 'completed';
```

---

## 🔗 Integration

### Service Architecture

```
┌──────────────────┐
│ User & Auth      │
│ Service (3001)   │ ← JWT Authentication
└──────────────────┘
         ↓
┌──────────────────┐       ┌──────────────────┐
│ Application      │       │ Workflow         │
│ Service (3010)   │←─────→│ Service (3020)   │
└──────────────────┘       └──────────────────┘
         ↓                          ↓
         │                  Izin Disetujui
         ↓                          ↓
┌──────────────────┐       ┌──────────────────┐
│ Survey (SKM)     │       │ Archive          │
│ Service (3030)   │──────→│ Service (3040)   │
└──────────────────┘       └──────────────────┘
```

### Integration Points

**1. Application Service → Survey Service**
```javascript
// Application Service calls Survey Service after approval
const response = await axios.post('http://localhost:3030/api/skm/notifikasi', {
  permohonan_id: 1,
  user_id: 5,
  nomor_registrasi: 'REG/2024/01/0001'
});
```

**2. Survey Service → Application Service**
```javascript
// Survey Service notifies Application Service after SKM completed
const response = await axios.post('http://localhost:3010/api/internal/unlock-download', {
  permohonan_id: 1
});
```

**3. Survey Service → Archive Service**
```javascript
// Survey Service triggers Archive Service after download
const response = await axios.post('http://localhost:3040/api/internal/arsipkan-dokumen', {
  permohonan_id: 1,
  nomor_registrasi: 'REG/2024/01/0001',
  user_id: 5
});
```

---

## 📝 Project Structure

```
layanan-survei/
├── server.js                    # Main application entry point
├── package.json                 # Dependencies
├── .env                         # Environment variables
│
├── models/
│   └── SKM.js                   # SKM model (Sequelize)
│
├── routes/
│   └── surveyRoutes.js          # All API endpoints
│
├── middleware/
│   └── authMiddleware.js        # JWT validation & role check
│
├── utils/
│   └── database.js              # Sequelize configuration
│
├── scripts/
│   ├── createDatabase.js        # Create jelita_survei database
│   └── setupDatabase.js         # Sync models to create tables
│
├── postman/
│   ├── Survey_Service.postman_collection.json
│   ├── Survey_Service.postman_environment.json
│   ├── TESTING_GUIDE.md         # Comprehensive testing guide
│   └── QUICK_START.md           # Quick start guide
│
└── README.md                    # This file
```

---

## 🚨 Error Handling

### Common Errors

| Status | Error | Solution |
|--------|-------|----------|
| 400 | SKM has not been completed | Submit SKM first |
| 401 | No token provided | Login to get token |
| 403 | Access denied | Login with appropriate role |
| 404 | SKM not found | Send SKM notification first |
| 500 | Archive Service error | Ensure Archive Service is running |

### Error Response Format
```json
{
  "message": "Error message here",
  "error": "Detailed error information"
}
```

---

## 📖 Documentation

- **Testing Guide**: `postman/TESTING_GUIDE.md` - Comprehensive testing documentation
- **Quick Start**: `postman/QUICK_START.md` - Quick reference guide
- **API Collection**: Import `postman/Survey_Service.postman_collection.json`
- **Environment**: Import `postman/Survey_Service.postman_environment.json`

---

## 🔐 Security

- **JWT Authentication**: All user-facing endpoints require valid JWT token
- **Role-Based Access**: Different roles (Admin, OPD, Pemohon, Pimpinan) have different permissions
- **Internal Endpoints**: No auth required, designed for service-to-service communication
- **Environment Variables**: Sensitive data stored in `.env` (not committed to git)

---

## 🎯 Future Improvements

- [ ] Email/SMS notification integration
- [ ] Real-time SKM dashboard
- [ ] Export SKM statistics to Excel/PDF
- [ ] Reminder notification for pending SKM
- [ ] Multi-language support
- [ ] SKM analytics & trends
- [ ] Mobile-responsive survey form

---

## 📞 Support

For issues or questions:
- Check `postman/TESTING_GUIDE.md` for detailed troubleshooting
- Verify all services are running (Auth, Application, Survey)
- Check database connection and table structure
- Review Postman automated test results

---

## 📄 License

Internal use only - Jelita System

---

**Version**: 1.0.0  
**Last Updated**: Desember 2025  
**Maintained by**: Jelita Development Team
