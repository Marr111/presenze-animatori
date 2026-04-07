import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);
const LOG_KEY = 'staff_tracker_logs_v1';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const raw = await redis.lrange(LOG_KEY, 0, 499);
    const logs = raw.map(r => {
      try { return JSON.parse(r); } catch { return null; }
    }).filter(Boolean);
    return res.status(200).json(logs);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
