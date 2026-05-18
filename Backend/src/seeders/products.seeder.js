require('dotenv').config();
const prisma = require('../config/database');
const logger = require('../utils/logger');

/**
 * Seed products for each shop
 */
const seedProducts = async () => {
  try {
    logger.info('🌱 Starting products seeder...');

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

    const productsByCategory = {
      'Green Grocers': [
        { productName: 'Rice (Basmati)', category: 'Grains', unit: 'kg', pricePerUnit: 120, stockStatus: 'AVAILABLE' },
        { productName: 'Wheat Flour', category: 'Grains', unit: 'kg', pricePerUnit: 45, stockStatus: 'AVAILABLE' },
        { productName: 'Sugar', category: 'Groceries', unit: 'kg', pricePerUnit: 50, stockStatus: 'AVAILABLE' },
        { productName: 'Cooking Oil', category: 'Groceries', unit: 'liter', pricePerUnit: 180, stockStatus: 'AVAILABLE' },
        { productName: 'Lentils (Dal)', category: 'Grains', unit: 'kg', pricePerUnit: 100, stockStatus: 'LOW_STOCK' },
        { productName: 'Tea Powder', category: 'Beverages', unit: 'kg', pricePerUnit: 400, stockStatus: 'AVAILABLE' },
        { productName: 'Salt', category: 'Groceries', unit: 'kg', pricePerUnit: 20, stockStatus: 'AVAILABLE' },
        { productName: 'Turmeric Powder', category: 'Spices', unit: 'kg', pricePerUnit: 250, stockStatus: 'AVAILABLE' },
      ],
      'City Electronics': [
        { productName: 'LED TV 32"', category: 'Electronics', unit: 'piece', pricePerUnit: 15000, stockStatus: 'AVAILABLE' },
        { productName: 'Washing Machine', category: 'Electronics', unit: 'piece', pricePerUnit: 22000, stockStatus: 'AVAILABLE' },
        { productName: 'Refrigerator', category: 'Electronics', unit: 'piece', pricePerUnit: 18000, stockStatus: 'LOW_STOCK' },
        { productName: 'Mixer Grinder', category: 'Electronics', unit: 'piece', pricePerUnit: 3500, stockStatus: 'AVAILABLE' },
        { productName: 'Electric Kettle', category: 'Electronics', unit: 'piece', pricePerUnit: 1200, stockStatus: 'AVAILABLE' },
        { productName: 'Iron Box', category: 'Electronics', unit: 'piece', pricePerUnit: 800, stockStatus: 'AVAILABLE' },
      ],
      'Fashion Hub': [
        { productName: 'Cotton Shirt', category: 'Clothing', unit: 'piece', pricePerUnit: 800, stockStatus: 'AVAILABLE' },
        { productName: 'Denim Jeans', category: 'Clothing', unit: 'piece', pricePerUnit: 1500, stockStatus: 'AVAILABLE' },
        { productName: 'Ladies Saree', category: 'Clothing', unit: 'piece', pricePerUnit: 2500, stockStatus: 'AVAILABLE' },
        { productName: 'Kurta Set', category: 'Clothing', unit: 'piece', pricePerUnit: 1200, stockStatus: 'AVAILABLE' },
        { productName: 'Leather Belt', category: 'Accessories', unit: 'piece', pricePerUnit: 500, stockStatus: 'LOW_STOCK' },
        { productName: 'Sports Shoes', category: 'Footwear', unit: 'pair', pricePerUnit: 2000, stockStatus: 'AVAILABLE' },
      ],
      'Daily Needs Store': [
        { productName: 'Bread Loaf', category: 'Bakery', unit: 'piece', pricePerUnit: 40, stockStatus: 'AVAILABLE' },
        { productName: 'Milk', category: 'Dairy', unit: 'liter', pricePerUnit: 60, stockStatus: 'AVAILABLE' },
        { productName: 'Eggs', category: 'Dairy', unit: 'dozen', pricePerUnit: 70, stockStatus: 'AVAILABLE' },
        { productName: 'Butter', category: 'Dairy', unit: 'kg', pricePerUnit: 500, stockStatus: 'AVAILABLE' },
        { productName: 'Biscuits', category: 'Snacks', unit: 'packet', pricePerUnit: 30, stockStatus: 'AVAILABLE' },
        { productName: 'Shampoo', category: 'Personal Care', unit: 'bottle', pricePerUnit: 150, stockStatus: 'AVAILABLE' },
        { productName: 'Soap', category: 'Personal Care', unit: 'piece', pricePerUnit: 40, stockStatus: 'AVAILABLE' },
      ],
      'Book Paradise': [
        { productName: 'Notebook (200 pages)', category: 'Stationery', unit: 'piece', pricePerUnit: 80, stockStatus: 'AVAILABLE' },
        { productName: 'Pen Set', category: 'Stationery', unit: 'set', pricePerUnit: 120, stockStatus: 'AVAILABLE' },
        { productName: 'School Bag', category: 'Accessories', unit: 'piece', pricePerUnit: 800, stockStatus: 'AVAILABLE' },
        { productName: 'Drawing Book', category: 'Stationery', unit: 'piece', pricePerUnit: 50, stockStatus: 'AVAILABLE' },
        { productName: 'Textbook (English)', category: 'Books', unit: 'piece', pricePerUnit: 350, stockStatus: 'LOW_STOCK' },
        { productName: 'Calculator', category: 'Electronics', unit: 'piece', pricePerUnit: 250, stockStatus: 'AVAILABLE' },
      ],
    };

    const createdProducts = [];

    for (const shop of shops) {
      const productsData = productsByCategory[shop.shopName] || productsByCategory['Daily Needs Store'];

      for (const productData of productsData) {
        // Check if product already exists
        const existingProduct = await prisma.product.findFirst({
          where: {
            shopId: shop.id,
            productName: productData.productName,
          },
        });

        if (existingProduct) {
          logger.info(`⏭️  Product "${productData.productName}" already exists for "${shop.shopName}"`);
          continue;
        }

        // Create product
        const product = await prisma.product.create({
          data: {
            shopId: shop.id,
            productName: productData.productName,
            category: productData.category,
            unit: productData.unit,
            pricePerUnit: productData.pricePerUnit,
            stockStatus: productData.stockStatus,
            description: `High quality ${productData.productName.toLowerCase()}`,
            isActive: true,
          },
        });

        createdProducts.push(product);
        logger.info(`✅ Created product: ${product.productName} for ${shop.shopName}`);
      }
    }

    logger.info(`✅ Products seeder completed. Created ${createdProducts.length} products.`);
    return createdProducts;
  } catch (error) {
    logger.error('❌ Products seeder error:', error);
    throw error;
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedProducts()
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

module.exports = seedProducts;
