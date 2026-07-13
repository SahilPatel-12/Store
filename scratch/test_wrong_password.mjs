import { supabaseAdmin } from '../api/_lib/supabase-admin.js';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://vjkwmefdutltwccpgnny.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqa3dtZWZkdXRsdHdjY3Bnbm55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk0MDE2OSwiZXhwIjoyMDk1NTE2MTY5fQ.9PIi4ccfQgaRD-AasEW40Z2nLsF3JD0SVCpGvJrXduc';

async function run() {
  try {
    const { data: waData } = await supabaseAdmin
      .from('website_settings')
      .select('value')
      .eq('key', 'whatsapp_settings')
      .single();

    const val = waData.value;
    const testPhone = '918819897434';
    const otp = '987654';

    const urlObj = new URL(val.endpoint);
    urlObj.searchParams.set('pass', 'wrong_password_here');
    urlObj.searchParams.set('phone', testPhone);
    urlObj.searchParams.set('Params', `${otp},Low CIBIL Score`);

    console.log('Firing BhashSMS test request with wrong password...');
    const res = await fetch(urlObj.toString());
    const text = await res.text();
    console.log('Response Status:', res.status);
    console.log('Response Body:', text);
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
