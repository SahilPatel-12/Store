import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Copy user uploaded banner image to public and dist directories for static serving
try {
  const srcFile = 'C:/Users/Lenovo/.gemini/antigravity-ide/brain/ac9f5fe3-0637-4cb8-8d58-9a85a022d701/media__1783589269855.jpg';
  const dests = [
    path.join(__dirname, 'public', 'vidya_rudraksh_share.jpg'),
    path.join(__dirname, 'dist', 'vidya_rudraksh_share.jpg')
  ];
  if (fs.existsSync(srcFile)) {
    for (const destFile of dests) {
      const destDir = path.dirname(destFile);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(srcFile, destFile);
      console.log(`[Server] Copied user banner image to ${destFile} successfully!`);
    }
  }
} catch (copyErr) {
  console.error('[Server] Failed to copy user banner image on startup:', copyErr);
}

// Load environment variables from .env / .env.local if they exist
function loadEnvFiles() {
  const files = ['.env', '.env.local'];
  for (const file of files) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        content.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const index = trimmed.indexOf('=');
            const key = trimmed.substring(0, index).trim();
            let value = trimmed.substring(index + 1).trim();
            // Remove wrapping quotes if any
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
              value = value.substring(1, value.length - 1);
            }
            if (process.env[key] === undefined) {
              process.env[key] = value;
            }
          }
        });
      } catch (err) {
        console.error(`[Server] Error loading env file ${file}:`, err);
      }
    }
  }
}

loadEnvFiles();

// Validate PAYMENT_ENV on server startup
const paymentEnv = process.env.PAYMENT_ENV;
if (paymentEnv !== undefined) {
  const trimmed = paymentEnv.trim();
  if (trimmed !== 'test' && trimmed !== 'live') {
    console.error(`\n[FATAL CONFIGURATION ERROR] Invalid PAYMENT_ENV value: "${trimmed}".`);
    console.error(`Allowed values are: "test" or "live".`);
    console.error(`Please update your environment configuration (e.g. .env.local or production server env).\n`);
    process.exit(1);
  }
}

// Helper to determine Content-Type
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

const PORT = process.env.PORT || 3000;

// Helper to parse query parameters
function parseQueryParams(url) {
  const params = {};
  const searchParams = new URL(url, 'http://localhost').searchParams;
  searchParams.forEach((val, key) => {
    params[key] = val;
  });
  return params;
}

// Path map to translate Vercel rewrites to consolidated API endpoints on GCP/Coolify
const PATH_MAP = {
  '/api/admin/whatsapp/config': { file: 'admin.js', action: 'whatsapp-config' },
  '/api/admin/razorpay/config': { file: 'admin.js', action: 'razorpay-config' },
  '/api/admin/razorpay/test-connection': { file: 'admin.js', action: 'razorpay-test' },
  '/api/admin/orders/update-delivery-status': { file: 'admin.js', action: 'orders-update' },
  '/api/admin/orders/confirm-legacy-payment': { file: 'admin.js', action: 'orders-confirm' },
  '/api/admin/orders/decline-legacy-payment': { file: 'admin.js', action: 'orders-decline' },
  '/api/admin/orders/revert-legacy-payment': { file: 'admin.js', action: 'orders-revert' },
  '/api/admin/orders/list': { file: 'admin.js', action: 'orders-list' },
  '/api/payments/razorpay/create-order': { file: 'payments.js', action: 'create-order' },
  '/api/payments/razorpay/verify': { file: 'payments.js', action: 'verify' },
  '/api/customer/orders': { file: 'customer.js', action: 'orders' },
  '/api/customer/addresses': { file: 'customer.js', action: 'addresses' }
};

// Main server handler
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  // Diagnostic log for all requests
  console.log(`[Server] Request: ${req.method} ${pathname}`);

  // Sitemap Router Interceptor
  const isSitemapIndex = pathname === '/sitemap.xml';
  const isSitemapChild = pathname.startsWith('/sitemap-') && pathname.endsWith('.xml');
  if (isSitemapIndex || isSitemapChild) {
    let sub = '';
    if (isSitemapChild) {
      const match = pathname.match(/^\/sitemap-(.+)\.xml$/);
      if (match) {
        sub = match[1];
      }
    }

    try {
      const filePath = path.join(__dirname, 'api', 'sitemap.js');
      if (fs.existsSync(filePath)) {
        const module = await import(`file://${filePath}`);
        const handler = module.default;

        // Parse query params
        const queryParams = parseQueryParams(req.url);
        if (sub) {
          queryParams.sub = sub;
        }
        req.query = queryParams;

        // Enhance response object with serverless compatibility helpers
        res.status = function (statusCode) {
          res.statusCode = statusCode;
          return res;
        };

        res.json = function (data) {
          if (!res.headersSent) {
            res.setHeader('Content-Type', 'application/json');
          }
          res.end(JSON.stringify(data));
          return res;
        };

        res.send = function (data) {
          if (typeof data === 'object') {
            return res.json(data);
          }
          res.end(data);
          return res;
        };

        await handler(req, res);
        return;
      } else {
        console.error(`[Server] Sitemap API handler not found at: ${filePath}`);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/html');
        res.end('<h1>500 Internal Server Error: Sitemap Handler Missing</h1>');
        return;
      }
    } catch (err) {
      console.error('[Server] Error handling sitemap request:', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/html');
      res.end(`<h1>500 Internal Server Error</h1><p>${err.message}</p>`);
      return;
    }
  }

  // 1. API Route Handler
  if (pathname.startsWith('/api/')) {
    // Add CORS headers for API requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token, Authorization');

    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      res.end();
      return;
    }

    let filePath = '';
    const mapped = PATH_MAP[pathname];

    if (mapped) {
      filePath = path.join(__dirname, 'api', mapped.file);
    } else {
      const apiPath = pathname.substring(5); // Remove "/api/"
      const relativePathJs = path.join(__dirname, 'api', `${apiPath}.js`);
      const relativePathTs = path.join(__dirname, 'api', `${apiPath}.ts`);

      if (fs.existsSync(relativePathJs)) {
        filePath = relativePathJs;
      } else if (fs.existsSync(relativePathTs)) {
        filePath = relativePathTs;
      }
    }

    if (filePath) {
      try {
        const module = await import(`file://${filePath}`);
        const handler = module.default;
        const config = module.config || {};

        // Parse query params (inject action if mapped)
        const queryParams = parseQueryParams(req.url);
        if (mapped) {
          queryParams.action = mapped.action;
        }
        req.query = queryParams;

        // Parse body if bodyParser is not disabled and it's a POST/PUT/PATCH request
        const shouldParseBody = config.api?.bodyParser !== false;
        let body = {};
        if (shouldParseBody && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
          const buffers = [];
          for await (const chunk of req) {
            buffers.push(chunk);
          }
          const rawBody = Buffer.concat(buffers).toString('utf8');
          if (rawBody) {
            const contentType = req.headers['content-type'] || '';
            if (contentType.includes('application/json')) {
              try {
                body = JSON.parse(rawBody);
              } catch (e) {
                console.error('[Server] Body parse error:', e);
              }
            } else if (contentType.includes('application/x-www-form-urlencoded')) {
              body = Object.fromEntries(new URLSearchParams(rawBody));
            }
          }
        }
        req.body = body;

        // Enhance response object with serverless compatibility helpers
        res.status = function (statusCode) {
          res.statusCode = statusCode;
          return res;
        };

        res.json = function (data) {
          if (!res.headersSent) {
            res.setHeader('Content-Type', 'application/json');
          }
          res.end(JSON.stringify(data));
          return res;
        };

        res.send = function (data) {
          if (typeof data === 'object') {
            return res.json(data);
          }
          res.end(data);
          return res;
        };

        await handler(req, res);
        return;
      } catch (err) {
        console.error(`[Server] Error in handler for ${pathname}:`, err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
        }
        return;
      }
    } else {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'API route not found' }));
      return;
    }
  }

  // 2. Static File Server (Frontend)
  // Clean up path to avoid directory traversal
  const safeSuffix = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let fileLoc = path.join(__dirname, 'dist', safeSuffix);

  // If path is a directory or file doesn't exist, fallback to index.html for SPA routing
  let exists = fs.existsSync(fileLoc) && fs.statSync(fileLoc).isFile();
  if (!exists) {
    fileLoc = path.join(__dirname, 'dist', 'index.html');
    exists = fs.existsSync(fileLoc);
  }

  if (exists) {
    const ext = path.extname(fileLoc).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    fs.createReadStream(fileLoc).pipe(res);
  } else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html');
    res.end('<h1>404 Not Found</h1>');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Production Node.js server running at http://0.0.0.0:${PORT}`);
});
