const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { ROLES } = require('../config/constants');
const logger = require('../utils/logger');
const { normalizePhoneNumber, isValidIndianPhone } = require('../utils/phoneValidation');
const generateAvatarUrl = require('../utils/generateAvatar');

// =====================================================
// DASHBOARD
// =====================================================

/**
 * @route   GET /api/admin/dashboard/stats
 * @desc    Get admin dashboard statistics
 * @access  Private (Admin)
 */
exports.getDashboardStats = asyncHandler(async (req, res) => {
  // Total shops
  const totalShops = await prisma.shop.count();
  const activeShops = await prisma.shop.count({ where: { status: 'ACTIVE' } });
  const pendingShops = await prisma.shop.count({ where: { status: 'PENDING' } });

  // Total customers
  const totalCustomers = await prisma.customer.count();

  // Credit statistics
  const creditStats = await prisma.customer.aggregate({
    _sum: {
      creditBalance: true,
      totalCredit: true,
      totalPaid: true,
    },
  });

  // Monthly revenue (this month)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlyRevenue = await prisma.transaction.aggregate({
    where: {
      transactionType: 'CREDIT_SALE',
      transactionDate: { gte: startOfMonth },
    },
    _sum: {
      totalAmount: true,
    },
  });

  res.json({
    success: true,
    stats: {
      totalShops,
      activeShops,
      pendingShops,
      totalCustomers,
      totalCreditOutstanding: creditStats._sum.creditBalance || 0,
      monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
      totalCreditIssued: creditStats._sum.totalCredit || 0,
      totalPaymentsCollected: creditStats._sum.totalPaid || 0,
    },
  });
});

// =====================================================
// SHOP MANAGEMENT
// =====================================================

/**
 * @route   GET /api/admin/shops
 * @desc    Get all shops
 * @access  Private (Admin)
 */
exports.getAllShops = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search = '' } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {
    ...(status && { status }),
    ...(search && {
      OR: [
        { shopName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ],
    }),
  };

  const [shops, total] = await Promise.all([
    prisma.shop.findMany({
      where,
      include: {
        shopOwner: true,
        _count: {
          select: {
            customers: true,
            products: true,
            transactions: true,
          },
        },
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.shop.count({ where }),
  ]);

  // Get credit outstanding for each shop
  const shopsWithStats = await Promise.all(
    shops.map(async (shop) => {
      const creditStats = await prisma.customer.aggregate({
        where: { shopId: shop.id },
        _sum: { creditBalance: true },
      });

      return {
        id: shop.id,
        shopName: shop.shopName,
        ownerName: shop.shopOwner?.ownerName,
        phone: shop.phone,
        email: shop.email,
        address: shop.address,
        city: shop.city,
        state: shop.state,
        status: shop.status,
        totalCustomers: shop._count.customers,
        totalProducts: shop._count.products,
        totalTransactions: shop._count.transactions,
        creditOutstanding: creditStats._sum.creditBalance || 0,
        registrationDate: shop.createdAt,
      };
    })
  );

  res.json({
    success: true,
    shops: shopsWithStats,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / take),
      totalShops: total,
      limit: take,
    },
  });
});

/**
 * @route   GET /api/admin/shops/:shopId
 * @desc    Get shop details
 * @access  Private (Admin)
 */
exports.getShopDetails = asyncHandler(async (req, res) => {
  const { shopId } = req.params;

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      shopOwner: {
        include: {
          user: {
            select: {
              email: true,
              phone: true,
              lastLogin: true,
            },
          },
        },
      },
      customers: {
        take: 10,
        orderBy: { creditBalance: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              phone: true,
            },
          },
        },
      },
      products: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
      transactions: {
        take: 10,
        orderBy: { transactionDate: 'desc' },
        include: {
          customer: true,
        },
      },
    },
  });

  if (!shop) {
    return res.status(404).json({
      success: false,
      message: 'Shop not found',
    });
  }

  // Get analytics
  const creditStats = await prisma.customer.aggregate({
    where: { shopId },
    _sum: {
      creditBalance: true,
      totalCredit: true,
      totalPaid: true,
    },
  });

  const revenueStats = await prisma.transaction.aggregate({
    where: {
      shopId,
      transactionType: 'CREDIT_SALE',
    },
    _sum: {
      totalAmount: true,
    },
  });

  res.json({
    success: true,
    shop: {
      id: shop.id,
      shopName: shop.shopName,
      address: shop.address,
      city: shop.city,
      state: shop.state,
      phone: shop.phone,
      email: shop.email,
      status: shop.status,
      createdAt: shop.createdAt,
      owner: shop.shopOwner
        ? {
            name: shop.shopOwner.ownerName,
            email: shop.shopOwner.user.email,
            phone: shop.shopOwner.user.phone,
            lastLogin: shop.shopOwner.user.lastLogin,
          }
        : null,
      customers: shop.customers.map((c) => ({
        id: c.id,
        name: c.customerName,
        creditBalance: c.creditBalance,
        status: c.status,
      })),
      products: shop.products.map((p) => ({
        id: p.id,
        name: p.productName,
        pricePerUnit: p.pricePerUnit,
        stockStatus: p.stockStatus,
      })),
      recentTransactions: shop.transactions.map((t) => ({
        id: t.id,
        customerName: t.customer.customerName,
        amount: t.totalAmount,
        status: t.paymentStatus,
        date: t.transactionDate,
      })),
      analytics: {
        totalRevenue: revenueStats._sum.totalAmount || 0,
        totalCreditIssued: creditStats._sum.totalCredit || 0,
        totalPaymentsCollected: creditStats._sum.totalPaid || 0,
        creditOutstanding: creditStats._sum.creditBalance || 0,
      },
    },
  });
});

/**
 * @route   PATCH /api/admin/shops/:shopId/status
 * @desc    Update shop status
 * @access  Private (Admin)
 */
exports.updateShopStatus = asyncHandler(async (req, res) => {
  const { shopId } = req.params;
  const { status, reason } = req.body;

  const shop = await prisma.shop.findUnique({ where: { id: shopId } });

  if (!shop) {
    return res.status(404).json({
      success: false,
      message: 'Shop not found',
    });
  }

  const updatedShop = await prisma.shop.update({
    where: { id: shopId },
    data: { status },
  });

  logger.info(`Shop ${shopId} status updated to ${status} by admin. Reason: ${reason || 'N/A'}`);

  res.json({
    success: true,
    message: 'Shop status updated successfully',
    shop: {
      id: updatedShop.id,
      shopName: updatedShop.shopName,
      status: updatedShop.status,
    },
  });
});

// =====================================================
// ANALYTICS
// =====================================================

/**
 * @route   GET /api/admin/analytics
 * @desc    Get system-wide analytics
 * @access  Private (Admin)
 */
exports.getAnalytics = asyncHandler(async (req, res) => {
  const { period = '30days' } = req.query;

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

  // Shop growth
  const newShops = await prisma.shop.count({
    where: { createdAt: { gte: startDate } },
  });

  // Customer growth
  const newCustomers = await prisma.customer.count({
    where: { joinDate: { gte: startDate } },
  });

  // Revenue by shop (top 10)
  const revenueByShop = await prisma.transaction.groupBy({
    by: ['shopId'],
    where: {
      transactionType: 'CREDIT_SALE',
      transactionDate: { gte: startDate },
    },
    _sum: {
      totalAmount: true,
    },
    orderBy: {
      _sum: {
        totalAmount: 'desc',
      },
    },
    take: 10,
  });

  const topShops = await Promise.all(
    revenueByShop.map(async (item) => {
      const shop = await prisma.shop.findUnique({
        where: { id: item.shopId },
        select: { shopName: true },
      });
      return {
        shopName: shop?.shopName,
        revenue: item._sum.totalAmount,
      };
    })
  );

  // Credit recovery rate
  const allCustomers = await prisma.customer.aggregate({
    _sum: {
      totalCredit: true,
      totalPaid: true,
    },
  });

  const creditRecoveryRate =
    allCustomers._sum.totalCredit > 0
      ? ((allCustomers._sum.totalPaid / allCustomers._sum.totalCredit) * 100).toFixed(2)
      : 0;

  // Payment collection efficiency
  const totalTransactions = await prisma.transaction.count({
    where: {
      transactionType: 'CREDIT_SALE',
      transactionDate: { gte: startDate },
    },
  });

  const paidTransactions = await prisma.transaction.count({
    where: {
      transactionType: 'CREDIT_SALE',
      transactionDate: { gte: startDate },
      paymentStatus: 'PAID',
    },
  });

  const collectionEfficiency = totalTransactions > 0 ? ((paidTransactions / totalTransactions) * 100).toFixed(2) : 0;

  res.json({
    success: true,
    analytics: {
      period,
      shopGrowth: {
        newShops,
      },
      customerGrowth: {
        newCustomers,
      },
      topShops,
      creditRecoveryRate: parseFloat(creditRecoveryRate),
      collectionEfficiency: parseFloat(collectionEfficiency),
    },
  });
});

// =====================================================
// USER MANAGEMENT
// =====================================================

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (shop owners and customers)
 * @access  Private (Admin)
 */
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, role, search = '', shopId } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Get shop owners
  const shopOwnerWhere = {
    ...(shopId && { shopId }),
    ...(search && {
      OR: [
        { ownerName: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { phone: { contains: search } } },
        { shop: { shopName: { contains: search, mode: 'insensitive' } } },
      ],
    }),
  };

  // Get customers
  const customerWhere = {
    ...(shopId && { shopId }),
    ...(search && {
      OR: [
        { customerName: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { phone: { contains: search } } },
        { shop: { shopName: { contains: search, mode: 'insensitive' } } },
      ],
    }),
  };

  const includeShopOwners = !role || role === 'shop_owner';
  const includeCustomers = !role || role === 'customer';

  const [shopOwners, customers] = await Promise.all([
    includeShopOwners
      ? prisma.shopOwner.findMany({
          where: shopOwnerWhere,
          include: {
            user: {
              select: {
                email: true,
                phone: true,
                lastLogin: true,
                isActive: true,
              },
            },
            shop: {
              select: {
                id: true,
                shopName: true,
                address: true,
                city: true,
                state: true,
                phone: true,
                email: true,
                status: true,
                _count: {
                  select: {
                    customers: true,
                  },
                },
              },
            },
          },
          skip: role === 'shop_owner' ? skip : 0,
          take: role === 'shop_owner' ? take : undefined,
          orderBy: { createdAt: 'desc' },
        })
      : [],
    includeCustomers
      ? prisma.customer.findMany({
          where: customerWhere,
          include: {
            user: {
              select: {
                email: true,
                phone: true,
                lastLogin: true,
                isActive: true,
              },
            },
            shop: {
              select: {
                id: true,
                shopName: true,
              },
            },
          },
          skip: role === 'customer' ? skip : 0,
          take: role === 'customer' ? take : undefined,
          orderBy: { joinDate: 'desc' },
        })
      : [],
  ]);

  // Format shop owners
  const formattedShopOwners = shopOwners.map((owner) => ({
    id: owner.id,
    userId: owner.userId,
    name: owner.ownerName,
    email: owner.user?.email || 'N/A',
    phone: owner.user?.phone || 'N/A',
    role: 'shop_owner',
    shop: owner.shop?.shopName || 'N/A',
    shopId: owner.shopId,
    shopAddress: owner.shop?.address || '',
    shopCity: owner.shop?.city || '',
    shopState: owner.shop?.state || '',
    location: owner.shop ? `${owner.shop.city || ''}, ${owner.shop.state || ''}`.trim() : 'N/A',
    customers: owner.shop?._count?.customers || 0,
    status: owner.shop?.status?.toLowerCase() || 'active',
    isActive: owner.user?.isActive ?? true,
    canCreate: true,
    joined: owner.createdAt,
    lastLogin: owner.user?.lastLogin,
  }));

  // Format customers
  const formattedCustomers = customers.map((customer) => ({
    id: customer.id,
    userId: customer.userId,
    name: customer.customerName,
    email: customer.user?.email || 'N/A',
    phone: customer.user?.phone || 'N/A',
    role: 'customer',
    shop: customer.shop?.shopName || 'N/A',
    shopId: customer.shopId,
    address: customer.address || '',
    workplace: customer.workplace || '',
    outstanding: customer.creditBalance,
    status: customer.status?.toLowerCase() || 'active',
    canCreate: false,
    isActive: customer.user?.isActive ?? true,
    joined: customer.joinDate,
    lastLogin: customer.user?.lastLogin,
  }));

  // Combine and sort by most recent
  const allUsers = [...formattedShopOwners, ...formattedCustomers].sort(
    (a, b) => new Date(b.joined).getTime() - new Date(a.joined).getTime()
  );

  // Apply pagination if not filtered by role
  const paginatedUsers = !role ? allUsers.slice(skip, skip + take) : allUsers;

  const [totalShopOwners, totalCustomers] = await Promise.all([
    includeShopOwners ? prisma.shopOwner.count({ where: shopOwnerWhere }) : 0,
    includeCustomers ? prisma.customer.count({ where: customerWhere }) : 0,
  ]);

  const total = !role ? totalShopOwners + totalCustomers : role === 'shop_owner' ? totalShopOwners : totalCustomers;

  res.json({
    success: true,
    users: paginatedUsers,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / take),
      totalUsers: total,
      limit: take,
    },
  });
});

const formatShopOwner = (owner) => ({
  id: owner.id,
  userId: owner.userId,
  name: owner.ownerName,
  email: owner.user?.email || 'N/A',
  phone: owner.user?.phone || 'N/A',
  role: 'shop_owner',
  shop: owner.shop?.shopName || 'N/A',
  shopId: owner.shopId,
  shopAddress: owner.shop?.address || '',
  shopCity: owner.shop?.city || '',
  shopState: owner.shop?.state || '',
  location: owner.shop ? `${owner.shop.city || ''}, ${owner.shop.state || ''}`.trim() : 'N/A',
  customers: owner.shop?._count?.customers || 0,
  status: owner.shop?.status?.toLowerCase() || 'active',
  isActive: owner.user?.isActive ?? true,
  canCreate: true,
  joined: owner.createdAt,
  lastLogin: owner.user?.lastLogin,
});

const formatCustomer = (customer) => ({
  id: customer.id,
  userId: customer.userId,
  name: customer.customerName,
  email: customer.user?.email || 'N/A',
  phone: customer.user?.phone || 'N/A',
  role: 'customer',
  shop: customer.shop?.shopName || 'N/A',
  shopId: customer.shopId,
  address: customer.address || '',
  workplace: customer.workplace || '',
  outstanding: customer.creditBalance,
  status: customer.status?.toLowerCase() || 'active',
  isActive: customer.user?.isActive ?? true,
  canCreate: false,
  joined: customer.joinDate,
  lastLogin: customer.user?.lastLogin,
});

const shopOwnerInclude = {
  user: { select: { email: true, phone: true, lastLogin: true, isActive: true } },
  shop: {
    select: {
      id: true,
      shopName: true,
      address: true,
      city: true,
      state: true,
      phone: true,
      email: true,
      status: true,
      _count: { select: { customers: true } },
    },
  },
};

const customerInclude = {
  user: { select: { email: true, phone: true, lastLogin: true, isActive: true } },
  shop: { select: { id: true, shopName: true } },
};

/**
 * @route   GET /api/admin/users/:role/:id
 * @desc    Get user by role profile id
 * @access  Private (Admin)
 */
exports.getUserById = asyncHandler(async (req, res) => {
  const { role, id } = req.params;

  if (role === 'shop_owner') {
    const owner = await prisma.shopOwner.findUnique({
      where: { id },
      include: shopOwnerInclude,
    });
    if (!owner) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, user: formatShopOwner(owner) });
  }

  if (role === 'customer') {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: customerInclude,
    });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, user: formatCustomer(customer) });
  }

  return res.status(400).json({ success: false, message: 'Invalid role. Use shop_owner or customer.' });
});

/**
 * @route   POST /api/admin/users
 * @desc    Create shop owner with shop (customers are created by shop owners only)
 * @access  Private (Admin)
 */
exports.createUser = asyncHandler(async (req, res) => {
  const {
    role,
    ownerName,
    shopName,
    address,
    phone,
    email,
    city,
    state,
    password,
  } = req.body;

  if (role !== 'shop_owner') {
    return res.status(403).json({
      success: false,
      message:
        'Customers can only be created by shop owners. Admin can add shop owners with their shop.',
    });
  }

  if (!ownerName?.trim() || !shopName?.trim() || !address?.trim() || !phone?.trim() || !email?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Owner name, shop name, address, phone, and email are required',
    });
  }

  const normalizedPhone = normalizePhoneNumber(phone);
  if (!isValidIndianPhone(normalizedPhone)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid Indian phone number',
    });
  }

  const emailNorm = email.toLowerCase().trim();

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ phone: normalizedPhone }, { email: emailNorm }],
    },
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Phone number or email already registered',
    });
  }

  let passwordHash = null;
  if (password?.trim()) {
    passwordHash = await bcrypt.hash(password.trim(), 12);
  }

  const user = await prisma.user.create({
    data: {
      email: emailNorm,
      phone: normalizedPhone,
      role: ROLES.SHOP_OWNER,
    },
  });

  const shop = await prisma.shop.create({
    data: {
      shopName: shopName.trim(),
      address: address.trim(),
      city: city?.trim() || null,
      state: state?.trim() || null,
      phone: normalizedPhone,
      email: emailNorm,
      status: 'ACTIVE',
    },
  });

  const shopOwner = await prisma.shopOwner.create({
    data: {
      userId: user.id,
      shopId: shop.id,
      ownerName: ownerName.trim(),
      passwordHash,
      avatarUrl: generateAvatarUrl(ownerName.trim()),
    },
    include: shopOwnerInclude,
  });

  logger.info(`Admin created shop owner: ${ownerName} / shop ${shopName}`);

  res.status(201).json({
    success: true,
    message: 'Shop owner and shop created successfully',
    user: formatShopOwner(shopOwner),
  });
});

/**
 * @route   PUT /api/admin/users/:role/:id
 * @desc    Update user profile
 * @access  Private (Admin)
 */
exports.updateUser = asyncHandler(async (req, res) => {
  const { role, id } = req.params;
  const {
    name,
    email,
    phone,
    address,
    workplace,
    customerStatus,
    shopName,
    shopAddress,
    shopCity,
    shopState,
  } = req.body;

  if (role === 'shop_owner') {
    const owner = await prisma.shopOwner.findUnique({
      where: { id },
      include: { user: true, shop: true },
    });
    if (!owner) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userUpdate = {};
    if (email !== undefined) {
      userUpdate.email = email?.trim() ? email.toLowerCase().trim() : null;
    }
    if (phone !== undefined) {
      const normalizedPhone = normalizePhoneNumber(phone);
      if (!isValidIndianPhone(normalizedPhone)) {
        return res.status(400).json({ success: false, message: 'Invalid phone number' });
      }
      userUpdate.phone = normalizedPhone;
    }

    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({ where: { id: owner.userId }, data: userUpdate });
    }

    if (name?.trim()) {
      await prisma.shopOwner.update({
        where: { id },
        data: { ownerName: name.trim() },
      });
    }

    const shopUpdate = {};
    if (shopName?.trim()) shopUpdate.shopName = shopName.trim();
    if (shopAddress !== undefined) shopUpdate.address = shopAddress?.trim() || owner.shop.address;
    if (shopCity !== undefined) shopUpdate.city = shopCity?.trim() || null;
    if (shopState !== undefined) shopUpdate.state = shopState?.trim() || null;
    if (phone !== undefined && userUpdate.phone) shopUpdate.phone = userUpdate.phone;
    if (email !== undefined && userUpdate.email) shopUpdate.email = userUpdate.email;

    if (Object.keys(shopUpdate).length > 0) {
      await prisma.shop.update({
        where: { id: owner.shopId },
        data: shopUpdate,
      });
    }

    const updated = await prisma.shopOwner.findUnique({
      where: { id },
      include: shopOwnerInclude,
    });

    return res.json({
      success: true,
      message: 'Shop owner updated successfully',
      user: formatShopOwner(updated),
    });
  }

  if (role === 'customer') {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userUpdate = {};
    if (email !== undefined) {
      userUpdate.email = email?.trim() ? email.toLowerCase().trim() : null;
    }
    if (phone !== undefined) {
      const normalizedPhone = normalizePhoneNumber(phone);
      if (!isValidIndianPhone(normalizedPhone)) {
        return res.status(400).json({ success: false, message: 'Invalid phone number' });
      }
      userUpdate.phone = normalizedPhone;
    }

    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({ where: { id: customer.userId }, data: userUpdate });
    }

    const customerUpdate = {};
    if (name?.trim()) customerUpdate.customerName = name.trim();
    if (address !== undefined) customerUpdate.address = address || null;
    if (workplace !== undefined) customerUpdate.workplace = workplace || null;
    if (customerStatus) {
      const valid = ['ACTIVE', 'OVERDUE', 'CLEARED'];
      const status = customerStatus.toUpperCase();
      if (valid.includes(status)) {
        customerUpdate.status = status;
      }
    }

    if (Object.keys(customerUpdate).length > 0) {
      await prisma.customer.update({ where: { id }, data: customerUpdate });
    }

    const updated = await prisma.customer.findUnique({
      where: { id },
      include: customerInclude,
    });

    return res.json({
      success: true,
      message: 'User updated successfully',
      user: formatCustomer(updated),
    });
  }

  return res.status(400).json({ success: false, message: 'Invalid role' });
});

/**
 * @route   PATCH /api/admin/users/:role/:id/status
 * @desc    Activate/deactivate user account
 * @access  Private (Admin)
 */
exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { role, id } = req.params;
  const { isActive, shopStatus } = req.body;

  if (role === 'shop_owner') {
    const owner = await prisma.shopOwner.findUnique({ where: { id } });
    if (!owner) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (typeof isActive === 'boolean') {
      await prisma.user.update({
        where: { id: owner.userId },
        data: { isActive },
      });
    }

    if (shopStatus) {
      await prisma.shop.update({
        where: { id: owner.shopId },
        data: { status: shopStatus.toUpperCase() },
      });
    }

    const updated = await prisma.shopOwner.findUnique({
      where: { id },
      include: shopOwnerInclude,
    });

    return res.json({
      success: true,
      message: 'User status updated',
      user: formatShopOwner(updated),
    });
  }

  if (role === 'customer') {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (typeof isActive === 'boolean') {
      await prisma.user.update({
        where: { id: customer.userId },
        data: { isActive },
      });
    }

    const updated = await prisma.customer.findUnique({
      where: { id },
      include: customerInclude,
    });

    return res.json({
      success: true,
      message: 'User status updated',
      user: formatCustomer(updated),
    });
  }

  return res.status(400).json({ success: false, message: 'Invalid role' });
});

/**
 * @route   DELETE /api/admin/users/:role/:id
 * @desc    Deactivate user (soft delete)
 * @access  Private (Admin)
 */
exports.deleteUser = asyncHandler(async (req, res) => {
  const { role, id } = req.params;

  let userId;
  if (role === 'shop_owner') {
    const owner = await prisma.shopOwner.findUnique({ where: { id } });
    if (!owner) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    userId = owner.userId;
    await prisma.shop.update({
      where: { id: owner.shopId },
      data: { status: 'INACTIVE' },
    });
  } else if (role === 'customer') {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    userId = customer.userId;
  } else {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });

  logger.info(`Admin deactivated user ${role}/${id}`);

  res.json({
    success: true,
    message: 'User deactivated successfully',
  });
});

// =====================================================
// SYSTEM LOGS
// =====================================================

/**
 * @route   GET /api/admin/logs
 * @desc    Get audit logs
 * @access  Private (Admin)
 */
exports.getAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.count(),
  ]);

  res.json({
    success: true,
    logs: logs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      userEmail: log.user?.email,
      userRole: log.user?.role,
      ipAddress: log.ipAddress,
      timestamp: log.createdAt,
      details: log.details ? JSON.parse(log.details) : null,
    })),
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / take),
      totalLogs: total,
      limit: take,
    },
  });
});

module.exports = exports;
