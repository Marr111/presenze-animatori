import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  try {
    const { key, data } = req.body;
    
    // Salva i dati su Upstash
    await redis.set(key, JSON.stringify(data));
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Errore salvataggio Upstash:", error);
    return res.status(500).json({ error: error.message });
  }
}