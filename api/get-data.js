import { Redis } from '@upstash/redis'

// Crea il client usando la tua variabile REDIS_URL
const redis = Redis.fromEnv({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_URL.split('@')[1].split(':')[0], // Estrae il token se necessario, ma di solito Redis.fromEnv lo fa da solo se le variabili sono standard
});

// Se vedi solo REDIS_URL, la soluzione più sicura è inizializzarlo così:
const kv = new Redis({
  url: process.env.REDIS_URL.startsWith('http') ? process.env.REDIS_URL : `https://${process.env.REDIS_URL}`,
  token: process.env.REDIS_TOKEN, // Se non hai REDIS_TOKEN, controlla bene la tab Environment Variables
})

export default async function handler(req, res) {
  try {
    const availabilities = await kv.get('availabilities_shared') || {};
    const ideas = await kv.get('triduo_ideas') || [];
    return res.status(200).json({ availabilities, ideas });
  } catch (error) {
    return res.status(500).json({ error: "Errore connessione Redis: " + error.message });
  }
}