let redisClient = null;
let isRedisConnected = false;

const connectRedis = async () => {
  try {
    const Redis = require('ioredis');
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      connectTimeout: 3000,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    redisClient.on('error', (err) => {
      // Catch connection resets and ECONNREFUSED silently after init
    });
    await redisClient.connect();
    isRedisConnected = true;
    console.log('✅ Redis Connected');
  } catch (err) {
    console.log('⚠️  Redis unavailable — caching disabled');
    isRedisConnected = false;
    redisClient = null;
  }
};

const getCache = async (key) => {
  if (!isRedisConnected || !redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
};

const setCache = async (key, value, ttlSeconds = 300) => {
  if (!isRedisConnected || !redisClient) return;
  try {
    await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
  } catch { /* silent */ }
};

const delCache = async (key) => {
  if (!isRedisConnected || !redisClient) return;
  try { await redisClient.del(key); } catch { /* silent */ }
};

module.exports = { connectRedis, getCache, setCache, delCache };
