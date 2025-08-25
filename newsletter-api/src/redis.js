const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// lazyConnect pour contrôler le moment où on se connecte
const redis = new Redis(REDIS_URL, { lazyConnect: true });

async function connectRedis() {
  try {
    await redis.connect();
    console.log('[redis] connected');
  } catch (err) {
    console.error('[redis] connect failed:', err.message);
  }
}

module.exports = { redis, connectRedis };
