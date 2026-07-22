import { supabaseAdmin } from '../_lib/supabase-admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { phone, userIds } = req.body;
  if (!phone && (!userIds || !Array.isArray(userIds))) {
    return res.status(400).json({ error: 'Missing phone or userIds parameters.' });
  }

  try {
    const targetUserIds = Array.isArray(userIds) ? userIds : [];
    
    // Clean and normalize phone number
    let digits = String(phone || '').replace(/[^0-9]/g, '');
    let phoneQuery = '';
    if (digits.length === 10) {
      phoneQuery = digits;
    } else if (digits.length > 10) {
      phoneQuery = digits.substring(digits.length - 10);
    }

    let query = supabaseAdmin.from('website_store_orders').select('*');

    if (phoneQuery) {
      if (targetUserIds.length > 0) {
        query = query.or(`user_id.in.(${targetUserIds.map(id => `"${id}"`).join(',')}),phone_number.ilike.%${phoneQuery}`);
      } else {
        query = query.ilike('phone_number', `%${phoneQuery}`);
      }
    } else {
      query = query.in('user_id', targetUserIds);
    }

    const { data: orders, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[Mobile Fetch Orders] Database error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(orders || []);
  } catch (err) {
    console.error('[Mobile Fetch Orders] Exception:', err);
    return res.status(500).json({ error: 'Internal server exception: ' + err.message });
  }
}
