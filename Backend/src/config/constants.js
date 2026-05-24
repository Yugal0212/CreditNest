module.exports = {
  APP_NAME: 'CreditNest',
  APP_SHORT_NAME: 'CreditNest',
  
  ROLES: {
    ADMIN: 'ADMIN',
    SHOP_OWNER: 'SHOP_OWNER',
    CUSTOMER: 'CUSTOMER',
  },

  OTP: {
    LENGTH: 6,
    EXPIRY_MINUTES: 5,
    MAX_ATTEMPTS: 3,
    MAX_REQUESTS_PER_HOUR: 3,
    LOCK_MINUTES: 10,
  },

  JWT: {
    ADMIN_EXPIRY: '2h',
    SHOP_OWNER_EXPIRY: '8h',
    CUSTOMER_EXPIRY: '4h',
  },

  FILE_UPLOAD: {
    MAX_SIZE: 2 * 1024 * 1024, // 2MB
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png'],
    FOLDERS: {
      CUSTOMERS: 'creditnest/customers',
      PRODUCTS: 'creditnest/products',
      SHOPS: 'creditnest/shops',
    },
  },

  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
};
