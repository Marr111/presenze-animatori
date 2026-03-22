export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, body } = req.body;
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    // Il frontend gestirà questa risposta aprendo il link precompilato.
    return res.status(500).json({ error: 'TOKEN_MISSING' });
  }

  try {
    const response = await fetch('https://api.github.com/repos/Marr111/presenze-animatori/issues', {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        title: title, 
        body: body + '\n\n---\n*Inviato automaticamente dall\'app Presenze Animatori.*' 
      })
    });

    if (response.ok) {
      const data = await response.json();
      return res.status(200).json({ success: true, url: data.html_url });
    } else {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData.message || 'Errore creazione issue su GitHub' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
