# ✅ WORKFLOW SERVICE - SETUP COMPLETED!

## 🎉 Complete Status

### ✅ Completed Tasks

1. **Database Setup**
   - ✅ Database `jelita_workflow` created
   - ✅ 4 tables created:
     - `disposisi`
     - `kajian_teknis`
     - `draft_izin`
     - `revisi_draft`
   - ✅ Foreign keys and constraints configured

2. **Server Setup**
   - ✅ Dependencies installed
   - ✅ Server running on **Port 3020**
   - ✅ 5 workflow endpoints ready to use

3. **Models Created**
   - ✅ Disposisi.js (enhanced)
   - ✅ KajianTeknis.js (enhanced)
   - ✅ DraftIzin.js (new)
   - ✅ RevisiDraft.js (new)

4. **Routes Implemented**
   - ✅ POST /api/workflow/disposisi-opd (Admin)
   - ✅ POST /api/workflow/kajian-teknis (OPD)
   - ✅ POST /api/workflow/forward-to-pimpinan (Admin)
   - ✅ POST /api/workflow/revisi-draft (Pimpinan)
   - ✅ POST /api/internal/receive-trigger (Internal)

5. **Documentation**
   - ✅ TESTING_GUIDE.md (50+ halaman)
   - ✅ README.md
   - ✅ QUICK_START.md
   - ✅ Postman Collection
   - ✅ Postman Environment

---

## 🚀 HOW TO START TESTING

### Step 1: Create OPD and Leadership Users

**Run the following SQL in MySQL**:

```sql
USE jelita_users;

-- OPD User (if not exists)
INSERT INTO users (username, password_hash, nama_lengkap, role, created_at, updated_at)
VALUES (
  'opd_demo',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password: demo123
  'Demo OPD User',
  'OPD',
  NOW(),
  NOW()
);

-- Leadership User (if not exists)
INSERT INTO users (username, password_hash, nama_lengkap, role, created_at, updated_at)
VALUES (
  'pimpinan_demo',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password: demo123
  'Demo Pimpinan',
  'Pimpinan',
  NOW(),
  NOW()
);

-- Check all users
SELECT id, username, nama_lengkap, role FROM users;
```

**Save the user ID with OPD role** (will be used in Postman).

---

### Step 2: Import ke Postman

1. Buka Postman
2. Klik **Import**
3. Import file:
   - `layanan-alur-kerja/postman/Workflow_Service.postman_collection.json`
   - `layanan-alur-kerja/postman/Workflow_Service.postman_environment.json`
4. Pilih environment **"Workflow Service Environment"**

---

### Step 3: Set Environment Variables

In Postman, click the eye icon (👁️) at the top right, then edit environment:

| Variable | Value | Description |
|----------|-------|-------------|
| `workflow_base_url` | `http://localhost:3020` | Already filled |
| `auth_base_url` | `http://localhost:3001` | Already filled |
| `permohonan_id` | **FILL MANUALLY** | ID from Application Service |
| `opd_user_id` | **FILL MANUALLY** | User ID with OPD role |

**How to get permohonan_id**:
```sql
-- From Application Service
SELECT id, nomor_registrasi, status FROM jelita_permohonan.permohonan LIMIT 1;
```

Or create a new application via Postman (Application Service collection).

---

### Step 4: Testing Flow

**Testing sequence for 5 endpoints**:

#### 1️⃣ Login as Admin
Collection: **User & Auth Service**  
Request: **POST /api/auth/signin**  
Body:
```json
{
  "username": "demo",
  "password": "demo123"
}
```
✅ Token saved automatically in `{{accessToken}}`

---

#### 2️⃣ Create OPD Disposition
Collection: **Workflow Service**  
Request: **POST /api/workflow/disposisi-opd**  
Body:
```json
{
  "permohonan_id": 1,
  "nomor_registrasi": "REG/2024/01/0001",
  "opd_id": 2,
  "catatan_disposisi": "Please conduct technical review immediately"
}
```
**Expected**: Status 201, `disposisi_id` saved

---

#### 3️⃣ Login as OPD
Collection: **User & Auth Service**  
Request: **POST /api/auth/signin**  
Body:
```json
{
  "username": "opd_demo",
  "password": "demo123"
}
```
✅ OPD token replaces Admin token

---

#### 4️⃣ Input Technical Review
Collection: **Workflow Service**  
Request: **POST /api/workflow/kajian-teknis**  
Body:
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
**Expected**: Status 201, `kajian_id` saved

---

#### 5️⃣ Login as Admin (again)
Repeat step 1 to get Admin token

---

#### 6️⃣ Forward Draft to Leadership
Collection: **Workflow Service**  
Request: **POST /api/workflow/forward-to-pimpinan**  
Body:
```json
{
  "permohonan_id": 1,
  "nomor_registrasi": "REG/2024/01/0001",
  "nomor_draft": "DRAFT/2024/01/0001",
  "isi_draft": "REGIONAL HEAD DECISION\nNUMBER: DRAFT/2024/01/0001..."
}
```
**Expected**: Status 201, `draft_id` saved, status `dikirim_ke_pimpinan`

---

#### 7️⃣ Login as Leadership
Collection: **User & Auth Service**  
Request: **POST /api/auth/signin**  
Body:
```json
{
  "username": "pimpinan_demo",
  "password": "demo123"
}
```

---

#### 8️⃣ Request Draft Revision
Collection: **Workflow Service**  
Request: **POST /api/workflow/revisi-draft**  
Body:
```json
{
  "draft_id": 1,
  "catatan_revisi": "Please revise the legal considerations section..."
}
```
**Expected**: 
- Status 201
- Draft status → `perlu_revisi`
- Revision record created
- `revisi_id` saved

---

## 📊 Database Validation

```sql
-- Check disposition
SELECT * FROM jelita_workflow.disposisi;

-- Check technical review
SELECT * FROM jelita_workflow.kajian_teknis;

-- Check permit draft
SELECT * FROM jelita_workflow.draft_izin;

-- Check draft revision
SELECT * FROM jelita_workflow.revisi_draft;

-- Full workflow (join all tables)
SELECT 
  d.nomor_registrasi,
  d.status AS disposisi_status,
  kt.hasil_kajian,
  di.nomor_draft,
  di.status AS draft_status,
  rd.catatan_revisi
FROM disposisi d
LEFT JOIN kajian_teknis kt ON d.permohonan_id = kt.permohonan_id
LEFT JOIN draft_izin di ON d.permohonan_id = di.permohonan_id
LEFT JOIN revisi_draft rd ON di.id = rd.draft_id;
```

---

## 🔧 Troubleshooting

### Server not running?
```powershell
Set-Location -Path 'd:\KULIAH\TESIS\prototype_eng\layanan-alur-kerja'
node server.js
```

### Port 3020 already in use?
```powershell
netstat -ano | findstr :3020
taskkill /PID <PID> /F
```

### Token expired?
Login again to get a new token (token valid for 1 hour).

### Database error?
```powershell
# Recreate database
cd d:\KULIAH\TESIS\prototype_eng\layanan-alur-kerja
node scripts/createDatabase.js
node scripts/setupDatabase.js
```

---

## 📂 File Structure

```
layanan-alur-kerja/
├── middleware/
│   └── authMiddleware.js           ✅ Created
├── models/
│   ├── Disposisi.js                ✅ Enhanced
│   ├── KajianTeknis.js             ✅ Enhanced
│   ├── DraftIzin.js                ✅ Created
│   └── RevisiDraft.js              ✅ Created
├── routes/
│   └── workflowRoutes.js           ✅ 5 endpoints
├── scripts/
│   ├── createDatabase.js           ✅ Created
│   ├── setupDatabase.js            ✅ Created
│   └── createTestUsers.js          ✅ Created
├── postman/
│   ├── Workflow_Service.postman_collection.json  ✅ Created
│   ├── Workflow_Service.postman_environment.json ✅ Created
│   └── TESTING_GUIDE.md            ✅ 50+ pages
├── utils/
│   └── database.js                 ✅ Configured
├── .env                            ✅ Configured
├── package.json                    ✅ Updated
├── server.js                       ✅ Running
├── README.md                       ✅ Complete
└── QUICK_START.md                  ✅ Complete
```

---

## 📚 Documentation

- **Quick Start**: `QUICK_START.md` (short guide)
- **Full Testing Guide**: `postman/TESTING_GUIDE.md` (50+ pages)
- **README**: `README.md` (API documentation)
- **Postman Collection**: `postman/Workflow_Service.postman_collection.json`
- **Postman Environment**: `postman/Workflow_Service.postman_environment.json`

---

## 🎯 Final Checklist

### Pre-Testing
- [ ] MySQL Server running
- [ ] User & Auth Service running (port 3001)
- [ ] Application Service running (port 3010)
- [ ] Workflow Service running (port 3020)
- [ ] OPD user created
- [ ] Leadership user created
- [ ] Postman collection imported
- [ ] Postman environment imported & activated
- [ ] Environment variables filled (`permohonan_id`, `opd_user_id`)

### Testing
- [ ] Test 1: Login Admin ✅
- [ ] Test 2: Create Disposition ✅
- [ ] Test 3: Login OPD ✅
- [ ] Test 4: Input Technical Review ✅
- [ ] Test 5: Login Admin (again) ✅
- [ ] Test 6: Forward Draft ✅
- [ ] Test 7: Login Leadership ✅
- [ ] Test 8: Request Revision ✅

### Validation
- [ ] All Postman tests PASS
- [ ] Data saved in database
- [ ] Environment variables auto-saved
- [ ] Role-based access working
- [ ] Timestamps generated correctly

---

## 🎉 COMPLETED!

Workflow Service is **READY TO USE**!

**Next Steps**:
1. ✅ Run all 3 services (auth, application, workflow)
2. ✅ Create OPD and Leadership users (SQL above)
3. ✅ Import Postman collection & environment
4. ✅ Set environment variables
5. ✅ Test 8 steps above
6. ✅ Verify in database

**Complete Documentation**: Read `postman/TESTING_GUIDE.md` for details.

---

**Support**: If you have questions or issues, check troubleshooting in TESTING_GUIDE.md.


