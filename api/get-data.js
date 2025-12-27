import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  try {
    // Recupera i dati dal database KV di Vercel
    const availabilities = await kv.get('availabilities_shared') || {};
    const ideas = await kv.get('triduo_ideas') || [];
    
    // Invia i dati al frontend (il tuo sito)
    return response.status(200).json({ availabilities, ideas });
  } catch (error) {
    console.error("Errore nel recupero dati:", error);
    return response.status(500).json({ error: error.message });
  }
}