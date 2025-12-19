// scripts/setupDatabase.js - Database Setup Script
const sequelize = require('../utils/database');
const User = require('../models/User');
const Permohonan = require('../models/Permohonan');
const Dokumen = require('../models/Dokumen');
const Disposisi = require('../models/Disposisi');
const KajianTeknis = require('../models/KajianTeknis');
const DraftIzin = require('../models/DraftIzin');
const SKM = require('../models/SKM');
const Arsip = require('../models/Arsip');

async function setupDatabase() {
  try {
    console.log('Starting database setup...');

    // Test connection
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    // Sync all models
    await sequelize.sync({ force: true });
    console.log('✓ All tables created successfully');

    console.log('\nDatabase setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
