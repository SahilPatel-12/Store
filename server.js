import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Main server handler
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. API Route Handler
  if (pathname.startsWith('/api/')) {
    let filePath = '';
    const apiPath = pathname.substring(5); // Remove "/api/"
    const relativePathJs = path.join(__dirname, 'api', `${apiPath}.js`);
    const relativePathTs = path.join(__dirname, 'api', `${apiPath}.ts`);

    if (fs.existsSync(relativePathJs)) {
      filePath = relativePathJs;
    } else if (fs.existsSync(relativePathTs)) {
      filePath = relativePathTs;
    }

    if (filePath) {
      try {
        const module = await import(`file://${filePath}`);
        const handler = module.default;
        const config = module.config || {};

        // Parse query params
        req.query = parseQueryParams(req.url);

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
