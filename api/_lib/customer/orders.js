import { supabaseAdmin } from '../supabase-admin.js';

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
      let data;
      const { data: rawOrders, error } = await supabaseAdmin
        .from('website_store_orders')
        .select('*, order_corrections(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[Customer Orders API] Relationship embedding fallback triggered:', error.message);

        const { data: simpleOrders, error: simpleErr } = await supabaseAdmin
          .from('website_store_orders')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (simpleErr) throw simpleErr;

        try {
          const { data: corrections } = await supabaseAdmin
            .from('order_corrections')
            .select('*');

          if (corrections && corrections.length > 0) {
            const corrMap = new Map();
            corrections.forEach(c => corrMap.set(c.order_id, c));
            simpleOrders.forEach(o => {
              if (corrMap.has(o.id)) {
                o.order_corrections = corrMap.get(o.id);
              }
            });
          }
        } catch (corrErr) {
          console.warn('[Customer Orders API] order_corrections table fallback:', corrErr.message);
        }

        data = simpleOrders;
      } else {
        data = rawOrders;
      }

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
