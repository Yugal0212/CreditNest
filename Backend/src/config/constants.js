module.exports = {
  APP_NAME: 'Smart Credit Management System',
  APP_SHORT_NAME: 'SCMS',
  
  ROLES: {
    ADMIN: 'ADMIN',
    SHOP_OWNER: 'SHOP_OWNER',
    CUSTOMER: 'CUSTOMER',
  },

  OTP: {
    LENGTH: 6,
    EXPIRY_MINUTES: 10,
    MAX_ATTEMPTS: 3,
    MAX_REQUESTS_PER_HOUR: 3,
  },

  JWT: {
    ADMIN_EXPIRY: '7d',
    SHOP_OWNER_EXPIRY: '30d',
    CUSTOMER_EXPIRY: '30d',
  },

  FILE_UPLOAD: {
    MAX_SIZE: 2 * 1024 * 1024, // 2MB
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png'],
    FOLDERS: {
      CUSTOMERS: 'scms/customers',
      PRODUCTS: 'scms/products',
      SHOPS: 'scms/shops',
    },
  },

  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
};
