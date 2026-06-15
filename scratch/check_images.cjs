const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']);

async function run() {
  const { data: eight, error: err8 } = await supabase
    .from('website_pooja_products')
    .select('id, name, image, gallery_images')
    .eq('id', 'f7a85ab0-e05c-495b-a440-d87941d09df1')
    .single();

  const { data: eleven, error: err11 } = await supabase
    .from('website_pooja_products')
    .select('id, name, image, gallery_images')
    .eq('id', '41c77cb0-d03b-456d-b52d-db7c5e4964b8')
    .single();

  console.log('8 Mukhi Rudraksha:');
  console.log(JSON.stringify(eight, null, 2));
  console.log('---');
  console.log('11 Mukhi Rudraksha:');
  console.log(JSON.stringify(eleven, null, 2));
}
run();
