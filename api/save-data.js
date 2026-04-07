import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
  try {
    const rawData = await redis.get('staff_tracker_master_v2');
    let currentState = rawData ? JSON.parse(rawData) : { availabilities: {}, ideas: [], people: [], schedule: [], dishAssignments: {} };

    if (req.method === 'POST') {
      const { data, actionObj } = req.body;

      if (actionObj) {
        const { type, payload } = actionObj;
        
        if (type === 'UPDATE_USER_AVAIL') {
          if (!currentState.availabilities) currentState.availabilities = {};
          currentState.availabilities[payload.user] = payload.avail;
        } 
        else if (type === 'ADD_IDEA') {
          if (!currentState.ideas) currentState.ideas = [];
          currentState.ideas.push(payload.idea);
        }
        else if (type === 'DELETE_IDEA') {
          if (!currentState.ideas) currentState.ideas = [];
          currentState.ideas = currentState.ideas.filter(i => i.id !== payload.id);
        }
        else if (type === 'UPDATE_IDEA') {
          if (!currentState.ideas) currentState.ideas = [];
          currentState.ideas = currentState.ideas.map(i => i.id === payload.idea.id ? payload.idea : i);
        }

        await redis.set('staff_tracker_master_v2', JSON.stringify(currentState));
        return res.status(200).json({ success: true, data: currentState });
      }

      // Se non ci sono azioni parziali (usato dall'Admin per sovrascrivere tutto in modo forzato)
      if (data) {
        await redis.set('staff_tracker_master_v2', JSON.stringify(data));
      }

      return res.status(200).json({ success: true, data: data });
    } else {
      return res.status(200).json(currentState);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}