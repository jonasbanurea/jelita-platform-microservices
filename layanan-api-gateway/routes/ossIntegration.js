/**
 * OSS-RBA Integration Routes
 * 
 * Handles all OSS-RBA related operations:
 * - Submit applications to OSS-RBA
 * - Check submission status
 * - Data transformation (JELITA → OSS format)
 * - Error handling and retries
 */

const express = require('express');
const router = express.Router();
const OSSSubmission = require('../models/OSSSubmission');
const ossClient = require('../utils/ossClient');

/**
 * Transform JELITA application data to OSS-RBA format
 */
const transformToOSSFormat = (jelitaData) => {
  return {
    // Applicant information
    pemohonNama: jelitaData.pemohonNama || jelitaData.nama,
    pemohonNIK: jelitaData.pemohonNIK || jelitaData.nik,
    pemohonEmail: jelitaData.pemohonEmail || jelitaData.email,
    pemohonTelepon: jelitaData.pemohonTelepon || jelitaData.telepon || jelitaData.phone,
    
    // Business information
    usahaNama: jelitaData.usahaNama || jelitaData.namaUsaha || jelitaData.businessName,
    usahaAlamat: jelitaData.usahaAlamat || jelitaData.alamatUsaha || jelitaData.address,
    usahaProvinsi: jelitaData.usahaProvinsi || jelitaData.provinsi || 'DKI Jakarta',
    usahaKabKota: jelitaData.usahaKabKota || jelitaData.kabKota || jelitaData.city || 'Jakarta Selatan',
    
    // KBLI (Business Classification)
    kbliKode: jelitaData.kbliKode || jelitaData.kbli || '47911', // Default: retail trade
    kbliNama: jelitaData.kbliNama || jelitaData.kbliDescription || 'Perdagangan Eceran',
    
    // License information
    izinJenis: jelitaData.izinJenis || jelitaData.jenisIzin || 'Izin Usaha',
    izinDeskripsi: jelitaData.izinDeskripsi || jelitaData.deskripsi || '',
    risikoLevel: jelitaData.risikoLevel || jelitaData.tingkatRisiko || 'Rendah'
  };
};

/**
 * POST /api/oss/submit
 * 
 * Submit JELITA application to OSS-RBA
 * 
 * Request body:
 * {
 *   "jelitaApplicationId": 123,
 *   "applicationData": { ... JELITA application data ... }
 * }
 */
router.post('/submit', async (req, res) => {
  try {
    const { jelitaApplicationId, applicationData } = req.body;
    
    // Validation
    if (!jelitaApplicationId) {
      return res.status(400).json({
        success: false,
        message: 'jelitaApplicationId is required'
      });
    }
    
    if (!applicationData) {
      return res.status(400).json({
        success: false,
        message: 'applicationData is required'
      });
    }
    
    // Check if already submitted
    const existingSubmission = await OSSSubmission.findOne({
      where: { jelitaApplicationId }
    });
    
    if (existingSubmission && existingSubmission.status !== 'ERROR') {
      return res.status(409).json({
        success: false,
        message: 'Application already submitted to OSS-RBA',
        data: {
          submissionId: existingSubmission.id,
          ossTrackingId: existingSubmission.ossTrackingId,
          status: existingSubmission.status
        }
      });
    }
    
    // Transform data to OSS format
    const ossData = transformToOSSFormat(applicationData);
    
    // Validate transformed data
    if (!ossData.pemohonNIK || !/^\d{16}$/.test(ossData.pemohonNIK)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pemohonNIK format (must be 16 digits)'
      });
    }
    
    if (!ossData.kbliKode || !/^\d{5}$/.test(ossData.kbliKode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid kbliKode format (must be 5 digits)'
      });
    }
    
    // Create or update submission record
    let submission;
    if (existingSubmission) {
      submission = existingSubmission;
      submission.status = 'PENDING';
      submission.errorMessage = null;
      submission.retryCount++;
    } else {
      submission = await OSSSubmission.create({
        jelitaApplicationId,
        pemohonNama: ossData.pemohonNama,
        pemohonNIK: ossData.pemohonNIK,
        usahaNama: ossData.usahaNama,
        status: 'PENDING'
      });
    }
    
    console.log(`📝 Created/Updated submission record #${submission.id}`);
    
    // Submit to OSS-RBA
    try {
      const ossResponse = await ossClient.submitApplication(ossData);
      
      // Update submission with OSS response
      submission.status = 'SUBMITTED';
      submission.ossTrackingId = ossResponse.trackingId;
      submission.ossNIB = ossResponse.nib;
      submission.ossResponseData = ossResponse.rawResponse;
      submission.submittedAt = new Date();
      
      await submission.save();
      
      console.log(`✅ Submission #${submission.id} sent to OSS-RBA: ${ossResponse.trackingId}`);
      
      res.status(201).json({
        success: true,
        message: 'Application submitted to OSS-RBA successfully',
        data: {
          submissionId: submission.id,
          jelitaApplicationId: submission.jelitaApplicationId,
          ossTrackingId: submission.ossTrackingId,
          ossNIB: submission.ossNIB,
          status: submission.status,
          submittedAt: submission.submittedAt
        }
      });
      
    } catch (ossError) {
      // OSS submission failed - update record
      submission.status = 'ERROR';
      submission.errorMessage = ossError.message || JSON.stringify(ossError);
      await submission.save();
      
      console.error(`❌ OSS submission failed for #${submission.id}:`, ossError);
      
      res.status(500).json({
        success: false,
        message: 'Failed to submit to OSS-RBA',
        error: ossError.message || ossError.error,
        details: ossError.errors || null,
        submissionId: submission.id
      });
    }
    
  } catch (error) {
    console.error('❌ OSS submit route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/oss/status/:trackingId
 * 
 * Check OSS-RBA submission status by tracking ID
 */
router.get('/status/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params;
    
    // Find submission in our database
    const submission = await OSSSubmission.findOne({
      where: { ossTrackingId: trackingId }
    });
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found in JELITA system'
      });
    }
    
    // Check status from OSS-RBA
    try {
      const ossStatus = await ossClient.checkStatus(trackingId);
      
      // Update local record if status changed
      if (ossStatus.success && ossStatus.status !== submission.status) {
        submission.status = ossStatus.status;
        submission.ossResponseData = ossStatus.rawResponse;
        
        if (ossStatus.status === 'SELESAI') {
          submission.completedAt = new Date();
        }
        
        await submission.save();
        console.log(`✅ Updated submission #${submission.id} status: ${ossStatus.status}`);
      }
      
      res.json({
        success: true,
        data: {
          submissionId: submission.id,
          jelitaApplicationId: submission.jelitaApplicationId,
          ossTrackingId: submission.ossTrackingId,
          ossNIB: submission.ossNIB,
          status: submission.status,
          ossStatus: ossStatus.data,
          submittedAt: submission.submittedAt,
          completedAt: submission.completedAt
        }
      });
      
    } catch (ossError) {
      // OSS check failed - return local data
      console.error('❌ OSS status check failed:', ossError);
      
      res.json({
        success: true,
        warning: 'Unable to reach OSS-RBA, returning cached data',
        data: {
          submissionId: submission.id,
          jelitaApplicationId: submission.jelitaApplicationId,
          ossTrackingId: submission.ossTrackingId,
          ossNIB: submission.ossNIB,
          status: submission.status,
          submittedAt: submission.submittedAt,
          completedAt: submission.completedAt
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Status check route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/oss/jelita/:jelitaApplicationId
 * 
 * Get OSS submission by JELITA application ID
 */
router.get('/jelita/:jelitaApplicationId', async (req, res) => {
  try {
    const { jelitaApplicationId } = req.params;
    
    const submission = await OSSSubmission.findOne({
      where: { jelitaApplicationId: parseInt(jelitaApplicationId) }
    });
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'No OSS submission found for this JELITA application'
      });
    }
    
    res.json({
      success: true,
      data: {
        submissionId: submission.id,
        jelitaApplicationId: submission.jelitaApplicationId,
        ossTrackingId: submission.ossTrackingId,
        ossNIB: submission.ossNIB,
        status: submission.status,
        pemohonNama: submission.pemohonNama,
        usahaNama: submission.usahaNama,
        submittedAt: submission.submittedAt,
        completedAt: submission.completedAt,
        errorMessage: submission.errorMessage
      }
    });
    
  } catch (error) {
    console.error('❌ JELITA lookup route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/oss/list
 * 
 * List all OSS submissions (with pagination)
 */
router.get('/list', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    const where = {};
    if (status) {
      where.status = status;
    }
    
    const submissions = await OSSSubmission.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: submissions.rows,
      pagination: {
        total: submissions.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(submissions.count / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('❌ List submissions route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/oss/health
 * 
 * Check OSS-RBA service health and circuit breaker status
 */
router.get('/health', async (req, res) => {
  try {
    const ossHealth = await ossClient.healthCheck();
    const circuitBreaker = ossClient.getCircuitBreakerStatus();
    
    res.json({
      success: true,
      data: {
        ossService: ossHealth,
        circuitBreaker,
        gateway: {
          status: 'OK',
          timestamp: new Date().toISOString()
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

module.exports = router;
