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

// Helper to capture send
function makeRes() {
  let content = '';
  return {
    statusCode: 200,
    headers: {},
    setHeader(name, val) {
      this.headers[name] = val;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(val) {
      content = val;
    },
    getContent() {
      return content;
    }
  };
}

async function runAudit() {
  const apiPath = path.join(__dirname, '../api/sitemap.js');
  const module = await import(`file://${apiPath}`);
  const handler = module.default;

  const subs = ['static', 'products', 'categories', 'pundits', 'images', 'blogs'];
  const auditReport = {};

  for (const s of subs) {
    const req = { query: { sub: s } };
    const res = makeRes();
    await handler(req, res);
    
    const xml = res.getContent();
    
    // Extract loc tags
    const locRegex = /<loc>([^<]+)<\/loc>/g;
    const urls = [];
    let match;
    while ((match = locRegex.exec(xml)) !== null) {
      urls.push(match[1]);
    }
    
    // Extract image loc tags if any
    const imgRegex = /<image:loc>([^<]+)<\/image:loc>/g;
    const images = [];
    while ((match = imgRegex.exec(xml)) !== null) {
      images.push(match[1]);
    }

    auditReport[s] = {
      urlCount: urls.length,
      urls,
      imageCount: images.length,
      images,
      statusCode: res.statusCode,
      contentType: res.headers['Content-Type'],
      cacheControl: res.headers['Cache-Control'],
      xmlLength: xml.length
    };
  }

  // Get index sitemap too
  const reqIndex = { query: {} };
  const resIndex = makeRes();
  await handler(reqIndex, resIndex);
  const indexXml = resIndex.getContent();
  const indexLocs = [];
  const locRegex = /<loc>([^<]+)<\/loc>/g;
  let match;
  while ((match = locRegex.exec(indexXml)) !== null) {
    indexLocs.push(match[1]);
  }

  auditReport['index'] = {
    urlCount: indexLocs.length,
    urls: indexLocs,
    statusCode: resIndex.statusCode,
    xmlLength: indexXml.length
  };

  console.log(JSON.stringify(auditReport, null, 2));
}

runAudit().catch(console.error);
