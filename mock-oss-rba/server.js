/**
 * Mock OSS-RBA (One Single Submission - Risk Based Approach) Service
 * 
 * Purpose: Simulates the national SPBE platform for integration testing
 * This mock service implements the core OSS-RBA API endpoints required
 * for JELITA system integration validation.
 * 
 * Note: This is a MOCK service for testing purposes only.
 * Real OSS-RBA integration would require government API credentials.
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// In-memory storage for submissions (simulate database)
const submissions = new Map();

/**
 * Simulate network/processing delay (100-300ms)
 * Real OSS-RBA responses typically take 150-500ms
 */
const simulateDelay = () => {
  return new Promise(resolve => {
    const delay = Math.floor(Math.random() * 200) + 100; // 100-300ms
    setTimeout(resolve, delay);
  });
};

/**
 * Generate random NIB (Nomor Induk Berusaha)
 * Format: 16 digits
 */
const generateNIB = () => {
  return Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();
};

/**
 * Validate submission data structure
 */
const validateSubmission = (data) => {
  const errors = [];
  
  if (!data.pemohonNama) errors.push('pemohonNama is required');
  if (!data.pemohonNIK) errors.push('pemohonNIK is required');
  if (!data.usahaNama) errors.push('usahaNama is required');
  if (!data.usahaAlamat) errors.push('usahaAlamat is required');
  if (!data.kbliKode) errors.push('kbliKode is required');
  if (!data.izinJenis) errors.push('izinJenis is required');
  
  // Validate NIK format (16 digits)
  if (data.pemohonNIK && !/^\d{16}$/.test(data.pemohonNIK)) {
    errors.push('pemohonNIK must be 16 digits');
  }
  
  // Validate KBLI format (5 digits)
  if (data.kbliKode && !/^\d{5}$/.test(data.kbliKode)) {
    errors.push('kbliKode must be 5 digits');
  }
  
  return errors;
};

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Mock OSS-RBA',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/v1/perizinan/submit
 * 
 * Submit new licensing application to OSS-RBA
 * 
 * Request body:
 * {
 *   "pemohonNama": "string",
 *   "pemohonNIK": "string (16 digits)",
 *   "pemohonEmail": "string",
 *   "pemohonTelepon": "string",
 *   "usahaNama": "string",
 *   "usahaAlamat": "string",
 *   "usahaProvinsi": "string",
 *   "usahaKabKota": "string",
 *   "kbliKode": "string (5 digits)",
 *   "kbliNama": "string",
 *   "izinJenis": "string",
 *   "izinDeskripsi": "string",
 *   "risikoLevel": "string (Rendah/Menengah/Tinggi)"
 * }
 * 
 * Response:
 * {
 *   "status": "success",
 *   "data": {
 *     "trackingId": "uuid",
 *     "nib": "16-digit number",
 *     "statusPengajuan": "DITERIMA",
 *     "tanggalPengajuan": "ISO timestamp"
 *   }
 * }
 */
app.post('/api/v1/perizinan/submit', async (req, res) => {
  await simulateDelay();
  
  try {
    const submissionData = req.body;
    
    // Validate required fields
    const validationErrors = validateSubmission(submissionData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Simulate success rate (95% success, 5% rejection for testing)
    const isApproved = Math.random() > 0.05;
    
    // Create submission record
    const trackingId = uuidv4();
    const nib = generateNIB();
    const submission = {
      trackingId,
      nib: isApproved ? nib : null,
      statusPengajuan: isApproved ? 'DITERIMA' : 'DITOLAK',
      alasanPenolakan: isApproved ? null : 'Data tidak lengkap atau tidak sesuai kriteria',
      tanggalPengajuan: new Date().toISOString(),
      tanggalUpdate: new Date().toISOString(),
      dataPemohon: submissionData,
      riwayatStatus: [
        {
          status: 'DITERIMA',
          timestamp: new Date().toISOString(),
          keterangan: 'Pengajuan diterima oleh sistem OSS-RBA'
        }
      ]
    };
    
    // Store in memory
    submissions.set(trackingId, submission);
    
    console.log(`✅ Submission created: ${trackingId} (NIB: ${nib || 'N/A'})`);
    
    // Return response
    res.status(201).json({
      status: 'success',
      message: isApproved ? 'Pengajuan berhasil diterima' : 'Pengajuan ditolak',
      data: {
        trackingId: submission.trackingId,
        nib: submission.nib,
        statusPengajuan: submission.statusPengajuan,
        alasanPenolakan: submission.alasanPenolakan,
        tanggalPengajuan: submission.tanggalPengajuan
      }
    });
    
  } catch (error) {
    console.error('❌ Error processing submission:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/perizinan/status/:trackingId
 * 
 * Check submission status by tracking ID
 * 
 * Response:
 * {
 *   "status": "success",
 *   "data": {
 *     "trackingId": "uuid",
 *     "nib": "16-digit number",
 *     "statusPengajuan": "DITERIMA|DIPROSES|DITOLAK|SELESAI",
 *     "tanggalPengajuan": "ISO timestamp",
 *     "tanggalUpdate": "ISO timestamp",
 *     "riwayatStatus": [...]
 *   }
 * }
 */
app.get('/api/v1/perizinan/status/:trackingId', async (req, res) => {
  await simulateDelay();
  
  try {
    const { trackingId } = req.params;
    
    // Check if submission exists
    const submission = submissions.get(trackingId);
    if (!submission) {
      return res.status(404).json({
        status: 'error',
        message: 'Tracking ID tidak ditemukan',
        trackingId
      });
    }
    
    // Simulate status progression (for testing)
    // If submission is older than 30 seconds, mark as SELESAI
    const ageSeconds = (Date.now() - new Date(submission.tanggalPengajuan).getTime()) / 1000;
    if (ageSeconds > 30 && submission.statusPengajuan === 'DITERIMA') {
      submission.statusPengajuan = 'SELESAI';
      submission.tanggalUpdate = new Date().toISOString();
      submission.riwayatStatus.push({
        status: 'SELESAI',
        timestamp: new Date().toISOString(),
        keterangan: 'Perizinan selesai diproses'
      });
    }
    
    console.log(`📊 Status check: ${trackingId} - ${submission.statusPengajuan}`);
    
    res.json({
      status: 'success',
      data: {
        trackingId: submission.trackingId,
        nib: submission.nib,
        statusPengajuan: submission.statusPengajuan,
        alasanPenolakan: submission.alasanPenolakan,
        tanggalPengajuan: submission.tanggalPengajuan,
        tanggalUpdate: submission.tanggalUpdate,
        riwayatStatus: submission.riwayatStatus
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/perizinan/nib/:nib
 * 
 * Get submission details by NIB
 */
app.get('/api/v1/perizinan/nib/:nib', async (req, res) => {
  await simulateDelay();
  
  try {
    const { nib } = req.params;
    
    // Find submission by NIB
    let found = null;
    for (const [trackingId, submission] of submissions.entries()) {
      if (submission.nib === nib) {
        found = submission;
        break;
      }
    }
    
    if (!found) {
      return res.status(404).json({
        status: 'error',
        message: 'NIB tidak ditemukan',
        nib
      });
    }
    
    res.json({
      status: 'success',
      data: found
    });
    
  } catch (error) {
    console.error('❌ Error fetching NIB:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/perizinan/list (Admin endpoint)
 * 
 * List all submissions (for testing/admin purposes)
 */
app.get('/api/v1/perizinan/list', async (req, res) => {
  await simulateDelay();
  
  const submissionsList = Array.from(submissions.values()).map(sub => ({
    trackingId: sub.trackingId,
    nib: sub.nib,
    statusPengajuan: sub.statusPengajuan,
    pemohonNama: sub.dataPemohon.pemohonNama,
    usahaNama: sub.dataPemohon.usahaNama,
    tanggalPengajuan: sub.tanggalPengajuan
  }));
  
  res.json({
    status: 'success',
    total: submissionsList.length,
    data: submissionsList
  });
});

/**
 * DELETE /api/v1/perizinan/reset (Testing endpoint)
 * 
 * Clear all submissions (for testing purposes)
 */
app.delete('/api/v1/perizinan/reset', (req, res) => {
  submissions.clear();
  console.log('🗑️  All submissions cleared');
  
  res.json({
    status: 'success',
    message: 'All submissions cleared'
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================================================
// SERVER START
// ============================================================================

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 Mock OSS-RBA Service Started');
  console.log('='.repeat(60));
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 Submit endpoint: POST http://localhost:${PORT}/api/v1/perizinan/submit`);
  console.log(`📊 Status check: GET http://localhost:${PORT}/api/v1/perizinan/status/:trackingId`);
  console.log('='.repeat(60));
  console.log('ℹ️  This is a MOCK service for testing purposes only');
  console.log('ℹ️  Submissions stored in memory (will be lost on restart)');
  console.log('='.repeat(60));
});

module.exports = app;
