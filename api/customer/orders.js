import { supabaseAdmin } from '../_lib/supabase-admin.js';

async function getUserIdFromSession(token) {
  if (!token) return null;
  const { data } = await supabaseAdmin
    .from('user_sessions')
    .select('user_id')
    .eq('session_token', token)
    .gt('expires_at', new Date().toISOString())
    .single();
  return data ? data.user_id : null;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const sessionToken = req.query.sessionToken || req.headers['x-session-token'];
    if (!sessionToken) {
      return res.status(400).json({ error: 'Session token is required.' });
    }

    const userId = await getUserIdFromSession(sessionToken);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized devotee session.' });
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('website_store_orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(data);
    } catch (err) {
      console.error('[Orders API] Fetch failed:', err);
      return res.status(500).json({ error: 'Could not fetch orders.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
