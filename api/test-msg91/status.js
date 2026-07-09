import { supabaseAdmin } from '../_lib/supabase-admin.js';

async function verifyAdmin(token) {
  if (!token) return null;
  const { data } = await supabaseAdmin
    .from('admin_sessions')
    .select('id, admin_id')
    .eq('session_token', token)
    .gt('expires_at', new Date().toISOString())
    .single();
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const adminToken = req.headers['x-admin-token'];
  if (!adminToken) {
    return res.status(401).json({ error: 'Unauthorized: Missing admin token.' });
  }

  try {
    const adminSession = await verifyAdmin(adminToken);
    if (!adminSession) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired admin session.' });
    }

    // Fetch MSG91 Settings
    const { data: msg91Data } = await supabaseAdmin
      .from('website_settings')
      .select('value')
      .eq('key', 'msg91_settings')
      .maybeSingle();

    if (!msg91Data?.value) {
      return res.status(200).json({
        configured: false,
        authKeyPresent: false,
        templateIdPresent: false,
        flowIdPresent: false,
        widgetIdPresent: false,
        widgetTokenPresent: false,
        whatsappConfigPresent: false,
        detectedArchitecture: 'unknown'
      });
    }

    const val = msg91Data.value;
    const authKeyPresent = !!val.encrypted_auth_key;
    const templateIdPresent = !!val.encrypted_template_id;
    const flowIdPresent = templateIdPresent; // Generic flow_id maps to templateId in our schema
    
    return res.status(200).json({
      configured: authKeyPresent && templateIdPresent,
      authKeyPresent,
      templateIdPresent,
      flowIdPresent,
      widgetIdPresent: false,
      widgetTokenPresent: false,
      whatsappConfigPresent: false,
      detectedArchitecture: 'flow'
    });

  } catch (err) {
    console.error('[test-msg91-status] Failed:', err);
    return res.status(500).json({ error: 'Internal server error checking configuration.' });
  }
}
