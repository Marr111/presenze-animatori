import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn('REDIS_URL non definita in .env. Redis non sarà disponibile.');
}

const redis = redisUrl ? new Redis(redisUrl) : null;

export const DATA_KEY = 'staff_tracker_data_v1';

export const saveToRedis = async (data) => {
  if (!redis) return;
  await redis.set(DATA_KEY, JSON.stringify(data));
};

export const loadFromRedis = async () => {
  if (!redis) return null;
  const data = await redis.get(DATA_KEY);
  return data ? JSON.parse(data) : null;
};

export default redis;
