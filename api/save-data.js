import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  // Accetta solo richieste di tipo POST
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Metodo non consentito' });
  }
  
  try {
    const { key, data } = request.body;
    
    // Salva i dati nel database KV
    await kv.set(key, data);
    
    return response.status(200).json({ success: true });
  } catch (error) {
    console.error("Errore nel salvataggio dati:", error);
    return response.status(500).json({ error: error.message });
  }
}