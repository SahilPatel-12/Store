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
      const { data, error } = await supabaseAdmin
        .from('website_store_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(data);
    } catch (err) {
      console.error('[Addresses API] Fetch failed:', err);
      return res.status(500).json({ error: 'Could not fetch addresses.' });
    }
  } else if (req.method === 'POST') {
    const { type, name, phone, street, city, state, zip, is_default, sessionToken, id } = req.body;

    if (!sessionToken) {
      return res.status(400).json({ error: 'Session token is required.' });
    }

    const userId = await getUserIdFromSession(sessionToken);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized devotee session.' });
    }

    if (!type || !name || !phone || !street || !city || !state || !zip) {
      return res.status(400).json({ error: 'Missing required address parameters.' });
    }

    try {
      if (is_default) {
        // Reset defaults for user
        await supabaseAdmin
          .from('website_store_addresses')
          .update({ is_default: false })
          .eq('user_id', userId);
      }

      if (id) {
        // Edit existing address
        // Verify ownership
        const { data: existing } = await supabaseAdmin
          .from('website_store_addresses')
          .select('user_id')
          .eq('id', id)
          .single();

        if (!existing || existing.user_id !== userId) {
          return res.status(403).json({ error: 'Forbidden: Unauthorized address ownership.' });
        }

        const { data, error } = await supabaseAdmin
          .from('website_store_addresses')
          .update({
            type,
            name,
            phone,
            street,
            city,
            state,
            zip,
            is_default: !!is_default
          })
          .eq('id', id)
          .select('*')
          .single();

        if (error) throw error;
        return res.status(200).json(data);
      } else {
        // Create new address
        const { data, error } = await supabaseAdmin
          .from('website_store_addresses')
          .insert({
            user_id: userId,
            type,
            name,
            phone,
            street,
            city,
            state,
            zip,
            is_default: !!is_default
          })
          .select('*')
          .single();

        if (error) throw error;
        return res.status(200).json(data);
      }
    } catch (err) {
      console.error('[Addresses API] Save failed:', err);
      return res.status(500).json({ error: 'Could not save address.' });
    }
  } else if (req.method === 'DELETE') {
    const { addressId, sessionToken } = req.body;

    if (!addressId || !sessionToken) {
      return res.status(400).json({ error: 'Address ID and Session token are required.' });
    }

    const userId = await getUserIdFromSession(sessionToken);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized devotee session.' });
    }

    try {
      // Verify ownership
      const { data: existing } = await supabaseAdmin
        .from('website_store_addresses')
        .select('user_id')
        .eq('id', addressId)
        .single();

      if (!existing || existing.user_id !== userId) {
        return res.status(403).json({ error: 'Forbidden: Unauthorized address ownership.' });
      }

      const { error } = await supabaseAdmin
        .from('website_store_addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('[Addresses API] Delete failed:', err);
      return res.status(500).json({ error: 'Could not delete address.' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
