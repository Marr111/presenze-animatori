import { loadFromRedis, saveToRedis } from './_lib/redis.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { secret, people } = req.body;

  // Verify shared secret
  if (!process.env.SYNC_SECRET || secret !== process.env.SYNC_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!Array.isArray(people)) {
    return res.status(400).json({ error: 'Invalid people array' });
  }

  try {
    // Get current state from Redis (or empty default)
    const currentState = (await loadFromRedis()) || { availabilities: {}, ideas: [], people: [] };

    // Find people that were removed and clean up their availabilities
    const oldPeople = currentState.people || [];
    const removedPeople = oldPeople.filter(p => !people.includes(p));
    removedPeople.forEach(name => {
      delete currentState.availabilities[name];
    });

    // Update the people list (sorted)
    currentState.people = [...people].sort();

    // Save back to Redis
    await saveToRedis(currentState);

    return res.status(200).json({ success: true, peopleCount: people.length });
  } catch (error) {
    console.error('API Error (sync-from-sheet):', error);
    return res.status(500).json({ error: error.message });
  }
}
