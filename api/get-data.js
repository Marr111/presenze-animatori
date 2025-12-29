import Redis from 'ioredis';

// Inizializza Redis usando l'URL redis:// che hai trovato
const redis = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
  // Gestione CORS per evitare blocchi dal browser
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      // SALVATAGGIO: Trasformiamo l'oggetto in stringa per Redis
      const dataToSave = JSON.stringify(req.body);
      await redis.set('staff_tracker_data', dataToSave);
      return res.status(200).json({ success: true });
    } else {
      // LETTURA
      const data = await redis.get('staff_tracker_data');
      // Se non c'è nulla, restituiamo un array vuoto, altrimenti convertiamo da stringa a oggetto
      return res.status(200).json(data ? JSON.parse(data) : []);
    }
  } catch (error) {
    console.error("Errore Redis:", error);
    return res.status(500).json({ error: error.message });
  }
}