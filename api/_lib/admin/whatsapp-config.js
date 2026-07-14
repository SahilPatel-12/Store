import { verifyAdmin } from './auth.js';
import { supabaseAdmin } from '../supabase-admin.js';
import { encryptTextServer, decryptTextServer } from '../crypto-server.js';



export default async function handler(req, res) {
  try {
    const adminSession = await verifyAdmin(req);
    if (!adminSession) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired admin session.' });
    }

    if (req.method === 'GET') {
      const { data: waData } = await supabaseAdmin
        .from('website_settings')
        .select('value')
        .eq('key', 'whatsapp_settings')
        .maybeSingle();

      if (!waData?.value) {
        return res.status(200).json({
          endpoint: '',
          isConfigured: false
        });
      }

      const val = waData.value;
      const isConfigured = !!(val.encrypted_token || val.token);

      return res.status(200).json({
        endpoint: val.endpoint || '',
        isConfigured
      });

    } else if (req.method === 'POST') {
      const { endpoint, token } = req.body || {};

      if (!endpoint) {
        return res.status(400).json({ error: 'Endpoint is required.' });
      }

      // Fetch existing config for preservation if token is not provided
      const { data: existing } = await supabaseAdmin
        .from('website_settings')
        .select('value')
        .eq('key', 'whatsapp_settings')
        .maybeSingle();

      const existingVal = existing?.value || {};
      let finalEncryptedToken = existingVal.encrypted_token || '';
      let finalIv = existingVal.iv || '';
      let finalAuthTag = existingVal.auth_tag || '';
      let finalLegacyToken = existingVal.token || ''; // fallback legacy

      if (token) {
        // Encrypt using AES-256-GCM server-side helper
        const encrypted = encryptTextServer(token);
        finalEncryptedToken = encrypted.ciphertext;
        finalIv = encrypted.iv;
        finalAuthTag = encrypted.authTag;
        finalLegacyToken = ''; // remove legacy token once updated
      } else if (!existingVal.encrypted_token && !existingVal.token) {
        return res.status(400).json({ error: 'Token is required for initial configuration.' });
      }

      const { error } = await supabaseAdmin
        .from('website_settings')
        .upsert({
          key: 'whatsapp_settings',
          value: {
            endpoint,
            encrypted_token: finalEncryptedToken,
            iv: finalIv,
            auth_tag: finalAuthTag,
            token: finalLegacyToken, // preserve legacy token only if not updating it
            version: 'v2'
          }
        });

      if (error) throw error;

      return res.status(200).json({
        success: true,
        config: {
          endpoint,
          isConfigured: true
        }
      });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

  } catch (err) {
    console.error('[Admin WhatsApp Config] Operation failed:', err);
    return res.status(500).json({ error: 'Internal server error processing configuration.' });
  }
}
