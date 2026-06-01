const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient = null;
let isRedisConnected = false;

try {
  // Use a short connect timeout so local dev without Redis doesn't hang forever
  redisClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    retryStrategy: (times) => {
      // Don't retry indefinitely to allow graceful fallback
      if (times > 2) {
        return null; // Stop retrying
      }
      return Math.min(times * 50, 2000);
    }
  });

  redisClient.on('connect', () => {
    isRedisConnected = true;
    logger.info('📦 Redis connected successfully');
  });

  redisClient.on('error', (err) => {
    isRedisConnected = false;
    // Suppress noisy ECONNREFUSED logs if Redis is intentionally offline
    if (err.code !== 'ECONNREFUSED') {
      logger.error('Redis error:', err);
    }
  });

} catch (error) {
  logger.warn('Redis initialization skipped or failed:', error.message);
}

const getCache = async (key) => {
  if (!isRedisConnected || !redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Redis GET error:', error);
    return null;
  }
};

const setCache = async (key, value, ttlSeconds = 300) => {
  if (!isRedisConnected || !redisClient) return false;
  try {
    await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.error('Redis SET error:', error);
    return false;
  }
};

const deleteCache = async (key) => {
  if (!isRedisConnected || !redisClient) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error('Redis DEL error:', error);
    return false;
  }
};

const deleteCachePattern = async (pattern) => {
  if (!isRedisConnected || !redisClient) return false;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    logger.error('Redis DEL pattern error:', error);
    return false;
  }
};

module.exports = {
  redisClient,
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  isRedisConnected: () => isRedisConnected
};
