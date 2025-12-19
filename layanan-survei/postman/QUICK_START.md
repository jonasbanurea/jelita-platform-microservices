# 🚀 Quick Start Guide - Survey (SKM) Service

Quick guide for testing Survey Service with Postman.

---

## ⚡ Quick Setup (5 Minutes)

### 1. Start Services
```powershell
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

### 2. Import to Postman
1. Open Postman
2. Import `postman/Survey_Service.postman_collection.json`
3. Import `postman/Survey_Service.postman_environment.json`
4. Select **"Survey Service Environment"**

### 3. Run Tests
Click **"Run Collection"** → Survey Service → **Run**

---

## 📋 Testing Checklist

### ✅ Pre-Flight
- [ ] MySQL running
- [ ] Database `jelita_survei` created
- [ ] Auth Service (3001) running
- [ ] Application Service (3010) running  
- [ ] Survey Service (3030) running
- [ ] Postman environment selected

### ✅ Test Flow
- [ ] 1️⃣ Login as Admin
- [ ] 2️⃣ Send Notifikasi SKM
- [ ] 3️⃣ Get Form SKM (no auth)
- [ ] 4️⃣ Login as Pemohon
- [ ] 5️⃣ Submit SKM
- [ ] 6️⃣ Get Rekap SKM
- [ ] 7️⃣ Unlock Download (internal)
- [ ] 8️⃣ Trigger Archive (internal)

---

## 🎯 Quick Test Scenarios

### Scenario 1: Perfect Score (100)
**Submit Request**:
```json
{
  "permohonan_id": 1,
  "jawaban_json": {
    "answers": [
      {"id": 1, "nilai": 4}, {"id": 2, "nilai": 4},
      {"id": 3, "nilai": 4}, {"id": 4, "nilai": 4},
      {"id": 5, "nilai": 4}, {"id": 6, "nilai": 4},
      {"id": 7, "nilai": 4}, {"id": 8, "nilai": 4},
      {"id": 9, "nilai": 4}
    ]
  }
}
```
**Expected**: SKM Value = 100.00, Category = "Sangat Baik"

---

### Scenario 2: Average Score (75)
**Submit Request**:
```json
{
  "permohonan_id": 2,
  "jawaban_json": {
    "answers": [
      {"id": 1, "nilai": 3}, {"id": 2, "nilai": 3},
      {"id": 3, "nilai": 3}, {"id": 4, "nilai": 3},
      {"id": 5, "nilai": 3}, {"id": 6, "nilai": 3},
      {"id": 7, "nilai": 3}, {"id": 8, "nilai": 3},
      {"id": 9, "nilai": 3}
    ]
  }
}
```
**Expected**: SKM Value = 75.00, Category = "Kurang Baik"

---

### Scenario 3: Mixed Scores (91.67)
**Submit Request**:
```json
{
  "permohonan_id": 3,
  "jawaban_json": {
    "answers": [
      {"id": 1, "nilai": 4}, {"id": 2, "nilai": 4},
      {"id": 3, "nilai": 3}, {"id": 4, "nilai": 4},
      {"id": 5, "nilai": 4}, {"id": 6, "nilai": 4},
      {"id": 7, "nilai": 4}, {"id": 8, "nilai": 3},
      {"id": 9, "nilai": 3}
    ],
    "saran": "Pelayanan sangat baik, perlu perbaikan sarana prasarana"
  }
}
```
**Expected**: SKM Value = 91.67, Category = "Sangat Baik"

---

## 🔍 Quick Validation

### Check Database
```sql
-- All SKM records
SELECT * FROM jelita_survei.skm;

-- Completed SKM only
SELECT 
  id, permohonan_id, status, submitted_at, download_unlocked
FROM jelita_survei.skm 
WHERE status = 'completed';

-- Count by status
SELECT status, COUNT(*) as total 
FROM jelita_survei.skm 
GROUP BY status;
```

### Check Server Status
```powershell
# Check if services are running
netstat -ano | findstr :3001  # Auth Service
netstat -ano | findstr :3010  # Application Service
netstat -ano | findstr :3030  # Survey Service
```

---

## 📊 SKM Calculation Cheat Sheet

| Total Score | Average | SKM Value | Category |
|-------------|---------|-----------|----------|
| 36 | 4.00 | 100.00 | Sangat Baik ⭐⭐⭐⭐ |
| 33 | 3.67 | 91.67 | Sangat Baik ⭐⭐⭐⭐ |
| 31 | 3.44 | 86.11 | Baik ⭐⭐⭐ |
| 27 | 3.00 | 75.00 | Kurang Baik ⭐⭐ |
| 24 | 2.67 | 66.67 | Kurang Baik ⭐⭐ |
| 18 | 2.00 | 50.00 | Tidak Baik ⭐ |

**Formula**: `SKM Value = (Average / 4) × 100`

---

## 🛠️ Troubleshooting

### ❌ "Token not provided"
**Fix**: Login first to get `accessToken`

### ❌ "SKM tidak ditemukan"
**Fix**: Send SKM notification first using endpoint `/api/skm/notifikasi`

### ❌ "SKM has not been completed"
**Fix**: Submit SKM first before unlock download

### ❌ "Failed to trigger Archive Service"
**Fix**: 
```powershell
# Check Archive Service
netstat -ano | findstr :3040
# If not running, start Archive Service
```

### ❌ "Access denied. Required role: Pemohon"
**Fix**: Login with user role Pemohon to submit SKM

---

## 📱 Environment Variables Quick Reference

| Variable | Default Value | Description |
|----------|--------------|-------------|
| `survey_base_url` | http://localhost:3030 | Survey Service |
| `auth_base_url` | http://localhost:3001 | Auth Service |
| `application_base_url` | http://localhost:3010 | Application Service |
| `accessToken` | (auto-saved) | JWT from login |
| `admin_username` | `demo` | Admin username |
| `admin_password` | `demo123` | Admin password |
| `permohonan_id` | (manual) | Application ID |
| `pemohon_user_id` | (manual) | Pemohon user ID |
| `skm_id` | (auto-saved) | SKM record ID |

---

## 🎯 API Quick Reference

### 1. Send Notifikasi (Admin/OPD)
```http
POST /api/skm/notifikasi
Authorization: Bearer {{accessToken}}

Body: { "permohonan_id": 1, "user_id": 5, "nomor_registrasi": "REG/..." }
```

### 2. Get Form (Public - No Auth)
```http
GET /api/skm/form
```

### 3. Submit SKM (Pemohon)
```http
POST /api/skm/submit
Authorization: Bearer {{accessToken}}

Body: { "permohonan_id": 1, "jawaban_json": {...} }
```

### 4. Get Rekap (Admin/OPD/Pimpinan)
```http
GET /api/skm/rekap?status=completed&startDate=2024-01-01
Authorization: Bearer {{accessToken}}
```

### 5. Unlock Download (Internal)
```http
POST /api/internal/buka-akses-download

Body: { "permohonan_id": 1 }
```

### 6. Trigger Archive (Internal)
```http
POST /api/internal/trigger-pengarsipan

Body: { "permohonan_id": 1, "nomor_registrasi": "REG/...", "user_id": 5 }
```

---

## 📦 Sample Requests

### Get Test Data
```sql
-- Get permohonan_id from Application Service
SELECT id, nomor_registrasi, status 
FROM jelita_pendaftaran.permohonan 
WHERE status = 'Disetujui' 
LIMIT 1;

-- Get user_id for Pemohon
SELECT id, username, role 
FROM jelita_users.users 
WHERE role = 'Pemohon' 
LIMIT 1;
```

### Create Test SKM
```sql
-- Manual insert for testing
INSERT INTO jelita_survei.skm (
  permohonan_id, user_id, nomor_registrasi, 
  jawaban_json, status, submitted_at, notified_at
) VALUES (
  1, 5, 'REG/2024/01/0001',
  '{"answers":[{"id":1,"nilai":4},...]}',
  'completed', NOW(), NOW()
);
```

---

## ⚡ One-Liner Commands

### Setup Database
```powershell
cd d:\KULIAH\TESIS\prototype_eng\layanan-survei; node scripts/createDatabase.js; node scripts/setupDatabase.js
```

### Start All Services
```powershell
# Use 3 separate terminals
start powershell -NoExit -Command "cd d:\KULIAH\TESIS\prototype_eng\layanan-manajemen-pengguna; npm start"
start powershell -NoExit -Command "cd d:\KULIAH\TESIS\prototype_eng\layanan-pendaftaran; npm start"
start powershell -NoExit -Command "cd d:\KULIAH\TESIS\prototype_eng\layanan-survei; npm start"
```

### Check All Services
```powershell
netstat -ano | findstr "3001 3010 3030"
```

---

## 📚 Need More Help?

- 📖 **Full Documentation**: See `README.md`
- 🧪 **Detailed Testing**: See `postman/TESTING_GUIDE.md`
- 🔗 **Postman Collection**: Import `postman/Survey_Service.postman_collection.json`

---

## ✅ Success Indicators

After successful testing, you should see:

- ✅ All 6 endpoints return 200/201 status codes
- ✅ Automated Postman tests all pass (green checkmarks)
- ✅ Environment variables auto-saved (`accessToken`, `skm_id`)
- ✅ Database has SKM records with calculated scores
- ✅ SKM categories correctly assigned
- ✅ Download unlock status = true after completion

---

For detailed explanations, see `TESTING_GUIDE.md`
