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
  try {
    console.log('Fetching msg91_settings using Service Role Key...');
    const { data: msg91, error: err1 } = await supabase
      .from('website_settings')
      .select('*')
      .eq('key', 'msg91_settings')
      .maybeSingle();

    if (err1) console.error('Error fetching msg91:', err1);
    else console.log('msg91_settings:', msg91);

    console.log('Fetching whatsapp_settings using Service Role Key...');
    const { data: whatsapp, error: err2 } = await supabase
      .from('website_settings')
      .select('*')
      .eq('key', 'whatsapp_settings')
      .maybeSingle();

    if (err2) console.error('Error fetching whatsapp:', err2);
    else console.log('whatsapp_settings:', whatsapp);

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
