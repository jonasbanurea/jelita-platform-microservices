// routes/archiveRoutes.js - Archive Management Routes
const express = require('express');
const Arsip = require('../models/Arsip');
const Permohonan = require('../models/Permohonan');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Create archive entry
router.post('/api/arsip', authMiddleware, authorize('Admin'), async (req, res) => {
  try {
    const { permohonan_id, jenis_izin, file_path, metadata_json, hak_akses_opd } = req.body;

    const permohonan = await Permohonan.findByPk(permohonan_id);
    if (!permohonan) {
      return res.status(404).json({ 
        success: false,
        message: 'Permohonan not found' 
      });
    }

    const arsip = await Arsip.create({
      permohonan_id,
      nomor_registrasi: permohonan.nomor_registrasi,
      jenis_izin,
      file_path,
      metadata_json,
      archived_at: new Date(),
      hak_akses_opd: hak_akses_opd || [],
      status: 'archived',
      triggered_from: 'workflow_service'
    });

    res.status(201).json({
      success: true,
      message: 'Document archived successfully',
      data: arsip
    });
  } catch (error) {
    console.error('Create archive error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to archive document', 
      error: error.message 
    });
  }
});

// Get all archives
router.get('/api/arsip', authMiddleware, async (req, res) => {
  try {
    const { status, jenis_izin } = req.query;
    const where = {};
    
    if (status) {
      where.status = status;
    }
    if (jenis_izin) {
      where.jenis_izin = jenis_izin;
    }

    const arsip = await Arsip.findAll({ where });
    
    res.json({
      success: true,
      data: arsip
    });
  } catch (error) {
    console.error('Get archives error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve archives', 
      error: error.message 
    });
  }
});

// Get archive by ID
router.get('/api/arsip/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const arsip = await Arsip.findByPk(id);
    if (!arsip) {
      return res.status(404).json({ 
        success: false,
        message: 'Archive not found' 
      });
    }

    // Update status to accessed
    await arsip.update({ status: 'accessed' });

    res.json({
      success: true,
      data: arsip
    });
  } catch (error) {
    console.error('Get archive error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve archive', 
      error: error.message 
    });
  }
});

// Search archives by registration number
router.get('/api/arsip/search/:nomor_registrasi', authMiddleware, async (req, res) => {
  try {
    const { nomor_registrasi } = req.params;

    const arsip = await Arsip.findOne({ 
      where: { nomor_registrasi }
    });

    if (!arsip) {
      return res.status(404).json({ 
        success: false,
        message: 'Archive not found' 
      });
    }

    res.json({
      success: true,
      data: arsip
    });
  } catch (error) {
    console.error('Search archive error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to search archive', 
      error: error.message 
    });
  }
});

// Update archive access rights
router.put('/api/arsip/:id/access', authMiddleware, authorize('Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { hak_akses_opd } = req.body;

    const arsip = await Arsip.findByPk(id);
    if (!arsip) {
      return res.status(404).json({ 
        success: false,
        message: 'Archive not found' 
      });
    }

    await arsip.update({ hak_akses_opd });

    res.json({
      success: true,
      message: 'Access rights updated successfully',
      data: arsip
    });
  } catch (error) {
    console.error('Update access error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update access rights', 
      error: error.message 
    });
  }
});

module.exports = router;
