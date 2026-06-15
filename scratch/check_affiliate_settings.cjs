const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env variables from .env.local
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
const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    console.log('Fetching affiliate settings...');
    const { data: settings, error: sErr } = await supabase
      .from('affiliate_settings')
      .select('*');
    if (sErr) throw sErr;
    console.log('Settings:', settings);

    console.log('Fetching affiliate levels...');
    const { data: levels, error: lErr } = await supabase
      .from('affiliate_levels')
      .select('*');
    if (lErr) throw lErr;
    console.log('Levels:', levels);

    console.log('Fetching user details for devotee in test...');
    const { data: users, error: uErr } = await supabase
      .from('website_store_users')
      .select('id, full_name, referred_by, affiliate_code, affiliate_status')
      .eq('id', '3b4a182e-b94b-4efe-923c-6d5d4c66cf60');
    if (uErr) throw uErr;
    console.log('Devotee:', users);

    console.log('Fetching referrer user details...');
    const { data: referrer, error: rErr } = await supabase
      .from('website_store_users')
      .select('id, full_name, referred_by, affiliate_code, affiliate_status')
      .eq('id', '32110317-3072-4d8b-9bc2-125598750237');
    if (rErr) throw rErr;
    console.log('Referrer:', referrer);

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
