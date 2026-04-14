import { loadFromSheets, saveToSheets } from './_lib/sheets.js';
import { loadFromRedis, saveToRedis } from './_lib/redis.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Prova a caricare da Redis (più veloce), altrimenti Sheets
    let currentState = await loadFromRedis();
    if (!currentState) {
      currentState = await loadFromSheets();
    }

    const { data, actionObj } = req.body;

    if (actionObj) {
      const { type, payload } = actionObj;
      
      if (type === 'UPDATE_USER_AVAIL') {
        if (!currentState.availabilities) currentState.availabilities = {};
        currentState.availabilities[payload.user] = payload.avail;
        // Aggiunge il nuovo utente alla lista people se non è già presente
        if (!currentState.people) currentState.people = [];
        if (!currentState.people.includes(payload.user)) {
          currentState.people.push(payload.user);
        }
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

      // Salva in entrambi
      await Promise.all([
        saveToRedis(currentState),
        saveToSheets(currentState)
      ]);
      
      return res.status(200).json({ success: true, data: currentState });
    }

    if (data) {
      await Promise.all([
        saveToRedis(data),
        saveToSheets(data)
      ]);
      currentState = data;
    }

    return res.status(200).json({ success: true, data: currentState });

  } catch (error) {
    console.error('API Error (save-data):', error);
    return res.status(500).json({ error: error.message });
  }
}