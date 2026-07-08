import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = url.pathname;

  // 1. API Route Handler
  if (pathname.startsWith('/api/')) {
    // Simulate vercel.json rewrites
    const query = {};
    url.searchParams.forEach((val, key) => {
      query[key] = val;
    });

    if (pathname.startsWith('/api/admin/')) {
      const action = pathname.substring(11);
      pathname = '/api/admin';
      if (action === 'whatsapp/config') query['action'] = 'whatsapp-config';
      else if (action === 'razorpay/config') query['action'] = 'razorpay-config';
      else if (action === 'razorpay/test-connection') query['action'] = 'razorpay-test';
      else if (action === 'orders/update-delivery-status') query['action'] = 'orders-update';
      else if (action === 'orders/confirm-legacy-payment') query['action'] = 'orders-confirm';
      else if (action === 'orders/decline-legacy-payment') query['action'] = 'orders-decline';
      else if (action === 'orders/list') query['action'] = 'orders-list';
    } else if (pathname.startsWith('/api/payments/razorpay/')) {
      const action = pathname.substring(23);
      pathname = '/api/payments';
      query['action'] = action;
    } else if (pathname.startsWith('/api/customer/')) {
      const action = pathname.substring(14);
      pathname = '/api/customer';
      query['action'] = action;
    }

    const apiJsPath = path.join(__dirname, 'api', `${pathname.substring(5)}.js`);
    
    if (fs.existsSync(apiJsPath)) {
      try {
        const module = await import(`file://${apiJsPath}`);
        const handler = module.default;

        // Parse query and body for handler
        req.query = query;
        let body = {};

        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
          // If body parsing is disabled by handler config, do not parse body
          const handlerConfig = module.config || {};
          if (handlerConfig.api?.bodyParser !== false) {
            const buffers = [];
            for await (const chunk of req) {
              buffers.push(chunk);
            }
            const rawBody = Buffer.concat(buffers).toString('utf8');
            try {
              body = JSON.parse(rawBody);
            } catch (e) {
              body = {};
            }
          }
        }
        req.body = body;

        // Mock res.status, res.json, res.send
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
        console.error(`Error executing API route ${pathname}:`, err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
        return;
      }
    } else {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: `API route ${pathname} not found.` }));
      return;
    }
  }

  // 2. Static File Server
  let filePath = path.join(__dirname, 'dist', pathname === '/' ? 'index.html' : pathname);
  
  // SPA Fallback: if file doesn't exist, serve index.html (excluding /api/ paths)
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'dist', 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.statusCode = 500;
      res.end(`Server Error: ${err.code}`);
    } else {
      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      res.end(content);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Production listener active at http://0.0.0.0:${PORT}`);
});
