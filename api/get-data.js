import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const rawData = await redis.get('staff_tracker_master_v2');
    const currentState = rawData ? JSON.parse(rawData) : { availabilities: {}, ideas: [], people: [] };
    return res.status(200).json(currentState);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}