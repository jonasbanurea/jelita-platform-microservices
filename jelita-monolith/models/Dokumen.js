// models/Dokumen.js
const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const Dokumen = sequelize.define('Dokumen', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  permohonan_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'permohonan',
      key: 'id'
    }
  },
  jenis_dokumen: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nama_file: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  path_file: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ukuran_file: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status_verifikasi: {
    type: DataTypes.ENUM('pending', 'verified', 'rejected'),
    defaultValue: 'pending',
  },
  catatan_verifikasi: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  verified_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  tableName: 'dokumen',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Dokumen;
