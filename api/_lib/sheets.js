const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

export const loadFromSheets = async () => {
  if (!APPS_SCRIPT_URL) {
    throw new Error('Manca la variabile d\'ambiente APPS_SCRIPT_URL');
  }

  const response = await fetch(APPS_SCRIPT_URL);
  if (!response.ok) {
    throw new Error(`Errore Apps Script: ${response.statusText}`);
  }
  
  return await response.json();
};

export const saveToSheets = async (data) => {
  if (!APPS_SCRIPT_URL) {
    throw new Error('Manca la variabile d\'ambiente APPS_SCRIPT_URL');
  }

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`Errore durante il salvataggio: ${response.statusText}`);
  }

  return await response.json();
};
