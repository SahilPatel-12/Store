import Razorpay from 'razorpay';
import { supabaseAdmin } from './supabase-admin.js';
import { decryptTextServer } from './crypto-server.js';

/**
 * Retrieves the stored configuration, decrypts the Key Secret, and returns an initialized Razorpay client instance.
 * @param {'test' | 'live'} mode The payment mode ('test' or 'live')
 * @returns {Promise<Razorpay>} Initialized Razorpay client instance
 */
export async function getRazorpayClient(mode) {
  if (process.env.TESTING === 'true') {
    return {
      orders: {
        async create(args) {
          if (global.mockRzpOrdersCreate) {
            return global.mockRzpOrdersCreate(args);
          }
          return { id: 'order_rzp_mocked', amount: args.amount, currency: args.currency };
        },
        async fetch(id) {
          if (global.mockRzpOrdersFetch) {
            return global.mockRzpOrdersFetch(id);
          }
          return { id, amount: 10800, status: 'created' };
        }
      },
      payments: {
        async fetch(id) {
          if (global.mockRzpPaymentsFetch) {
            return global.mockRzpPaymentsFetch(id);
          }
          return { id, amount: 10800, currency: 'INR', status: 'captured' };
        }
      }
    };
  }

  if (!mode || (mode !== 'test' && mode !== 'live')) {
    throw new Error('Invalid Razorpay mode. Must be "test" or "live".');
  }

  const { data: config, error } = await supabaseAdmin
    .from('razorpay_configuration')
    .select('*')
    .eq('mode', mode)
    .single();

  if (error || !config) {
    throw new Error(`Razorpay configuration is not initialized in the database for mode: ${mode}`);
  }

  let decryptedSecret;
  try {
    decryptedSecret = decryptTextServer(
      config.encrypted_key_secret,
      config.key_secret_iv,
      config.key_secret_auth_tag
    );
  } catch (err) {
    throw new Error(`Decryption of Razorpay Key Secret failed: ${err.message}`);
  }

  return new Razorpay({
    key_id: config.key_id,
    key_secret: decryptedSecret
  });
}

/**
 * Retrieves only the decrypted webhook secret for signature verification.
 * @param {'test' | 'live'} mode The payment mode ('test' or 'live')
 * @returns {Promise<string>} Plaintext webhook secret
 */
export async function getWebhookSecret(mode) {
  if (process.env.TESTING === 'true') {
    return 'whsec_test_secret_12345';
  }

  if (!mode || (mode !== 'test' && mode !== 'live')) {
    throw new Error('Invalid Razorpay mode. Must be "test" or "live".');
  }

  const { data: config, error } = await supabaseAdmin
    .from('razorpay_configuration')
    .select('encrypted_webhook_secret, webhook_secret_iv, webhook_secret_auth_tag')
    .eq('mode', mode)
    .single();

  if (error || !config) {
    throw new Error(`Razorpay configuration is not initialized for webhook verification in mode: ${mode}`);
  }

  try {
    return decryptTextServer(
      config.encrypted_webhook_secret,
      config.webhook_secret_iv,
      config.webhook_secret_auth_tag
    );
  } catch (err) {
    throw new Error(`Decryption of Webhook Secret failed: ${err.message}`);
  }
}
