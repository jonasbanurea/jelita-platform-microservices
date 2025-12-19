// routes/surveyRoutes.js - Survey/SKM Routes
const express = require('express');
const SKM = require('../models/SKM');
const Permohonan = require('../models/Permohonan');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Create SKM notification (when permit is approved)
router.post('/api/skm/notify', authMiddleware, async (req, res) => {
  try {
    const { permohonan_id, user_id, nomor_registrasi } = req.body;

    const skm = await SKM.create({
      permohonan_id,
      user_id,
      nomor_registrasi,
      jawaban_json: {},
      status: 'pending',
      notified_at: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'SKM notification created successfully',
      data: skm
    });
  } catch (error) {
    console.error('Create SKM notification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create SKM notification', 
      error: error.message 
    });
  }
});

// Submit SKM survey
router.post('/api/skm/:id/submit', authMiddleware, authorize('Pemohon'), async (req, res) => {
  try {
    const { id } = req.params;
    const { jawaban_json } = req.body;

    const skm = await SKM.findByPk(id);
    if (!skm) {
      return res.status(404).json({ 
        success: false,
        message: 'SKM not found' 
      });
    }

    if (skm.user_id !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    await skm.update({
      jawaban_json,
      status: 'completed',
      submitted_at: new Date(),
      download_unlocked: true,
      download_unlocked_at: new Date()
    });

    res.json({
      success: true,
      message: 'Survey submitted successfully',
      data: skm
    });
  } catch (error) {
    console.error('Submit SKM error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to submit survey', 
      error: error.message 
    });
  }
});

// Get SKM by user
router.get('/api/skm/user/:user_id', authMiddleware, async (req, res) => {
  try {
    const { user_id } = req.params;

    // Check if user is requesting their own data or is admin
    if (req.user.id !== parseInt(user_id) && req.user.peran !== 'Admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    const skm = await SKM.findAll({ 
      where: { user_id }
    });

    res.json({
      success: true,
      data: skm
    });
  } catch (error) {
    console.error('Get SKM error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve SKM', 
      error: error.message 
    });
  }
});

// Get SKM by permohonan
router.get('/api/skm/permohonan/:permohonan_id', authMiddleware, async (req, res) => {
  try {
    const { permohonan_id } = req.params;

    const skm = await SKM.findOne({ 
      where: { permohonan_id }
    });

    if (!skm) {
      return res.status(404).json({ 
        success: false,
        message: 'SKM not found for this application' 
      });
    }

    res.json({
      success: true,
      data: skm
    });
  } catch (error) {
    console.error('Get SKM by permohonan error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve SKM', 
      error: error.message 
    });
  }
});

// Check download access
router.get('/api/skm/:id/download-access', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const skm = await SKM.findByPk(id);
    if (!skm) {
      return res.status(404).json({ 
        success: false,
        message: 'SKM not found' 
      });
    }

    if (skm.user_id !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    res.json({
      success: true,
      data: {
        download_unlocked: skm.download_unlocked,
        download_unlocked_at: skm.download_unlocked_at,
        status: skm.status
      }
    });
  } catch (error) {
    console.error('Check download access error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to check download access', 
      error: error.message 
    });
  }
});

module.exports = router;
