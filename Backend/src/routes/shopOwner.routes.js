const express = require('express');
const router = express.Router();
const shopOwnerController = require('../controllers/shopOwner.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { upload, handleMulterError } = require('../middleware/upload.middleware');
const {
  customerValidation,
  productValidation,
  transactionValidation,
  historyQuery,
  paginationQuery,
  cursorPaginationQuery,
  validate,
} = require('../utils/validators');
const { ROLES } = require('../config/constants');
const { cacheMiddleware } = require('../middleware/cache.middleware');

// All routes require shop owner authentication
router.use(authenticate);
router.use(authorize(ROLES.SHOP_OWNER));

// =====================================================
// DASHBOARD
// =====================================================
// Cache stats for 60 seconds — reduces DB load on every page mount
router.get('/dashboard/stats', cacheMiddleware(60), shopOwnerController.getDashboardStats);

// =====================================================
// CUSTOMER MANAGEMENT
// =====================================================
// Cache customer list for 30s — SWR deduplication handles the rest
router.get('/customers', cursorPaginationQuery, validate, cacheMiddleware(30), shopOwnerController.getAllCustomers);
router.get('/customers/:customerId/history', shopOwnerController.getCustomerHistory);
router.get('/customers/:customerId', shopOwnerController.getCustomerDetails);

router.post(
  '/customers',
  upload.single('photo'),
  handleMulterError,
  customerValidation.create,
  validate,
  shopOwnerController.addCustomer
);

router.put(
  '/customers/:customerId',
  upload.single('photo'),
  handleMulterError,
  customerValidation.update,
  validate,
  shopOwnerController.updateCustomer
);

router.delete('/customers/:customerId', shopOwnerController.deleteCustomer);

// =====================================================
// PRODUCT MANAGEMENT
// =====================================================
// Products change infrequently — cache for 60s
router.get('/products', cursorPaginationQuery, validate, cacheMiddleware(60), shopOwnerController.getAllProducts);

router.post(
  '/products',
  upload.single('photo'),
  handleMulterError,
  productValidation.create,
  validate,
  shopOwnerController.addProduct
);

router.put(
  '/products/:productId',
  upload.single('photo'),
  handleMulterError,
  productValidation.update,
  validate,
  shopOwnerController.updateProduct
);

router.delete('/products/:productId', shopOwnerController.deleteProduct);

// =====================================================
// CATEGORY MANAGEMENT
// =====================================================
// Categories rarely change — cache for 2 minutes
router.get('/categories', cacheMiddleware(120), shopOwnerController.getAllCategories);
router.post(
  '/categories',
  upload.single('photo'),
  handleMulterError,
  shopOwnerController.addCategory
);
router.put(
  '/categories/:categoryId',
  upload.single('photo'),
  handleMulterError,
  shopOwnerController.updateCategory
);
router.delete('/categories/:categoryId', shopOwnerController.deleteCategory);

// =====================================================
// BILL SCANNING & OCR
// =====================================================
// Bill scan accepts large multipart files — 10mb limit applied here only
router.post(
  '/bills/scan',
  express.json({ limit: '10mb' }),
  upload.single('bill'),
  handleMulterError,
  shopOwnerController.scanBill
);
router.post(
  '/bills/save-scanned',
  express.json({ limit: '2mb' }),
  shopOwnerController.saveScannedProducts
);

// =====================================================
// TRANSACTION MANAGEMENT
// =====================================================
router.post(
  '/transactions/credit-sale',
  transactionValidation.creditSale,
  validate,
  shopOwnerController.recordCreditSale
);

// Cache transactions list for 30s
router.get('/transactions', cursorPaginationQuery, validate, cacheMiddleware(30), shopOwnerController.getAllTransactions);

// =====================================================
// PAYMENT MANAGEMENT
// =====================================================
router.post('/payments', transactionValidation.payment, validate, shopOwnerController.recordPayment);

// Cache payment history for 30s
router.get('/payments', cursorPaginationQuery, validate, cacheMiddleware(30), shopOwnerController.getPaymentHistory);

// =====================================================
// COMBINED HISTORY (Transactions + Payments)
// =====================================================
// Server-filtered, paginated — replaces client-side 500-record fetch
router.get('/history', historyQuery, validate, shopOwnerController.getHistory);

// =====================================================
// ANALYTICS
// =====================================================
// Cache analytics for 5 minutes — heavy queries, don't need realtime precision
router.get('/analytics', cacheMiddleware(300), shopOwnerController.getAnalytics);

// =====================================================
// ORDER REQUESTS (from customers)
// =====================================================
// Short cache — orders need to appear quickly
router.get('/order-requests', cursorPaginationQuery, validate, cacheMiddleware(20), shopOwnerController.getPendingOrders);
router.post('/order-requests/:orderId/approve', shopOwnerController.approveOrder);
router.post('/order-requests/:orderId/reject', shopOwnerController.rejectOrder);

module.exports = router;
