const cloudinary = require('../config/cloudinary');
const logger = require('../utils/logger');

/**
 * Upload file buffer to Cloudinary
 */
const uploadToCloudinary = (buffer, folder, fileName) => {
  return new Promise((resolve, reject) => {
    // Check if Cloudinary is configured (Forced to local storage to avoid errors)
    if (true || !process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      logger.info('Cloudinary not configured. Falling back to local storage.');
      
      const fs = require('fs');
      const path = require('path');
      
      // Normalize folder path for Windows
      const normalizedFolder = folder.replace(/\//g, path.sep);
      const uploadDir = path.join(__dirname, '../../uploads', normalizedFolder);
      
      logger.info(`Target upload directory: ${uploadDir}`);
      
      try {
        if (!fs.existsSync(uploadDir)) {
          logger.info('Creating upload directory...');
          fs.mkdirSync(uploadDir, { recursive: true });
          logger.info('Upload directory created.');
        }
        
        const filePath = path.join(uploadDir, `${fileName}.jpg`);
        logger.info(`Writing file to: ${filePath}`);
        fs.writeFileSync(filePath, buffer);
        logger.info('File written successfully.');
        
        logger.info(`File saved locally: ${filePath}`);
        
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        return resolve({
          secure_url: `${baseUrl}/uploads/${folder}/${fileName}.jpg`
        });
      } catch (err) {
        logger.error('Local upload error:', err);
        return reject(err);
      }
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: fileName,
        transformation: [{ width: 500, height: 500, crop: 'limit' }, { quality: 'auto' }],
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload error:', error);
          return reject(error);
        }
        logger.info(`File uploaded to Cloudinary: ${result.secure_url}`);
        resolve(result);
      }
    );

    // Create a readable stream from buffer
    const Readable = require('stream').Readable;
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    stream.pipe(uploadStream);
  });
};

/**
 * Delete file from Cloudinary
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info(`File deleted from Cloudinary: ${publicId}`);
    return result;
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Get public ID from Cloudinary URL
 */
const getPublicIdFromUrl = (url) => {
  try {
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    const publicId = lastPart.split('.')[0];
    const folder = parts[parts.length - 2];
    return `${folder}/${publicId}`;
  } catch (error) {
    return null;
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
};
