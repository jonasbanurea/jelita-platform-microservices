// jelita-monolith/scripts/seedDatabase.js
// Seed database with identical data for both architectures
const bcrypt = require('bcryptjs');
const sequelize = require('../utils/database');
const User = require('../models/User');
const Permohonan = require('../models/Permohonan');
const Dokumen = require('../models/Dokumen');

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database with test data...');
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create users
    console.log('👥 Creating users...');
    const users = await User.bulkCreate([
      // Pemohon (50 users)
      ...Array.from({ length: 50 }, (_, i) => ({
        username: `pemohon${i + 1}`,
        password_hash: hashedPassword,
        nama_lengkap: `Test Pemohon ${i + 1}`,
        role: 'Pemohon'
      })),
      // Admin (10 users)
      ...Array.from({ length: 10 }, (_, i) => ({
        username: `admin${i + 1}`,
        password_hash: hashedPassword,
        nama_lengkap: `Test Admin ${i + 1}`,
        role: 'Admin'
      })),
      // OPD (10 users)
      ...Array.from({ length: 10 }, (_, i) => ({
        username: `opd${i + 1}`,
        password_hash: hashedPassword,
        nama_lengkap: `Test OPD ${i + 1}`,
        role: 'OPD'
      })),
      // Pimpinan (5 users)
      ...Array.from({ length: 5 }, (_, i) => ({
        username: `pimpinan${i + 1}`,
        password_hash: hashedPassword,
        nama_lengkap: `Test Pimpinan ${i + 1}`,
        role: 'Pimpinan'
      }))
    ]);
    console.log(`✅ Created ${users.length} users`);

    // Create sample permohonan (100 applications)
    console.log('📄 Creating sample applications...');
    const permohonanData = [];
    for (let i = 1; i <= 100; i++) {
      const userId = ((i - 1) % 50) + 1; // Distribute among pemohon users
      permohonanData.push({
        user_id: userId,
        nomor_registrasi: i <= 50 ? `REG-2024-${String(i).padStart(4, '0')}` : null,
        status: i <= 30 ? 'approved' : i <= 50 ? 'submitted' : 'draft',
        data_pemohon: {
          nama: `Pemohon ${userId}`,
          alamat: `Jl. Test No. ${i}`,
          jenis_izin: ['IMB', 'SIUP', 'TDP', 'HO'][i % 4],
          luas_bangunan: 100 + (i * 10),
          tahun: 2024
        },
        created_at: new Date(2024, 0, i), // Spread across January 2024
        updated_at: new Date(2024, 0, i)
      });
    }
    
    const permohonan = await Permohonan.bulkCreate(permohonanData);
    console.log(`✅ Created ${permohonan.length} applications`);

    // Create sample documents (200 documents, 2 per application for first 100)
    console.log('📎 Creating sample documents...');
    const dokumenData = [];
    for (let i = 1; i <= 100; i++) {
      // KTP document
      dokumenData.push({
        permohonan_id: i,
        jenis_dokumen: 'KTP',
        nama_file: `ktp-${i}.pdf`,
        path_file: `/uploads/ktp-${i}.pdf`,
        ukuran_file: 512000 + (i * 1000),
        status_verifikasi: i <= 30 ? 'verified' : i <= 50 ? 'pending' : 'pending'
      });
      
      // Surat Permohonan document
      dokumenData.push({
        permohonan_id: i,
        jenis_dokumen: 'Surat Permohonan',
        nama_file: `surat-${i}.pdf`,
        path_file: `/uploads/surat-${i}.pdf`,
        ukuran_file: 768000 + (i * 1500),
        status_verifikasi: i <= 30 ? 'verified' : i <= 50 ? 'pending' : 'pending'
      });
    }
    
    const dokumen = await Dokumen.bulkCreate(dokumenData);
    console.log(`✅ Created ${dokumen.length} documents`);

    console.log('\n✅ Database seeding completed!');
    console.log('\n📊 Summary:');
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Applications: ${permohonan.length}`);
    console.log(`   - Documents: ${dokumen.length}`);
    console.log(`   - Status Distribution:`);
    console.log(`     • Approved: 30`);
    console.log(`     • Submitted: 20`);
    console.log(`     • Draft: 50`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
