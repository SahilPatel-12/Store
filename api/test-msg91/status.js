import { supabaseAdmin } from '../_lib/supabase-admin.js';
import { verifyAdmin } from '../_lib/admin/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const adminSession = await verifyAdmin(req);
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
    const templateIdPresent = !!val.encrypted_template_id; // Stored templateId is the Flow ID
    
    return res.status(200).json({
      configured: authKeyPresent && templateIdPresent,
      detectedProduct: 'flow-api',
      authKeyPresent,
      smsFlowIdPresent: templateIdPresent,
      otpTemplateIdPresent: false,
      widgetIdPresent: false,
      whatsappTemplatePresent: false,
      whatsappIntegratedNumberPresent: false,
      verificationMode: 'local-server-hash'
    });

  } catch (err) {
    console.error('[test-msg91-status] Failed:', err);
    return res.status(500).json({ error: 'Internal server error checking configuration.' });
  }
}
