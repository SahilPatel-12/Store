import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars manually from .env.local
function loadEnv() {
  const filePath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const index = trimmed.indexOf('=');
        const key = trimmed.substring(0, index).trim();
        let value = trimmed.substring(index + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        if (process.env[key] === undefined) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

// Mock request and response
const makeRes = (label) => ({
  statusCode: 200,
  headers: {},
  setHeader(name, val) {
    this.headers[name] = val;
  },
  status(code) {
    this.statusCode = code;
    return this;
  },
  send(content) {
    console.log(`\n==========================================`);
    console.log(` SUB-SITEMAP: ${label}`);
    console.log(`==========================================`);
    console.log(`Status Code: ${this.statusCode}`);
    console.log(`Headers: ${JSON.stringify(this.headers)}`);
    console.log('--- Content ---');
    console.log(content);
    console.log('---------------------');
  }
});

async function testAll() {
  const apiPath = path.join(__dirname, '../api/sitemap.js');
  if (!fs.existsSync(apiPath)) {
    console.error('api/sitemap.js does not exist.');
    return;
  }

  const module = await import(`file://${apiPath}`);
  const handler = module.default;

  const subs = [undefined, 'static', 'products', 'categories', 'pundits', 'images', 'blogs'];

  for (const s of subs) {
    const req = { 
      query: s ? { sub: s } : {},
      headers: {} 
    };
    const res = makeRes(s || 'INDEX (root)');
    await handler(req, res);
  }
}

testAll().catch(console.error);
