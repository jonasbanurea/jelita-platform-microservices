/**
 * JELITA API Gateway with OSS-RBA Integration
 * 
 * Main server file
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const { testConnection, syncDatabase } = require('./utils/database');
const ossIntegrationRoutes = require('./routes/ossIntegration');

const app = express();
const PORT = process.env.PORT || 3050;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'JELITA API Gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// OSS Integration routes
app.use('/api/oss', ossIntegrationRoutes);

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
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }
    
    // Sync database (create tables)
    await syncDatabase();
    
    // Start listening
    app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log('🚀 JELITA API Gateway Started');
      console.log('='.repeat(60));
      console.log(`📍 Server running on: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 OSS Submit: POST http://localhost:${PORT}/api/oss/submit`);
      console.log(`📊 OSS Status: GET http://localhost:${PORT}/api/oss/status/:trackingId`);
      console.log(`🔍 OSS Health: GET http://localhost:${PORT}/api/oss/health`);
      console.log('='.repeat(60));
      console.log(`📦 Database: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
      console.log(`🌐 OSS-RBA: ${process.env.OSS_RBA_BASE_URL}`);
      console.log('='.repeat(60));
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
