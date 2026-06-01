const express = require('express');
const router = express.Router();
const shopOwnerController = require('../controllers/shopOwner.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { upload, handleMulterError } = require('../middleware/upload.middleware');
const { customerValidation, productValidation, transactionValidation, validate } = require('../utils/validators');
const { ROLES } = require('../config/constants');

const { cacheMiddleware } = require('../middleware/cache.middleware');

// All routes require shop owner authentication
router.use(authenticate);
router.use(authorize(ROLES.SHOP_OWNER));

// =====================================================
// DASHBOARD
// =====================================================
// Cache stats for 60 seconds to improve rendering time and reduce DB load
router.get('/dashboard/stats', cacheMiddleware(60), shopOwnerController.getDashboardStats);

// =====================================================
// CUSTOMER MANAGEMENT
// =====================================================
router.get('/customers', shopOwnerController.getAllCustomers);
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
router.get('/products', shopOwnerController.getAllProducts);

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
router.get('/categories', shopOwnerController.getAllCategories);
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
router.post(
  '/bills/scan',
  upload.single('bill'),
  handleMulterError,
  shopOwnerController.scanBill
);
router.post(
  '/bills/save-scanned',
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

router.get('/transactions', shopOwnerController.getAllTransactions);

// =====================================================
// PAYMENT MANAGEMENT
// =====================================================
router.post('/payments', transactionValidation.payment, validate, shopOwnerController.recordPayment);

router.get('/payments', shopOwnerController.getPaymentHistory);

// =====================================================
// ANALYTICS
// =====================================================
// Cache analytics for 5 minutes (300 seconds) since they are heavy and don't need realtime precision
router.get('/analytics', cacheMiddleware(300), shopOwnerController.getAnalytics);

// =====================================================
// ORDER REQUESTS (from customers)
// =====================================================
router.get('/order-requests', shopOwnerController.getPendingOrders);
router.post('/order-requests/:orderId/approve', shopOwnerController.approveOrder);
router.post('/order-requests/:orderId/reject', shopOwnerController.rejectOrder);

// =====================================================
// DEBUG (temporary - remove in production)
// =====================================================
router.get('/debug/transactions', shopOwnerController.debugTransactions);

module.exports = router;
