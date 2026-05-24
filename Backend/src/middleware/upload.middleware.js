const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { FILE_UPLOAD } = require('../config/constants');
const logger = require('../utils/logger');

// Set up disk storage with dynamic folder categorization
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'users'; // default subfolder
    const url = req.originalUrl || '';
    
    if (url.includes('/products')) {
      folder = 'products';
    } else if (url.includes('/categories')) {
      folder = 'categories';
    } else if (url.includes('/bills') || url.includes('/scan') || url.includes('/ocr')) {
      folder = 'bills';
    } else if (url.includes('/customers') || url.includes('/profile') || url.includes('/users')) {
      folder = 'users';
    }

    const dir = path.join(__dirname, '../../uploads', folder);
    
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    } catch (err) {
      logger.error('Error creating upload folder:', err);
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// Allowed MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// File filter validator
const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only JPG, JPEG, PNG, and WEBP formats are allowed.'
      ),
      false
    );
  }
};

// Multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Error handler for multer errors
const handleMulterError = (err, req, res, next) => {
  if (err) {
    logger.error('Multer file upload error:', err);
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds 5MB limit.',
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`,
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  next();
};

module.exports = {
  upload,
  handleMulterError,
};
