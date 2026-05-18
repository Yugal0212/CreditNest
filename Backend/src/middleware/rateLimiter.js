const rateLimit = require('express-rate-limit');

const isDevelopment = process.env.NODE_ENV !== 'production';

const isLocalIp = (ip) => {
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
};

// In local development, skip rate limiting for localhost to avoid blocking QA/testing flows.
const skipLocalDevelopment = (req) => isDevelopment && isLocalIp(req.ip);

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipLocalDevelopment,
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: isDevelopment ? 5 * 60 * 1000 : 15 * 60 * 1000, // 5 mins in dev, 15 minutes in prod
  max: isDevelopment ? 50 : (parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 20), // 50 in dev, 20 in prod
  message: {
    success: false,
    message: isDevelopment
      ? 'Too many authentication attempts, please try again after 5 minutes.'
      : 'Too many authentication attempts, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skip: skipLocalDevelopment,
});

/**
 * OTP rate limiter
 * More lenient in development for testing
 */
const otpLimiter = rateLimit({
  windowMs: isDevelopment ? 5 * 60 * 1000 : 60 * 60 * 1000, // 5 mins in dev, 1 hour in prod
  max: isDevelopment ? 20 : 5, // 20 in dev, 5 in prod
  message: {
    success: false,
    message: isDevelopment
      ? 'Too many OTP requests. Please try again after 5 minutes.'
      : 'Too many OTP requests. Please try again after 1 hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipLocalDevelopment,
});

module.exports = {
  apiLimiter,
  authLimiter,
  otpLimiter,
};
