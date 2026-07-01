import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables from .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verify() {
  try {
    console.log('Querying website_store_pundits...');
    const { data, error } = await supabase
      .from('website_store_pundits')
      .select('id, full_name, profile_photo, city, experience_years');

    if (error) {
      console.error('Error fetching pundits:', error);
      process.exit(1);
    }

    console.log(`Found ${data.length} pundits:`);
    data.forEach((p, idx) => {
      console.log(`[${idx + 1}] ${p.full_name} (${p.city}, ${p.experience_years} yrs exp) - Photo: ${p.profile_photo}`);
    });
    
    // Check user accounts marked as is_pundit
    const { data: users, error: userError } = await supabase
      .from('website_store_users')
      .select('id, full_name, is_pundit, phone_number')
      .eq('is_pundit', true);

    if (userError) {
      console.error('Error fetching pundit users:', userError);
      process.exit(1);
    }
    
    console.log(`Found ${users.length} user accounts with is_pundit = true.`);
    process.exit(0);
  } catch (err) {
    console.error('Exception during verification:', err);
    process.exit(1);
  }
}

verify();
