// models/Arsip.js
const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const Arsip = sequelize.define('Arsip', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  permohonan_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Reference to permohonan'
  },
  nomor_registrasi: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Registration number from application'
  },
  jenis_izin: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Type of license'
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Path to archived document file'
  },
  metadata_json: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional metadata about the archived document'
  },
  archived_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when document was archived'
  },
  hak_akses_opd: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'List of OPD IDs that have access rights'
  },
  status: {
    type: DataTypes.ENUM('pending', 'archived', 'accessed'),
    defaultValue: 'pending',
    comment: 'Archive status'
  },
  triggered_from: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Which service triggered the archiving'
  }
}, {
  tableName: 'arsip',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Arsip;
