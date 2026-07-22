const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read env.local from the store project directory
const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function run() {
  try {
    const { data, error } = await supabase
      .from('website_settings')
      .select('*')
      .eq('key', 'whatsapp_settings')
      .single();

    if (error) {
      console.error('Error fetching settings:', error.message);
      return;
    }

    const val = data.value;
    console.log('Original Value:', JSON.stringify(val, null, 2));

    const oldEndpoint = val.endpoint;
    const newEndpoint = oldEndpoint.replace('text=1051239926572617', 'text=service_rejected_hindi');

    if (oldEndpoint === newEndpoint) {
      console.log('Template is already set to service_rejected_hindi or could not find old template ID.');
      return;
    }

    val.endpoint = newEndpoint;
    console.log('Updated Value:', JSON.stringify(val, null, 2));

    const { error: updateError } = await supabase
      .from('website_settings')
      .update({ value: val })
      .eq('key', 'whatsapp_settings');

    if (updateError) {
      console.error('Failed to update whatsapp_settings in DB:', updateError.message);
    } else {
      console.log('Successfully updated whatsapp_settings in database!');
    }
  } catch (err) {
    console.error('Script Error:', err);
  }
}

run();
