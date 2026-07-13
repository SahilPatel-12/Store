import { supabaseAdmin } from '../supabase-admin.js';

async function verifyAdmin(token) {
  if (!token) return false;
  const { data } = await supabaseAdmin
    .from('admin_sessions')
    .select('id')
    .eq('session_token', token)
    .gt('expires_at', new Date().toISOString())
    .single();
  return !!data;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const adminToken = req.query.adminToken || req.headers['x-admin-token'];
  if (!adminToken) {
    return res.status(400).json({ error: 'Admin token is required.' });
  }

  try {
    const isAdmin = await verifyAdmin(adminToken);
    if (!isAdmin) {
      return res.status(401).json({ error: 'Unauthorized: Admin session required.' });
    }

    const { data, error } = await supabaseAdmin
      .from('website_store_orders')
      .select('*')
      .neq('status', 'Payment Pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.status(200).json(data);
  } catch (err) {
    console.error('[Admin Orders List] Fetch failed:', err);
    return res.status(500).json({ error: 'Could not fetch orders list.' });
  }
}
