import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export default async function handler(req, res) {
  try {
    // Recupera i dati usando il client Upstash
    const availabilities = await redis.get('availabilities_shared') || {};
    const ideas = await redis.get('triduo_ideas') || [];
    
    return res.status(200).json({ availabilities, ideas });
  } catch (error) {
    console.error("Errore Upstash:", error);
    return res.status(500).json({ error: error.message });
  }
}