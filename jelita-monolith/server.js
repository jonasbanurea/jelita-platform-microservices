// server.js - Jelita Monolithic Application
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./utils/database');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Test database connection
sequelize.authenticate()
  .then(() => {
    console.log('✓ Database connection established successfully');
    console.log(`✓ Connected to: ${process.env.DB_NAME}`);
  })
  .catch(err => {
    console.error('✗ Database connection failed:', err.message);
    process.exit(1);
  });

// Sync database models
sequelize.sync({ alter: false })
  .then(() => {
    console.log('✓ Database models synchronized');
  })
  .catch(err => {
    console.error('✗ Database sync failed:', err.message);
  });

// Import routes
const authRoutes = require('./routes/authRoutes');
const permohonanRoutes = require('./routes/permohonanRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const surveyRoutes = require('./routes/surveyRoutes');
const archiveRoutes = require('./routes/archiveRoutes');

// Mount routes
// Authentication & User Management
app.use('/api/auth', authRoutes);

// Application/Registration Service
app.use(permohonanRoutes);

// Workflow Service (Disposisi, Kajian, Draft)
app.use(workflowRoutes);

// Survey/SKM Service
app.use(surveyRoutes);

// Archive Service
app.use(archiveRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Jelita Licensing System - Monolithic Architecture',
    version: '1.0.0',
    architecture: 'monolith',
    services: [
      'Authentication & User Management',
      'Application/Registration',
      'Workflow Management',
      'Survey/SKM',
      'Archive Management'
    ],
    endpoints: {
      auth: '/api/auth/*',
      permohonan: '/api/permohonan/*',
      workflow: '/api/disposisi/*, /api/kajian-teknis/*, /api/draft-izin/*',
      survey: '/api/skm/*',
      archive: '/api/arsip/*'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    architecture: 'monolith',
    service: 'jelita-monolith',
    timestamp: new Date().toISOString(),
    database: sequelize.authenticate() ? 'connected' : 'disconnected'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Endpoint not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 Jelita Monolithic System Started');
  console.log('='.repeat(60));
  console.log(`   Architecture: MONOLITHIC`);
  console.log(`   Server:       http://localhost:${PORT}`);
  console.log(`   Environment:  ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Database:     ${process.env.DB_NAME || 'jelita_monolith'}`);
  console.log('='.repeat(60));
  console.log('   Available Services:');
  console.log('   • Authentication & User Management');
  console.log('   • Application/Registration');
  console.log('   • Workflow Management');
  console.log('   • Survey/SKM');
  console.log('   • Archive Management');
  console.log('='.repeat(60));
});

module.exports = app;
