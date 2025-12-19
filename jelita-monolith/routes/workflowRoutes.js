// routes/workflowRoutes.js - Workflow Management Routes
const express = require('express');
const Disposisi = require('../models/Disposisi');
const KajianTeknis = require('../models/KajianTeknis');
const DraftIzin = require('../models/DraftIzin');
const Permohonan = require('../models/Permohonan');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Create disposition (Admin assigns to OPD)
router.post('/api/disposisi', authMiddleware, authorize('Admin'), async (req, res) => {
  try {
    const { permohonan_id, opd_id, catatan_disposisi } = req.body;

    const permohonan = await Permohonan.findByPk(permohonan_id);
    if (!permohonan) {
      return res.status(404).json({ 
        success: false,
        message: 'Permohonan not found' 
      });
    }

    const disposisi = await Disposisi.create({
      permohonan_id,
      nomor_registrasi: permohonan.nomor_registrasi,
      opd_id,
      disposisi_dari: req.user.id,
      catatan_disposisi,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Disposisi created successfully',
      data: disposisi
    });
  } catch (error) {
    console.error('Create disposisi error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create disposisi', 
      error: error.message 
    });
  }
});

// Get dispositions for OPD
router.get('/api/disposisi', authMiddleware, async (req, res) => {
  try {
    const where = {};
    
    // If OPD user, only show their dispositions
    if (req.user.peran === 'OPD') {
      where.opd_id = req.user.id;
    }

    const disposisi = await Disposisi.findAll({ where });
    
    res.json({
      success: true,
      data: disposisi
    });
  } catch (error) {
    console.error('Get disposisi error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve disposisi', 
      error: error.message 
    });
  }
});

// Submit technical review (OPD)
router.post('/api/kajian-teknis', authMiddleware, authorize('OPD'), async (req, res) => {
  try {
    const { disposisi_id, permohonan_id, hasil_kajian, rekomendasi, catatan_teknis } = req.body;

    const disposisi = await Disposisi.findByPk(disposisi_id);
    if (!disposisi) {
      return res.status(404).json({ 
        success: false,
        message: 'Disposisi not found' 
      });
    }

    const kajian = await KajianTeknis.create({
      disposisi_id,
      permohonan_id,
      opd_id: req.user.id,
      reviewer_id: req.user.id,
      hasil_kajian,
      rekomendasi,
      catatan_teknis,
      tanggal_kajian: new Date()
    });

    // Update disposition status
    await disposisi.update({ status: 'selesai' });

    res.status(201).json({
      success: true,
      message: 'Kajian teknis submitted successfully',
      data: kajian
    });
  } catch (error) {
    console.error('Submit kajian error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to submit kajian teknis', 
      error: error.message 
    });
  }
});

// Get technical reviews
router.get('/api/kajian-teknis', authMiddleware, async (req, res) => {
  try {
    const { permohonan_id } = req.query;
    const where = {};
    
    if (permohonan_id) {
      where.permohonan_id = permohonan_id;
    }

    const kajian = await KajianTeknis.findAll({ where });
    
    res.json({
      success: true,
      data: kajian
    });
  } catch (error) {
    console.error('Get kajian error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve kajian teknis', 
      error: error.message 
    });
  }
});

// Create draft permit (Admin)
router.post('/api/draft-izin', authMiddleware, authorize('Admin'), async (req, res) => {
  try {
    const { permohonan_id, nomor_registrasi, isi_draft } = req.body;

    const timestamp = Date.now();
    const nomor_draft = `DRAFT-${timestamp}`;

    const draft = await DraftIzin.create({
      permohonan_id,
      nomor_registrasi,
      nomor_draft,
      isi_draft,
      dibuat_oleh: req.user.id,
      status: 'draft'
    });

    res.status(201).json({
      success: true,
      message: 'Draft izin created successfully',
      data: draft
    });
  } catch (error) {
    console.error('Create draft error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create draft izin', 
      error: error.message 
    });
  }
});

// Send draft to leadership (Admin)
router.put('/api/draft-izin/:id/kirim', authMiddleware, authorize('Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const draft = await DraftIzin.findByPk(id);

    if (!draft) {
      return res.status(404).json({ 
        success: false,
        message: 'Draft not found' 
      });
    }

    await draft.update({
      status: 'dikirim_ke_pimpinan',
      tanggal_kirim_pimpinan: new Date()
    });

    res.json({
      success: true,
      message: 'Draft sent to leadership successfully',
      data: draft
    });
  } catch (error) {
    console.error('Send draft error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send draft', 
      error: error.message 
    });
  }
});

// Approve draft (Leadership)
router.put('/api/draft-izin/:id/setujui', authMiddleware, authorize('Pimpinan'), async (req, res) => {
  try {
    const { id } = req.params;
    const draft = await DraftIzin.findByPk(id);

    if (!draft) {
      return res.status(404).json({ 
        success: false,
        message: 'Draft not found' 
      });
    }

    await draft.update({
      status: 'disetujui',
      disetujui_oleh: req.user.id,
      tanggal_persetujuan: new Date()
    });

    // Update permohonan status to approved
    await Permohonan.update(
      { status: 'approved' },
      { where: { id: draft.permohonan_id } }
    );

    res.json({
      success: true,
      message: 'Draft approved successfully',
      data: draft
    });
  } catch (error) {
    console.error('Approve draft error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to approve draft', 
      error: error.message 
    });
  }
});

// Get drafts
router.get('/api/draft-izin', authMiddleware, async (req, res) => {
  try {
    const { permohonan_id, status } = req.query;
    const where = {};
    
    if (permohonan_id) {
      where.permohonan_id = permohonan_id;
    }
    if (status) {
      where.status = status;
    }

    const drafts = await DraftIzin.findAll({ where });
    
    res.json({
      success: true,
      data: drafts
    });
  } catch (error) {
    console.error('Get drafts error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve drafts', 
      error: error.message 
    });
  }
});

module.exports = router;
