// models/Disposisi.js
const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const Disposisi = sequelize.define('Disposisi', {
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
  opd_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  disposisi_dari: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'User ID yang membuat disposisi (Admin)'
  },
  catatan_disposisi: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'dikerjakan', 'selesai', 'ditolak'),
    defaultValue: 'pending',
  },
  tanggal_disposisi: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'disposisi',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Disposisi;
