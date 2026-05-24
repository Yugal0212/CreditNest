require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const logger = require('../utils/logger');

/**
 * Seed admin user
 * Email: admin@creditnest.com
 * Password: Admin@123
 */
const seedAdmin = async () => {
  try {
    logger.info('🌱 Starting admin seeder...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        email: 'admin@creditnest.com',
        role: 'ADMIN',
      },
    });

    if (!existingAdmin) {
      // Hash password
      const passwordHash = await bcrypt.hash('Admin@123', 12);

      // Create admin user
      await prisma.user.create({
        data: {
          email: 'admin@creditnest.com',
          role: 'ADMIN',
          admin: {
            create: {
              name: 'System Administrator',
              passwordHash,
              avatarUrl: 'https://ui-avatars.com/api/?name=Admin&size=500&background=667eea&color=fff',
            },
          },
        },
      });
      logger.info('✅ Default Admin user created successfully');
    }

    // Check if user's admin already exists
    const existingUserAdmin = await prisma.user.findFirst({
      where: {
        email: 'jakasaniyayugal@gmail.com',
        role: 'ADMIN',
      },
    });

    if (!existingUserAdmin) {
      // Hash password
      const userPasswordHash = await bcrypt.hash('Yugal@0212', 12);

      // Create user admin
      await prisma.user.create({
        data: {
          email: 'jakasaniyayugal@gmail.com',
          role: 'ADMIN',
          admin: {
            create: {
              name: 'Yugal Admin',
              passwordHash: userPasswordHash,
              avatarUrl: 'https://ui-avatars.com/api/?name=Yugal&size=500&background=D4A017&color=fff',
            },
          },
        },
      });
      logger.info('✅ User Admin created successfully');
    }

    logger.info('✅ Admin user created successfully');
    logger.info('📧 Email: admin@creditnest.com');
    logger.info('🔑 Password: Admin@123');
    logger.info('⚠️  Please change the password after first login!');

    return;
  } catch (error) {
    logger.error('❌ Admin seeder error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedAdmin()
    .then(() => {
      logger.info('🎉 Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedAdmin;
