const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation rules for authentication
 */
const authValidation = {
  adminLogin: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],

  shopOwnerRegister: [
    body('shopName').trim().isLength({ min: 3, max: 100 }).withMessage('Shop name must be 3-100 characters'),
    body('ownerName').trim().isLength({ min: 2, max: 100 }).withMessage('Owner name must be 2-100 characters'),
    body('address').trim().notEmpty().withMessage('Address is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required')
      .isLength({ min: 10, max: 13 }).withMessage('Phone number must be 10-13 digits'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('otpMethod')
      .optional()
      .isIn(['sms', 'email', 'both'])
      .withMessage('OTP method must be sms, email, or both'),
  ],

  passwordLogin: [
    body('identifier').notEmpty().withMessage('Phone or email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],

  verifyOTP: [
    body('identifier').notEmpty().withMessage('Identifier (phone/email) is required'),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Valid 6-digit OTP is required'),
  ],

  login: [body('identifier').notEmpty().withMessage('Phone or email is required')],
};

/**
 * Validation rules for customer
 */
const customerValidation = {
  create: [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('phone').optional({ checkFalsy: true }).trim().isLength({ min: 10, max: 13 }).withMessage('Phone number must be 10-13 digits'),
    body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('address').optional().trim(),
    body('workplace').optional().trim(),
    body().custom((value, { req }) => {
      if (!req.body.phone && !req.body.email) {
        throw new Error('Either phone number or email must be provided');
      }
      return true;
    }),
  ],

  update: [
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('phone').optional({ checkFalsy: true }).trim().isLength({ min: 10, max: 13 }).withMessage('Phone number must be 10-13 digits'),
    body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail().withMessage('Valid email is required if provided'),
    body('address').optional().trim(),
    body('workplace').optional().trim(),
  ],
};

/**
 * Validation rules for product
 */
const productValidation = {
  create: [
    body('productName').trim().isLength({ min: 2, max: 100 }).withMessage('Product name must be 2-100 characters'),
    body('productNameEn').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Product name (EN) must be 2-100 characters'),
    body('productNameHi').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Product name (HI) must be 2-100 characters'),
    body('productNameGu').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Product name (GU) must be 2-100 characters'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('categoryEn').optional().trim(),
    body('categoryHi').optional().trim(),
    body('categoryGu').optional().trim(),
    body('unit').trim().notEmpty().withMessage('Unit is required'),
    body('pricePerUnit').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('stockStatus').optional().isIn(['AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK']).withMessage('Invalid stock status'),
    body('description').optional().trim(),
  ],

  update: [
    body('productName').optional().trim().isLength({ min: 2, max: 100 }),
    body('productNameEn').optional().trim().isLength({ min: 2, max: 100 }),
    body('productNameHi').optional().trim().isLength({ min: 2, max: 100 }),
    body('productNameGu').optional().trim().isLength({ min: 2, max: 100 }),
    body('category').optional().trim(),
    body('categoryEn').optional().trim(),
    body('categoryHi').optional().trim(),
    body('categoryGu').optional().trim(),
    body('unit').optional().trim(),
    body('pricePerUnit').optional().isFloat({ min: 0 }),
    body('stockStatus').optional().isIn(['AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK']).withMessage('Invalid stock status'),
    body('description').optional().trim(),
  ],
};

/**
 * Validation rules for transaction
 */
const transactionValidation = {
  creditSale: [
    body('customerId').notEmpty().withMessage('Customer ID is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.productId').notEmpty().withMessage('Product ID is required'),
    body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be positive'),
    body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be positive'),
    body('totalAmount').isFloat({ min: 0 }).withMessage('Total amount must be positive'),
    body('notes').optional().trim(),
  ],

  payment: [
    body('customerId').notEmpty().withMessage('Customer ID is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('paymentMethod').isIn(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER']).withMessage('Invalid payment method'),
    body('notes').optional().trim(),
  ],
};

/**
 * Validate request and return errors if any
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

/**
 * Reusable pagination query validation (page, limit)
 */
const paginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('limit must be between 1 and 200')
    .toInt(),
];

/**
 * Cursor pagination query validation (cursor, limit)
 */
const cursorPaginationQuery = [
  query('cursor')
    .optional()
    .isInt({ min: 1 })
    .withMessage('cursor must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('limit must be between 1 and 200')
    .toInt(),
];

/**
 * Combined history endpoint query validation
 */
const historyQuery = [
  ...paginationQuery,
  query('type')
    .optional()
    .isIn(['credit', 'payment', 'all'])
    .withMessage('type must be credit, payment, or all'),
  query('customerId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('customerId must be a positive integer')
    .toInt(),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid ISO 8601 date'),
];

module.exports = {
  authValidation,
  customerValidation,
  productValidation,
  transactionValidation,
  paginationQuery,
  cursorPaginationQuery,
  historyQuery,
  validate,
};
