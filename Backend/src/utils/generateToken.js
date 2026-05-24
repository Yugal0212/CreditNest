const jwt = require('jsonwebtoken');
const { ROLES, JWT } = require('../config/constants');

/**
 * Generate JWT token
 */
const generateToken = (userId, email, role, additionalData = {}) => {
  const payload = {
    userId,
    email,
    role,
    ...additionalData,
  };

  let expiry = process.env.JWT_EXPIRY || JWT.SHOP_OWNER_EXPIRY;

  // Set expiry based on role
  if (role === ROLES.ADMIN) {
    expiry = JWT.ADMIN_EXPIRY;
  } else if (role === ROLES.CUSTOMER) {
    expiry = JWT.CUSTOMER_EXPIRY;
  } else if (role === ROLES.SHOP_OWNER) {
    expiry = JWT.SHOP_OWNER_EXPIRY;
  }

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: expiry });
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Decode token without verification
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
};
