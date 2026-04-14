import { loadFromSheets } from './_lib/sheets.js';
import { loadFromRedis, saveToRedis } from './_lib/redis.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    // Prova prima da Redis
    let currentState = await loadFromRedis();
    
    if (!currentState) {
      // Fallback a Google Sheets
      currentState = await loadFromSheets();
      // Salva in Redis per le prossime chiamate
      if (currentState) await saveToRedis(currentState);
    }
    
    return res.status(200).json(currentState);
  } catch (error) {
    console.error('API Error (get-data):', error);
    if (error.message.includes('Mancano le credenziali')) {
      return res.status(200).json({ availabilities: {}, ideas: [], people: [] });
    }
    return res.status(500).json({ error: error.message });
  }
}