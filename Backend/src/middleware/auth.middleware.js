const { verifyToken } = require('../utils/generateToken');
const prisma = require('../config/database');
const { getCache, setCache } = require('../config/redis');
const logger = require('../utils/logger');

const isDatabaseConnectionError = (error) => {
  const message = String(error?.message || '');
  const name = String(error?.name || '');
  const code = String(error?.code || '');

  // Prisma + Mongo Atlas connectivity failures often show up as P2010 + "Server selection timeout"
  // or PrismaClientInitializationError during connection issues.
  if (name === 'PrismaClientInitializationError') return true;
  if (code === 'P2010' && /Server selection timeout|No available servers|ReplicaSetNoPrimary/i.test(message)) return true;
  if (code === 'P2024') return true; // Connection pool timeout
  if (/No such host is known|DNS resolution|ETIMEDOUT|ECONNREFUSED|ENOTFOUND/i.test(message)) return true;
  return false;
};

/**
 * Authenticate JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);
    const cacheKey = `session:${decoded.userId}`;

    // 1. Check Redis Cache
    let user = await getCache(cacheKey);

    // 2. Cache Miss -> Query Database
    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
        },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found.',
        });
      }

      // 3. Store in Cache (1 hour TTL)
      await setCache(cacheKey, user, 3600);
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact support.',
      });
    }

    // Attach user to request
    req.user = {
      ...user,
      ...decoded, // Include shopId if present
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);

    // If DB is down/unreachable, don't pretend the token is invalid.
    // This prevents the frontend from clearing auth state and redirecting to /login.
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable. Database connection issue.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};

/**
 * Authorize by role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
    }

    // Validate shopId for CUSTOMER and SHOP_OWNER roles
    if (req.user.role === 'CUSTOMER' || req.user.role === 'SHOP_OWNER') {
      if (!req.user.shopId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. No shop association found. Please contact support.',
        });
      }
    }

    next();
  };
};

/**
 * Optional authentication (does not fail if no token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
        },
      });

      if (user && user.isActive) {
        req.user = { ...user, ...decoded };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
};
