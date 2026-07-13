import handler from '../api/send-otp.js';

const req = {
  method: 'POST',
  body: {
    phone: '9876543210',
    otp: '123456'
  },
  headers: {}
};

const res = {
  statusCode: 200,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(data) {
    console.log(`Response Code: ${this.statusCode}`);
    console.log('Response JSON:', data);
  },
  setHeader(name, val) {}
};

// Set local env variables before execution
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://vjkwmefdutltwccpgnny.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqa3dtZWZkdXRsdHdjY3Bnbm55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk0MDE2OSwiZXhwIjoyMDk1NTE2MTY5fQ.9PIi4ccfQgaRD-AasEW40Z2nLsF3JD0SVCpGvJrXduc';
process.env.ENCRYPTION_STRING_KEY = 'sg6XisTlL2QcXSuE';
process.env.ENCRYPTION_STRING_KEY_ESG_91 = 'gk4ukWKg78THpQ170x0XY0aPl9';

async function run() {
  await handler(req, res);
}

run();
