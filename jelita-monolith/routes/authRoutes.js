// routes/authRoutes.js - Authentication & User Management Routes
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// SignIn Route
router.post('/signin', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    const accessToken = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        peran: user.role 
      }, 
      process.env.JWT_SECRET || 'your-secret-key', 
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        nama_lengkap: user.nama_lengkap,
        peran: user.role,
        accessToken: accessToken
      }
    });
  } catch (error) {
    console.error('SignIn error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error', 
      error: error.message 
    });
  }
});

// SignUp Route
router.post('/signup', async (req, res) => {
  const { username, password, nama_lengkap, role } = req.body;

  try {
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Username already exists' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      password_hash: hashedPassword,
      nama_lengkap,
      role: role || 'Pemohon'
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: newUser.id,
        username: newUser.username,
        nama_lengkap: newUser.nama_lengkap,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('SignUp error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error', 
      error: error.message 
    });
  }
});

// Validate token endpoint
router.get('/validate', authMiddleware, (req, res) => {
  res.json({ 
    success: true,
    valid: true, 
    user: req.user 
  });
});

// Get user by role
router.get('/users/role/:role', authMiddleware, async (req, res) => {
  try {
    const users = await User.findAll({ 
      where: { role: req.params.role },
      attributes: ['id', 'username', 'nama_lengkap', 'role']
    });
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error', 
      error: error.message 
    });
  }
});

module.exports = router;
