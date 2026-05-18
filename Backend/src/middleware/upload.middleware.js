const multer = require('multer');
const path = require('path');
const { FILE_UPLOAD } = require('../config/constants');

// File filter
const fileFilter = (req, file, cb) => {
  // Check file type
  if (FILE_UPLOAD.ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only JPG, JPEG, and PNG images are allowed.'
      ),
      false
    );
  }
};

// Multer configuration
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory for Cloudinary upload
  limits: {
    fileSize: FILE_UPLOAD.MAX_SIZE, // 2MB
  },
  fileFilter: fileFilter,
});

// Error handler for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 2MB limit.',
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  } else if (err) {
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
