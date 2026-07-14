import { verifyAdmin } from './auth.js';
import { supabaseAdmin } from '../supabase-admin.js';
import { encryptTextWithCustomKey } from '../crypto-server.js';



export default async function handler(req, res) {
  try {
    const adminSession = await verifyAdmin(req);
    if (!adminSession) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired admin session.' });
    }

    const rawKey = process.env.ENCRYPTION_STRING_KEY_ESG_91 || 'gk4ukWKg78THpQ170x0XY0aPl9';

    if (req.method === 'GET') {
      const { data: configData } = await supabaseAdmin
        .from('website_settings')
        .select('value')
        .eq('key', 'msg91_settings')
        .maybeSingle();

      if (!configData?.value) {
        return res.status(200).json({
          isConfigured: false
        });
      }

      const val = configData.value;
      const isConfigured = !!(val.encrypted_auth_key && val.encrypted_template_id);

      return res.status(200).json({
        isConfigured,
        senderId: val.sender_id || ''
      });

    } else if (req.method === 'POST') {
      const { authKey, templateId, senderId } = req.body || {};

      // If one of them is missing but they exist in the DB, preserve the old ones.
      const { data: existing } = await supabaseAdmin
        .from('website_settings')
        .select('value')
        .eq('key', 'msg91_settings')
        .maybeSingle();

      const existingVal = existing?.value || {};
      let finalEncryptedAuthKey = existingVal.encrypted_auth_key || '';
      let authKeyIv = existingVal.auth_key_iv || '';
      let authKeyTag = existingVal.auth_key_tag || '';

      let finalEncryptedTemplateId = existingVal.encrypted_template_id || '';
      let templateIdIv = existingVal.template_id_iv || '';
      let templateIdTag = existingVal.template_id_tag || '';

      if (authKey) {
        const encrypted = encryptTextWithCustomKey(authKey, rawKey);
        finalEncryptedAuthKey = encrypted.ciphertext;
        authKeyIv = encrypted.iv;
        authKeyTag = encrypted.authTag;
      }

      if (templateId) {
        const encrypted = encryptTextWithCustomKey(templateId, rawKey);
        finalEncryptedTemplateId = encrypted.ciphertext;
        templateIdIv = encrypted.iv;
        templateIdTag = encrypted.authTag;
      }

      if (!finalEncryptedAuthKey || !finalEncryptedTemplateId) {
        return res.status(400).json({ error: 'Auth Key and Template ID are required for MSG91 configuration.' });
      }

      const { error } = await supabaseAdmin
        .from('website_settings')
        .upsert({
          key: 'msg91_settings',
          value: {
            encrypted_auth_key: finalEncryptedAuthKey,
            auth_key_iv: authKeyIv,
            auth_key_tag: authKeyTag,
            encrypted_template_id: finalEncryptedTemplateId,
            template_id_iv: templateIdIv,
            template_id_tag: templateIdTag,
            sender_id: senderId || existingVal.sender_id || '',
            updated_at: new Date().toISOString()
          }
        });

      if (error) throw error;

      return res.status(200).json({
        success: true,
        isConfigured: true
      });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

  } catch (err) {
    console.error('[Admin MSG91 Config] Operation failed:', err);
    return res.status(500).json({ error: 'Internal server error processing configuration.' });
  }
}
