const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authValidation, validate } = require('../utils/validators');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');

// =====================================================
// ADMIN ROUTES
// =====================================================
router.post('/admin/login', authLimiter, authValidation.adminLogin, validate, authController.adminLogin);

// =====================================================
// SHOP OWNER ROUTES
// =====================================================
router.post(
  '/shop-owner/register',
  otpLimiter,
  authValidation.shopOwnerRegister,
  validate,
  authController.shopOwnerRegister
);

router.post(
  '/shop-owner/verify-otp',
  authLimiter,
  authValidation.verifyOTP,
  validate,
  authController.shopOwnerVerifyOTP
);

router.post('/shop-owner/login', otpLimiter, authValidation.login, validate, authController.shopOwnerLogin);

router.post(
  '/shop-owner/verify-login-otp',
  authLimiter,
  authValidation.verifyOTP,
  validate,
  authController.shopOwnerVerifyLoginOTP
);

router.post(
  '/shop-owner/password-login',
  authLimiter,
  authValidation.passwordLogin,
  validate,
  authController.shopOwnerPasswordLogin
);

// =====================================================
// CUSTOMER ROUTES
// =====================================================
router.post('/customer/login', otpLimiter, authValidation.login, validate, authController.customerLogin);

router.post('/customer/verify-otp', authLimiter, authValidation.verifyOTP, validate, authController.customerVerifyOTP);

// =====================================================
// COMMON ROUTES
// =====================================================
router.post('/logout', authenticate, authController.logout);

router.get('/verify-token', authenticate, authController.verifyToken);
// =====================================================
// PROFILE & PASSWORD ROUTES
// =====================================================
router.put('/profile', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, authController.changePassword);
router.post('/forgot-password/request', otpLimiter, authController.requestPasswordReset);
router.post('/forgot-password/reset', authLimiter, authController.resetPassword);

module.exports = router;
