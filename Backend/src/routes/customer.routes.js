const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { ROLES } = require('../config/constants');

// All routes require customer authentication
router.use(authenticate);
router.use(authorize(ROLES.CUSTOMER));

// =====================================================
// DASHBOARD
// =====================================================
router.get('/dashboard', customerController.getDashboard);

// =====================================================
// PRODUCTS
// =====================================================
router.get('/products', customerController.getProducts);

router.get('/products/:productId', customerController.getProductDetails);

// =====================================================
// ORDERS/PURCHASES
// =====================================================
router.post('/orders', customerController.requestOrder);

router.get('/orders', customerController.getOrders);

router.get('/orders/:orderId', customerController.getOrderDetails);

// =====================================================
// PAYMENT HISTORY
// =====================================================
router.get('/payments', customerController.getPayments);

module.exports = router;
