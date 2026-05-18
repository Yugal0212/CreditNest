require('dotenv').config();
const prisma = require('../config/database');
const logger = require('../utils/logger');

// Import all seeders
const seedAdmin = require('./admin.seeder');
const seedShops = require('./shops.seeder');
const seedCustomers = require('./customers.seeder');
const seedProducts = require('./products.seeder');
const seedTransactions = require('./transactions.seeder');

/**
 * Main seeder - Runs all seeders in correct order
 */
const runAllSeeders = async () => {
  try {
    logger.info('🚀 Starting database seeding...');
    logger.info('================================\n');

    // 1. Seed Admin
    logger.info('📋 Step 1: Seeding Admin User...');
    await seedAdmin();
    logger.info('');

    // 2. Seed Shops & Shop Owners
    logger.info('📋 Step 2: Seeding Shops & Shop Owners...');
    await seedShops();
    logger.info('');

    // 3. Seed Customers
    logger.info('📋 Step 3: Seeding Customers...');
    await seedCustomers();
    logger.info('');

    // 4. Seed Products
    logger.info('📋 Step 4: Seeding Products...');
    await seedProducts();
    logger.info('');

    // 5. Seed Transactions & Payments
    logger.info('📋 Step 5: Seeding Transactions & Payments...');
    await seedTransactions();
    logger.info('');

    logger.info('================================');
    logger.info('🎉 All seeders completed successfully!');
    logger.info('================================\n');

    // Display summary
    await displaySummary();

  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

/**
 * Display database summary after seeding
 */
const displaySummary = async () => {
  try {
    const userCount = await prisma.user.count();
    const adminCount = await prisma.admin.count();
    const shopCount = await prisma.shop.count();
    const shopOwnerCount = await prisma.shopOwner.count();
    const customerCount = await prisma.customer.count();
    const productCount = await prisma.product.count();
    const transactionCount = await prisma.transaction.count();
    const paymentCount = await prisma.payment.count();

    // Get total credit statistics
    const creditStats = await prisma.customer.aggregate({
      _sum: {
        totalCredit: true,
        totalPaid: true,
        creditBalance: true,
      },
    });

    logger.info('📊 DATABASE SUMMARY:');
    logger.info('================================');
    logger.info(`👥 Users: ${userCount}`);
    logger.info(`👨‍💼 Admins: ${adminCount}`);
    logger.info(`🏪 Shops: ${shopCount}`);
    logger.info(`👤 Shop Owners: ${shopOwnerCount}`);
    logger.info(`🧑‍🤝‍🧑 Customers: ${customerCount}`);
    logger.info(`📦 Products: ${productCount}`);
    logger.info(`💳 Transactions: ${transactionCount}`);
    logger.info(`💰 Payments: ${paymentCount}`);
    logger.info('================================');
    logger.info('💵 CREDIT SUMMARY:');
    logger.info(`   Total Credit Given: ₹${creditStats._sum.totalCredit || 0}`);
    logger.info(`   Total Amount Paid: ₹${creditStats._sum.totalPaid || 0}`);
    logger.info(`   Outstanding Balance: ₹${creditStats._sum.creditBalance || 0}`);
    logger.info('================================\n');

    logger.info('🔐 DEFAULT CREDENTIALS:');
    logger.info('================================');
    logger.info('Admin:');
    logger.info('  Email: admin@scms.com');
    logger.info('  Password: Admin@123');
    logger.info('');
    logger.info('Shop Owners:');
    logger.info('  Password for all: Shop@123');
    logger.info('  Check logs above for individual shop owner emails');
    logger.info('================================\n');

  } catch (error) {
    logger.error('❌ Error displaying summary:', error);
  }
};

// Run seeder if called directly
if (require.main === module) {
  runAllSeeders()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Seeding process failed:', error);
      process.exit(1);
    });
}

module.exports = runAllSeeders;
