require('dotenv').config();
const prisma = require('../config/database');
const logger = require('../utils/logger');

/**
 * Verify database has been seeded with data
 */
const verifySeeding = async () => {
  try {
    logger.info('🔍 Verifying database seeding...\n');

    // Count all records
    const userCount = await prisma.user.count();
    const adminCount = await prisma.admin.count();
    const shopCount = await prisma.shop.count();
    const shopOwnerCount = await prisma.shopOwner.count();
    const customerCount = await prisma.customer.count();
    const productCount = await prisma.product.count();
    const transactionCount = await prisma.transaction.count();
    const paymentCount = await prisma.payment.count();
    const transactionItemCount = await prisma.transactionItem.count();

    // Get credit statistics
    const creditStats = await prisma.customer.aggregate({
      _sum: {
        totalCredit: true,
        totalPaid: true,
        creditBalance: true,
      },
    });

    // Get sample data
    const sampleShops = await prisma.shop.findMany({
      take: 3,
      select: {
        shopName: true,
        city: true,
        status: true,
      },
    });

    const sampleCustomers = await prisma.customer.findMany({
      take: 3,
      select: {
        customerName: true,
        creditBalance: true,
        shop: {
          select: {
            shopName: true,
          },
        },
      },
    });

    console.log('\n================================');
    console.log('📊 DATABASE SUMMARY');
    console.log('================================');
    console.log(`👥 Users: ${userCount}`);
    console.log(`👨‍💼 Admins: ${adminCount}`);
    console.log(`🏪 Shops: ${shopCount}`);
    console.log(`👤 Shop Owners: ${shopOwnerCount}`);
    console.log(`🧑‍🤝‍🧑 Customers: ${customerCount}`);
    console.log(`📦 Products: ${productCount}`);
    console.log(`💳 Transactions: ${transactionCount}`);
    console.log(`📝 Transaction Items: ${transactionItemCount}`);
    console.log(`💰 Payments: ${paymentCount}`);
    console.log('================================\n');

    console.log('💵 CREDIT SUMMARY');
    console.log('================================');
    console.log(`Total Credit Given: ₹${(creditStats._sum.totalCredit || 0).toFixed(2)}`);
    console.log(`Total Amount Paid: ₹${(creditStats._sum.totalPaid || 0).toFixed(2)}`);
    console.log(`Outstanding Balance: ₹${(creditStats._sum.creditBalance || 0).toFixed(2)}`);
    console.log('================================\n');

    console.log('🏪 SAMPLE SHOPS');
    console.log('================================');
    sampleShops.forEach((shop, index) => {
      console.log(`${index + 1}. ${shop.shopName} - ${shop.city} (${shop.status})`);
    });
    console.log('================================\n');

    console.log('🧑‍🤝‍🧑 SAMPLE CUSTOMERS');
    console.log('================================');
    sampleCustomers.forEach((customer, index) => {
      console.log(`${index + 1}. ${customer.customerName} at ${customer.shop.shopName} - Balance: ₹${customer.creditBalance}`);
    });
    console.log('================================\n');

    if (userCount === 0) {
      logger.warn('⚠️  Database appears to be empty. Please run seeding.');
    } else {
      logger.info('✅ Database has been seeded with data!');
    }

  } catch (error) {
    logger.error('❌ Verification error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

// Run verification if called directly
if (require.main === module) {
  verifySeeding()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = verifySeeding;
