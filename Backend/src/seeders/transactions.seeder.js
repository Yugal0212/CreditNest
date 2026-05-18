require('dotenv').config();
const prisma = require('../config/database');
const logger = require('../utils/logger');

/**
 * Seed transactions and payments
 */
const seedTransactions = async () => {
  try {
    logger.info('🌱 Starting transactions seeder...');

    // Get all customers with their shops
    const customers = await prisma.customer.findMany({
      include: {
        shop: {
          include: {
            products: true,
          },
        },
      },
    });

    if (customers.length === 0) {
      logger.warn('⚠️  No customers found. Please run customers seeder first.');
      return [];
    }

    const createdTransactions = [];
    const createdPayments = [];
    let receiptCounter = 1000;

    for (const customer of customers) {
      const shop = customer.shop;
      const products = shop.products;

      if (products.length === 0) {
        logger.warn(`⚠️  No products found for shop "${shop.shopName}". Skipping...`);
        continue;
      }

      // Create 2-3 transactions per customer
      const numTransactions = Math.floor(Math.random() * 2) + 2; // 2-3 transactions

      for (let i = 0; i < numTransactions; i++) {
        // Select 1-3 random products
        const numProducts = Math.floor(Math.random() * 3) + 1;
        const selectedProducts = [];
        const usedIndices = new Set();

        while (selectedProducts.length < numProducts && selectedProducts.length < products.length) {
          const index = Math.floor(Math.random() * products.length);
          if (!usedIndices.has(index)) {
            usedIndices.add(index);
            selectedProducts.push(products[index]);
          }
        }

        // Calculate total amount
        let totalAmount = 0;
        const items = selectedProducts.map((product) => {
          const quantity = Math.floor(Math.random() * 5) + 1; // 1-5 quantity
          const subtotal = product.pricePerUnit * quantity;
          totalAmount += subtotal;

          return {
            productId: product.id,
            quantity,
            unitPrice: product.pricePerUnit,
            subtotal,
          };
        });

        // Randomly decide payment status
        const paymentStatuses = ['PENDING', 'PARTIAL', 'PAID'];
        const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
        
        let amountPaid = 0;
        if (paymentStatus === 'PAID') {
          amountPaid = totalAmount;
        } else if (paymentStatus === 'PARTIAL') {
          amountPaid = Math.floor(totalAmount * (Math.random() * 0.4 + 0.3)); // 30-70% paid
        }

        const remainingBalance = totalAmount - amountPaid;

        // Random transaction date in the last 30 days
        const daysAgo = Math.floor(Math.random() * 30);
        const transactionDate = new Date();
        transactionDate.setDate(transactionDate.getDate() - daysAgo);

        // Create transaction with items
        const transaction = await prisma.transaction.create({
          data: {
            shopId: shop.id,
            customerId: customer.id,
            transactionType: 'CREDIT_SALE',
            totalAmount,
            paymentStatus,
            amountPaid,
            remainingBalance,
            transactionDate,
            notes: `Transaction #${createdTransactions.length + 1}`,
            items: {
              create: items,
            },
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        createdTransactions.push(transaction);

        // If payment was made, create payment record
        if (amountPaid > 0) {
          const paymentMethods = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER'];
          const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

          const payment = await prisma.payment.create({
            data: {
              transactionId: transaction.id,
              customerId: customer.id,
              shopId: shop.id,
              amount: amountPaid,
              paymentMethod,
              paymentDate: transactionDate,
              receiptNumber: `RCP${String(receiptCounter++).padStart(6, '0')}`,
              notes: `Payment for Transaction #${createdTransactions.length}`,
            },
          });

          createdPayments.push(payment);
        }

        // Update customer credit balance
        const updatedCustomer = await prisma.customer.update({
          where: { id: customer.id },
          data: {
            totalCredit: { increment: totalAmount },
            totalPaid: { increment: amountPaid },
            creditBalance: { increment: remainingBalance },
            lastPurchase: transactionDate,
          },
        });

        logger.info(`✅ Created transaction for ${customer.customerName} at ${shop.shopName} - ₹${totalAmount} (${paymentStatus})`);
      }
    }

    logger.info(`✅ Transactions seeder completed.`);
    logger.info(`   Created ${createdTransactions.length} transactions`);
    logger.info(`   Created ${createdPayments.length} payments`);
    
    return { transactions: createdTransactions, payments: createdPayments };
  } catch (error) {
    logger.error('❌ Transactions seeder error:', error);
    throw error;
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedTransactions()
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

module.exports = seedTransactions;
