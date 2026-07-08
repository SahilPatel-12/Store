import { supabaseAdmin } from '../supabase-admin.js';
import { encryptTextServer } from '../crypto-server.js';

// Verify if the admin token is valid and not expired
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
  const adminToken = req.headers['x-admin-token'] || req.query.adminToken;
  if (!adminToken) {
    return res.status(401).json({ error: 'Unauthorized: Missing admin token.' });
  }

  try {
    const adminSession = await verifyAdmin(adminToken);
    if (!adminSession) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired admin session.' });
    }

    if (req.method === 'GET') {
      const mode = req.query.mode || 'test';
      if (mode !== 'test' && mode !== 'live') {
        return res.status(400).json({ error: 'Invalid mode parameter. Must be "test" or "live".' });
      }

      const { data: config } = await supabaseAdmin
        .from('razorpay_configuration')
        .select('*')
        .eq('mode', mode)
        .maybeSingle();

      const { data: activationData } = await supabaseAdmin
        .from('website_settings')
        .select('value')
        .eq('key', 'payment_activation_settings')
        .maybeSingle();

      const activation = activationData?.value || {
        activePaymentProvider: 'manual_upi',
        razorpayMode: mode,
        legacyManualUpiEnabled: true
      };

      if (!config) {
        return res.status(200).json({
          mode,
          keyId: '',
          hasKeySecret: false,
          hasWebhookSecret: false,
          connectionStatus: 'Not Tested',
          lastVerifiedAt: null,
          isConfigured: false,
          activePaymentProvider: activation.activePaymentProvider,
          legacyManualUpiEnabled: activation.legacyManualUpiEnabled
        });
      }

      return res.status(200).json({
        mode: config.mode,
        keyId: config.key_id,
        hasKeySecret: !!config.encrypted_key_secret,
        hasWebhookSecret: !!config.encrypted_webhook_secret,
        connectionStatus: config.connection_status,
        lastVerifiedAt: config.last_verified_at,
        isConfigured: config.is_configured,
        activePaymentProvider: activation.activePaymentProvider,
        legacyManualUpiEnabled: activation.legacyManualUpiEnabled
      });

    } else if (req.method === 'POST') {
      const { mode, keyId, keySecret, webhookSecret, activePaymentProvider, legacyManualUpiEnabled } = req.body || {};
      
      if (!mode || (mode !== 'test' && mode !== 'live')) {
        return res.status(400).json({ error: 'Invalid mode. Must be "test" or "live".' });
      }
      if (!keyId) {
        return res.status(400).json({ error: 'Key ID is required.' });
      }

      // Fetch existing config for preservation
      const { data: existing } = await supabaseAdmin
        .from('razorpay_configuration')
        .select('*')
        .eq('mode', mode)
        .maybeSingle();

      let finalKeySecretEnc = existing?.encrypted_key_secret || '';
      let finalKeySecretIv = existing?.key_secret_iv || '';
      let finalKeySecretTag = existing?.key_secret_auth_tag || '';

      let finalWebhookSecretEnc = existing?.encrypted_webhook_secret || '';
      let finalWebhookSecretIv = existing?.webhook_secret_iv || '';
      let finalWebhookSecretTag = existing?.webhook_secret_auth_tag || '';

      // Encrypt new Key Secret if provided
      if (keySecret) {
        const encrypted = encryptTextServer(keySecret);
        finalKeySecretEnc = encrypted.ciphertext;
        finalKeySecretIv = encrypted.iv;
        finalKeySecretTag = encrypted.authTag;
      } else if (!existing) {
        return res.status(400).json({ error: 'Key Secret is required for initial configuration.' });
      }

      // Encrypt new Webhook Secret if provided
      if (webhookSecret) {
        const encrypted = encryptTextServer(webhookSecret);
        finalWebhookSecretEnc = encrypted.ciphertext;
        finalWebhookSecretIv = encrypted.iv;
        finalWebhookSecretTag = encrypted.authTag;
      } else if (!existing) {
        return res.status(400).json({ error: 'Webhook Secret is required for initial configuration.' });
      }

      const upsertData = {
        mode,
        key_id: keyId,
        encrypted_key_secret: finalKeySecretEnc,
        key_secret_iv: finalKeySecretIv,
        key_secret_auth_tag: finalKeySecretTag,
        encrypted_webhook_secret: finalWebhookSecretEnc,
        webhook_secret_iv: finalWebhookSecretIv,
        webhook_secret_auth_tag: finalWebhookSecretTag,
        is_configured: true,
        updated_at: new Date().toISOString(),
        updated_by_admin_id: adminSession.admin_id
      };

      if (existing) {
        upsertData.id = existing.id;
        // Reset status if Key ID changes
        if (existing.key_id !== keyId || keySecret || webhookSecret) {
          upsertData.connection_status = 'Not Tested';
          upsertData.last_verified_at = null;
        } else {
          upsertData.connection_status = existing.connection_status;
          upsertData.last_verified_at = existing.last_verified_at;
        }
      } else {
        upsertData.connection_status = 'Not Tested';
        upsertData.last_verified_at = null;
      }

      const { data: saved, error: saveErr } = await supabaseAdmin
        .from('razorpay_configuration')
        .upsert(upsertData)
        .select()
        .single();

      if (saveErr) throw saveErr;

      const { data: currentSettings } = await supabaseAdmin
        .from('website_settings')
        .select('value')
        .eq('key', 'payment_activation_settings')
        .maybeSingle();
      
      const prevVal = currentSettings?.value || {};
      
      const newSettings = {
        activePaymentProvider: activePaymentProvider !== undefined ? activePaymentProvider : (prevVal.activePaymentProvider || 'manual_upi'),
        razorpayMode: mode,
        legacyManualUpiEnabled: legacyManualUpiEnabled !== undefined ? !!legacyManualUpiEnabled : (prevVal.legacyManualUpiEnabled !== undefined ? prevVal.legacyManualUpiEnabled : true)
      };

      const { error: settingsErr } = await supabaseAdmin
        .from('website_settings')
        .upsert({
          key: 'payment_activation_settings',
          value: newSettings
        });
        
      if (settingsErr) throw settingsErr;

      return res.status(200).json({
        success: true,
        config: {
          mode: saved.mode,
          keyId: saved.key_id,
          hasKeySecret: !!saved.encrypted_key_secret,
          hasWebhookSecret: !!saved.encrypted_webhook_secret,
          connectionStatus: saved.connection_status,
          lastVerifiedAt: saved.last_verified_at,
          isConfigured: saved.is_configured,
          activePaymentProvider: newSettings.activePaymentProvider,
          legacyManualUpiEnabled: newSettings.legacyManualUpiEnabled
        }
      });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

  } catch (err) {
    console.error('[Admin Razorpay Config] Operation failed:', err);
    return res.status(500).json({ error: 'Internal server error processing configuration.' });
  }
}
