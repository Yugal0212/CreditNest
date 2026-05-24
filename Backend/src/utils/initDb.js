const prisma = require('../config/database');
const logger = require('../utils/logger');

const initDatabase = async () => {
  try {
    logger.info('⚙️ Initializing database tables...');
    // Create categories table if not exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        shop_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        photo_url VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create scanned_bills table if not exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS scanned_bills (
        id SERIAL PRIMARY KEY,
        shop_id INTEGER NOT NULL,
        bill_url VARCHAR(255) NOT NULL,
        raw_text TEXT,
        extracted_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    logger.info('✅ Database tables initialized successfully');
  } catch (error) {
    logger.error('❌ Database initialization error:', error);
  }
};

module.exports = initDatabase;
