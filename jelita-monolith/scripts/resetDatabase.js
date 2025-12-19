// jelita-monolith/scripts/resetDatabase.js
// Reset database to clean state for repeatable testing
const sequelize = require('../utils/database');

async function resetDatabase() {
  try {
    console.log('🔄 Resetting database...');
    
    await sequelize.drop();
    console.log('✅ All tables dropped');
    
    await sequelize.sync({ force: true });
    console.log('✅ Tables recreated');
    
    console.log('✅ Database reset completed!');
    console.log('\n⚠️  Run seedDatabase.js to populate with test data');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase();
