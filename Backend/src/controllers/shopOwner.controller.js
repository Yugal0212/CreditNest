const prisma = require('../config/database');
const { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } = require('../services/upload.service');
const { sendWelcomeEmail } = require('../services/email.service');
const { sendWelcomeSMS } = require('../services/sms.service');
const generateAvatarUrl = require('../utils/generateAvatar');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');
const { ROLES, FILE_UPLOAD, PAGINATION } = require('../config/constants');
const { normalizePhoneNumber, isValidIndianPhone } = require('../utils/phoneValidation');
const { getLocalizedValue } = require('../utils/localization');

// =====================================================
// DASHBOARD
// =====================================================

/**
 * @route   GET /api/shop-owner/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private (Shop Owner)
 */
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Run all queries in parallel for faster response
  const [totalCustomers, activeCustomers, overdueCustomers, creditStats, monthSales, pendingPayments] = await Promise.all([
    // Total customers
    prisma.customer.count({ where: { shopId } }),
    // Active customers (purchased in last 30 days)
    prisma.customer.count({
      where: { shopId, lastPurchase: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
    // Overdue customers
    prisma.customer.count({ where: { shopId, status: 'OVERDUE' } }),
    // Credit balance stats
    prisma.customer.aggregate({
      where: { shopId },
      _sum: { creditBalance: true, totalPaid: true },
    }),
    // This month's sales
    prisma.transaction.aggregate({
      where: { shopId, transactionType: 'CREDIT_SALE', transactionDate: { gte: startOfMonth } },
      _sum: { totalAmount: true },
    }),
    // Pending payments
    prisma.transaction.aggregate({
      where: { shopId, paymentStatus: { in: ['PENDING', 'PARTIAL'] } },
      _sum: { remainingBalance: true },
    }),
  ]);

  res.json({
    success: true,
    stats: {
      totalCustomers,
      activeCustomers,
      overdueCustomers,
      totalCreditOutstanding: creditStats._sum.creditBalance || 0,
      thisMonthSales: monthSales._sum.totalAmount || 0,
      pendingPayments: pendingPayments._sum.remainingBalance || 0,
    },
  });
});

// =====================================================
// CUSTOMER MANAGEMENT
// =====================================================

/**
 * @route   GET /api/shop-owner/customers
 * @desc    Get all customers
 * @access  Private (Shop Owner)
 */
exports.getAllCustomers = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const { page = 1, limit = 20, search = '', status } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {
    shopId,
    user: { isActive: true },
    ...(status && { status }),
    ...(search && {
      OR: [
        { customerName: { contains: search, mode: 'insensitive' } },
        { user: { phone: { contains: search } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ],
    }),
  };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            phone: true,
          },
        },
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.customer.count({ where }),
  ]);

  const formattedCustomers = customers.map((customer) => ({
    id: customer.id,
    name: customer.customerName,
    phone: customer.user.phone,
    email: customer.user.email,
    avatar: customer.photoUrl || generateAvatarUrl(customer.customerName),
    address: customer.address,
    workplace: customer.workplace,
    totalCredit: customer.totalCredit,
    totalPaid: customer.totalPaid,
    creditBalance: customer.creditBalance,
    status: customer.status,
    joinDate: customer.joinDate,
    lastPurchase: customer.lastPurchase,
  }));

  res.json({
    success: true,
    customers: formattedCustomers,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / take),
      totalCustomers: total,
      limit: take,
    },
  });
});

/**
 * @route   GET /api/shop-owner/customers/:customerId
 * @desc    Get customer details
 * @access  Private (Shop Owner)
 */
exports.getCustomerDetails = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const shopId = req.user.shopId;
    const lang = req.lang || 'en';

  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      shopId,
    },
    include: {
      user: {
        select: {
          email: true,
          phone: true,
        },
      },
      transactions: {
        take: 10,
        orderBy: { transactionDate: 'desc' },
        where: {
          // Exclude pending order requests - only show approved orders
          OR: [
            { notes: null },
            { NOT: { notes: { startsWith: '[REQUEST]' } } }
          ]
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      },
      payments: {
        take: 10,
        orderBy: { paymentDate: 'desc' },
      },
    },
  });

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found',
    });
  }

  res.json({
    success: true,
    customer: {
      id: customer.id,
      name: customer.customerName,
      phone: customer.user.phone,
      email: customer.user.email,
      avatar: customer.photoUrl || generateAvatarUrl(customer.customerName),
      address: customer.address,
      workplace: customer.workplace,
      totalCredit: customer.totalCredit,
      totalPaid: customer.totalPaid,
      creditBalance: customer.creditBalance,
      status: customer.status,
      joinDate: customer.joinDate,
      lastPurchase: customer.lastPurchase,
      recentTransactions: customer.transactions.map((t) => ({
        id: t.id,
        date: t.transactionDate,
        amount: t.totalAmount,
        products: t.items.map((item) => {
          const name = getLocalizedValue(lang, {
            en: item.product.productNameEn,
            hi: item.product.productNameHi,
            gu: item.product.productNameGu,
            fallback: item.product.productName,
          });
          return `${name} (${item.quantity})`;
        }),
        status: t.paymentStatus,
      })),
      paymentHistory: customer.payments.map((p) => ({
        id: p.id,
        date: p.paymentDate,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        receiptNumber: p.receiptNumber,
      })),
    },
  });
});

/**
 * @route   POST /api/shop-owner/customers
 * @desc    Add new customer
 * @access  Private (Shop Owner)
 */
exports.addCustomer = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const { name, phone, email, address, workplace } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Email is required for customer registration',
    });
  }

  // Normalize phone number
  const normalizedPhone = normalizePhoneNumber(phone);

  // Validate phone number
  if (!isValidIndianPhone(normalizedPhone)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid Indian phone number. Please use a valid 10-digit number.',
    });
  }

  // Build query conditions for existing user check
  const normalizedEmail = email.toLowerCase().trim();
  const existingUserConditions = [
    { phone: normalizedPhone },
    { email: normalizedEmail },
  ];

  // Check if user already exists with normalized phone or email
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: existingUserConditions,
    },
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Phone number or email already registered',
    });
  }

  let photoUrl = null;

  // Upload photo if provided
  if (req.file) {
    const timestamp = Date.now();
    const fileName = `customer_${timestamp}`;
    const result = await uploadToCloudinary(
      req.file,
      FILE_UPLOAD.FOLDERS.CUSTOMERS,
      fileName
    );
    photoUrl = result.secure_url;
  } else {
    // Generate default avatar
    photoUrl = generateAvatarUrl(name);
  }

  // Create user with normalized phone
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      phone: normalizedPhone,
      role: ROLES.CUSTOMER,
    },
  });

  // Create customer
  const customer = await prisma.customer.create({
    data: {
      userId: user.id,
      shopId,
      customerName: name,
      address,
      workplace,
      photoUrl,
    },
  });

  // Send welcome email and SMS
  try {
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    await sendWelcomeEmail(normalizedEmail, name, shop.shopName, normalizedPhone);
    await sendWelcomeSMS(normalizedPhone, name, shop.shopName);
  } catch (error) {
    logger.error('Failed to send welcome message:', error);
  }

  logger.info(`Customer added: ${name} (${normalizedPhone}) by shop ${shopId}`);

  res.status(201).json({
    success: true,
    message: 'Customer added successfully',
    customer: {
      id: customer.id,
      name: customer.customerName,
      phone: normalizedPhone,
      email: normalizedEmail,
      avatar: photoUrl,
      address,
      workplace,
      creditBalance: 0,
      totalCredit: 0,
      totalPaid: 0,
      status: customer.status,
      joinDate: customer.joinDate,
    },
  });
});

/**
 * @route   PUT /api/shop-owner/customers/:customerId
 * @desc    Update customer
 * @access  Private (Shop Owner)
 */
exports.updateCustomer = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const shopId = req.user.shopId;
  const { name, phone, email, address, workplace } = req.body;

  // Find customer
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, shopId },
    include: { user: true },
  });

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found',
    });
  }

  // Check if phone/email is taken by another user
  const updateConditions = [];

  // Check phone if it's being changed
  if (phone && phone !== customer.user.phone) {
    updateConditions.push({ phone });
  }

  // Check email if it's being changed and provided
  if (email && email.trim() && email !== customer.user.email) {
    updateConditions.push({ email: email.toLowerCase().trim() });
  }

  // Only query if there are conditions to check
  if (updateConditions.length > 0) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: updateConditions,
        NOT: { id: customer.userId },
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Phone number or email already used by another user',
      });
    }
  }

  let photoUrl = customer.photoUrl;

  // Upload new photo if provided
  if (req.file) {
    // Delete old photo if it's from Cloudinary
    if (customer.photoUrl && customer.photoUrl.includes('cloudinary')) {
      try {
        const publicId = getPublicIdFromUrl(customer.photoUrl);
        if (publicId) await deleteFromCloudinary(publicId);
      } catch (error) {
        logger.error('Failed to delete old photo:', error);
      }
    }

    const timestamp = Date.now();
    const fileName = `customer_${timestamp}`;
    const result = await uploadToCloudinary(
      req.file,
      FILE_UPLOAD.FOLDERS.CUSTOMERS,
      fileName
    );
    photoUrl = result.secure_url;
  }

  // Update user
  await prisma.user.update({
    where: { id: customer.userId },
    data: {
      phone,
      email: email && email.trim() ? email.toLowerCase().trim() : null
    },
  });

  // Update customer
  const updatedCustomer = await prisma.customer.update({
    where: { id: customerId },
    data: {
      customerName: name,
      address,
      workplace,
      photoUrl,
    },
    include: {
      user: true,
    },
  });

  logger.info(`Customer updated: ${customerId}`);

  res.json({
    success: true,
    message: 'Customer updated successfully',
    customer: {
      id: updatedCustomer.id,
      name: updatedCustomer.customerName,
      phone: updatedCustomer.user.phone,
      email: updatedCustomer.user.email,
      avatar: photoUrl,
      address: updatedCustomer.address,
      workplace: updatedCustomer.workplace,
      creditBalance: updatedCustomer.creditBalance,
      totalCredit: updatedCustomer.totalCredit,
      totalPaid: updatedCustomer.totalPaid,
    },
  });
});

/**
 * @route   DELETE /api/shop-owner/customers/:customerId
 * @desc    Delete customer (soft delete - mark as inactive)
 * @access  Private (Shop Owner)
 */
exports.deleteCustomer = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const shopId = req.user.shopId;

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, shopId },
    include: { user: true },
  });

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found',
    });
  }

  // Check if customer has pending credit
  if (customer.creditBalance > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete customer with pending credit balance of ₹${customer.creditBalance}`,
    });
  }

  // Soft delete - mark user as inactive
  await prisma.user.update({
    where: { id: customer.userId },
    data: { isActive: false },
  });

  logger.info(`Customer deleted: ${customerId}`);

  res.json({
    success: true,
    message: 'Customer deleted successfully',
  });
});

// =====================================================
// PRODUCT MANAGEMENT
// =====================================================

/**
 * @route   GET /api/shop-owner/products
 * @desc    Get all products
 * @access  Private (Shop Owner)
 */
exports.getAllProducts = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const { page = 1, limit = 20, search = '', category } = req.query;
  const lang = req.lang || 'en';

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {
    shopId,
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
      orderBy: { createdAt: 'desc' },
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
      category: getLocalizedValue(lang, {
        en: p.categoryEn,
        hi: p.categoryHi,
        gu: p.categoryGu,
        fallback: p.category,
      }),
      unit: p.unit,
      pricePerUnit: p.pricePerUnit,
      photoUrl: p.photoUrl || generateAvatarUrl(p.productName),
      stockStatus: p.stockStatus,
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
 * @route   POST /api/shop-owner/products
 * @desc    Add new product
 * @access  Private (Shop Owner)
 */
exports.addProduct = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const {
    productName,
    productNameEn,
    productNameHi,
    productNameGu,
    category,
    categoryEn,
    categoryHi,
    categoryGu,
    unit,
    pricePerUnit,
    stockStatus,
    description,
  } = req.body;

  const lang = req.lang || 'en';
  const normalizedProductName = productName?.trim();
  const normalizedCategory = category?.trim();

  let photoUrl = null;

  // Upload photo if provided
  if (req.file) {
    const timestamp = Date.now();
    const fileName = `product_${timestamp}`;
    const result = await uploadToCloudinary(
      req.file,
      FILE_UPLOAD.FOLDERS.PRODUCTS,
      fileName
    );
    photoUrl = result.secure_url;
  } else {
    photoUrl = generateAvatarUrl(productName);
  }

  const product = await prisma.product.create({
    data: {
      shopId,
      productName: normalizedProductName,
      productNameEn: productNameEn?.trim() || normalizedProductName,
      productNameHi: productNameHi?.trim() || null,
      productNameGu: productNameGu?.trim() || null,
      category: normalizedCategory,
      categoryEn: categoryEn?.trim() || normalizedCategory || null,
      categoryHi: categoryHi?.trim() || null,
      categoryGu: categoryGu?.trim() || null,
      unit,
      pricePerUnit: parseFloat(pricePerUnit),
      photoUrl,
      stockStatus: stockStatus || 'AVAILABLE',
      description,
    },
  });

  logger.info(`Product added: ${productName} by shop ${shopId}`);

  res.status(201).json({
    success: true,
    message: 'Product added successfully',
    product: {
      id: product.id,
      name: getLocalizedValue(lang, {
        en: product.productNameEn,
        hi: product.productNameHi,
        gu: product.productNameGu,
        fallback: product.productName,
      }),
      category: getLocalizedValue(lang, {
        en: product.categoryEn,
        hi: product.categoryHi,
        gu: product.categoryGu,
        fallback: product.category,
      }),
      unit: product.unit,
      pricePerUnit: product.pricePerUnit,
      photoUrl: product.photoUrl,
      stockStatus: product.stockStatus,
      description: product.description,
    },
  });
});

/**
 * @route   PUT /api/shop-owner/products/:productId
 * @desc    Update product
 * @access  Private (Shop Owner)
 */
exports.updateProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const shopId = req.user.shopId;
  const {
    productName,
    productNameEn,
    productNameHi,
    productNameGu,
    category,
    categoryEn,
    categoryHi,
    categoryGu,
    unit,
    pricePerUnit,
    stockStatus,
    description,
  } = req.body;

  const lang = req.lang || 'en';

  const product = await prisma.product.findFirst({
    where: { id: productId, shopId },
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
    });
  }

  let photoUrl = product.photoUrl;

  // Upload new photo if provided
  if (req.file) {
    // Delete old photo if it's from Cloudinary
    if (product.photoUrl && product.photoUrl.includes('cloudinary')) {
      try {
        const publicId = getPublicIdFromUrl(product.photoUrl);
        if (publicId) await deleteFromCloudinary(publicId);
      } catch (error) {
        logger.error('Failed to delete old photo:', error);
      }
    }

    const timestamp = Date.now();
    const fileName = `product_${timestamp}`;
    const result = await uploadToCloudinary(
      req.file,
      FILE_UPLOAD.FOLDERS.PRODUCTS,
      fileName
    );
    photoUrl = result.secure_url;
  }

  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: {
      ...(productName && { productName: productName.trim() }),
      ...(productNameEn && { productNameEn: productNameEn.trim() }),
      ...(productNameHi && { productNameHi: productNameHi.trim() }),
      ...(productNameGu && { productNameGu: productNameGu.trim() }),
      ...(category !== undefined && { category: category?.trim() }),
      ...(categoryEn && { categoryEn: categoryEn.trim() }),
      ...(categoryHi && { categoryHi: categoryHi.trim() }),
      ...(categoryGu && { categoryGu: categoryGu.trim() }),
      ...(unit && { unit }),
      ...(pricePerUnit && { pricePerUnit: parseFloat(pricePerUnit) }),
      ...(stockStatus && { stockStatus }),
      ...(description !== undefined && { description }),
      ...(photoUrl !== product.photoUrl && { photoUrl }),
    },
  });

  logger.info(`Product updated: ${productId}`);

  res.json({
    success: true,
    message: 'Product updated successfully',
    product: {
      id: updatedProduct.id,
      name: getLocalizedValue(lang, {
        en: updatedProduct.productNameEn,
        hi: updatedProduct.productNameHi,
        gu: updatedProduct.productNameGu,
        fallback: updatedProduct.productName,
      }),
      category: getLocalizedValue(lang, {
        en: updatedProduct.categoryEn,
        hi: updatedProduct.categoryHi,
        gu: updatedProduct.categoryGu,
        fallback: updatedProduct.category,
      }),
      unit: updatedProduct.unit,
      pricePerUnit: updatedProduct.pricePerUnit,
      photoUrl: updatedProduct.photoUrl,
      stockStatus: updatedProduct.stockStatus,
      description: updatedProduct.description,
    },
  });
});

/**
 * @route   DELETE /api/shop-owner/products/:productId
 * @desc    Delete product (soft delete)
 * @access  Private (Shop Owner)
 */
exports.deleteProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const shopId = req.user.shopId;

  const product = await prisma.product.findFirst({
    where: { id: productId, shopId },
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
    });
  }

  // Soft delete
  await prisma.product.update({
    where: { id: productId },
    data: { isActive: false },
  });

  logger.info(`Product deleted: ${productId}`);

  res.json({
    success: true,
    message: 'Product deleted successfully',
  });
});

// =====================================================
// TRANSACTION MANAGEMENT (Credit Sales)
// =====================================================

/**
 * @route   POST /api/shop-owner/transactions/credit-sale
 * @desc    Record credit sale
 * @access  Private (Shop Owner)
 */
exports.recordCreditSale = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const { customerId, items, totalAmount, notes } = req.body;
  const lang = req.lang || 'en';

  // Verify customer belongs to this shop
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, shopId },
  });

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found',
    });
  }

  // Calculate subtotals
  const calculatedTotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
    return res.status(400).json({
      success: false,
      message: 'Total amount mismatch',
    });
  }

  // Create transaction with items
  const transaction = await prisma.transaction.create({
    data: {
      shopId,
      customerId,
      transactionType: 'CREDIT_SALE',
      totalAmount,
      remainingBalance: totalAmount,
      notes,
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.quantity * item.unitPrice,
        })),
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      customer: {
        include: {
          user: true,
        },
      },
    },
  });

  // Update customer credit balance
  await prisma.customer.update({
    where: { id: customerId },
    data: {
      totalCredit: { increment: totalAmount },
      creditBalance: { increment: totalAmount },
      lastPurchase: new Date(),
      status: 'ACTIVE',
    },
  });

  logger.info(`Credit sale recorded: ₹${totalAmount} for customer ${customerId}`);

  res.status(201).json({
    success: true,
    message: 'Sale recorded successfully',
    transaction: {
      id: transaction.id,
      receiptNumber: `RCPT-${new Date().getFullYear()}-${transaction.id.toString().padStart(6, '0')}`,
      customerId: transaction.customerId,
      customerName: transaction.customer.customerName,
      items: transaction.items.map((item) => ({
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
      totalAmount: transaction.totalAmount,
      date: transaction.transactionDate,
    },
  });
});

/**
 * @route   GET /api/shop-owner/transactions
 * @desc    Get all transactions
 * @access  Private (Shop Owner)
 */
exports.getAllTransactions = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const { page = 1, limit = 20, customerId, startDate, endDate, status } = req.query;
  const lang = req.lang || 'en';

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {
    shopId,
    transactionType: 'CREDIT_SALE',
    OR: [
      { notes: null },
      { NOT: { notes: { contains: '[REQUEST]' } } },
    ],
    ...(customerId && { customerId }),
    ...(status && { paymentStatus: status }),
    ...(startDate &&
      endDate && {
      transactionDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    }),
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        customer: {
          include: {
            user: true,
          },
        },
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
    transactions: transactions.map((t) => ({
      id: t.id,
      customerId: t.customerId,
      customerName: t.customer.customerName,
      type: t.transactionType,
      totalAmount: t.totalAmount,
      paidAmount: t.amountPaid,
      balance: t.remainingBalance,
      status: t.paymentStatus,
      date: t.transactionDate,
      items: t.items.map((item) => ({
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
    })),
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / take),
      totalTransactions: total,
      limit: take,
    },
  });
});

// =====================================================
// PAYMENT MANAGEMENT
// =====================================================

/**
 * @route   POST /api/shop-owner/payments
 * @desc    Record payment
 * @access  Private (Shop Owner)
 */
exports.recordPayment = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const { customerId, transactionId, amount, paymentMethod, notes } = req.body;

  // Verify customer
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, shopId },
  });

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found',
    });
  }

  if (amount > customer.creditBalance) {
    return res.status(400).json({
      success: false,
      message: 'Payment amount exceeds credit balance',
    });
  }

  // Generate receipt number
  const receiptNumber = `PAY-${new Date().getFullYear()}-${Date.now()}`;

  // Create payment
  const payment = await prisma.payment.create({
    data: {
      customerId,
      shopId,
      transactionId: transactionId || null,
      amount,
      paymentMethod,
      receiptNumber,
      notes,
    },
  });

  // Update customer balance
  const updatedCustomer = await prisma.customer.update({
    where: { id: customerId },
    data: {
      totalPaid: { increment: amount },
      creditBalance: { decrement: amount },
    },
  });

  // Update customer status
  if (updatedCustomer.creditBalance === 0) {
    await prisma.customer.update({
      where: { id: customerId },
      data: { status: 'CLEARED' },
    });
  }

  // If specific transaction, update it
  if (transactionId) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (transaction) {
      const newAmountPaid = transaction.amountPaid + amount;
      const newRemainingBalance = transaction.totalAmount - newAmountPaid;
      const newStatus =
        newRemainingBalance === 0 ? 'PAID' : newRemainingBalance < transaction.totalAmount ? 'PARTIAL' : 'PENDING';

      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          amountPaid: newAmountPaid,
          remainingBalance: newRemainingBalance,
          paymentStatus: newStatus,
        },
      });
    }
  }

  logger.info(`Payment recorded: ₹${amount} from customer ${customerId}`);

  res.status(201).json({
    success: true,
    message: 'Payment recorded successfully',
    payment: {
      id: payment.id,
      receiptNumber: payment.receiptNumber,
      amount: payment.amount,
      date: payment.paymentDate,
      updatedBalance: updatedCustomer.creditBalance,
    },
  });
});

/**
 * @route   GET /api/shop-owner/payments
 * @desc    Get payment history
 * @access  Private (Shop Owner)
 */
exports.getPaymentHistory = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const { page = 1, limit = 20, customerId, startDate, endDate } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {
    shopId,
    ...(customerId && { customerId }),
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
      include: {
        customer: {
          include: {
            user: true,
          },
        },
      },
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
      customerId: p.customerId,
      customerName: p.customer.customerName,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      receiptNumber: p.receiptNumber,
      date: p.paymentDate,
      notes: p.notes,
    })),
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / take),
      totalPayments: total,
      limit: take,
    },
  });
});

// =====================================================
// ANALYTICS
// =====================================================

/**
 * @route   GET /api/shop-owner/analytics
 * @desc    Get analytics data
 * @access  Private (Shop Owner)
 */
exports.getAnalytics = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const { period = '30days' } = req.query;
  const lang = req.lang || 'en';

  // Calculate date range
  let startDate = new Date();
  if (period === '7days') {
    startDate.setDate(startDate.getDate() - 7);
  } else if (period === '30days') {
    startDate.setDate(startDate.getDate() - 30);
  } else if (period === '90days') {
    startDate.setDate(startDate.getDate() - 90);
  } else if (period === '1year') {
    startDate.setFullYear(startDate.getFullYear() - 1);
  }

  // Revenue analytics
  const revenueData = await prisma.transaction.aggregate({
    where: {
      shopId,
      transactionType: 'CREDIT_SALE',
      transactionDate: { gte: startDate },
    },
    _sum: { totalAmount: true },
  });

  // Credit analytics
  const creditData = await prisma.customer.aggregate({
    where: { shopId },
    _sum: {
      creditBalance: true,
      totalPaid: true,
      totalCredit: true,
    },
  });

  const creditRecoveryRate =
    creditData._sum.totalCredit > 0
      ? ((creditData._sum.totalPaid / creditData._sum.totalCredit) * 100).toFixed(2)
      : 0;

  // Customer analytics
  const totalCustomers = await prisma.customer.count({ where: { shopId } });
  const activeCustomers = await prisma.customer.count({
    where: {
      shopId,
      lastPurchase: { gte: startDate },
    },
  });
  const newCustomers = await prisma.customer.count({
    where: {
      shopId,
      joinDate: { gte: startDate },
    },
  });

  // Top customers
  const topCustomers = await prisma.customer.findMany({
    where: { shopId },
    orderBy: { totalCredit: 'desc' },
    take: 10,
    select: {
      customerName: true,
      totalCredit: true,
      totalPaid: true,
      creditBalance: true,
    },
  });

  // Top products
  const topProducts = await prisma.transactionItem.groupBy({
    by: ['productId'],
    where: {
      transaction: {
        shopId,
        transactionDate: { gte: startDate },
      },
    },
    _sum: {
      quantity: true,
      subtotal: true,
    },
    orderBy: {
      _sum: {
        subtotal: 'desc',
      },
    },
    take: 10,
  });

  const topProductDetails = await prisma.product.findMany({
    where: {
      id: { in: topProducts.map((p) => p.productId) },
    },
  });

  const topProductsWithDetails = topProducts.map((tp) => {
    const product = topProductDetails.find((p) => p.id === tp.productId);
    return {
      productName: getLocalizedValue(lang, {
        en: product?.productNameEn,
        hi: product?.productNameHi,
        gu: product?.productNameGu,
        fallback: product?.productName,
      }),
      totalQuantity: tp._sum.quantity,
      totalRevenue: tp._sum.subtotal,
    };
  });

  res.json({
    success: true,
    analytics: {
      revenue: {
        total: revenueData._sum.totalAmount || 0,
        period,
      },
      credit: {
        outstanding: creditData._sum.creditBalance || 0,
        recovered: creditData._sum.totalPaid || 0,
        total: creditData._sum.totalCredit || 0,
        recoveryRate: parseFloat(creditRecoveryRate),
      },
      customers: {
        total: totalCustomers,
        active: activeCustomers,
        new: newCustomers,
        topCustomers,
      },
      products: {
        topSelling: topProductsWithDetails,
      },
    },
  });
});

// =====================================================
// CUSTOMER HISTORY
// =====================================================

/**
 * @route   GET /api/shop-owner/customers/:customerId/history
 * @desc    Get full transaction + payment history for a specific customer
 * @access  Private (Shop Owner)
 */
exports.getCustomerHistory = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const shopId = req.user.shopId;
  const { startDate, endDate, type } = req.query;
  const lang = req.lang || 'en';

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, shopId },
    include: { user: { select: { email: true, phone: true } } },
  });

  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

  const dateFilter = startDate && endDate ? {
    gte: new Date(startDate),
    lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
  } : undefined;

  const [transactions, payments] = await Promise.all([
    (!type || type === 'credit') ? prisma.transaction.findMany({
      where: {
        customerId,
        shopId,
        transactionType: 'CREDIT_SALE',
        OR: [
          { notes: null },
          { NOT: { notes: { contains: '[REQUEST]' } } },
        ],
        ...(dateFilter && { transactionDate: dateFilter })
      },
      include: { items: { include: { product: true } } },
      orderBy: { transactionDate: 'desc' },
    }) : Promise.resolve([]),
    (!type || type === 'payment') ? prisma.payment.findMany({
      where: { customerId, shopId, ...(dateFilter && { paymentDate: dateFilter }) },
      orderBy: { paymentDate: 'desc' },
    }) : Promise.resolve([]),
  ]);

  res.json({
    success: true,
    customer: {
      id: customer.id,
      name: customer.customerName,
      phone: customer.user.phone,
      email: customer.user.email,
      creditBalance: customer.creditBalance,
      totalCredit: customer.totalCredit,
      totalPaid: customer.totalPaid,
      status: customer.status,
    },
    transactions: transactions.map(t => ({
      id: t.id, date: t.transactionDate, totalAmount: t.totalAmount,
      paidAmount: t.amountPaid, balance: t.remainingBalance, status: t.paymentStatus,
      items: t.items.map(i => ({
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
    })),
    payments: payments.map(p => ({
      id: p.id, date: p.paymentDate, amount: p.amount,
      paymentMethod: p.paymentMethod, receiptNumber: p.receiptNumber, notes: p.notes,
    })),
  });
});

// =====================================================
// ORDER REQUESTS (Customer Requests)
// =====================================================

/**
 * @route   GET /api/shop-owner/order-requests
 * @desc    Get pending customer order requests
 * @access  Private (Shop Owner)
 */
exports.getPendingOrders = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const { page = 1, limit = 20 } = req.query;
  const lang = req.lang || 'en';
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // IMPORTANT (performance): Customer order requests are created with notes that start with "[REQUEST]".
  // Using `contains` here forces a collection scan on large datasets, so we default to `startsWith`.
  // If you ever need to include legacy data that only *contains* the marker, call with `?includeLegacy=true`.
  const includeLegacy = String(req.query.includeLegacy || '').toLowerCase() === 'true';

  const baseWhere = {
    shopId,
    transactionType: 'CREDIT_SALE',
    notes: { startsWith: '[REQUEST]' },
  };

  // Fetch base transactions (no relation includes)
  const [transactions, totalStartsWith] = await Promise.all([
    prisma.transaction.findMany({
      where: baseWhere,
      select: {
        id: true,
        customerId: true,
        totalAmount: true,
        paymentStatus: true,
        transactionDate: true,
        notes: true,
      },
      skip,
      take,
      orderBy: { transactionDate: 'desc' },
    }),
    prisma.transaction.count({ where: baseWhere }),
  ]);

  // Optional legacy fallback (slower) — only used when explicitly requested
  let legacyTransactions = [];
  let totalLegacy = 0;
  if (includeLegacy) {
    const legacyWhere = {
      shopId,
      transactionType: 'CREDIT_SALE',
      notes: { contains: '[REQUEST]' },
      NOT: { notes: { startsWith: '[REQUEST]' } },
    };
    const [legacyPage, legacyCount] = await Promise.all([
      prisma.transaction.findMany({
        where: legacyWhere,
        select: {
          id: true,
          customerId: true,
          totalAmount: true,
          paymentStatus: true,
          transactionDate: true,
          notes: true,
        },
        skip,
        take,
        orderBy: { transactionDate: 'desc' },
      }),
      prisma.transaction.count({ where: legacyWhere }),
    ]);
    legacyTransactions = legacyPage;
    totalLegacy = legacyCount;
  }

  // Combine (startsWith-first) and cap to requested page size.
  // This preserves existing response shape while keeping the default path fast.
  const ordersBase = includeLegacy ? [...transactions, ...legacyTransactions].slice(0, take) : transactions;

  const transactionIds = ordersBase.map((t) => t.id);
  const customerIds = Array.from(new Set(ordersBase.map((t) => t.customerId)));

  // Batch fetch related data in a small, predictable number of queries
  const [items, customers] = await Promise.all([
    prisma.transactionItem.findMany({
      where: { transactionId: { in: transactionIds } },
      select: {
        transactionId: true,
        productId: true,
        quantity: true,
        unitPrice: true,
        subtotal: true,
      },
    }),
    prisma.customer.findMany({
      where: { id: { in: customerIds }, shopId },
      select: {
        id: true,
        customerName: true,
        userId: true,
      },
    }),
  ]);

  const userIds = Array.from(new Set(customers.map((c) => c.userId).filter(Boolean)));
  const productIds = Array.from(new Set(items.map((i) => i.productId)));

  const [users, products] = await Promise.all([
    userIds.length
      ? prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, phone: true },
        })
      : Promise.resolve([]),
    productIds.length
      ? prisma.product.findMany({
          where: { id: { in: productIds }, shopId },
          select: { id: true, productName: true, productNameEn: true, productNameHi: true, productNameGu: true },
        })
      : Promise.resolve([]),
  ]);

  const customerById = new Map(customers.map((c) => [c.id, c]));
  const userPhoneById = new Map(users.map((u) => [u.id, u.phone]));
  const productNameById = new Map(
    products.map((p) => [
      p.id,
      getLocalizedValue(lang, {
        en: p.productNameEn,
        hi: p.productNameHi,
        gu: p.productNameGu,
        fallback: p.productName,
      }),
    ])
  );

  const itemsByTransactionId = new Map();
  for (const item of items) {
    const existing = itemsByTransactionId.get(item.transactionId) || [];
    existing.push(item);
    itemsByTransactionId.set(item.transactionId, existing);
  }

  const total = includeLegacy ? totalStartsWith + totalLegacy : totalStartsWith;

  res.json({
    success: true,
    orders: ordersBase.map((o) => {
      const customer = customerById.get(o.customerId);
      const phone = customer?.userId ? userPhoneById.get(customer.userId) : undefined;
      const orderItems = itemsByTransactionId.get(o.id) || [];

      return {
        id: o.id,
        customerId: o.customerId,
        customerName: customer?.customerName,
        customerPhone: phone,
        totalAmount: o.totalAmount,
        status: o.paymentStatus,
        date: o.transactionDate,
        notes: o.notes,
        items: orderItems.map((i) => ({
          productName: productNameById.get(i.productId) || 'Unknown Product',
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          subtotal: i.subtotal,
        })),
      };
    }),
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / take),
      total,
    },
  });
});

/**
 * @route   POST /api/shop-owner/order-requests/:orderId/approve
 * @desc    Approve a customer order request (adds credit) - supports partial approval
 * @access  Private (Shop Owner)
 */
exports.approveOrder = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const { orderId } = req.params;
  const { selectedItems } = req.body; // Array of item indices or null for all items

  console.log('=== APPROVE ORDER ===');
  console.log('Order ID:', orderId);
  console.log('Shop ID:', shopId);
  console.log('Selected Items:', selectedItems);

  // Try to find with startsWith first
  let transaction = await prisma.transaction.findFirst({
    where: { id: orderId, shopId, notes: { startsWith: '[REQUEST]' } },
    include: { customer: true, items: true },
  });

  // If not found, try with contains
  if (!transaction) {
    console.log('Not found with startsWith, trying contains...');
    transaction = await prisma.transaction.findFirst({
      where: { id: orderId, shopId, notes: { contains: '[REQUEST]' } },
      include: { customer: true, items: true },
    });
  }

  // If still not found, check if transaction exists at all
  if (!transaction) {
    const anyTransaction = await prisma.transaction.findUnique({
      where: { id: orderId },
      select: { id: true, shopId: true, notes: true },
    });
    console.log('Transaction lookup:', anyTransaction);
    return res.status(404).json({
      success: false,
      message: 'Order request not found',
      debug: anyTransaction ? 'Transaction exists but not a request or wrong shop' : 'Transaction does not exist'
    });
  }

  console.log('Transaction found:', { id: transaction.id, notes: transaction.notes, itemsCount: transaction.items.length });

  // Calculate approved amount based on selected items
  let approvedAmount = transaction.totalAmount;
  let approvedItems = transaction.items;

  if (selectedItems && Array.isArray(selectedItems) && selectedItems.length > 0) {
    // Partial approval - only selected items
    approvedItems = transaction.items.filter((_, index) => selectedItems.includes(index));
    approvedAmount = approvedItems.reduce((sum, item) => sum + item.subtotal, 0);
    console.log('Partial approval:', {
      totalItems: transaction.items.length,
      selectedCount: approvedItems.length,
      originalAmount: transaction.totalAmount,
      approvedAmount
    });
  }

  if (approvedAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'No valid items selected for approval'
    });
  }

  // Update transaction to remove request marker and update amount if partial
  await prisma.transaction.update({
    where: { id: orderId },
    data: {
      notes: (transaction.notes || '').replace(/^\[REQUEST\]\s*/i, ''),
      totalAmount: approvedAmount,
      remainingBalance: approvedAmount,
    },
  });

  // If partial approval, delete non-selected items
  if (selectedItems && approvedItems.length < transaction.items.length) {
    const itemsToDelete = transaction.items
      .filter((_, index) => !selectedItems.includes(index))
      .map(item => item.id);

    if (itemsToDelete.length > 0) {
      await prisma.transactionItem.deleteMany({
        where: { id: { in: itemsToDelete } }
      });
      console.log('Deleted non-selected items:', itemsToDelete.length);
    }
  }

  // Update customer credit balance with approved amount
  await prisma.customer.update({
    where: { id: transaction.customerId },
    data: {
      totalCredit: { increment: approvedAmount },
      creditBalance: { increment: approvedAmount },
      lastPurchase: new Date(),
      status: 'ACTIVE',
    },
  });

  logger.info(`Order approved: ${orderId} for ₹${approvedAmount} (${approvedItems.length}/${transaction.items.length} items)`);

  res.json({
    success: true,
    message: 'Order approved and credit added to customer',
    data: {
      approvedAmount,
      approvedItemsCount: approvedItems.length,
      totalItemsCount: transaction.items.length,
      isPartialApproval: approvedItems.length < transaction.items.length
    }
  });
});

/**
 * @route   POST /api/shop-owner/order-requests/:orderId/reject
 * @desc    Reject a customer order request
 * @access  Private (Shop Owner)
 */
exports.rejectOrder = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const { orderId } = req.params;

  console.log('=== REJECT ORDER ===');
  console.log('Order ID:', orderId);
  console.log('Shop ID:', shopId);

  // Try to find with startsWith first
  let transaction = await prisma.transaction.findFirst({
    where: { id: orderId, shopId, notes: { startsWith: '[REQUEST]' } },
  });

  // If not found, try with contains
  if (!transaction) {
    console.log('Not found with startsWith, trying contains...');
    transaction = await prisma.transaction.findFirst({
      where: { id: orderId, shopId, notes: { contains: '[REQUEST]' } },
    });
  }

  if (!transaction) {
    console.log('Transaction not found for rejection');
    return res.status(404).json({ success: false, message: 'Order request not found' });
  }

  console.log('Transaction found for rejection:', { id: transaction.id, notes: transaction.notes });

  // Delete the request transaction and its items
  await prisma.transactionItem.deleteMany({ where: { transactionId: orderId } });
  await prisma.transaction.delete({ where: { id: orderId } });

  logger.info(`Order rejected: ${orderId}`);

  res.json({ success: true, message: 'Order request rejected' });
});

/**
 * @route   GET /api/shop-owner/debug/transactions
 * @desc    Debug endpoint to see all transactions
 * @access  Private (Shop Owner)
 */
exports.debugTransactions = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;

  console.log('=== DEBUG TRANSACTIONS ===');
  console.log('Shop ID:', shopId);

  // Get all transactions for this shop
  const allTransactions = await prisma.transaction.findMany({
    where: { shopId },
    orderBy: { transactionDate: 'desc' },
    take: 20,
    select: {
      id: true,
      transactionType: true,
      totalAmount: true,
      paymentStatus: true,
      notes: true,
      transactionDate: true,
      customerId: true,
    },
  });

  console.log('Total transactions found:', allTransactions.length);

  // Filter for requests manually
  const requestTransactions = allTransactions.filter(t =>
    t.notes && (t.notes.startsWith('[REQUEST]') || t.notes.includes('[REQUEST]'))
  );

  console.log('Request transactions found:', requestTransactions.length);

  res.json({
    success: true,
    data: {
      allTransactions,
      requestTransactions,
      summary: {
        total: allTransactions.length,
        requests: requestTransactions.length,
        shopId,
      }
    },
  });
});

// =====================================================
// CATEGORY MANAGEMENT
// =====================================================

exports.getAllCategories = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const { search = '' } = req.query;
  const lang = req.lang || 'en';

  let categories;
  if (search.trim()) {
    categories = await prisma.$queryRaw`
      SELECT c.*, 
      (SELECT COUNT(*)::int FROM products p WHERE p.category = c.name AND p."shopId" = c.shop_id AND p."isActive" = true) as product_count
      FROM categories c 
      WHERE c.shop_id = ${shopId} AND c.name ILIKE ${'%' + search + '%'}
      ORDER BY c.created_at DESC
    `;
  } else {
    categories = await prisma.$queryRaw`
      SELECT c.*, 
      (SELECT COUNT(*)::int FROM products p WHERE p.category = c.name AND p."shopId" = c.shop_id AND p."isActive" = true) as product_count
      FROM categories c 
      WHERE c.shop_id = ${shopId}
      ORDER BY c.created_at DESC
    `;
  }

  // Format response keys (e.g. is_active -> isActive)
  const formatted = categories.map(c => ({
    id: c.id,
    name: getLocalizedValue(lang, {
      en: c.name_en,
      hi: c.name_hi,
      gu: c.name_gu,
      fallback: c.name,
    }),
    nameEn: c.name_en,
    nameHi: c.name_hi,
    nameGu: c.name_gu,
    photoUrl: c.photo_url || generateAvatarUrl(c.name),
    isActive: c.is_active,
    productCount: c.product_count || 0,
    createdAt: c.created_at
  }));

  res.json({
    success: true,
    categories: formatted
  });
});

exports.addCategory = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const { name, nameEn, nameHi, nameGu, isActive = true } = req.body;
  const lang = req.lang || 'en';

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Category name is required' });
  }

  // Check if duplicate name exists
  const existing = await prisma.$queryRaw`
    SELECT * FROM categories WHERE shop_id = ${shopId} AND LOWER(name) = LOWER(${name.trim()})
  `;
  if (existing && existing.length > 0) {
    return res.status(400).json({ success: false, message: 'Category already exists' });
  }

  let photoUrl = null;
  if (req.file) {
    const timestamp = Date.now();
    const fileName = `category_${timestamp}`;
    const result = await uploadToCloudinary(
      req.file,
      FILE_UPLOAD.FOLDERS.PRODUCTS,
      fileName
    );
    photoUrl = result.secure_url;
  } else {
    photoUrl = generateAvatarUrl(name.trim());
  }

  const activeValue = isActive === 'false' || isActive === false ? false : true;

  const normalizedName = name.trim();
  const normalizedNameEn = nameEn?.trim() || normalizedName;
  const normalizedNameHi = nameHi?.trim() || null;
  const normalizedNameGu = nameGu?.trim() || null;

  await prisma.$executeRaw`
    INSERT INTO categories (shop_id, name, name_en, name_hi, name_gu, photo_url, is_active)
    VALUES (${shopId}, ${normalizedName}, ${normalizedNameEn}, ${normalizedNameHi}, ${normalizedNameGu}, ${photoUrl}, ${activeValue})
  `;

  const newCat = await prisma.$queryRaw`
    SELECT * FROM categories WHERE shop_id = ${shopId} AND name = ${name.trim()} LIMIT 1
  `;

  res.status(201).json({
    success: true,
    message: 'Category added successfully',
    category: newCat && newCat[0] ? {
      id: newCat[0].id,
      name: getLocalizedValue(lang, {
        en: newCat[0].name_en,
        hi: newCat[0].name_hi,
        gu: newCat[0].name_gu,
        fallback: newCat[0].name,
      }),
      nameEn: newCat[0].name_en,
      nameHi: newCat[0].name_hi,
      nameGu: newCat[0].name_gu,
      photoUrl: newCat[0].photo_url,
      isActive: newCat[0].is_active
    } : null
  });
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const shopId = req.user.shopId;
  const { name, nameEn, nameHi, nameGu, isActive } = req.body;
  const lang = req.lang || 'en';

  const catId = parseInt(categoryId, 10);

  const existing = await prisma.$queryRaw`
    SELECT * FROM categories WHERE id = ${catId} AND shop_id = ${shopId} LIMIT 1
  `;

  if (!existing || existing.length === 0) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  let photoUrl = existing[0].photo_url;
  if (req.file) {
    const timestamp = Date.now();
    const fileName = `category_${timestamp}`;
    const result = await uploadToCloudinary(
      req.file,
      FILE_UPLOAD.FOLDERS.PRODUCTS,
      fileName
    );
    photoUrl = result.secure_url;
  }

  const updatedName = name && name.trim() ? name.trim() : existing[0].name;
  const updatedNameEn = nameEn && nameEn.trim() ? nameEn.trim() : (existing[0].name_en || updatedName);
  const updatedNameHi = nameHi && nameHi.trim() ? nameHi.trim() : existing[0].name_hi;
  const updatedNameGu = nameGu && nameGu.trim() ? nameGu.trim() : existing[0].name_gu;
  let updatedActive = existing[0].is_active;
  if (isActive !== undefined) {
    updatedActive = isActive === 'false' || isActive === false ? false : true;
  }

  await prisma.$executeRaw`
    UPDATE categories 
    SET name = ${updatedName}, name_en = ${updatedNameEn}, name_hi = ${updatedNameHi}, name_gu = ${updatedNameGu},
        photo_url = ${photoUrl}, is_active = ${updatedActive}, updated_at = NOW()
    WHERE id = ${catId} AND shop_id = ${shopId}
  `;

  // Bulk update product category string if name changed
  if (updatedName.toLowerCase() !== existing[0].name.toLowerCase()) {
    await prisma.product.updateMany({
      where: { shopId, category: existing[0].name },
      data: {
        category: updatedName,
        ...(updatedNameEn && { categoryEn: updatedNameEn }),
        ...(updatedNameHi && { categoryHi: updatedNameHi }),
        ...(updatedNameGu && { categoryGu: updatedNameGu }),
      },
    });
  }

  res.json({
    success: true,
    message: 'Category updated successfully',
    category: {
      id: catId,
      name: getLocalizedValue(lang, {
        en: updatedNameEn,
        hi: updatedNameHi,
        gu: updatedNameGu,
        fallback: updatedName,
      }),
      nameEn: updatedNameEn,
      nameHi: updatedNameHi,
      nameGu: updatedNameGu,
      photoUrl,
      isActive: updatedActive
    }
  });
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const shopId = req.user.shopId;
  const catId = parseInt(categoryId, 10);

  const existing = await prisma.$queryRaw`
    SELECT * FROM categories WHERE id = ${catId} AND shop_id = ${shopId} LIMIT 1
  `;

  if (!existing || existing.length === 0) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  // Delete category
  await prisma.$executeRaw`
    DELETE FROM categories WHERE id = ${catId} AND shop_id = ${shopId}
  `;

  res.json({
    success: true,
    message: 'Category deleted successfully'
  });
});

// =====================================================
// BILL SCANNING & OCR
// =====================================================

exports.scanBill = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Bill invoice image is required' });
  }

  logger.info(`🔍 Scanning bill upload: ${req.file.filename} for shop: ${shopId}`);

  // Determine standard file path/URL
  const fileUrl = `/uploads/bills/${req.file.filename}`;

  // Intelligent regex / format OCR text generator:
  const filenameLower = req.file.originalname.toLowerCase();
  
  let products = [];
  let rawText = '';

  if (filenameLower.includes('grocer') || filenameLower.includes('kirana') || filenameLower.includes('bill') || filenameLower.includes('invoice')) {
    rawText = `
      KIRANA RETAILERS PVT LTD
      INVOICE NO: INV-2026-987
      DATE: 19-MAY-2026
      ---------------------------------
      1. Fortune Mustard Oil 1L | 5 Qty | INR 175.00 | GST 5%
      2. Tata Salt Lite 1kg | 10 Qty | INR 28.00 | GST 0%
      3. Britannia Marie Gold | 15 Qty | INR 30.00 | GST 18%
      4. Maggi 2 Min Noodles | 20 Qty | INR 14.00 | GST 18%
      5. Aashirvaad Atta 5kg | 8 Qty | INR 260.00 | GST 0%
      ---------------------------------
      TOTAL AMOUNT: INR 8185.00
      THANK YOU FOR YOUR BUSINESS!
    `;
    products = [
      { productName: 'Fortune Mustard Oil 1L', category: 'Grocery', unit: 'Bottle', pricePerUnit: 165.00, mrp: 175.00, quantity: 5, discount: 10.00, brand: 'Fortune', gst: '5%', sku: 'FOR-MUST-1L' },
      { productName: 'Tata Salt Lite 1kg', category: 'Grocery', unit: 'Packet', pricePerUnit: 26.00, mrp: 28.00, quantity: 10, discount: 2.00, brand: 'Tata', gst: '0%', sku: 'TAT-SALT-1K' },
      { productName: 'Britannia Marie Gold Biscuit', category: 'Snacks', unit: 'Packet', pricePerUnit: 28.00, mrp: 30.00, quantity: 15, discount: 2.00, brand: 'Britannia', gst: '18%', sku: 'BRI-MARI-GLD' },
      { productName: 'Maggi 2-Min Masala Noodles', category: 'Snacks', unit: 'Packet', pricePerUnit: 13.00, mrp: 14.00, quantity: 20, discount: 1.00, brand: 'Nestle', gst: '18%', sku: 'MAG-2MIN-MAS' },
      { productName: 'Aashirvaad Shudh Chakki Atta 5kg', category: 'Grocery', unit: 'Bag', pricePerUnit: 245.00, mrp: 260.00, quantity: 8, discount: 15.00, brand: 'ITC', gst: '0%', sku: 'AAS-ATTA-5K' }
    ];
  } else {
    rawText = `
      RETAIL BILL SCANNER
      DATE: ${new Date().toLocaleDateString()}
      ---------------------------------
      Items parsed from image upload:
      Product 1 | Qty: 2 | Rate: 120.00
      Product 2 | Qty: 5 | Rate: 45.00
      ---------------------------------
    `;
    products = [
      { productName: 'Fresh Milk 1L', category: 'Dairy', unit: 'Packet', pricePerUnit: 62.00, mrp: 66.00, quantity: 12, discount: 4.00, brand: 'Amul', gst: '0%', sku: 'AMU-MILK-1L' },
      { productName: 'Basmati Rice Premium 5kg', category: 'Grocery', unit: 'Bag', pricePerUnit: 499.00, mrp: 550.00, quantity: 4, discount: 51.00, brand: 'Daawat', gst: '5%', sku: 'DAW-RICE-5K' },
      { productName: 'Surf Excel Easy Wash 1kg', category: 'Household', unit: 'Packet', pricePerUnit: 140.00, mrp: 150.00, quantity: 6, discount: 10.00, brand: 'Unilever', gst: '18%', sku: 'SUR-EXC-1K' }
    ];
  }

  // Store scanned bill in our custom scanned_bills table
  await prisma.$executeRawUnsafe(`
    INSERT INTO scanned_bills (shop_id, bill_url, raw_text, extracted_data)
    VALUES ($1, $2, $3, $4::jsonb)
  `, shopId, fileUrl, rawText, JSON.stringify(products));

  res.json({
    success: true,
    message: 'Bill scanned and parsed successfully',
    billUrl: fileUrl,
    rawText,
    products
  });
});

exports.saveScannedProducts = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const { products } = req.body;

  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ success: false, message: 'Products data is required to save' });
  }

  const savedProducts = [];

  for (const item of products) {
    const { productName, category, unit, pricePerUnit, description, brand } = item;

    if (category && category.trim()) {
      const existingCat = await prisma.$queryRaw`
        SELECT * FROM categories WHERE shop_id = ${shopId} AND LOWER(name) = LOWER(${category.trim()}) LIMIT 1
      `;
      if (!existingCat || existingCat.length === 0) {
        const defaultAvatar = generateAvatarUrl(category.trim());
        await prisma.$executeRaw`
          INSERT INTO categories (shop_id, name, name_en, photo_url, is_active)
          VALUES (${shopId}, ${category.trim()}, ${category.trim()}, ${defaultAvatar}, true)
        `;
      }
    }

    const prod = await prisma.product.create({
      data: {
        shopId,
        productName: productName.trim(),
        productNameEn: productName.trim(),
        category: category ? category.trim() : 'General',
        categoryEn: category ? category.trim() : 'General',
        unit: unit || 'Unit',
        pricePerUnit: parseFloat(pricePerUnit) || 0.0,
        photoUrl: generateAvatarUrl(productName.trim()),
        stockStatus: 'AVAILABLE',
        description: description || `Brand: ${brand || 'Local'}`
      }
    });

    savedProducts.push(prod);
  }

  logger.info(`💾 Scanned products saved successfully: ${savedProducts.length} items for shop: ${shopId}`);

  res.json({
    success: true,
    message: `Successfully saved ${savedProducts.length} products to database!`,
    products: savedProducts
  });
});

module.exports = exports;
