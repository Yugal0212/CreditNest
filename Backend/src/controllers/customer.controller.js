const prisma = require('../config/database');
const generateAvatarUrl = require('../utils/generateAvatar');
const { asyncHandler } = require('../middleware/errorHandler');
const { getLocalizedValue } = require('../utils/localization');

// =====================================================
// DASHBOARD
// =====================================================

/**
 * @route   GET /api/customer/dashboard
 * @desc    Get customer dashboard
 * @access  Private (Customer)
 */
exports.getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const shopId = req.user.shopId; // Get shopId from JWT token

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      customer: {
        where: {
          shopId: shopId // Ensure customer belongs to the correct shop
        },
        include: {
          shop: {
            include: {
              shopOwner: true,
            },
          },
        },
      },
    },
  });

  if (!user || !user.customer) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Customer profile not found or shop mismatch.',
    });
  }

  const customer = user.customer;

  res.json({
    success: true,
    dashboard: {
      creditBalance: customer.creditBalance,
      totalPurchases: customer.totalCredit,
      totalPaid: customer.totalPaid,
      lastPurchaseDate: customer.lastPurchase,
      status: customer.status,
      shop: {
        name: customer.shop.shopName,
        ownerName: customer.shop.shopOwner?.ownerName,
        phone: customer.shop.phone,
        address: customer.shop.address,
        email: customer.shop.email,
      },
    },
  });
});

// =====================================================
// PRODUCTS
// =====================================================

/**
 * @route   GET /api/customer/products
 * @desc    Get shop's product catalog
 * @access  Private (Customer)
 */
exports.getProducts = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const shopId = req.user.shopId; // Get shopId from JWT token
  const { page = 1, limit = 20, search = '', category } = req.query;
  const lang = req.lang || 'en';

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Verify customer belongs to this shop
  const customer = await prisma.customer.findFirst({
    where: { 
      userId,
      shopId // Ensure customer belongs to the shop in token
    },
    select: { shopId: true },
  });

  if (!customer) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Customer profile not found or shop mismatch.',
    });
  }

  // Explicitly filter by shopId from token for security
  const where = {
    shopId: shopId, // Use shopId from JWT token, not just from customer record
    isActive: true,
    ...(category && { category }),
    ...(search && {
      productName: { contains: search, mode: 'insensitive' },
    }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { productName: 'asc' },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    success: true,
    products: products.map((p) => ({
      id: p.id,
      name: getLocalizedValue(lang, {
        en: p.productNameEn,
        hi: p.productNameHi,
        gu: p.productNameGu,
        fallback: p.productName,
      }),
      unit: p.unit,
      pricePerUnit: p.pricePerUnit,
      photoUrl: p.photoUrl || generateAvatarUrl(p.productName),
      stockStatus: p.stockStatus,
      category: getLocalizedValue(lang, {
        en: p.categoryEn,
        hi: p.categoryHi,
        gu: p.categoryGu,
        fallback: p.category,
      }),
      description: p.description,
    })),
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / take),
      totalProducts: total,
      limit: take,
    },
  });
});

/**
 * @route   GET /api/customer/products/:productId
 * @desc    Get product details
 * @access  Private (Customer)
 */
exports.getProductDetails = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.userId;
  const shopId = req.user.shopId; // Get shopId from JWT token
  const lang = req.lang || 'en';

  // Verify customer belongs to this shop
  const customer = await prisma.customer.findFirst({
    where: { 
      userId,
      shopId // Ensure customer belongs to the shop in token
    },
    select: { shopId: true },
  });

  if (!customer) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Customer profile not found or shop mismatch.',
    });
  }

  // Use shopId from token for security
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      shopId: shopId, // Use shopId from JWT token
      isActive: true,
    },
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
    });
  }

  res.json({
    success: true,
    product: {
      id: product.id,
      name: getLocalizedValue(lang, {
        en: product.productNameEn,
        hi: product.productNameHi,
        gu: product.productNameGu,
        fallback: product.productName,
      }),
      unit: product.unit,
      pricePerUnit: product.pricePerUnit,
      photoUrl: product.photoUrl || generateAvatarUrl(product.productName),
      stockStatus: product.stockStatus,
      category: getLocalizedValue(lang, {
        en: product.categoryEn,
        hi: product.categoryHi,
        gu: product.categoryGu,
        fallback: product.category,
      }),
      description: product.description,
    },
  });
});

// =====================================================
// ORDERS/PURCHASES
// =====================================================

/**
 * @route   POST /api/customer/orders
 * @desc    Customer requests products from shop (order request)
 * @access  Private (Customer)
 */
exports.requestOrder = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const shopId = req.user.shopId; // Get shopId from JWT token
  const { items, notes } = req.body;
  const lang = req.lang || 'en';

  console.log('=== ORDER REQUEST DEBUG ===');
  console.log('User ID:', userId);
  console.log('Shop ID:', shopId);
  console.log('Items:', JSON.stringify(items, null, 2));
  console.log('Notes:', notes);

  if (!items || !Array.isArray(items) || items.length === 0) {
    console.error('Invalid items:', items);
    return res.status(400).json({ success: false, message: 'Items are required' });
  }

  // Verify customer belongs to this shop
  const customer = await prisma.customer.findFirst({
    where: { 
      userId,
      shopId // Ensure customer belongs to the shop in token
    },
    select: { id: true, shopId: true, customerName: true },
  });

  console.log('Customer found:', customer);

  if (!customer) {
    console.error('Customer not found for userId:', userId, 'shopId:', shopId);
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Customer profile not found or shop mismatch.' 
    });
  }

  // Validate products belong to the shop (use shopId from token)
  const productIds = items.map((i) => i.productId);
  console.log('Looking for products with IDs:', productIds);
  console.log('In shopId:', shopId);
  
  const products = await prisma.product.findMany({
    where: { 
      id: { in: productIds }, 
      shopId: shopId, // Use shopId from JWT token
      isActive: true 
    },
  });

  console.log('Products found:', products.length, 'out of', productIds.length);
  console.log('Products:', products.map(p => ({ id: p.id, name: p.productName, shopId: p.shopId })));

  if (products.length !== productIds.length) {
    console.error('Product mismatch. Requested:', productIds.length, 'Found:', products.length);
    const missingIds = productIds.filter(id => !products.find(p => p.id === id));
    console.error('Missing product IDs:', missingIds);
    return res.status(400).json({ 
      success: false, 
      message: 'One or more products are invalid or not available',
      missingProducts: missingIds
    });
  }

  // Calculate total based on actual product prices
  const itemsWithDetails = items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: product.pricePerUnit,
      subtotal: item.quantity * product.pricePerUnit,
    };
  });

  const totalAmount = itemsWithDetails.reduce((sum, i) => sum + i.subtotal, 0);

  // Create order request as PENDING transaction
  const transaction = await prisma.transaction.create({
    data: {
      shopId: customer.shopId,
      customerId: customer.id,
      transactionType: 'CREDIT_SALE',
      totalAmount,
      remainingBalance: totalAmount,
      paymentStatus: 'PENDING',
      notes: notes ? `[REQUEST] ${notes}` : '[REQUEST] Customer order request',
      items: {
        create: itemsWithDetails,
      },
    },
    include: {
      items: { include: { product: true } },
    },
  });

  console.log('Order request created successfully:', transaction.id);
  console.log('Total amount:', totalAmount);
  console.log('Items count:', transaction.items.length);

  res.status(201).json({
    success: true,
    message: 'Order request sent to shop owner',
    order: {
      id: transaction.id,
      totalAmount: transaction.totalAmount,
      items: transaction.items.map((i) => ({
        productName: getLocalizedValue(lang, {
          en: i.product.productNameEn,
          hi: i.product.productNameHi,
          gu: i.product.productNameGu,
          fallback: i.product.productName,
        }),
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        subtotal: i.subtotal,
      })),
      status: 'PENDING',
      date: transaction.transactionDate,
    },
  });
});

/**
 * @route   GET /api/customer/orders
 * @desc    Get purchase history
 * @access  Private (Customer)
 */
exports.getOrders = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const shopId = req.user.shopId; // Get shopId from JWT token
  const { page = 1, limit = 20, startDate, endDate } = req.query;
  const lang = req.lang || 'en';

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Verify customer belongs to this shop
  const customer = await prisma.customer.findFirst({
    where: { 
      userId,
      shopId // Ensure customer belongs to the shop in token
    },
    select: { id: true },
  });

  if (!customer) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Customer profile not found or shop mismatch.',
    });
  }

  const where = {
    customerId: customer.id,
    transactionType: 'CREDIT_SALE',
    ...(startDate &&
      endDate && {
      transactionDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    }),
  };

  const [orders, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      skip,
      take,
      orderBy: { transactionDate: 'desc' },
    }),
    prisma.transaction.count({ where }),
  ]);

  res.json({
    success: true,
    orders: orders.map((order) => ({
      id: order.id,
      date: order.transactionDate,
      items: order.items.map((item) => ({
        productName: getLocalizedValue(lang, {
          en: item.product.productNameEn,
          hi: item.product.productNameHi,
          gu: item.product.productNameGu,
          fallback: item.product.productName,
        }),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })),
      totalAmount: order.totalAmount,
      paidAmount: order.amountPaid,
      balance: order.remainingBalance,
      status: order.paymentStatus,
      notes: order.notes,
    })),
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / take),
      totalOrders: total,
      limit: take,
    },
  });
});

/**
 * @route   GET /api/customer/orders/:orderId
 * @desc    Get order details
 * @access  Private (Customer)
 */
exports.getOrderDetails = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.userId;
  const shopId = req.user.shopId; // Get shopId from JWT token
  const lang = req.lang || 'en';

  // Verify customer belongs to this shop
  const customer = await prisma.customer.findFirst({
    where: { 
      userId,
      shopId // Ensure customer belongs to the shop in token
    },
    select: { id: true },
  });

  if (!customer) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Customer profile not found or shop mismatch.',
    });
  }

  const order = await prisma.transaction.findFirst({
    where: {
      id: orderId,
      customerId: customer.id,
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      payments: true,
    },
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }

  res.json({
    success: true,
    order: {
      id: order.id,
      date: order.transactionDate,
      items: order.items.map((item) => ({
        productName: getLocalizedValue(lang, {
          en: item.product.productNameEn,
          hi: item.product.productNameHi,
          gu: item.product.productNameGu,
          fallback: item.product.productName,
        }),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })),
      totalAmount: order.totalAmount,
      paidAmount: order.amountPaid,
      balance: order.remainingBalance,
      status: order.paymentStatus,
      notes: order.notes,
      payments: order.payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        date: p.paymentDate,
        receiptNumber: p.receiptNumber,
      })),
    },
  });
});

// =====================================================
// PAYMENT HISTORY
// =====================================================

/**
 * @route   GET /api/customer/payments
 * @desc    Get payment history
 * @access  Private (Customer)
 */
exports.getPayments = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const shopId = req.user.shopId; // Get shopId from JWT token
  const { page = 1, limit = 20, startDate, endDate } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Verify customer belongs to this shop
  const customer = await prisma.customer.findFirst({
    where: { 
      userId,
      shopId // Ensure customer belongs to the shop in token
    },
    select: { id: true, totalPaid: true },
  });

  if (!customer) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Customer profile not found or shop mismatch.',
    });
  }

  const where = {
    customerId: customer.id,
    ...(startDate &&
      endDate && {
      paymentDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    }),
  };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take,
      orderBy: { paymentDate: 'desc' },
    }),
    prisma.payment.count({ where }),
  ]);

  res.json({
    success: true,
    payments: payments.map((p) => ({
      id: p.id,
      date: p.paymentDate,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      receiptNumber: p.receiptNumber,
      notes: p.notes,
    })),
    totalPaid: customer.totalPaid,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / take),
      totalPayments: total,
      limit: take,
    },
  });
});

module.exports = exports;
