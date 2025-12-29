import { Redis } from '@upstash/redis'

// Configurazione manuale usando la variabile REDIS_URL dello screenshot
const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_URL, // In molte configurazioni Vercel/Upstash, l'URL include già il token o viene usato lo stesso valore
})

export default async function handler(req, res) {
  try {
    // Recupera i dati (usa la stessa chiave che userai in save-data)
    const data = await redis.get('staff_presence');
    return res.status(200).json(data || []);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}