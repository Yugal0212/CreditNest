const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Handle file url generation for Multer diskStorage
 * Compatible with existing controller signatures.
 * If fileObject is already written to disk by Multer, we construct the static path URL.
 * If it is a buffer, we write it to the local folder.
 */
const uploadToCloudinary = async (fileObject, folder, fileName) => {
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';

  // 1. If fileObject is already a saved Multer disk file
  if (fileObject && fileObject.filename) {
    const subfolder = path.basename(fileObject.destination);
    logger.info(`Processing already saved disk upload: ${fileObject.filename} under ${subfolder}`);
    return {
      secure_url: `${baseUrl}/uploads/${subfolder}/${fileObject.filename}`
    };
  }

  // 2. Fallback: If it's a raw buffer, write it manually to the disk
  if (fileObject && Buffer.isBuffer(fileObject)) {
    logger.info(`Received raw buffer upload for folder ${folder}`);
    
    // Normalize folder name (remove scms prefix if any)
    let subfolder = 'users';
    if (folder.includes('product')) {
      subfolder = 'products';
    } else if (folder.includes('category')) {
      subfolder = 'categories';
    }

    const uploadDir = path.join(__dirname, '../../uploads', subfolder);
    
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const ext = '.jpg'; // default extension for manual buffers
      const savedFileName = `${fileName}${ext}`;
      const filePath = path.join(uploadDir, savedFileName);
      
      fs.writeFileSync(filePath, fileObject);
      logger.info(`File successfully written to disk: ${filePath}`);
      
      return {
        secure_url: `${baseUrl}/uploads/${subfolder}/${savedFileName}`
      };
    } catch (err) {
      logger.error('Error writing manual buffer to disk:', err);
      throw err;
    }
  }

  throw new Error('Invalid file object or buffer provided for upload.');
};

/**
 * Delete local file based on its URL
 */
const deleteFromCloudinary = async (fileUrl) => {
  if (!fileUrl) return;
  
  try {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    if (fileUrl.startsWith(baseUrl)) {
      const relativePath = fileUrl.replace(baseUrl, ''); // e.g. /uploads/products/photo-123.jpg
      const filePath = path.join(__dirname, '../../', relativePath);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Successfully deleted local file: ${filePath}`);
      }
    }
  } catch (error) {
    logger.error('Failed to delete local file:', error);
  }
};

/**
 * Extract relative filename/path from URL
 */
const getPublicIdFromUrl = (url) => {
  try {
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart;
  } catch (error) {
    return null;
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
};
