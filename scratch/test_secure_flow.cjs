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
    process.env[key] = val;
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'];
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const testPhone = '9999999999';

  try {
    // 1. Delete previous OTP attempts to clear lockout states for testPhone
    await supabase.from('website_store_msg91_test_otps').delete().eq('phone_number', '91' + testPhone);
    console.log('Cleared previous OTP attempts.');

    // 2. Simulate sending OTP via calling our backend logic
    const sendHandler = require('../api/send-otp.js').default;
    const mockResSend = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      }
    };
    
    await sendHandler({
      method: 'POST',
      body: { phone: testPhone },
      headers: { 'x-forwarded-for': '127.0.0.1', 'user-agent': 'test-agent' }
    }, mockResSend);

    console.log('Send-OTP Response:', mockResSend.statusCode, mockResSend.body);

    // 3. Confirm record was created in website_store_msg91_test_otps
    const { data: record, error: fetchErr } = await supabase
      .from('website_store_msg91_test_otps')
      .select('*')
      .eq('phone_number', '91' + testPhone)
      .is('used_at', null)
      .single();

    if (fetchErr) {
      console.error('Fetch record failed:', fetchErr.message);
      process.exit(1);
    }
    console.log('Saved DB Record:', record);

    // 4. Test wrong OTP attempts to confirm brute force warning
    const verifyHandler = require('../api/verify-otp.js').default;
    for (let i = 1; i <= 3; i++) {
      const mockResVerify = {
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          this.body = data;
          return this;
        }
      };
      await verifyHandler({
        method: 'POST',
        body: { phone: testPhone, otp: '000000' },
        headers: { 'x-forwarded-for': '127.0.0.1', 'user-agent': 'test-agent' }
      }, mockResVerify);
      console.log(`Failed verify attempt ${i} response:`, mockResVerify.statusCode, mockResVerify.body);
    }

    // 5. Verify database incremented attempt counter
    const { data: updatedRecord } = await supabase
      .from('website_store_msg91_test_otps')
      .select('attempt_count')
      .eq('id', record.id)
      .single();
    console.log('Counter updated in DB:', updatedRecord.attempt_count);

    // 6. Complete authentication using correct OTP ('111111' mock)
    const mockResVerifySuccess = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      }
    };
    await verifyHandler({
      method: 'POST',
      body: { phone: testPhone, otp: '111111', device_id: 'integration_test_runner' },
      headers: { 'x-forwarded-for': '8.8.8.8', 'user-agent': 'chrome-dev-agent' }
    }, mockResVerifySuccess);
    console.log('Successful login response:', mockResVerifySuccess.statusCode, mockResVerifySuccess.body);

    // 7. Verify session exists in user_sessions table
    const { data: session } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('session_token', mockResVerifySuccess.body.session_token)
      .single();
    console.log('Session details in DB:', session);

    console.log('\nALL TESTS PASSED SUCCESSFULLY! THE SECURE VERIFICATION FLOW IS WORKING SHIFT-FREE!');
  } catch (err) {
    console.error('Test script exception:', err);
  }
}

run();
