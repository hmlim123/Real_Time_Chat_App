const redis = require('redis');
require('dotenv').config();

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'  // Dockerized Redis
});

redisClient.on('connect', () => {
    console.log('✅ Connected to Redis inside Docker");
});

redisClient.on('error', (err) => {
    console.error('❌ Redis connection error:', err);
});

(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error('Redis connection failed:', err);
    }
})();

module.exports = redisClient;
