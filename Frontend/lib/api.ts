import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API Configuration
const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    return `${protocol}//${hostname}:5000/api`;
  }

  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // If sending FormData, remove Content-Type to let browser set it with boundary
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    if (error.response) {
      // Extract error message from response
      const errorMessage = error.response.data?.message || error.message;
      
      // Handle specific error codes
      switch (error.response.status) {
        case 401:
          // Unauthorized:
          // - If a user had an existing session token, treat it as expired and redirect.
          // - If this was a login/OTP request (no token yet), do NOT hard-redirect; let the caller show the error.
          if (typeof window !== 'undefined') {
            const hasToken = !!localStorage.getItem('token');

            const requestUrl = String(error.config?.url || '');
            const isAuthRequest = requestUrl.startsWith('/auth/') || requestUrl.includes('/auth/');
            const isAuthAttempt =
              isAuthRequest &&
              (requestUrl.includes('login') ||
                requestUrl.includes('verify-otp') ||
                requestUrl.includes('register') ||
                requestUrl.includes('forgot-password'));

            const currentPath = window.location?.pathname || '';
            const isOnAuthPage =
              currentPath.startsWith('/login') ||
              currentPath.startsWith('/register') ||
              currentPath.startsWith('/verify-otp');

            if (hasToken) {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              if (!isOnAuthPage) {
                window.location.href = '/login';
              }
            } else {
              // No token means this is likely an auth attempt (wrong password/OTP).
              // Avoid a full-page redirect that hides the real error.
              if (!isAuthAttempt) {
                // If somehow we got a 401 on a non-auth request without a token,
                // redirect to login (but only when not already there).
                if (!isOnAuthPage) {
                  window.location.href = '/login';
                }
              }
            }
          }
          break;
        case 403:
          console.error('Access forbidden:', errorMessage);
          break;
        case 404:
          console.error('Resource not found:', errorMessage);
          break;
        case 500:
          console.error('Server error:', errorMessage);
          break;
      }
    }
    return Promise.reject(error);
  }
);

// ============= AUTH APIs =============

export const authAPI = {
  // =====================================================
  // FIREBASE PHONE AUTHENTICATION (RECOMMENDED)
  // =====================================================
  
  /**
   * Firebase Phone Login
   * After Firebase verifies OTP and returns ID token,
   * send token to backend for app authentication
   */
  firebasePhoneLogin: (idToken: string, role: 'customer' | 'shop_owner') =>
    api.post('/auth/firebase-phone-login', { idToken, role }),
  
  // =====================================================
  // LEGACY OTP AUTHENTICATION (OLD METHOD)
  // =====================================================
  
  // Admin Login
  adminLogin: (email: string, password: string) =>
    api.post('/auth/admin/login', { email, password }),

  // Shop Owner Registration
  shopOwnerRegister: (data: {
    shopName: string;
    ownerName: string;
    address: string;
    phone: string;
    email: string;
    otpMethod?: 'email' | 'sms' | 'both';
  }) => api.post('/auth/shop-owner/register', data),

  // Shop Owner Verify OTP
  shopOwnerVerifyOTP: (data: {
    identifier: string;
    otp: string;
    registrationData: any;
  }) => api.post('/auth/shop-owner/verify-otp', data),

  // Shop Owner Login
  shopOwnerLogin: (identifier: string) =>
    api.post('/auth/shop-owner/login', { identifier }),

  // Shop Owner Password Login
  shopOwnerPasswordLogin: (identifier: string, password: string) =>
    api.post('/auth/shop-owner/password-login', { identifier, password }),

  // Shop Owner Verify Login OTP
  shopOwnerVerifyLoginOTP: (identifier: string, otp: string) =>
    api.post('/auth/shop-owner/verify-login-otp', { identifier, otp }),

  // Customer Login
  customerLogin: (identifier: string) =>
    api.post('/auth/customer/login', { identifier }),

  // Customer Verify OTP
  customerVerifyOTP: (identifier: string, otp: string) =>
    api.post('/auth/customer/verify-otp', { identifier, otp }),

  // Logout
  logout: () => api.post('/auth/logout'),

  // Verify Token
  verifyToken: () => api.get('/auth/verify-token'),

  // Profile & Password Management
  updateProfile: (data: { name?: string; email?: string; phone?: string }) => 
    api.put('/auth/profile', data),
  
  changePassword: (data: { currentPassword?: string; newPassword: string }) => 
    api.post('/auth/change-password', data),
    
  requestPasswordReset: (identifier: string) => 
    api.post('/auth/forgot-password/request', { identifier }),
    
  resetPassword: (data: { identifier: string; otp: string; newPassword: string }) => 
    api.post('/auth/forgot-password/reset', data),
};

// ============= ADMIN APIs =============

export const adminAPI = {
  // Dashboard Stats
  getDashboardStats: () => api.get('/admin/dashboard/stats'),

  // Users
  getAllUsers: (params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
    shopId?: string;
  }) => api.get('/admin/users', { params }),

  getUser: (role: string, id: string) => api.get(`/admin/users/${role}/${id}`),

  createShopOwner: (data: {
    role: 'shop_owner';
    ownerName: string;
    shopName: string;
    address: string;
    phone: string;
    email: string;
    city?: string;
    state?: string;
    password?: string;
  }) => api.post('/admin/users', data),

  updateUser: (
    role: string,
    id: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      workplace?: string;
      customerStatus?: string;
      shopName?: string;
      shopAddress?: string;
      shopCity?: string;
      shopState?: string;
    }
  ) => api.put(`/admin/users/${role}/${id}`, data),

  updateUserStatus: (
    role: string,
    id: string,
    data: { isActive?: boolean; shopStatus?: string }
  ) => api.patch(`/admin/users/${role}/${id}/status`, data),

  deleteUser: (role: string, id: string) => api.delete(`/admin/users/${role}/${id}`),

  // Shops
  getShops: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    api.get('/admin/shops', { params }),

  getShopDetails: (shopId: string) => api.get(`/admin/shops/${shopId}`),

  updateShopStatus: (shopId: string, status: string, reason?: string) =>
    api.patch(`/admin/shops/${shopId}/status`, { status, reason }),

  // Analytics
  getAnalytics: (period?: string) =>
    api.get('/admin/analytics', { params: { period } }),

  // Audit Logs
  getAuditLogs: (params?: { page?: number; limit?: number; action?: string }) =>
    api.get('/admin/logs', { params }),
};

// ============= SHOP OWNER APIs =============

export const shopOwnerAPI = {
  // Dashboard
  getDashboardStats: () => api.get('/shop-owner/dashboard/stats'),

  // Customers
  getCustomers: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    api.get('/shop-owner/customers', { params }),

  getCustomer: (customerId: string) => api.get(`/shop-owner/customers/${customerId}`),

  getCustomerHistory: (customerId: string, params?: { startDate?: string; endDate?: string; type?: string }) =>
    api.get(`/shop-owner/customers/${customerId}/history`, { params }),

  addCustomer: (formData: FormData) =>
    api.post('/shop-owner/customers', formData),

  updateCustomer: (customerId: string, formData: FormData) =>
    api.put(`/shop-owner/customers/${customerId}`, formData),

  deleteCustomer: (customerId: string) => api.delete(`/shop-owner/customers/${customerId}`),

  // Products
  getProducts: (params?: { page?: number; limit?: number; category?: string; stockStatus?: string }) =>
    api.get('/shop-owner/products', { params }),

  getProduct: (productId: string) => api.get(`/shop-owner/products/${productId}`),

  addProduct: (formData: FormData) =>
    api.post('/shop-owner/products', formData),

  updateProduct: (productId: string, formData: FormData) =>
    api.put(`/shop-owner/products/${productId}`, formData),

  deleteProduct: (productId: string) => api.delete(`/shop-owner/products/${productId}`),

  // Transactions
  recordCreditSale: (data: {
    customerId: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number }>;
    totalAmount: number;
    notes?: string;
  }) => api.post('/shop-owner/transactions/credit-sale', data),

  getTransactions: (params?: {
    page?: number;
    limit?: number;
    customerId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/shop-owner/transactions', { params }),

  getTransaction: (transactionId: string) =>
    api.get(`/shop-owner/transactions/${transactionId}`),

  // Payments
  recordPayment: (data: {
    customerId: string;
    amount: number;
    paymentMethod: string;
    notes?: string;
  }) => api.post('/shop-owner/payments', data),

  getPayments: (params?: {
    page?: number;
    limit?: number;
    customerId?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/shop-owner/payments', { params }),

  // Analytics
  getAnalytics: (period?: string) =>
    api.get('/shop-owner/analytics', { params: { period } }),

  // Order Requests (Customer Requests)
  getOrderRequests: (
    params?: { page?: number; limit?: number },
    options?: { timeout?: number }
  ) =>
    api.get('/shop-owner/order-requests', { params, timeout: options?.timeout }),

  approveOrder: (orderId: string, selectedItems?: number[]) =>
    api.post(`/shop-owner/order-requests/${orderId}/approve`, { selectedItems }),

  rejectOrder: (orderId: string) =>
    api.post(`/shop-owner/order-requests/${orderId}/reject`),
};

// ============= CUSTOMER APIs =============

export const customerAPI = {
  // Dashboard
  getDashboard: () => api.get('/customer/dashboard'),

  // Products
  getProducts: (params?: { category?: string; search?: string }) =>
    api.get('/customer/products', { params }),

  getProduct: (productId: string) => api.get(`/customer/products/${productId}`),

  // Orders (Transactions)
  getOrders: (params?: { page?: number; limit?: number }) =>
    api.get('/customer/orders', { params }),

  requestOrder: (data: {
    items: Array<{ productId: string; quantity: number }>;
    notes?: string;
  }) => api.post('/customer/orders', data),

  getOrder: (orderId: string) => api.get(`/customer/orders/${orderId}`),

  // Payments
  getPayments: (params?: { page?: number; limit?: number }) =>
    api.get('/customer/payments', { params }),
};

// ============= UTILITY FUNCTIONS =============

export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Health Check
export const healthCheck = () => api.get('/health');

export default api;
