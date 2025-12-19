// routes/permohonanRoutes.js - Application/Registration Routes
const express = require('express');
const Permohonan = require('../models/Permohonan');
const Dokumen = require('../models/Dokumen');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Create a new application
router.post('/api/permohonan', authMiddleware, async (req, res) => {
  try {
    const { data_pemohon } = req.body;
    const user_id = req.user.id;

    const newPermohonan = await Permohonan.create({
      user_id,
      status: 'draft',
      data_pemohon,
      created_at: new Date(),
      updated_at: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Permohonan created successfully',
      data: newPermohonan
    });
  } catch (error) {
    console.error('Create permohonan error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create application', 
      error: error.message 
    });
  }
});

// Submit application (change status to submitted)
router.post('/api/permohonan/:id/submit', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const permohonan = await Permohonan.findByPk(id);
    
    if (!permohonan) {
      return res.status(404).json({ 
        success: false,
        message: 'Application not found' 
      });
    }

    if (permohonan.user_id !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    // Generate registration number
    const timestamp = Date.now();
    const nomor_registrasi = `REG-${timestamp}`;

    await permohonan.update({
      status: 'submitted',
      nomor_registrasi,
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: 'Application submitted successfully',
      data: permohonan
    });
  } catch (error) {
    console.error('Submit permohonan error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to submit application', 
      error: error.message 
    });
  }
});

// Get all applications (for admin/staff)
router.get('/api/permohonan', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    
    // If user is Pemohon, only show their applications
    if (req.user.peran === 'Pemohon') {
      where.user_id = req.user.id;
    }
    
    if (status) {
      where.status = status;
    }

    const permohonan = await Permohonan.findAll({ where });
    
    res.json({
      success: true,
      data: permohonan
    });
  } catch (error) {
    console.error('Get permohonan error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve applications', 
      error: error.message 
    });
  }
});

// Get application by ID
router.get('/api/permohonan/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const permohonan = await Permohonan.findByPk(id);

    if (!permohonan) {
      return res.status(404).json({ 
        success: false,
        message: 'Application not found' 
      });
    }

    // Check access
    if (req.user.peran === 'Pemohon' && permohonan.user_id !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    res.json({
      success: true,
      data: permohonan
    });
  } catch (error) {
    console.error('Get permohonan by ID error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve application', 
      error: error.message 
    });
  }
});

// Update application status (for admin)
router.put('/api/permohonan/:id/status', authMiddleware, authorize('Admin', 'OPD'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const permohonan = await Permohonan.findByPk(id);
    if (!permohonan) {
      return res.status(404).json({ 
        success: false,
        message: 'Application not found' 
      });
    }

    await permohonan.update({
      status,
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: permohonan
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update application status', 
      error: error.message 
    });
  }
});

module.exports = router;
