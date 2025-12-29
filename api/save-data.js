import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
  try {
    // Carichiamo lo stato attuale dal database
    const rawData = await redis.get('staff_tracker_master');
    let currentState = rawData ? JSON.parse(rawData) : { availabilities: {}, ideas: [] };

    if (req.method === 'POST') {
      const { key, data } = req.body;

      // Aggiorniamo solo la parte che è cambiata (availabilities o ideas)
      if (key === 'availabilities_shared') {
        currentState.availabilities = data;
      } else if (key === 'triduo_ideas') {
        currentState.ideas = data;
      }

      await redis.set('staff_tracker_master', JSON.stringify(currentState));
      return res.status(200).json({ success: true });
    } else {
      // GET: Restituiamo l'intero oggetto
      return res.status(200).json(currentState);
    }
  } catch (error) {
    console.error("Errore:", error);
    return res.status(500).json({ error: error.message });
  }
}