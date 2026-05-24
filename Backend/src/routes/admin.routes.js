const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { ROLES } = require('../config/constants');

// All routes require admin authentication
router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

// =====================================================
// DASHBOARD
// =====================================================
router.get('/dashboard/stats', adminController.getDashboardStats);

// =====================================================
// USER MANAGEMENT
// =====================================================
router.get('/users', adminController.getAllUsers);
router.get('/users/:role/:id', adminController.getUserById);
router.post('/users', adminController.createUser);
router.put('/users/:role/:id', adminController.updateUser);
router.patch('/users/:role/:id/status', adminController.updateUserStatus);
router.delete('/users/:role/:id', adminController.deleteUser);

// =====================================================
// SHOP MANAGEMENT
// =====================================================
router.get('/shops', adminController.getAllShops);

router.get('/shops/:shopId', adminController.getShopDetails);

router.patch('/shops/:shopId/status', adminController.updateShopStatus);

// =====================================================
// ANALYTICS
// =====================================================
router.get('/analytics', adminController.getAnalytics);

// =====================================================
// AUDIT LOGS & API LOGS
// =====================================================
router.get('/logs/audit', adminController.getAuditLogs);
router.get('/logs/api', adminController.getApiLogs);

// =====================================================
// SYSTEM MONITORING & OPERATIONS
// =====================================================
router.get('/system/health', adminController.getSystemHealth);
router.post('/system/backup', adminController.runSystemBackup);
router.post('/system/prune', adminController.runPruneTokens);
router.post('/system/optimize', adminController.runOptimizeDB);

module.exports = router;
