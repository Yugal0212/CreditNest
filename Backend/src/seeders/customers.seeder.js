require('dotenv').config();
const prisma = require('../config/database');
const logger = require('../utils/logger');

/**
 * Seed customers for each shop
 */
const seedCustomers = async () => {
  try {
    logger.info('🌱 Starting customers seeder...');

    // Get all shops
    const shops = await prisma.shop.findMany({
      where: {
        status: 'ACTIVE',
      },
    });

    if (shops.length === 0) {
      logger.warn('⚠️  No shops found. Please run shops seeder first.');
      return [];
    }

    const customersData = [
      {
        customerName: 'Ravi Mehta',
        email: 'ravi@example.com',
        phone: '+919123456780',
        address: '12 Gandhi Road, Sector 5',
        workplace: 'TCS IT Services',
        status: 'ACTIVE',
      },
      {
        customerName: 'Anita Desai',
        email: 'anita@example.com',
        phone: '+919123456781',
        address: '45 Nehru Street, Block A',
        workplace: 'State Bank of India',
        status: 'ACTIVE',
      },
      {
        customerName: 'Suresh Reddy',
        email: 'suresh@example.com',
        phone: '+919123456782',
        address: '78 MG Road, Suite 10',
        workplace: 'Infosys Technologies',
        status: 'ACTIVE',
      },
      {
        customerName: 'Lakshmi Iyer',
        email: 'lakshmi@example.com',
        phone: '+919123456783',
        address: '23 Temple Road',
        workplace: 'Government Hospital',
        status: 'ACTIVE',
      },
      {
        customerName: 'Mohammed Ali',
        email: 'mohammed@example.com',
        phone: '+919123456784',
        address: '56 Park Avenue',
        workplace: 'Own Business',
        status: 'ACTIVE',
      },
      {
        customerName: 'Deepa Nair',
        email: 'deepa@example.com',
        phone: '+919123456785',
        address: '89 Lake View',
        workplace: 'Teaching Professional',
        status: 'ACTIVE',
      },
      {
        customerName: 'Karthik Menon',
        email: 'karthik@example.com',
        phone: '+919123456786',
        address: '101 Station Road',
        workplace: 'Railway Department',
        status: 'OVERDUE',
      },
      {
        customerName: 'Pooja Gupta',
        email: 'pooja@example.com',
        phone: '+919123456787',
        address: '34 Market Street',
        workplace: 'Fashion Designer',
        status: 'ACTIVE',
      },
    ];

    const createdCustomers = [];

    // Create 3-4 customers for each shop
    let customerCounter = 0;
    let shopCounter = 0;
    for (const shop of shops) {
      shopCounter++;
      const shopCustomers = customersData.slice(0, Math.min(4, customersData.length));
      
      for (const customerData of shopCustomers) {
        customerCounter++;
        const uniqueEmail = `${customerData.email.split('@')[0]}.shop${shopCounter}.${customerCounter}@example.com`;
        const uniquePhoneSuffix = String(1000 + (shopCounter * 100) + customerCounter).padStart(4, '0');
        const uniquePhone = `+9191234${uniquePhoneSuffix}`;

        // Check if customer already exists
        const existingCustomer = await prisma.customer.findFirst({
          where: {
            shopId: shop.id,
            user: {
              email: uniqueEmail,
            },
          },
        });

        if (existingCustomer) {
          logger.info(`⏭️  Customer "${customerData.customerName}" already exists for shop "${shop.shopName}"`);
          continue;
        }

        // Create customer
        const customer = await prisma.customer.create({
          data: {
            customerName: customerData.customerName,
            address: customerData.address,
            workplace: customerData.workplace,
            photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(customerData.customerName)}&size=500&background=random`,
            totalCredit: 0,
            totalPaid: 0,
            creditBalance: 0,
            status: customerData.status,
            shop: {
              connect: { id: shop.id },
            },
            user: {
              create: {
                email: uniqueEmail,
                phone: uniquePhone,
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

        createdCustomers.push(customer);
        logger.info(`✅ Created customer: ${customer.customerName} for ${shop.shopName}`);
      }
    }

    logger.info(`✅ Customers seeder completed. Created ${createdCustomers.length} customers.`);
    return createdCustomers;
  } catch (error) {
    logger.error('❌ Customers seeder error:', error);
    throw error;
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedCustomers()
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

module.exports = seedCustomers;
