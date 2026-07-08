import { supabaseAdmin } from '../supabase-admin.js';
import { getRazorpayClient } from '../razorpay-client.js';

// Verify if the admin token is valid and not expired
async function verifyAdmin(token) {
  if (!token) return null;
  const { data } = await supabaseAdmin
    .from('admin_sessions')
    .select('id')
    .eq('session_token', token)
    .gt('expires_at', new Date().toISOString())
    .single();
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const adminToken = req.headers['x-admin-token'] || req.body?.adminToken;
  if (!adminToken) {
    return res.status(401).json({ error: 'Unauthorized: Missing admin token.' });
  }

  const { mode } = req.body || {};
  if (!mode || (mode !== 'test' && mode !== 'live')) {
    return res.status(400).json({ error: 'Invalid mode. Must be "test" or "live".' });
  }

  try {
    const adminSession = await verifyAdmin(adminToken);
    if (!adminSession) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired admin session.' });
    }

    // 1. Initialize Razorpay server client (will fetch config and decrypt automatically)
    let razorpay;
    try {
      razorpay = await getRazorpayClient(mode);
    } catch (configErr) {
      return res.status(400).json({
        success: false,
        connectionStatus: 'Failed',
        safeErrorCode: 'CONFIG_ERROR',
        safeMessage: configErr.message
      });
    }

    // 2. Execute read-only, non-destructive list payments operation
    let success = false;
    let safeErrorCode = '';
    let safeMessage = '';
    let statusValue = 'Failed';

    try {
      // List payments with count: 1 is read-only and validates the signature
      await razorpay.payments.all({ count: 1 });
      success = true;
      statusValue = 'Connected';
      safeMessage = 'Connection test successful. Credentials are valid.';
    } catch (apiErr) {
      statusValue = 'Failed';
      
      // Parse safe error code and message
      const statusCode = apiErr.statusCode || 500;
      const errorMsg = apiErr.error?.description || apiErr.message || '';
      
      if (statusCode === 401 || errorMsg.toLowerCase().includes('invalid key') || errorMsg.toLowerCase().includes('auth')) {
        safeErrorCode = 'AUTHENTICATION_FAILED';
        safeMessage = 'Authentication failed: Invalid Razorpay Key ID or Key Secret.';
      } else {
        safeErrorCode = 'NETWORK_OR_API_ERROR';
        safeMessage = `Razorpay API Error: ${errorMsg || 'Connection timeout or invalid gateway response.'}`;
      }
    }

    // 3. Update connection status and last verification time in the database
    const nowStr = new Date().toISOString();
    const { error: updateErr } = await supabaseAdmin
      .from('razorpay_configuration')
      .update({
        connection_status: statusValue,
        last_verified_at: success ? nowStr : null,
        updated_at: nowStr
      })
      .eq('mode', mode);

    if (updateErr) {
      console.warn('[Admin Razorpay Test] Status update in DB failed:', updateErr.message);
    }

    return res.status(200).json({
      success,
      mode,
      connectionStatus: statusValue,
      safeErrorCode: safeErrorCode || null,
      safeMessage,
      verifiedAt: success ? nowStr : null
    });

  } catch (err) {
    console.error('[Admin Razorpay Test] Operation failed:', err);
    return res.status(500).json({ error: 'Internal server error executing connection test.' });
  }
}
