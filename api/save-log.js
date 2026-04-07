import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);
const LOG_KEY = 'staff_tracker_logs_v1';
const MAX_LOGS = 500;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { user, action, timestamp } = req.body;
    if (!user || !action) return res.status(400).json({ error: 'Missing fields' });
    const entry = JSON.stringify({ user, action, timestamp: timestamp || new Date().toISOString() });
    await redis.lpush(LOG_KEY, entry);
    await redis.ltrim(LOG_KEY, 0, MAX_LOGS - 1);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
