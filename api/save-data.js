import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
  try {
    const rawData = await redis.get('staff_tracker_master_v2');
    let currentState = rawData ? JSON.parse(rawData) : { availabilities: {}, ideas: [], people: [] };

    if (req.method === 'POST') {
      const { data } = req.body;
      // Salviamo l'intero oggetto master che contiene tutto
      await redis.set('staff_tracker_master_v2', JSON.stringify(data));
      return res.status(200).json({ success: true });
    } else {
      return res.status(200).json(currentState);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}