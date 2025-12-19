// models/Permohonan.js
const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const Permohonan = sequelize.define('Permohonan', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  nomor_registrasi: {
    type: DataTypes.STRING,
    unique: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  data_pemohon: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'permohonan',
  timestamps: false,
});

module.exports = Permohonan;
