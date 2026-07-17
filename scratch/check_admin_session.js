import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables from .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      process.env[key] = val;
    }
  });
}

// Now import the admin client
const { supabaseAdmin } = await import('../api/_lib/supabase-admin.js');

async function checkDb() {
  try {
    console.log('Querying website_store_admin...');
    const { data: admins, error: adminErr } = await supabaseAdmin
      .from('website_store_admin')
      .select('id, username');
    if (adminErr) {
      console.error('Error fetching admins:', adminErr.message);
    } else {
      console.log('Admins list:', admins);
    }

    console.log('Querying active admin_sessions...');
    const { data: sessions, error: sessionErr } = await supabaseAdmin
      .from('admin_sessions')
      .select('id, admin_id, expires_at, created_at, ip_address, user_agent, session_token_hash');
    if (sessionErr) {
      console.error('Error fetching sessions:', sessionErr.message);
    } else {
      console.log('Active Sessions count:', sessions.length);
      console.log('Active Sessions detailed:', sessions.map(s => ({
        id: s.id,
        admin_id: s.admin_id,
        created_at: s.created_at,
        expires_at: s.expires_at,
        ip_address: s.ip_address,
        user_agent: s.user_agent,
        token_hash_preview: s.session_token_hash ? s.session_token_hash.substring(0, 10) + '...' : null
      })));
    }
  } catch (err) {
    console.error('Exception checkDb:', err);
  }
}

checkDb();
