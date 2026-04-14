const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

export const loadFromSheets = async () => {
  if (!APPS_SCRIPT_URL) {
    console.error('ERRORE: APPS_SCRIPT_URL non definita nel file .env o su Vercel');
    throw new Error('Manca la variabile d\'ambiente APPS_SCRIPT_URL');
  }

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'GET',
      redirect: 'follow' // Fondamentale per Google Apps Script
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Errore risposta Apps Script:', text);
      throw new Error(`Errore Apps Script: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (err) {
    console.error('Errore durante la fetch (load):', err);
    throw err;
  }
};

export const saveToSheets = async (data) => {
  if (!APPS_SCRIPT_URL) {
    throw new Error('Manca la variabile d\'ambiente APPS_SCRIPT_URL');
  }

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      redirect: 'follow'
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Errore risposta Apps Script (save):', text);
      throw new Error(`Errore durante il salvataggio: ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    console.error('Errore durante la fetch (save):', err);
    throw err;
  }
};
