const handler = require('../api/send-otp.js').default;

// Mock req and res
const req = {
  method: 'POST',
  body: {
    phone: '9999999999',
    otp: '123456'
  },
  headers: {}
};

const res = {
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

// Mock process env (as in local development, next.js/vercel injects them)
process.env.ENCRYPTION_STRING_KEY = 'sg6XisTlL2QcXSuE';
process.env.ENCRYPTION_STRING_KEY_ESG_91 = 'gk4ukWKg78THpQ170x0XY0aPl9';

async function run() {
  await handler(req, res);
}

run();
