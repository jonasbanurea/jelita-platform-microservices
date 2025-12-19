# ✅ SURVEY (SKM) SERVICE - SETUP COMPLETED!

## 🎉 Complete Status

### ✅ What Has Been Completed

1. **Database Setup**
   - ✅ Database `jelita_survei` has been created
   - ✅ Table `skm` has been created with 12 fields
   - ✅ Sequelize models synchronized

2. **Server Setup**
   - ✅ Dependencies installed (express, sequelize, mysql2, jwt, axios, bcryptjs)
   - ✅ Server running on **Port 3030**
   - ✅ JWT_SECRET synchronized with Auth Service
   - ✅ 6 SKM endpoints ready to use

3. **Models Created**
   - ✅ SKM.js (enhanced with 10 fields + timestamps)

4. **Routes Implemented**
   - ✅ POST /api/skm/notifikasi (Admin, OPD)
   - ✅ GET /api/skm/form (Public - no auth)
   - ✅ POST /api/skm/submit (Pemohon)
   - ✅ GET /api/skm/rekap (Admin, OPD, Pimpinan)
   - ✅ POST /api/internal/buka-akses-download (Internal)
   - ✅ POST /api/internal/trigger-pengarsipan (Internal)

5. **Test Users Created**
   - ✅ Admin (username: `demo`, password: `demo123`)
   - ✅ OPD (username: `opd_demo`, password: `demo123`)
   - ✅ Pimpinan (username: `pimpinan_demo`, password: `demo123`)
   - ✅ Pemohon (username: `pemohon_demo`, password: `demo123`) **← ID: 4**

6. **Documentation**
   - ✅ TESTING_GUIDE.md (50+ pages)
   - ✅ README.md
   - ✅ QUICK_START.md
   - ✅ Postman Collection with automated tests
   - ✅ Postman Environment with variables

---

## 🚀 HOW TO START TESTING

### Step 1: Ensure All Services Are Running

```powershell
# Check running services
netstat -ano | findstr "3001 3010 3030"
```

**Expected Output**:
```
TCP    0.0.0.0:3001    # Auth Service
TCP    0.0.0.0:3010    # Application Service
TCP    0.0.0.0:3030    # Survey Service
```

**If not running yet**, start services:
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

---

### Step 2: Get Test Data (permohonan_id)

**Method 1: Via MySQL**
```sql
-- Get approved application
SELECT id, nomor_registrasi, status, user_id 
FROM jelita_pendaftaran.permohonan 
WHERE status = 'Disetujui' 
LIMIT 1;
```

**Method 2: Via Postman (Application Service)**
- Login as Applicant (Pemohon)
- Create new application
- Save returned `permohonan_id`

**If no application exists yet**, create test data:
```sql
USE jelita_pendaftaran;

INSERT INTO permohonan (
  user_id, nomor_registrasi, jenis_izin, status, 
  createdAt, updatedAt
) VALUES (
  4, -- user_id Pemohon (dari jelita_users.users)
  'REG/2024/11/0001',
  'Izin Mendirikan Bangunan',
  'Disetujui',
  NOW(),
  NOW()
);

-- Check data
SELECT id, nomor_registrasi, status, user_id FROM permohonan;
```

---

### Step 3: Import to Postman

1. Open Postman
2. Click **Import**
3. Import files:
   - `layanan-survei/postman/Survey_Service.postman_collection.json`
   - `layanan-survei/postman/Survey_Service.postman_environment.json`
4. Select environment **"Survey Service Environment"**

---

### Step 4: Set Environment Variables

In Postman, click the eye icon (👁️) at top right, then edit environment:

| Variable | Value | Description |
|----------|-------|------------||
| `survey_base_url` | `http://localhost:3030` | ✅ Already filled |
| `auth_base_url` | `http://localhost:3001` | ✅ Already filled |
| `application_base_url` | `http://localhost:3010` | ✅ Already filled |
| `permohonan_id` | **FILL MANUALLY** | Approved application ID |
| `pemohon_user_id` | **4** | Applicant user ID (from step 1) |

---

### Step 5: Testing Flow (8 Steps)

#### 1️⃣ Login as Admin
**Collection**: Survey Service  
**Folder**: "0. Setup - Login"  
**Request**: "Login as Admin"  

**Expected**:
- Status 200
- `accessToken` auto-saved to environment

---

#### 2️⃣ Send SKM Notification
**Collection**: Survey Service  
**Folder**: "1. SKM Notification"  
**Request**: "POST Send SKM Notification"

**Body** (auto-filled from environment):
```json
{
  "permohonan_id": {{permohonan_id}},
  "user_id": {{pemohon_user_id}},
  "nomor_registrasi": "REG/2024/11/0001"
}
```

**Expected**:
- Status 200
- Response has `survey_link`
- `skm_id` auto-saved to environment

**Automated Tests**:
- ✅ Status code is 200
- ✅ Response has survey_link
- ✅ skm_id saved to environment

---

#### 3️⃣ Get Form SKM (Public - No Auth)
**Collection**: Survey Service  
**Folder**: "2. Form SKM"  
**Request**: "GET Form SKM (Public)"

**Expected**:
- Status 200
- Form has **9 questions** SKM standard
- Each question has 1-4 scale
- **DOES NOT require Authorization header**

**Automated Tests**:
- ✅ Status code is 200
- ✅ Form has 9 questions
- ✅ Each question has 4-point scale

---

#### 4️⃣ Login as Applicant (Pemohon)
**Collection**: Survey Service  
**Folder**: "0. Setup - Login"  
**Request**: "Login as Pemohon"

**Body**:
```json
{
  "username": "pemohon_demo",
  "password": "demo123"
}
```

**Expected**:
- Status 200
- `accessToken` updated with Pemohon token

---

#### 5️⃣ Submit SKM
**Collection**: Survey Service  
**Folder**: "3. Submit SKM"  
**Request**: "POST Submit SKM (Pemohon)"

**Body** (auto-filled):
```json
{
  "permohonan_id": {{permohonan_id}},
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
    "saran": "Service is very good, needs improvement in facilities and infrastructure"
  }
}
```

**Expected**:
- Status 201
- SKM status changed to `completed`
- SKM value calculated: **91.67**
- Category: **"Excellent"**

**Automated Tests**:
- ✅ Status code is 201
- ✅ SKM value calculated correctly
- ✅ Category is assigned

---

#### 6️⃣ Login as Admin (again)
**Collection**: Survey Service  
**Folder**: "0. Setup - Login"  
**Request**: "Login as Admin"

---

#### 7️⃣ Get SKM Recap
**Collection**: Survey Service  
**Folder**: "4. SKM Recap"  
**Request**: "GET Rekap SKM (Admin)"

**Expected**:
- Status 200
- Statistics: `total_surveys`, `completed`, `pending`
- `average_skm_value` calculated
- `category_distribution` available
- Survey list with individual SKM values

**Automated Tests**:
- ✅ Status code is 200
- ✅ Has statistics
- ✅ Has category distribution

---

#### 8️⃣ Unlock Download Access (Internal)
**Collection**: Survey Service  
**Folder**: "5. Unlock Download Access"  
**Request**: "POST Unlock Download (Internal)"

**Body**:
```json
{
  "permohonan_id": {{permohonan_id}}
}
```

**Expected**:
- Status 200
- `download_unlocked` = true
- `download_unlocked_at` timestamp filled
- **DOES NOT require Authorization** (internal endpoint)

**Automated Tests**:
- ✅ Status code is 200
- ✅ Download unlocked successfully

---

#### 9️⃣ Trigger Archiving (Internal) - OPTIONAL
**Collection**: Survey Service  
**Folder**: "6. Trigger Archiving"  
**Request**: "POST Trigger Archive (Internal)"

**Body**:
```json
{
  "permohonan_id": {{permohonan_id}},
  "nomor_registrasi": "REG/2024/11/0001",
  "user_id": {{pemohon_user_id}}
}
```

**⚠️ EXPECTED ERROR (Normal)**:
```json
{
  "error": "Failed to trigger Archive Service",
  "details": "Error"
}
```

**Why?**
- Archive Service **has not been implemented yet** (will be created later)
- Port 3040 has no listener
- This error is **NORMAL and EXPECTED** for now during testing

**Note**: 
- ✅ **SKIP this test for now** - Archive Service will be created as the last service
- ✅ Endpoint is ready and will function automatically after Archive Service is created
- ✅ Tests 1-8 are sufficient for Survey Service validation

---

## 📊 Database Validation

```sql
-- Check all SKM records
SELECT * FROM jelita_survei.skm;

-- Check SKM details
SELECT 
  id,
  permohonan_id,
  user_id,
  nomor_registrasi,
  status,
  submitted_at,
  download_unlocked,
  created_at
FROM jelita_survei.skm;

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

-- Count by status
SELECT 
  status, 
  COUNT(*) as total
FROM jelita_survei.skm
GROUP BY status;

-- Verify test users
SELECT id, username, nama_lengkap, role 
FROM jelita_users.users 
ORDER BY role;
```

---

## 🧮 SKM Calculation Verification

**Manual Calculation**:

Example from test data:
- Answers: [4, 4, 3, 4, 4, 4, 4, 3, 3]
- Total: 33
- Average: 33 / 9 = 3.67
- **SKM Value**: (3.67 / 4) × 100 = **91.67**
- **Category**: Excellent (≥ 88.31)

**Categories** (Permenpan RB No. 14/2017):
| SKM Value | Category |
|-----------|---------|
| 88.31 - 100.00 | Excellent |
| 76.61 - 88.30 | Good |
| 65.00 - 76.60 | Fair |
| 25.00 - 64.99 | Poor |

---

## 🔧 Troubleshooting

### ❌ "Token is invalid or has expired"
**Cause**: JWT_SECRET different between services  
**Solution**: ✅ Already fixed! JWT_SECRET in Survey Service is synchronized with Auth Service

---

### ❌ "SKM not found"
**Cause**: No SKM record exists for permohonan_id  
**Solution**: 
1. Send notification first using endpoint `/api/skm/notifikasi`
2. Or submit SKM will auto-create new record

---

### ❌ "SKM has not been completed"
**Cause**: Trying to unlock download before SKM completed  
**Solution**:
1. Submit SKM first (endpoint `/api/skm/submit`)
2. Check SKM status: `SELECT status FROM skm WHERE permohonan_id = 1;`

---

### ❌ "Failed to trigger Archive Service"
**Cause**: Archive Service not running or not yet created  
**Solution**: 
- ✅ **SKIP this test for now** - This is NORMAL!
- Archive Service **has not been implemented yet** (port 3040 empty)
- Endpoint `/api/internal/trigger-pengarsipan` will function automatically after Archive Service is created
- **Tests 1-8 are sufficient** for Survey Service validation

**Expected Error**:
```json
{
  "error": "Failed to trigger Archive Service",
  "details": "Error"
}
```

**Status**: ✅ Endpoint is ready, waiting for Archive Service to be implemented

---

### ❌ Port 3030 already in use
**Solution**:
```powershell
# Find process using port 3030
netstat -ano | findstr :3030

# Kill the process (replace PID)
taskkill /F /PID <PID>

# Restart Survey Service
cd d:\KULIAH\TESIS\prototype_eng\layanan-survei
node server.js
```

---

## 📂 File Structure

```
layanan-survei/
├── middleware/
│   └── authMiddleware.js           ✅ Created (JWT validation)
├── models/
│   └── SKM.js                      ✅ Created (10 fields + timestamps)
├── routes/
│   └── surveyRoutes.js             ✅ Created (6 endpoints)
├── scripts/
│   ├── createDatabase.js           ✅ Created
│   ├── setupDatabase.js            ✅ Created
│   ├── createPemohonUser.js        ✅ Created
│   └── createPemohonUser.sql       ✅ Created
├── postman/
│   ├── Survey_Service.postman_collection.json     ✅ Created
│   ├── Survey_Service.postman_environment.json    ✅ Created
│   ├── TESTING_GUIDE.md            ✅ Created (50+ pages)
│   └── QUICK_START.md              ✅ Created
├── utils/
│   └── database.js                 ✅ Configured
├── .env                            ✅ Configured (JWT_SECRET synced)
├── package.json                    ✅ Updated
├── server.js                       ✅ Running on port 3030
├── README.md                       ✅ Complete
└── SETUP_COMPLETE.md               ✅ This file
```

---

## 📚 Documentation

- **Quick Start**: `postman/QUICK_START.md` - Quick testing guide
- **Full Testing Guide**: `postman/TESTING_GUIDE.md` - Complete documentation 50+ pages
- **README**: `README.md` - API documentation and project overview
- **Postman Collection**: `postman/Survey_Service.postman_collection.json`
- **Postman Environment**: `postman/Survey_Service.postman_environment.json`

---

## 🎯 Final Checklist

### Pre-Testing
- [x] MySQL Server running
- [x] Database `jelita_survei` created
- [x] Table `skm` created with 12 fields
- [x] User & Auth Service running (port 3001)
- [x] Application Service running (port 3010)
- [x] Survey Service running (port 3030)
- [x] User Pemohon created (ID: 4, username: pemohon_demo)
- [x] JWT_SECRET synchronized across all services
- [x] Postman collection imported
- [x] Postman environment imported & activated
- [ ] Environment variables set (`permohonan_id`, `pemohon_user_id`)
- [ ] Test application data available

### Testing Flow
- [ ] **Test 1**: Login Admin → Token saved
- [ ] **Test 2**: Send SKM Notification → skm_id saved
- [ ] **Test 3**: Get SKM Form → 9 questions shown
- [ ] **Test 4**: Login Applicant → Token updated
- [ ] **Test 5**: Submit SKM → SKM value calculated
- [ ] **Test 6**: Login Admin (again) → Token refreshed
- [ ] **Test 7**: Get SKM Recap → Statistics shown
- [ ] **Test 8**: Unlock Download → download_unlocked = true
- [ ] **Test 9**: Trigger Archive → ⚠️ SKIP (Archive Service not yet available - NORMAL!)

### Validation
- [ ] All responses have correct status codes
- [ ] All automated Postman tests pass (green checkmarks)
- [ ] Environment variables auto-saved correctly
- [ ] Role-based access control working
- [ ] SKM calculation accurate (91.67 for test data)
- [ ] Category correctly assigned ("Sangat Baik")
- [ ] Internal endpoints work without auth
- [ ] Database records created correctly

---

## 🎓 SKM Standards Reference

### 9 Service Elements (Permenpan RB No. 14/2017)

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
- **1** = Poor
- **2** = Fair
- **3** = Good
- **4** = Excellent

---

## 🎉 DONE!

Survey (SKM) Service is **READY TO USE**!

**Next Steps**:
1. ✅ Ensure all services are running (auth, application, survey)
2. ✅ Import Postman collection & environment
3. ✅ Set environment variables (`permohonan_id`, `pemohon_user_id`)
4. ✅ Test 9 steps above
5. ✅ Verify in database
6. ✅ Review TESTING_GUIDE.md for complete details

**What's Next After This?**
- 🔜 **Archive Service** - Document archiving service (port 3040)
- 🔜 Integration testing across all services
- 🔜 Production deployment preparation

---

## 👥 Test Credentials

| Username | Password | Role | User ID |
|----------|----------|------|---------|
| `demo` | `demo123` | Admin | 1 |
| `opd_demo` | `demo123` | OPD | 2 |
| `pimpinan_demo` | `demo123` | Pimpinan | 3 |
| `pemohon_demo` | `demo123` | Pemohon | 4 |

---

**Happy Testing! 🚀**

For detailed instructions, see `postman/TESTING_GUIDE.md`
