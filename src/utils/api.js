export const loadData = async () => {
  const response = await fetch('/api/get-data');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

export const saveData = async (data, actionObj) => {
  const bodyPayload = actionObj ? { actionObj } : { data };
  const res = await fetch('/api/save-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyPayload),
  });
  if (!res.ok) throw new Error(`Errore server: ${res.status}`);
  return await res.json();
};

export const addLog = async (user, action) => {
  try {
    await fetch('/api/save-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, action, timestamp: new Date().toISOString() }),
    });
  } catch (e) {
    console.warn('Log write failed:', e);
  }
};

export const getLogs = async () => {
  try {
    const res = await fetch('/api/get-logs');
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
};

export const createIssue = async (title, body) => {
  const res = await fetch('/api/create-issue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body }),
  });
  return res.json();
};
