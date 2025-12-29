import { Redis } from '@upstash/redis'

const kv = Redis.fromEnv(); // Questo cercherà UPSTASH_REDIS_REST_URL e TOKEN

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  try {
    const { key, data } = req.body;
    await kv.set(key, data);
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}