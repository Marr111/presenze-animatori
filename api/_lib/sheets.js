const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

export const loadFromSheets = async () => {
  if (!APPS_SCRIPT_URL) {
    throw new Error('Manca la variabile d\'ambiente APPS_SCRIPT_URL');
  }

  const response = await fetch(`${APPS_SCRIPT_URL}?action=load`, { redirect: 'follow' });
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Risposta non-JSON da Apps Script (load):', text.substring(0, 300));
    throw new Error('Apps Script ha restituito HTML invece di JSON. Controlla i permessi del deployment.');
  }
};

export const saveToSheets = async (data) => {
  if (!APPS_SCRIPT_URL) {
    throw new Error('Manca la variabile d\'ambiente APPS_SCRIPT_URL');
  }

  // Codifica i dati come parametro URL (GET) per evitare il blocco CORS/auth di Google sulle POST
  const encoded = encodeURIComponent(JSON.stringify(data));
  const url = `${APPS_SCRIPT_URL}?action=save&payload=${encoded}`;
  
  const response = await fetch(url, { redirect: 'follow' });
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Risposta non-JSON da Apps Script (save):', text.substring(0, 300));
    throw new Error('Apps Script ha restituito HTML invece di JSON. Controlla i permessi del deployment.');
  }
};
