const NodeCache = require('node-cache');
// Standard TTL is 60 seconds. Can be overridden.
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120, useClones: false });

/**
 * Get or set a cache value asynchronously.
 * @param {string} key - Cache key
 * @param {Function} fetcher - Async function returning the data if not in cache
 * @param {number} [ttl] - Optional TTL in seconds
 * @returns {Promise<any>}
 */
const getOrSetCache = async (key, fetcher, ttl) => {
  const cachedData = cache.get(key);
  if (cachedData !== undefined) {
    return cachedData;
  }

  const data = await fetcher();
  if (data !== undefined && data !== null) {
    if (ttl !== undefined) {
      cache.set(key, data, ttl);
    } else {
      cache.set(key, data);
    }
  }
  return data;
};

const invalidateCache = (pattern) => {
  const keys = cache.keys();
  const matchingKeys = keys.filter(k => k.includes(pattern));
  cache.del(matchingKeys);
};

module.exports = {
  cache,
  getOrSetCache,
  invalidateCache
};
