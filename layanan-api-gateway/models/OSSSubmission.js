/**
 * OSS Submission Model
 * 
 * Tracks all submissions made to OSS-RBA platform
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const OSSSubmission = sequelize.define('OSSSubmission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // JELITA internal reference
  jelitaApplicationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Reference to JELITA application/draft'
  },
  
  // OSS-RBA tracking information
  ossTrackingId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
    comment: 'OSS-RBA tracking ID (UUID)'
  },
  
  ossNIB: {
    type: DataTypes.STRING(16),
    allowNull: true,
    comment: 'Nomor Induk Berusaha (16 digits)'
  },
  
  // Submission status
  status: {
    type: DataTypes.ENUM('PENDING', 'SUBMITTED', 'DITERIMA', 'DIPROSES', 'SELESAI', 'DITOLAK', 'ERROR'),
    defaultValue: 'PENDING',
    allowNull: false
  },
  
  // Applicant information (cached from JELITA)
  pemohonNama: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  
  pemohonNIK: {
    type: DataTypes.STRING(16),
    allowNull: false
  },
  
  usahaNama: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  
  // OSS-RBA response data
  ossResponseData: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON string of OSS-RBA response',
    get() {
      const rawValue = this.getDataValue('ossResponseData');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(value) {
      this.setDataValue('ossResponseData', JSON.stringify(value));
    }
  },
  
  // Error tracking
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  retryCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  // Timestamps
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'oss_submissions',
  timestamps: true,
  indexes: [
    { fields: ['jelitaApplicationId'] },
    { fields: ['ossTrackingId'] },
    { fields: ['ossNIB'] },
    { fields: ['status'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = OSSSubmission;
