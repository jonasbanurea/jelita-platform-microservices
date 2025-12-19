# 🎯 QUICK TESTING GUIDE - WORKFLOW SERVICE

## ✅ SETUP STATUS

### Database
- ✅ Database `jelita_workflow` created
- ✅ Tables `disposisi`, `kajian_teknis`, `draft_izin`, `revisi_draft` created
- ✅ Foreign keys and constraints configured

### Server
- ✅ Dependencies installed (express, sequelize, mysql2, jsonwebtoken, axios)
- ✅ Server running on **Port 3020**
- ✅ Workflow Service ready to use

---

## 🚀 QUICK START TESTING

### 1. Import to Postman

**Collection & Environment**:
- File: `postman/Workflow_Service.postman_collection.json`
- File: `postman/Workflow_Service.postman_environment.json`

**Import Steps**:
1. Open Postman
2. Click **Import** (top left)
3. Drag & drop both JSON files
4. Select environment **"Workflow Service Environment"** in dropdown (top right)

---

### 2. Environment Variables to Fill Manually

Before testing, set the following values in environment:

| Variable | How to Get Value | Example |
|----------|------------------|----------|
| `permohonan_id` | From Application Service → Create new application | `1` |
| `opd_user_id` | From database → SELECT id FROM jelita_users.users WHERE role='OPD' | `2` |

**Query to get OPD User ID**:
```sql
SELECT id, username, nama_lengkap, role 
FROM jelita_users.users 
WHERE role = 'OPD' 
LIMIT 1;
```

If no OPD user exists, create with:
```sql
INSERT INTO jelita_users.users (username, password_hash, nama_lengkap, role)
VALUES (
  'opd_demo', 
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password: demo123
  'Demo OPD User',
  'OPD'
);
```

---

### 3. Testing Sequence (5 Endpoints)

#### 📍 Test 1: Login as Admin
**Collection**: User & Auth Service (port 3001)  
**Request**: POST /api/auth/signin  
**Body**:
```json
{
  "username": "demo",
  "password": "demo123"
}
```
✅ Token will be automatically saved in `{{accessToken}}`

---

#### 📍 Test 2: Create OPD Disposition
**Request**: POST /api/workflow/disposisi-opd  
**Body**:
```json
{
  "permohonan_id": {{permohonan_id}},
  "nomor_registrasi": "REG/2024/01/0001",
  "opd_id": {{opd_user_id}},
  "catatan_disposisi": "Please conduct technical review immediately for this application"
}
```
**Expected**: Status 201, `disposisi_id` saved automatically

---

#### 📍 Test 3: Login as OPD
**Collection**: User & Auth Service  
**Request**: POST /api/auth/signin  
**Body**:
```json
{
  "username": "opd_demo",
  "password": "demo123"
}
```
✅ OPD token will replace Admin token in `{{accessToken}}`

---

#### 📍 Test 4: Input Technical Review
**Request**: POST /api/workflow/kajian-teknis  
**Body**:
```json
{
  "permohonan_id": {{permohonan_id}},
  "opd_id": {{opd_user_id}},
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
**Expected**: Status 201, `kajian_id` saved, `reviewer_id` filled automatically

---

#### 📍 Test 5: Login as Admin (again)
Repeat Test 1 to get Admin token

---

#### 📍 Test 6: Forward Draft to Leadership
**Request**: POST /api/workflow/forward-to-pimpinan  
**Body**:
```json
{
  "permohonan_id": {{permohonan_id}},
  "nomor_registrasi": "REG/2024/01/0001",
  "nomor_draft": "DRAFT/2024/01/0001",
  "isi_draft": "REGIONAL HEAD DECISION\nNUMBER: DRAFT/2024/01/0001\n\nABOUT\nAPPROVAL OF BUILDING PERMIT\n\nREGIONAL HEAD,\n\nConsidering:\na. That based on the application...\nb. That based on technical review results...\n\nRecalling:\n1. Law...\n2. Regional Regulation...\n\nDECIDES:\n\nEstablishes:\nFIRST: Approving the permit application...\nSECOND: Permit valid for...\nTHIRD: This decision effective from...\n\nEstablished in: ...\nOn date: ...\n\nREGIONAL HEAD,\n\n(Official Name)"
}
```
**Expected**: Status 201, `draft_id` saved, status `dikirim_ke_pimpinan`

---

#### 📍 Test 7: Login as Leadership
**Note**: Create Leadership user first if not exists
```sql
INSERT INTO jelita_users.users (username, password_hash, nama_lengkap, role)
VALUES (
  'pimpinan_demo', 
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'Demo Pimpinan',
  'Pimpinan'
);
```

**Request**: POST /api/auth/signin  
**Body**:
```json
{
  "username": "pimpinan_demo",
  "password": "demo123"
}
```

---

#### 📍 Test 8: Request Draft Revision
**Request**: POST /api/workflow/revisi-draft  
**Body**:
```json
{
  "draft_id": {{draft_id}},
  "catatan_revisi": "Please revise the legal considerations section in point b. Add reference to latest Regional Regulation No. 5 of 2024. Also ensure numbering format follows the latest standard."
}
```
**Expected**: 
- Status 201
- Draft status changed to `perlu_revisi`
- Revision record created with status `pending`
- `revisi_id` saved

---

## 📊 Database Validation

### Check Disposition
```sql
SELECT * FROM jelita_workflow.disposisi;
```

### Check Technical Review
```sql
SELECT * FROM jelita_workflow.kajian_teknis;
```

### Check Permit Draft
```sql
SELECT * FROM jelita_workflow.draft_izin;
```

### Check Draft Revision
```sql
SELECT * FROM jelita_workflow.revisi_draft;
```

### Full Workflow Query
```sql
SELECT 
  d.id AS disposisi_id,
  d.nomor_registrasi,
  d.status AS disposisi_status,
  kt.hasil_kajian,
  kt.rekomendasi,
  di.nomor_draft,
  di.status AS draft_status,
  rd.catatan_revisi,
  rd.status AS revisi_status
FROM disposisi d
LEFT JOIN kajian_teknis kt ON d.permohonan_id = kt.permohonan_id
LEFT JOIN draft_izin di ON d.permohonan_id = di.permohonan_id
LEFT JOIN revisi_draft rd ON di.id = rd.draft_id
WHERE d.permohonan_id = 1;
```

---

## 🔍 Expected Test Results

### ✅ All Tests Must Pass:

1. **Test 1 (Login Admin)**: 
   - Status: 200
   - Token saved
   
2. **Test 2 (OPD Disposition)**: 
   - Status: 201
   - `disposisi_id` saved
   - `status` = 'pending'
   
3. **Test 3 (Login OPD)**: 
   - Status: 200
   - OPD token saved
   
4. **Test 4 (Technical Review)**: 
   - Status: 201
   - `kajian_id` saved
   - `reviewer_id` not null
   - `hasil_kajian` matches input
   
5. **Test 5 (Login Admin again)**: 
   - Status: 200
   - Admin token saved
   
6. **Test 6 (Forward Draft)**: 
   - Status: 201
   - `draft_id` saved
   - `status` = 'dikirim_ke_pimpinan'
   - `tanggal_kirim_pimpinan` not null
   
7. **Test 7 (Login Leadership)**: 
   - Status: 200
   - Leadership token saved
   
8. **Test 8 (Draft Revision)**: 
   - Status: 201
   - `revisi_id` saved
   - Draft status = 'perlu_revisi'
   - Revision status = 'pending'

---

## 🚨 Troubleshooting Common Issues

### Error: "Token tidak valid"
**Fix**: Login again, token may have expired (1 hour)

### Error: "Access denied. Required role: Admin"
**Fix**: Ensure login with correct user role for the endpoint

### Error: "Duplicate entry for key 'nomor_draft'"
**Fix**: Change draft number (must be unique): `DRAFT/2024/01/0002`

### Error: "Draft tidak ditemukan"
**Fix**: Ensure `draft_id` exists in environment variable and is valid

### Server not running
**Fix**:
```powershell
# Check port
netstat -ano | findstr :3020

# Restart server
Set-Location -Path 'd:\KULIAH\TESIS\prototype_eng\layanan-alur-kerja'
node server.js
```

---

## 📚 Complete Documentation

- **Full Testing Guide**: `postman/TESTING_GUIDE.md` (50+ pages)
- **README**: `README.md`
- **API Docs**: See Postman collection

---

## 🎉 Happy Testing!

All Workflow Service endpoints are ready to test.

**Next Steps**:
1. Import Postman collection & environment
2. Create OPD and Leadership users (if not exists)
3. Get `permohonan_id` from Application Service
4. Follow testing sequence 1-8
5. Verify in database

**Support**: If you have issues, check TESTING_GUIDE.md for detailed troubleshooting.
