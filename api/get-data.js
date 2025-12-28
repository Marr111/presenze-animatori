import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    const availabilities = await kv.get('availabilities_shared') || {};
    const ideas = await kv.get('triduo_ideas') || [];
    return res.status(200).json({ availabilities, ideas });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}