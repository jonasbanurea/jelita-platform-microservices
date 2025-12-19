// models/DraftIzin.js
const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const DraftIzin = sequelize.define('DraftIzin', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  permohonan_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  nomor_registrasi: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  nomor_draft: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  isi_draft: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  dibuat_oleh: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'User ID Admin yang membuat draft'
  },
  status: {
    type: DataTypes.ENUM('draft', 'dikirim_ke_pimpinan', 'disetujui', 'perlu_revisi', 'ditolak'),
    defaultValue: 'draft',
  },
  tanggal_kirim_pimpinan: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  disetujui_oleh: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'User ID Pimpinan yang menyetujui'
  },
  tanggal_persetujuan: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  tableName: 'draft_izin',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = DraftIzin;
