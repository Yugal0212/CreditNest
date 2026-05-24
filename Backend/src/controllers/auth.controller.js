const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { generateToken } = require('../utils/generateToken');
const { sendOTP, verifyOTP } = require('../services/otp.service');
const { sendWelcomeEmail } = require('../services/email.service');
const { sendWelcomeSMS } = require('../services/sms.service');
const generateAvatarUrl = require('../utils/generateAvatar');
const logger = require('../utils/logger');
const { ROLES, OTP } = require('../config/constants');
const { asyncHandler } = require('../middleware/errorHandler');
const { normalizePhoneNumber } = require('../utils/phoneValidation');

const normalizeEmail = (email) => (email ? email.toLowerCase().trim() : null);

const getOtpDeliveryMessage = (email, phone) => {
  if (email && phone) return 'OTP sent to your email and phone';
  if (email) return 'OTP sent to your email';
  if (phone) return 'OTP sent to your phone';
  return 'OTP sent successfully';
};

const logAdminLoginAttempt = async ({ email, userId, success, reason, req }) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action: 'ADMIN_LOGIN_ATTEMPT',
        entityType: 'ADMIN',
        entityId: userId || null,
        details: JSON.stringify({ email, success, reason }),
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || null,
      },
    });
  } catch (error) {
    logger.error('Failed to log admin login attempt:', error);
  }
};

// =====================================================
// ADMIN AUTHENTICATION
// =====================================================

/**
 * @route   POST /api/auth/admin/login
 * @desc    Admin login
 * @access  Public
 */
exports.adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find admin by email
  const user = await prisma.user.findUnique({
    where: { email },
    include: { admin: true },
  });

  if (!user || user.role !== ROLES.ADMIN) {
    await logAdminLoginAttempt({
      email,
      userId: null,
      success: false,
      reason: 'admin_not_found',
      req,
    });
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.admin.passwordHash);

  if (!isPasswordValid) {
    await logAdminLoginAttempt({
      email,
      userId: user.id,
      success: false,
      reason: 'invalid_password',
      req,
    });
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  // Generate JWT token
  const token = generateToken(user.id, user.email, user.role);

  logger.info(`Admin logged in: ${email}`);

  await logAdminLoginAttempt({
    email,
    userId: user.id,
    success: true,
    reason: 'success',
    req,
  });

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.admin.name,
      email: user.email,
      role: user.role,
      avatar: user.admin.avatarUrl || generateAvatarUrl(user.admin.name),
    },
  });
});

// =====================================================
// SHOP OWNER AUTHENTICATION
// =====================================================

/**
 * @route   POST /api/auth/shop-owner/register
 * @desc    Shop owner registration (Step 1: Send OTP)
 * @access  Public
 */
exports.shopOwnerRegister = asyncHandler(async (req, res) => {
  const { shopName, ownerName, address, phone, email, password } = req.body;

  // Normalize phone number to ensure consistent format (+919XXXXXXXXX)
  const normalizedPhone = phone ? normalizePhoneNumber(phone) : null;
  const normalizedEmail = normalizeEmail(email);

  // Check if phone or email already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: normalizedPhone },
        { email: normalizedEmail },
        { phone: phone }, // Also check original format
        { email },
      ],
    },
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Phone number or email already registered',
    });
  }

  const identifier = normalizedEmail || normalizedPhone;
  const otpTargets = {
    email: normalizedEmail,
    phone: normalizedPhone,
  };

  // Send OTP
  await sendOTP(otpTargets, 'REGISTRATION');

  // Store registration data in a temporary collection or cache
  // For simplicity, we'll send it back to frontend to send with OTP verification
  res.json({
    success: true,
    message: getOtpDeliveryMessage(otpTargets.email, otpTargets.phone),
    identifier,
    registrationData: {
      shopName,
      ownerName,
      address,
      phone: normalizedPhone,
      email: normalizedEmail,
      password,
    },
    otpExpiresIn: OTP.EXPIRY_MINUTES * 60,
  });
});

/**
 * @route   POST /api/auth/shop-owner/verify-otp
 * @desc    Verify OTP and complete shop owner registration
 * @access  Public
 */
exports.shopOwnerVerifyOTP = asyncHandler(async (req, res) => {
  const { identifier, otp, registrationData } = req.body;

  if (!registrationData) {
    return res.status(400).json({
      success: false,
      message: 'Registration data is required',
    });
  }

  const { shopName, ownerName, address, phone, email, password } = registrationData;

  // Normalize phone number to ensure consistent format
  const normalizedPhone = phone ? normalizePhoneNumber(phone) : null;
  const normalizedEmail = normalizeEmail(email);

  // Verify OTP
  await verifyOTP([identifier, normalizedEmail, normalizedPhone], otp);

  // Hash password if provided
  let passwordHash = null;
  if (password) {
    passwordHash = await bcrypt.hash(password, 12);
  }

  // Create user, shop, and shop owner
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      phone: normalizedPhone,
      role: ROLES.SHOP_OWNER,
    },
  });

  const shop = await prisma.shop.create({
    data: {
      shopName,
      address,
      phone: normalizedPhone,
      email,
      status: 'ACTIVE',
    },
  });

  const avatarUrl = generateAvatarUrl(ownerName);

  const shopOwner = await prisma.shopOwner.create({
    data: {
      userId: user.id,
      shopId: shop.id,
      ownerName,
      passwordHash,
      avatarUrl,
    },
  });

  // Generate JWT token
  const token = generateToken(user.id, user.email, user.role, { shopId: shop.id });

  logger.info(`Shop owner registered: ${email}`);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    token,
    user: {
      id: user.id,
      name: ownerName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      shopId: shop.id,
      shopName: shop.shopName,
      avatar: avatarUrl,
    },
  });
});

/**
 * @route   POST /api/auth/shop-owner/login
 * @desc    Shop owner login (Step 1: Request OTP)
 * @access  Public
 */
exports.shopOwnerLogin = asyncHandler(async (req, res) => {
  const { identifier } = req.body; // phone or email

  // Normalize phone number if it's a phone (not email)
  const normalizedIdentifier = identifier.includes('@')
    ? identifier.toLowerCase().trim()
    : normalizePhoneNumber(identifier);

  // Find shop owner by phone or email - try both original and normalized
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: normalizedIdentifier },
        { email: normalizedIdentifier },
        { phone: identifier },
        { email: identifier },
      ],
      role: ROLES.SHOP_OWNER,
    },
    include: {
      shopOwner: {
        include: {
          shop: true,
        },
      },
    },
  });

  if (!user || !user.shopOwner) {
    return res.status(404).json({
      success: false,
      message: 'Account not found. Please complete your registration or contact support.',
      hint: 'If you recently registered, make sure you verified the OTP to complete your account setup.',
      debug: {
        searchedFor: normalizedIdentifier,
        isEmail: identifier.includes('@'),
      },
    });
  }

  const otpTargets = {
    email: normalizeEmail(user.email),
    phone: user.phone ? normalizePhoneNumber(user.phone) : null,
  };

  // Send OTP
  await sendOTP(otpTargets, 'LOGIN');

  res.json({
    success: true,
    message: getOtpDeliveryMessage(otpTargets.email, otpTargets.phone),
    identifier: normalizedIdentifier,
    shopName: user.shopOwner.shop.shopName,
    otpExpiresIn: OTP.EXPIRY_MINUTES * 60,
  });
});

/**
 * @route   POST /api/auth/shop-owner/verify-login-otp
 * @desc    Verify OTP and login shop owner
 * @access  Public
 */
exports.shopOwnerVerifyLoginOTP = asyncHandler(async (req, res) => {
  const { identifier, otp } = req.body;

  // Normalize identifier to match how OTPs are stored/sent
  const normalizedIdentifier = identifier.includes('@')
    ? identifier.toLowerCase().trim()
    : normalizePhoneNumber(identifier);

  // Find shop owner
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: normalizedIdentifier },
        { email: normalizedIdentifier },
        { phone: identifier },
        { email: identifier },
      ],
      role: ROLES.SHOP_OWNER,
    },
    include: {
      shopOwner: {
        include: {
          shop: true,
        },
      },
    },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  const verificationIdentifiers = [
    normalizedIdentifier,
    normalizeEmail(user.email),
    user.phone ? normalizePhoneNumber(user.phone) : null,
  ];

  // Verify OTP (accept code sent to email or phone)
  await verifyOTP(verificationIdentifiers, otp);

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  // Generate JWT token
  const token = generateToken(user.id, user.email, user.role, {
    shopId: user.shopOwner.shopId,
  });

  logger.info(`Shop owner logged in: ${identifier}`);

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.shopOwner.ownerName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      shopId: user.shopOwner.shopId,
      shopName: user.shopOwner.shop.shopName,
      avatar: user.shopOwner.avatarUrl,
    },
  });
});

/**
 * @route   POST /api/auth/shop-owner/password-login
 * @desc    Shop owner login with password
 * @access  Public
 */
exports.shopOwnerPasswordLogin = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body; // identifier can be phone or email

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required',
    });
  }

  // Normalize identifier for consistent lookups
  const normalizedIdentifier = identifier.includes('@')
    ? identifier.toLowerCase().trim()
    : normalizePhoneNumber(identifier);

  // Find shop owner by phone or email
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: normalizedIdentifier },
        { email: normalizedIdentifier },
        { phone: identifier },
        { email: identifier },
      ],
      role: ROLES.SHOP_OWNER,
    },
    include: {
      shopOwner: {
        include: {
          shop: true,
        },
      },
    },
  });

  if (!user || !user.shopOwner) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Check if password exists
  if (!user.shopOwner.passwordHash) {
    return res.status(400).json({
      success: false,
      message: 'Password not set. Please use OTP login or reset your password',
    });
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.shopOwner.passwordHash);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  // Generate JWT token
  const token = generateToken(user.id, user.email, user.role, {
    shopId: user.shopOwner.shopId,
  });

  logger.info(`Shop owner logged in with password: ${identifier}`);

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.shopOwner.ownerName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      shopId: user.shopOwner.shopId,
      shopName: user.shopOwner.shop.shopName,
      avatar: user.shopOwner.avatarUrl,
    },
  });
});
// =====================================================
// CUSTOMER AUTHENTICATION
// =====================================================

/**
 * @route   POST /api/auth/customer/login
 * @desc    Customer login (Step 1: Request OTP)
 * @access  Public
 */
exports.customerLogin = asyncHandler(async (req, res) => {
  const { identifier } = req.body; // phone or email

  // Normalize phone number if it's a phone (not email)
  const normalizedIdentifier = identifier.includes('@')
    ? identifier.toLowerCase().trim()
    : normalizePhoneNumber(identifier);

  // Find customer by phone or email - try both original and normalized
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: normalizedIdentifier },
        { email: normalizedIdentifier },
        { phone: identifier },
        { email: identifier },
      ],
      role: ROLES.CUSTOMER,
    },
    include: {
      customer: {
        include: {
          shop: true,
        },
      },
    },
  });

  if (!user || !user.customer) {
    return res.status(404).json({
      success: false,
      message: 'No account found. Please contact your shop owner to register you.',
      debug: {
        searchedFor: normalizedIdentifier,
        isEmail: identifier.includes('@'),
      },
    });
  }

  // Validate that customer has a shop association
  if (!user.customer.shopId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. No shop association found. Please contact support.',
    });
  }

  // Validate that the shop is active
  if (user.customer.shop.status !== 'ACTIVE') {
    return res.status(403).json({
      success: false,
      message: `Access denied. Shop is ${user.customer.shop.status.toLowerCase()}. Please contact your shop owner.`,
    });
  }

  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Your account is inactive. Please contact your shop owner.',
    });
  }

  const otpTargets = {
    email: normalizeEmail(user.email),
    phone: user.phone ? normalizePhoneNumber(user.phone) : null,
  };

  // Send OTP
  await sendOTP(otpTargets, 'LOGIN');

  res.json({
    success: true,
    message: getOtpDeliveryMessage(otpTargets.email, otpTargets.phone),
    identifier: normalizedIdentifier,
    shopName: user.customer.shop.shopName,
    otpExpiresIn: OTP.EXPIRY_MINUTES * 60,
  });
});

/**
 * @route   POST /api/auth/customer/verify-otp
 * @desc    Verify OTP and login customer
 * @access  Public
 */
exports.customerVerifyOTP = asyncHandler(async (req, res) => {
  const { identifier, otp } = req.body;

  // Normalize phone number if it's a phone (not email)
  const normalizedIdentifier = identifier.includes('@')
    ? identifier.toLowerCase().trim()
    : normalizePhoneNumber(identifier);

  // Find customer - try both original and normalized
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: normalizedIdentifier },
        { email: normalizedIdentifier },
        { phone: identifier },
        { email: identifier },
      ],
      role: ROLES.CUSTOMER,
    },
    include: {
      customer: {
        include: {
          shop: true,
        },
      },
    },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  const verificationIdentifiers = [
    normalizedIdentifier,
    normalizeEmail(user.email),
    user.phone ? normalizePhoneNumber(user.phone) : null,
  ];

  // Verify OTP (accept code sent to email or phone)
  await verifyOTP(verificationIdentifiers, otp);

  // Validate that customer has a shop association
  if (!user.customer || !user.customer.shopId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. No shop association found. Please contact support.',
    });
  }

  // Validate that the shop is active
  if (user.customer.shop.status !== 'ACTIVE') {
    return res.status(403).json({
      success: false,
      message: `Access denied. Shop is ${user.customer.shop.status.toLowerCase()}. Please contact your shop owner.`,
    });
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  // Generate JWT token
  const token = generateToken(user.id, user.email, user.role, {
    shopId: user.customer.shopId,
  });

  logger.info(`Customer logged in: ${identifier}`);

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.customer.customerName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      shopId: user.customer.shopId,
      shopName: user.customer.shop.shopName,
      avatar: user.customer.photoUrl || generateAvatarUrl(user.customer.customerName),
      creditBalance: user.customer.creditBalance,
      totalPurchases: user.customer.totalCredit,
      totalPaid: user.customer.totalPaid,
    },
  });
});

// =====================================================
// COMMON
// =====================================================

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res) => {
  // Since we're using JWT, logout is handled on frontend by removing token
  // We can log the action
  logger.info(`User logged out: ${req.user.email}`);

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * @route   GET /api/auth/verify-token
 * @desc    Verify JWT token and get user data
 * @access  Private
 */
exports.verifyToken = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      admin: true,
      shopOwner: {
        include: {
          shop: true,
        },
      },
      customer: {
        include: {
          shop: true,
        },
      },
    },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  let userData = {
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };

  if (user.role === ROLES.ADMIN && user.admin) {
    userData = {
      ...userData,
      name: user.admin.name,
      avatar: user.admin.avatarUrl || generateAvatarUrl(user.admin.name),
    };
  } else if (user.role === ROLES.SHOP_OWNER && user.shopOwner) {
    userData = {
      ...userData,
      name: user.shopOwner.ownerName,
      shopId: user.shopOwner.shopId,
      shopName: user.shopOwner.shop.shopName,
      avatar: user.shopOwner.avatarUrl,
    };
  } else if (user.role === ROLES.CUSTOMER && user.customer) {
    userData = {
      ...userData,
      name: user.customer.customerName,
      shopId: user.customer.shopId,
      shopName: user.customer.shop.shopName,
      avatar: user.customer.photoUrl || generateAvatarUrl(user.customer.customerName),
      creditBalance: user.customer.creditBalance,
      totalPurchases: user.customer.totalCredit,
      totalPaid: user.customer.totalPaid,
    };
  }

  res.json({
    success: true,
    user: userData,
  });
});

// =====================================================
// PROFILE & PASSWORD
// =====================================================

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
exports.updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { name, email, phone } = req.body;
  const role = req.user.role;

  // Normalize phone number if provided
  const normalizedPhone = phone ? normalizePhoneNumber(phone) : null;

  // Check if email or phone is already used by another user
  if (email || normalizedPhone) {
    const existingUser = await prisma.user.findFirst({
      where: {
        id: { not: userId },
        OR: [
          ...(email ? [{ email }] : []),
          ...(normalizedPhone ? [{ phone: normalizedPhone }, { phone }] : [])
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone number already in use by another account',
      });
    }
  }

  // Update User table
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(email && { email }),
      ...(normalizedPhone && { phone: normalizedPhone }),
    }
  });

  // Update specific role tables
  if (role === ROLES.ADMIN && name) {
    await prisma.admin.update({
      where: { userId },
      data: { name }
    });
  } else if (role === ROLES.SHOP_OWNER && name) {
    await prisma.shopOwner.update({
      where: { userId },
      data: { ownerName: name }
    });
  } else if (role === ROLES.CUSTOMER && name) {
    await prisma.customer.update({
      where: { userId },
      data: { customerName: name }
    });
  }

  res.json({
    success: true,
    message: 'Profile updated successfully',
  });
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
exports.changePassword = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const role = req.user.role;
  const { currentPassword, newPassword } = req.body;

  if (role === ROLES.CUSTOMER) {
    return res.status(400).json({ success: false, message: 'Customers do not use passwords.' });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { admin: true, shopOwner: true }
  });

  let passwordHash = null;
  if (role === ROLES.ADMIN) {
    passwordHash = user.admin.passwordHash;
  } else if (role === ROLES.SHOP_OWNER) {
    passwordHash = user.shopOwner.passwordHash;
  }

  if (passwordHash) {
    const isMatch = await bcrypt.compare(currentPassword, passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect current password' });
    }
  }

  const newHash = await bcrypt.hash(newPassword, 12);

  if (role === ROLES.ADMIN) {
    await prisma.admin.update({ where: { userId }, data: { passwordHash: newHash } });
  } else if (role === ROLES.SHOP_OWNER) {
    await prisma.shopOwner.update({ where: { userId }, data: { passwordHash: newHash } });
  }

  res.json({ success: true, message: 'Password changed successfully' });
});

/**
 * @route   POST /api/auth/forgot-password/request
 * @desc    Request forgot password OTP
 * @access  Public
 */
exports.requestPasswordReset = asyncHandler(async (req, res) => {
  const { identifier } = req.body;

  const normalizedIdentifier = identifier.includes('@')
    ? identifier.toLowerCase().trim()
    : normalizePhoneNumber(identifier);

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: normalizedIdentifier },
        { email: normalizedIdentifier },
        { phone: identifier },
        { email: identifier },
      ],
      role: { in: [ROLES.SHOP_OWNER, ROLES.ADMIN] }
    }
  });

  if (!user) {
    return res.status(404).json({ success: false, message: 'Account not found or invalid role' });
  }

  const otpTargets = {
    email: normalizeEmail(user.email),
    phone: user.phone ? normalizePhoneNumber(user.phone) : null,
  };

  await sendOTP(otpTargets, 'RESET_PASSWORD');

  res.json({
    success: true,
    message: getOtpDeliveryMessage(otpTargets.email, otpTargets.phone),
    identifier: normalizedIdentifier
  });
});

/**
 * @route   POST /api/auth/forgot-password/reset
 * @desc    Reset password with OTP
 * @access  Public
 */
exports.resetPassword = asyncHandler(async (req, res) => {
  const { identifier, otp, newPassword } = req.body;

  const normalizedIdentifier = identifier.includes('@')
    ? identifier.toLowerCase().trim()
    : normalizePhoneNumber(identifier);

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: normalizedIdentifier },
        { email: normalizedIdentifier },
        { phone: identifier },
        { email: identifier },
      ],
      role: { in: [ROLES.SHOP_OWNER, ROLES.ADMIN] }
    }
  });

  if (!user) {
    return res.status(404).json({ success: false, message: 'Account not found' });
  }

  const verificationIdentifiers = [
    normalizedIdentifier,
    normalizeEmail(user.email),
    user.phone ? normalizePhoneNumber(user.phone) : null,
  ];

  // Verify OTP (accept code sent to email or phone)
  await verifyOTP(verificationIdentifiers, otp);

  const newHash = await bcrypt.hash(newPassword, 12);

  if (user.role === ROLES.ADMIN) {
    await prisma.admin.update({ where: { userId: user.id }, data: { passwordHash: newHash } });
  } else if (user.role === ROLES.SHOP_OWNER) {
    await prisma.shopOwner.update({ where: { userId: user.id }, data: { passwordHash: newHash } });
  }

  res.json({ success: true, message: 'Password reset successfully. You can now login.' });
});

