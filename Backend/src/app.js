require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { languageMiddleware } = require('./middleware/language.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const shopOwnerRoutes = require('./routes/shopOwner.routes');
const customerRoutes = require('./routes/customer.routes');

// Create Express app
const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

// Security headers
const compression = require('compression');
app.use(compression());

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const normalizeOrigin = (origin) => origin?.replace(/\/$/, '');

const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'https://credit-nest.vercel.app',
  'http://172.28.118.64:3000',
].map(normalizeOrigin);

const envAllowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',') : []),
]
  .map((origin) => normalizeOrigin(origin?.trim()))
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = normalizeOrigin(origin);
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Language parsing (Accept-Language / x-language)
app.use(languageMiddleware);

// Serve static files (fallback for local uploads)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting (apply to all routes)
app.use('/api/', apiLimiter);

// Request logging in development and WebSocket emission
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    logger.info(`${req.method} ${req.path}`);
  }
  
  // Emit to socket for admin diagnostics terminal and Save to DB
  if (req.app.locals.io && !req.path.includes('/admin/system/health')) {
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent') || 'Unknown'
    };
    req.app.locals.io.emit('system_log', logData);
    
    // Save to DB asynchronously
    const prisma = require('./config/database');
    // Ensure we don't block the request
    res.on('finish', () => {
      prisma.apiLog.create({
        data: {
          method: req.method,
          path: req.path,
          ipAddress: req.ip,
          userAgent: req.get('user-agent') || 'Unknown',
          statusCode: res.statusCode,
          responseTime: null, // Could calculate this if needed
        }
      }).catch(err => logger.error('Failed to save API log:', err));
    });
  }
  
  next();
});

// =====================================================
// ROUTES
// =====================================================

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Credit Management System API',
    version: '1.0.0',
    status: 'running',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shop-owner', shopOwnerRoutes);
app.use('/api/customer', customerRoutes);

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// =====================================================
// EXPORT
// =====================================================

module.exports = app;
