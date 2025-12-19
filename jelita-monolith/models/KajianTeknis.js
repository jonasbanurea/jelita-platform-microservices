// models/KajianTeknis.js
const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const KajianTeknis = sequelize.define('KajianTeknis', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  disposisi_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'disposisi',
      key: 'id'
    }
  },
  permohonan_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  opd_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reviewer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'User ID dari OPD yang melakukan kajian'
  },
  hasil_kajian: {
    type: DataTypes.ENUM('disetujui', 'ditolak', 'perlu_revisi'),
    allowNull: false,
  },
  rekomendasi: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  catatan_teknis: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  lampiran: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of file paths/URLs'
  },
  tanggal_kajian: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'kajian_teknis',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = KajianTeknis;
