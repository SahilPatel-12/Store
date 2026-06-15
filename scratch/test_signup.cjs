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
  const testPhone = '999' + Math.floor(1000000 + Math.random() * 9000000); // Unique 10-digit test phone starting with 999
  const placeholderEmail = `devotee_${testPhone}@spiritual.com`;
  let userId = '';

  try {
    console.log(`[Test] 1. Simulating signup for phone number: ${testPhone}`);
    
    // Insert new user with empty name and placeholder email
    const { data: newUser, error: insertErr } = await supabase
      .from('website_store_users')
      .insert({
        full_name: '',
        email: placeholderEmail,
        phone_number: testPhone,
        password_hash: '',
        last_login_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (insertErr) {
      console.error('[FAIL] Registration insert failed:', insertErr.message);
      return;
    }

    userId = newUser.id;
    console.log('[PASS] Registration insert succeeded! User ID:', userId);

    console.log('[Test] 2. Simulating OTP authentication using authenticate_user_otp RPC with backdoor OTP...');
    const { data: authData, error: authErr } = await supabase.rpc('authenticate_user_otp', {
      p_phone: testPhone,
      p_otp_entered: '260529',
      p_otp_generated: '123456',
      p_device_id: 'test_node_runner',
      p_ip: '127.0.0.1',
      p_user_agent: 'NodeRunner'
    });

    if (authErr) {
      console.error('[FAIL] OTP Authentication failed:', authErr.message);
      return;
    }

    console.log('[PASS] OTP Authentication succeeded!', authData);

    console.log('[Test] 3. Simulating devotee updating their profile from profile page...');
    const updatedName = 'Sahil Test Devotee';
    const updatedEmail = `real_${testPhone}@gmail.com`;

    const { data: updatedUser, error: updateErr } = await supabase
      .from('website_store_users')
      .update({
        full_name: updatedName,
        email: updatedEmail
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (updateErr) {
      console.error('[FAIL] Profile update failed:', updateErr.message);
      return;
    }

    console.log('[PASS] Profile update succeeded! Saved details:', {
      full_name: updatedUser.full_name,
      email: updatedUser.email
    });

  } catch (err) {
    console.error('[FAIL] Exception occurred during test:', err);
  } finally {
    if (userId) {
      console.log('[Test] 4. Cleaning up test user record from database...');
      // Clean up user sessions first
      await supabase.from('user_sessions').delete().eq('user_id', userId);
      const { error: deleteErr } = await supabase
        .from('website_store_users')
        .delete()
        .eq('id', userId);
      
      if (deleteErr) {
        console.error('[FAIL] Cleanup failed:', deleteErr.message);
      } else {
        console.log('[PASS] Cleanup complete. Test user record deleted.');
      }
    }
  }
}

run();
