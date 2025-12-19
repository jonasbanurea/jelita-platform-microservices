// models/SKM.js
const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const SKM = sequelize.define('SKM', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  permohonan_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID permohonan dari Application Service'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID pemohon yang mengisi survei'
  },
  nomor_registrasi: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Nomor registrasi permohonan'
  },
  jawaban_json: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Jawaban survei dalam format JSON'
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed'),
    defaultValue: 'pending',
    comment: 'Status pengisian survei'
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Waktu submit survei'
  },
  notified_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Waktu notifikasi dikirim'
  },
  download_unlocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Apakah akses download sudah dibuka'
  },
  download_unlocked_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Waktu akses download dibuka'
  }
}, {
  tableName: 'skm',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = SKM;
