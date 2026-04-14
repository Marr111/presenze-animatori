import { saveToRedis } from './_lib/redis.js';
import { saveToSheets } from './_lib/sheets.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;
    
    // Quando il foglio cambia, aggiorniamo Redis
    // Nota: Riceviamo i dati già formattati dall'Apps Script o mandiamo l'intero stato
    if (data) {
      await saveToRedis(data);
      // Opzionale: non risalviamo su sheets per evitare loop infiniti 
      // o lo facciamo con cautela. Solitamente Sheets -> Redis è sufficiente.
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
