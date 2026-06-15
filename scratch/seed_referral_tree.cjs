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
    const rootId = '32110317-3072-4d8b-9bc2-125598750237'; // Sahil Patel

    console.log('Seeding sub-affiliates...');

    // 1. Insert Level 1 referral: Devotee Ramesh
    const rameshEmail = `ramesh_${Math.floor(Math.random()*10000)}@devotee.com`;
    const { data: ramesh, error: e1 } = await supabase
      .from('website_store_users')
      .insert({
        full_name: 'Devotee Ramesh',
        email: rameshEmail,
        phone_number: `797${Math.floor(1000000 + Math.random()*9000000)}`,
        password_hash: 'dummy_hash',
        referred_by: rootId,
        affiliate_status: 'active',
        affiliate_code: `MPRAM${Math.floor(100 + Math.random()*900)}`
      })
      .select('*')
      .single();

    if (e1) throw e1;
    console.log('Inserted Level 1:', ramesh.full_name, ramesh.id);

    // Insert to affiliate_relationships
    await supabase.from('affiliate_relationships').insert({
      referrer_id: rootId,
      referred_id: ramesh.id
    });

    // 2. Insert Level 1 referral: Devotee Sunita
    const sunitaEmail = `sunita_${Math.floor(Math.random()*10000)}@devotee.com`;
    const { data: sunita, error: e2 } = await supabase
      .from('website_store_users')
      .insert({
        full_name: 'Devotee Sunita',
        email: sunitaEmail,
        phone_number: `797${Math.floor(1000000 + Math.random()*9000000)}`,
        password_hash: 'dummy_hash',
        referred_by: rootId,
        affiliate_status: 'inactive'
      })
      .select('*')
      .single();

    if (e2) throw e2;
    console.log('Inserted Level 1:', sunita.full_name, sunita.id);

    await supabase.from('affiliate_relationships').insert({
      referrer_id: rootId,
      referred_id: sunita.id
    });

    // 3. Insert Level 2 referral: Devotee Amit (under Ramesh)
    const amitEmail = `amit_${Math.floor(Math.random()*10000)}@devotee.com`;
    const { data: amit, error: e3 } = await supabase
      .from('website_store_users')
      .insert({
        full_name: 'Devotee Amit',
        email: amitEmail,
        phone_number: `797${Math.floor(1000000 + Math.random()*9000000)}`,
        password_hash: 'dummy_hash',
        referred_by: ramesh.id,
        affiliate_status: 'inactive'
      })
      .select('*')
      .single();

    if (e3) throw e3;
    console.log('Inserted Level 2 (under Ramesh):', amit.full_name, amit.id);

    await supabase.from('affiliate_relationships').insert({
      referrer_id: ramesh.id,
      referred_id: amit.id
    });

    console.log('Referral tree successfully seeded!');

  } catch (err) {
    console.error('Seeding Error:', err.message);
  }
}

run();
