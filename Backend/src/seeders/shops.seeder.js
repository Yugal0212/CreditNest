require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const logger = require('../utils/logger');

/**
 * Seed shops and shop owners
 */
const seedShops = async () => {
  try {
    logger.info('🌱 Starting shops seeder...');

    const shopsData = [
      {
        shopName: 'Green Grocers',
        address: '123 Market Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        phone: '+919876543210',
        email: 'greengrocer@example.com',
        ownerName: 'Rajesh Kumar',
        ownerEmail: 'rajesh@example.com',
        ownerPhone: '+919876543210',
        password: 'Shop@123',
      },
      {
        shopName: 'City Electronics',
        address: '456 Main Road',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        phone: '+919876543211',
        email: 'cityelectronics@example.com',
        ownerName: 'Priya Sharma',
        ownerEmail: 'priya@example.com',
        ownerPhone: '+919876543211',
        password: 'Shop@123',
      },
      {
        shopName: 'Fashion Hub',
        address: '789 Shopping Complex',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        phone: '+919876543212',
        email: 'fashionhub@example.com',
        ownerName: 'Amit Patel',
        ownerEmail: 'amit@example.com',
        ownerPhone: '+919876543212',
        password: 'Shop@123',
      },
      {
        shopName: 'Daily Needs Store',
        address: '321 Colony Road',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        phone: '+919876543213',
        email: 'dailyneeds@example.com',
        ownerName: 'Sunita Verma',
        ownerEmail: 'sunita@example.com',
        ownerPhone: '+919876543213',
        password: 'Shop@123',
      },
      {
        shopName: 'Book Paradise',
        address: '555 Education Street',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700001',
        phone: '+919876543214',
        email: 'bookparadise@example.com',
        ownerName: 'Vikram Singh',
        ownerEmail: 'vikram@example.com',
        ownerPhone: '+919876543214',
        password: 'Shop@123',
      },
    ];

    const createdShops = [];

    for (const shopData of shopsData) {
      // Check if shop already exists
      const existingShop = await prisma.shop.findFirst({
        where: {
          email: shopData.email,
        },
      });

      if (existingShop) {
        logger.info(`⏭️  Shop "${shopData.shopName}" already exists`);
        continue;
      }

      // Hash password for shop owner
      const passwordHash = await bcrypt.hash(shopData.password, 12);

      // Create shop with shop owner
      const shop = await prisma.shop.create({
        data: {
          shopName: shopData.shopName,
          address: shopData.address,
          city: shopData.city,
          state: shopData.state,
          pincode: shopData.pincode,
          phone: shopData.phone,
          email: shopData.email,
          status: 'ACTIVE',
          shopOwner: {
            create: {
              ownerName: shopData.ownerName,
              passwordHash,
              avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(shopData.ownerName)}&size=500&background=667eea&color=fff`,
              user: {
                create: {
                  email: shopData.ownerEmail,
                  phone: shopData.ownerPhone,
                  role: 'SHOP_OWNER',
                  isActive: true,
                },
              },
            },
          },
        },
        include: {
          shopOwner: {
            include: {
              user: true,
            },
          },
        },
      });

      createdShops.push(shop);
      logger.info(`✅ Created shop: ${shop.shopName}`);
      logger.info(`   Owner: ${shopData.ownerName}`);
      logger.info(`   Email: ${shopData.ownerEmail}`);
      logger.info(`   Password: ${shopData.password}`);
    }

    logger.info(`✅ Shops seeder completed. Created ${createdShops.length} shops.`);
    return createdShops;
  } catch (error) {
    logger.error('❌ Shops seeder error:', error);
    throw error;
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedShops()
    .then(() => {
      logger.info('🎉 Seeding completed');
      prisma.$disconnect();
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Seeding failed:', error);
      prisma.$disconnect();
      process.exit(1);
    });
}

module.exports = seedShops;
