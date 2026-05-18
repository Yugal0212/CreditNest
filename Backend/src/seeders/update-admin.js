require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const logger = require('../utils/logger');

const updateAdminPassword = async () => {
  try {
    logger.info('Updating admin password...');
    
    const user = await prisma.user.findFirst({
      where: { email: 'jakasaniyayugal@gmail.com' },
      include: { admin: true }
    });

    const passwordHash = await bcrypt.hash('Yugal@0212', 12);

    if (!user) {
      logger.info('User not found, creating new admin...');
      await prisma.user.create({
        data: {
          email: 'jakasaniyayugal@gmail.com',
          role: 'ADMIN',
          admin: {
            create: {
              name: 'Yugal Admin',
              passwordHash,
              avatarUrl: 'https://ui-avatars.com/api/?name=Yugal&size=500&background=D4A017&color=fff',
            }
          }
        }
      });
      logger.info('✅ New Admin created!');
      return;
    }

    logger.info('User found, updating to admin role...');
    
    // Update role to ADMIN
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' }
    });

    if (user.admin) {
      // Update password
      await prisma.admin.update({
        where: { id: user.admin.id },
        data: { passwordHash }
      });
      logger.info('✅ Admin password updated!');
    } else {
      // Create admin profile
      await prisma.admin.create({
        data: {
          userId: user.id,
          name: 'Yugal Admin',
          passwordHash,
          avatarUrl: 'https://ui-avatars.com/api/?name=Yugal&size=500&background=D4A017&color=fff',
        }
      });
      logger.info('✅ Admin profile created!');
    }

  } catch (error) {
    logger.error('❌ Error updating password:', error);
  } finally {
    await prisma.$disconnect();
  }
};

updateAdminPassword();
