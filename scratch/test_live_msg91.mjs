import { supabaseAdmin } from '../api/_lib/supabase-admin.js';
import { decryptTextWithCustomKey } from '../api/_lib/crypto-server.js';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://vjkwmefdutltwccpgnny.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqa3dtZWZkdXRsdHdjY3Bnbm55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk0MDE2OSwiZXhwIjoyMDk1NTE2MTY5fQ.9PIi4ccfQgaRD-AasEW40Z2nLsF3JD0SVCpGvJrXduc';
process.env.ENCRYPTION_STRING_KEY_ESG_91 = 'gk4ukWKg78THpQ170x0XY0aPl9';

async function run() {
  try {
    const { data: msg91Data } = await supabaseAdmin
      .from('website_settings')
      .select('value')
      .eq('key', 'msg91_settings')
      .single();

    if (!msg91Data) {
      console.log('No MSG91 settings found.');
      return;
    }

    const val = msg91Data.value;
    const rawKey = process.env.ENCRYPTION_STRING_KEY_ESG_91;
    const decryptedAuthKey = decryptTextWithCustomKey(val.encrypted_auth_key, val.auth_key_iv, val.auth_key_tag, rawKey);
    const decryptedTemplateId = decryptTextWithCustomKey(val.encrypted_template_id, val.template_id_iv, val.template_id_tag, rawKey);

    console.log('Decrypted MSG91 Auth Key:', decryptedAuthKey);
    console.log('Decrypted MSG91 Template ID:', decryptedTemplateId);
    console.log('Sender ID:', val.sender_id);
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
