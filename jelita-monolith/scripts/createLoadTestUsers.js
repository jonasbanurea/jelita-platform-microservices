// scripts/createLoadTestUsers.js - Create 70 users for load testing
const bcrypt = require('bcryptjs');
const sequelize = require('../utils/database');
const User = require('../models/User');

async function createLoadTestUsers() {
  try {
    console.log('👥 Creating load test users...');

    await sequelize.authenticate();
    console.log('✓ Database connected');

    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    let created = 0;
    let skipped = 0;

    // Create 50 Pemohon users
    for (let i = 1; i <= 50; i++) {
      const username = `pemohon${i}`;
      
      const exists = await User.findOne({ where: { username } });
      if (exists) {
        skipped++;
        continue;
      }

      await User.create({
        username,
        password_hash: hashedPassword,
        nama_lengkap: `Pemohon Test ${i}`,
        role: 'Pemohon'
      });
      created++;
    }

    // Create 10 Admin users
    for (let i = 1; i <= 10; i++) {
      const username = `admin${i}`;
      
      const exists = await User.findOne({ where: { username } });
      if (exists) {
        skipped++;
        continue;
      }

      await User.create({
        username,
        password_hash: hashedPassword,
        nama_lengkap: `Admin Test ${i}`,
        role: 'Admin'
      });
      created++;
    }

    // Create 10 OPD users
    for (let i = 1; i <= 10; i++) {
      const username = `opd${i}`;
      
      const exists = await User.findOne({ where: { username } });
      if (exists) {
        skipped++;
        continue;
      }

      await User.create({
        username,
        password_hash: hashedPassword,
        nama_lengkap: `OPD Test ${i}`,
        role: 'OPD'
      });
      created++;
    }

    console.log(`✓ Created ${created} new users`);
    console.log(`⚠️  Skipped ${skipped} existing users`);
    console.log('✓ All load test users ready!');
    console.log('\nCredentials:');
    console.log('  - Username: pemohon1 to pemohon50');
    console.log('  - Username: admin1 to admin10');
    console.log('  - Username: opd1 to opd10');
    console.log('  - Password: password123 (for all)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

createLoadTestUsers();
