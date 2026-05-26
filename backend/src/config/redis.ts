import Redis from 'ioredis';

let redisClient: Redis | null = null;

const SHARED_OPTIONS = {
  maxRetriesPerRequest: null,   // required by BullMQ
  enableOfflineQueue:   false,  // throw immediately when disconnected (fail-fast for HTTP requests)
  connectTimeout:       8000,
  retryStrategy: (times: number) => {
    if (times > 5) return null; // stop retrying after 5 attempts
    return Math.min(times * 500, 3000);
  },
};

export function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;

    redisClient = redisUrl
      ? new Redis(redisUrl, SHARED_OPTIONS)
      : new Redis({
          host:     process.env.REDIS_HOST || 'localhost',
          port:     parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD || undefined,
          ...SHARED_OPTIONS,
        });

    redisClient.on('connect', () => console.log('Redis connected'));
    redisClient.on('error',   (err) => console.error('Redis error:', err.message));
  }
  return redisClient;
}
