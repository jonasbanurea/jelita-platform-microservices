# 🚀 Quick Start Guide - Archive Service

Quick guide for testing Archive Service with Postman.

---

## ⚡ Quick Setup (3 Minutes)

### 1. Start All Services
```powershell
# Check all services
netstat -ano | findstr "3001 3010 3020 3030 3040"
```

**Expected**: All 5 ports should be listening

### 2. Import to Postman
1. Open Postman
2. Import `postman/Archive_Service.postman_collection.json`
3. Import `postman/Archive_Service.postman_environment.json`
4. Select **"Archive Service Environment"****

### 3. Run Tests
Click **"Run Collection"** → Archive Service → **Run**

---

## 📋 Testing Checklist

### ✅ Pre-Flight
- [ ] MySQL running
- [ ] Database `jelita_arsip` created  
- [ ] Auth Service (3001) running
- [ ] Archive Service (3040) running
- [ ] Postman environment selected
- [ ] `permohonan_id` set in environment

### ✅ Test Flow (6 Steps)
- [ ] 1️⃣ Login as Admin
- [ ] 2️⃣ Receive Archive Trigger (Internal - no auth)
- [ ] 3️⃣ Archive License Document
- [ ] 4️⃣ Set Hak Akses OPD
- [ ] 5️⃣ Get Archive Data (Admin)
- [ ] 6️⃣ Login as OPD & Get Archive (with access check)

---

## 🎯 Quick Test Scenarios

### Scenario 1: Complete Archive Flow
```
Trigger → Archive → Set Access → Retrieve
```

**Steps**:
1. Receive trigger from Survey Service (POST /api/internal/arsipkan-dokumen)
2. Archive the license document (POST /api/arsip/archive-izin)
3. Grant OPD access rights (POST /api/arsip/set-hak-akses)
4. Retrieve archive data (GET /api/arsip/:id)

---

### Scenario 2: OPD Access Control
**Test**: OPD can only access archives they have permission for

1. Set hak_akses_opd = [2] (OPD user ID 2)
2. Login as OPD (user_id = 2) → ✅ Access granted
3. Login as OPD (user_id = 3) → ❌ Access denied

---

## 🔍 Quick Validation

### Check Database
```sql
-- All archive records
SELECT * FROM jelita_arsip.arsip;

-- Check status
SELECT 
  id, permohonan_id, status, archived_at, hak_akses_opd
FROM jelita_arsip.arsip;

-- Count by status
SELECT status, COUNT(*) as total
FROM jelita_arsip.arsip
GROUP BY status;
```

### Check Server Status
```powershell
# Check Archive Service
netstat -ano | findstr :3040
```

---

## 📊 Archive Status Flow

| Status | Description | When |
|--------|-------------|------|
| `pending` | Trigger received, waiting for file upload | After receive trigger |
| `archived` | Document archived with file_path | After archive-izin |
| `accessed` | Document has been accessed | After GET /arsip/:id |

---

## 🛠️ Troubleshooting

### ❌ "Token not provided"
**Fix**: Login first to get `accessToken`

### ❌ "Archive not found"
**Fix**: 
1. Receive trigger first (POST /api/internal/arsipkan-dokumen)
2. Check `arsip_id` saved in environment

### ❌ "Access denied. You do not have permission"
**Fix**: OPD user trying to access archive without permission
- Set hak_akses_opd with OPD user ID first
- Or login as Admin (Admin has access to all archives)

### ❌ Port 3040 already in use
**Fix**:
```powershell
netstat -ano | findstr :3040
taskkill /F /PID <PID>
cd d:\KULIAH\TESIS\prototype_eng\layanan-arsip
node server.js
```

---

## 📱 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `archive_base_url` | http://localhost:3040 | Archive Service |
| `auth_base_url` | http://localhost:3001 | Auth Service |
| `accessToken` | (auto-saved) | JWT from login |
| `permohonan_id` | 1 | Application ID |
| `arsip_id` | (auto-saved) | Archive ID |

---

## 🎯 API Quick Reference

### 1. Receive Trigger (Internal - No Auth)
```http
POST /api/internal/arsipkan-dokumen

Body: {
  "permohonan_id": 1,
  "nomor_registrasi": "REG/2024/11/0001",
  "user_id": 4,
  "triggered_from": "survey_service"
}
```

### 2. Archive License (Admin/OPD)
```http
POST /api/arsip/archive-izin
Authorization: Bearer {{accessToken}}

Body: {
  "permohonan_id": 1,
  "file_path": "/uploads/licenses/2024/11/REG-2024-11-0001.pdf",
  "metadata_json": {...}
}
```

### 3. Set Access Rights (Admin)
```http
POST /api/arsip/set-hak-akses
Authorization: Bearer {{accessToken}}

Body: {
  "arsip_id": 1,
  "opd_ids": [2, 3]
}
```

### 4. Get Archive Data (Admin/OPD/Pimpinan)
```http
GET /api/arsip/:id
Authorization: Bearer {{accessToken}}
```

---

## 📦 Sample Request Bodies

### Archive with Metadata
```json
{
  "permohonan_id": 1,
  "nomor_registrasi": "REG/2024/11/0001",
  "jenis_izin": "Izin Mendirikan Bangunan",
  "file_path": "/uploads/licenses/2024/11/REG-2024-11-0001.pdf",
  "metadata_json": {
    "file_size": "245KB",
    "pages": 5,
    "format": "PDF",
    "uploaded_by": "Admin",
    "checksum": "abc123def456",
    "encryption": "AES-256"
  }
}
```

---

## ⚡ One-Liner Commands

### Setup Database
```powershell
cd d:\KULIAH\TESIS\prototype_eng\layanan-arsip; node scripts/createDatabase.js; node scripts/setupDatabase.js
```

### Start Archive Service
```powershell
cd d:\KULIAH\TESIS\prototype_eng\layanan-arsip; node server.js
```

### Check All Services
```powershell
netstat -ano | findstr "3001 3010 3020 3030 3040"
```

---

## 📚 Need More Help?

- 📖 **Full Documentation**: See `README.md`
- 🧪 **Detailed Testing**: See `postman/TESTING_GUIDE.md`
- 🔗 **Postman Collection**: Import `postman/Archive_Service.postman_collection.json`

---

## ✅ Success Indicators

- ✅ All 4 endpoints return 200/201 status codes
- ✅ Automated Postman tests all pass
- ✅ Environment variables auto-saved (`arsip_id`)
- ✅ Database has archive records with correct status
- ✅ OPD access control working
- ✅ Internal endpoint works without auth

---

For detailed explanations, see `TESTING_GUIDE.md`
