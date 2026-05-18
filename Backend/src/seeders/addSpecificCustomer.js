require('dotenv').config();
const prisma = require('../config/database');
const logger = require('../utils/logger');

/**
 * Add specific customer with phone +919327117231
 */
const addSpecificCustomer = async () => {
  try {
    logger.info('🌱 Adding specific customer with phone +919327117231...');

    // Get the first active shop
    const shop = await prisma.shop.findFirst({
      where: {
        status: 'ACTIVE',
      },
    });

    if (!shop) {
      logger.error('❌ No active shop found. Please run shops seeder first.');
      return null;
    }

    const customerPhone = '+919327117231';
    const customerEmail = 'customer9327117231@example.com';

    // Check if customer already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: customerPhone },
          { email: customerEmail },
        ],
      },
    });

    if (existingUser) {
      logger.info(`⏭️  Customer with phone ${customerPhone} already exists`);
      
      // Get customer details
      const customer = await prisma.customer.findFirst({
        where: { userId: existingUser.id },
        include: {
          user: true,
          shop: true,
        },
      });

      if (customer) {
        logger.info(`✅ Customer Details:`);
        logger.info(`   Name: ${customer.customerName}`);
        logger.info(`   Phone: ${customer.user.phone}`);
        logger.info(`   Email: ${customer.user.email}`);
        logger.info(`   Shop: ${customer.shop.shopName}`);
        logger.info(`   Status: ${customer.status}`);
      }

      return customer;
    }

    // Create new customer
    const customer = await prisma.customer.create({
      data: {
        customerName: 'Test Customer',
        address: '123 Test Street, Test City',
        workplace: 'Test Company',
        photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent('Test Customer')}&size=500&background=random`,
        totalCredit: 0,
        totalPaid: 0,
        creditBalance: 0,
        status: 'ACTIVE',
        shop: {
          connect: { id: shop.id },
        },
        user: {
          create: {
            email: customerEmail,
            phone: customerPhone,
            role: 'CUSTOMER',
            isActive: true,
          },
        },
      },
      include: {
        user: true,
        shop: true,
      },
    });

    logger.info(`✅ Successfully created customer:`);
    logger.info(`   Name: ${customer.customerName}`);
    logger.info(`   Phone: ${customer.user.phone}`);
    logger.info(`   Email: ${customer.user.email}`);
    logger.info(`   Shop: ${customer.shop.shopName}`);
    logger.info(`   Status: ${customer.status}`);
    logger.info(`\n✅ Customer can now login with phone: ${customerPhone}`);

    return customer;
  } catch (error) {
    logger.error('❌ Add specific customer error:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  addSpecificCustomer()
    .then(() => {
      logger.info('🎉 Customer addition completed');
      prisma.$disconnect();
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Customer addition failed:', error);
      prisma.$disconnect();
      process.exit(1);
    });
}

module.exports = addSpecificCustomer;
