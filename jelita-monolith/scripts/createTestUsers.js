// scripts/createTestUsers.js - Create Test Users
const bcrypt = require('bcryptjs');
const sequelize = require('../utils/database');
const User = require('../models/User');

async function createTestUsers() {
  try {
    console.log('Creating test users...');

    await sequelize.authenticate();
    console.log('✓ Database connected');

    const users = [
      {
        username: 'pemohon1',
        password: 'password123',
        nama_lengkap: 'Test Pemohon',
        role: 'Pemohon'
      },
      {
        username: 'admin1',
        password: 'password123',
        nama_lengkap: 'Test Admin',
        role: 'Admin'
      },
      {
        username: 'opd1',
        password: 'password123',
        nama_lengkap: 'Test OPD',
        role: 'OPD'
      },
      {
        username: 'pimpinan1',
        password: 'password123',
        nama_lengkap: 'Test Pimpinan',
        role: 'Pimpinan'
      }
    ];

    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await User.create({
        username: userData.username,
        password_hash: hashedPassword,
        nama_lengkap: userData.nama_lengkap,
        role: userData.role
      });
      console.log(`✓ Created user: ${user.username} (${user.role})`);
    }

    console.log('\nTest users created successfully!');
    console.log('\nLogin credentials:');
    console.log('Pemohon: pemohon1 / password123');
    console.log('Admin:   admin1 / password123');
    console.log('OPD:     opd1 / password123');
    console.log('Pimpinan: pimpinan1 / password123');

    process.exit(0);
  } catch (error) {
    console.error('✗ Failed to create test users:', error);
    process.exit(1);
  }
}

createTestUsers();
