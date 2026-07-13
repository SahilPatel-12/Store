const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const action = process.argv[2];
  if (action !== 'disable-msg91' && action !== 'enable-msg91') {
    console.log('Usage:');
    console.log('  node scratch/toggle_gateways.cjs disable-msg91  -> fallback to BhashSMS WhatsApp');
    console.log('  node scratch/toggle_gateways.cjs enable-msg91   -> use MSG91 SMS gateway');
    return;
  }

  try {
    if (action === 'disable-msg91') {
      console.log('Disabling MSG91 settings to force fallback to WhatsApp (BhashSMS)...');
      // We can temporarily rename the key in website_settings so it doesn't match 'msg91_settings'
      const { data, error } = await supabase
        .from('website_settings')
        .update({ key: 'msg91_settings_disabled' })
        .eq('key', 'msg91_settings');

      if (error) throw error;
      console.log('Successfully disabled MSG91 settings. Fallback to WhatsApp (BhashSMS) is now active!');
    } else {
      console.log('Enabling MSG91 settings...');
      const { data, error } = await supabase
        .from('website_settings')
        .update({ key: 'msg91_settings' })
        .eq('key', 'msg91_settings_disabled');

      if (error) throw error;
      console.log('Successfully enabled MSG91 settings. MSG91 SMS gateway takes precedence again!');
    }
  } catch (err) {
    console.error('Operation failed:', err);
  }
}

run();
