const NodeCache = require('node-cache');
const logger = require('../utils/logger');

// Initialize cache with default TTL of 60 seconds
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

/**
 * Caching middleware
 * @param {number} duration - Time to live in seconds
 */
const cacheMiddleware = (duration = 60) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create a unique cache key based on the URL and user ID (if authenticated)
    const userId = req.user ? req.user.id : 'anonymous';
    const shopId = req.user && req.user.shopId ? req.user.shopId : 'no-shop';
    const key = `__express__${req.originalUrl || req.url}__user_${userId}__shop_${shopId}`;

    // Always set Cache-Control so the browser / CDN caches authenticated GET responses.
    // Using 'private' because responses are user-specific (auth token required).
    res.setHeader('Cache-Control', `private, max-age=${duration}, stale-while-revalidate=${Math.floor(duration / 2)}`);
    res.setHeader('Vary', 'Accept-Language, X-Language, Authorization');

    // Check if we have a cached response
    const cachedBody = cache.get(key);
    if (cachedBody) {
      if (process.env.NODE_ENV === 'development') {
        logger.info(`⚡ Serving from cache: ${key}`);
      }
      res.setHeader('X-Cache', 'HIT');
      // Set ETag from cached body for conditional requests
      res.setHeader('ETag', `"${key.length}-${duration}"`);
      return res.json(cachedBody);
    } else {
      res.setHeader('X-Cache', 'MISS');

      // Store original res.json
      const originalSend = res.json;

      // Override res.json to cache the body before sending
      res.json = function(body) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(key, body, duration);
        }

        // Call the original res.json
        originalSend.call(this, body);
      };

      next();
    }
  };
};

/**
 * Clear cache for a specific pattern or user
 */
const clearCache = (pattern) => {
  const keys = cache.keys();
  const keysToDelete = keys.filter(k => k.includes(pattern));
  if (keysToDelete.length > 0) {
    cache.del(keysToDelete);
    if (process.env.NODE_ENV === 'development') {
      logger.info(`🧹 Cleared ${keysToDelete.length} cache entries matching '${pattern}'`);
    }
  }
};

module.exports = {
  cacheMiddleware,
  clearCache,
  cache
};
