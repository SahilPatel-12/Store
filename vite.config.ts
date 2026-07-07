import { defineConfig, loadEnv } from 'vite'
import type { ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'

function vercelDevPlugin() {
  return {
    name: 'vite-plugin-vercel-emulator',
    configureServer(server: ViteDevServer) {
      // Load environment variables from env files and expose them to process.env
      const env = loadEnv('development', process.cwd(), '');
      for (const key in env) {
        process.env[key] = env[key];
      }

      server.middlewares.use(async (req: any, res: any, next) => {
        if (req.url && req.url.startsWith('/api/')) {
          const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          const pathname = url.pathname;
          
          let filePath = '';
          if (pathname === '/api/send-otp') filePath = './api/send-otp.js';
          else if (pathname === '/api/share') filePath = './api/share.js';
          else if (pathname === '/api/sitemap') filePath = './api/sitemap.ts';
          else if (pathname === '/api/robots') filePath = './api/robots.ts';
          else if (pathname === '/api/seo-render') filePath = './api/seo-render.ts';
          
          if (filePath) {
            try {
              const module = await server.ssrLoadModule(filePath);
              const handler = module.default;
              
              // Parse query
              const query: Record<string, string> = {};
              url.searchParams.forEach((val, key) => {
                query[key] = val;
              });
              req.query = query;
              
              // Parse body
              let body = {};
              if (req.method === 'POST') {
                const buffers: Buffer[] = [];
                for await (const chunk of req) {
                  buffers.push(chunk);
                }
                const rawBody = Buffer.concat(buffers).toString();
                try {
                  body = JSON.parse(rawBody);
                } catch (e) {
                  body = {};
                }
              }
              req.body = body;
              
              // Mock res
              res.status = function(statusCode: number) {
                res.statusCode = statusCode;
                return res;
              };
              
              res.json = function(data: any) {
                if (!res.headersSent) {
                  res.setHeader('Content-Type', 'application/json');
                }
                res.end(JSON.stringify(data));
                return res;
              };
              
              res.send = function(data: any) {
                if (typeof data === 'object') {
                  return res.json(data);
                }
                res.end(data);
                return res;
              };
              
              await handler(req, res);
              return;
            } catch (err: any) {
              console.error(`Error in local emulator for ${pathname}:`, err);
              if (!res.headersSent) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
              }
              return;
            }
          }
        }
        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode === 'development' ? [vercelDevPlugin()] : [])
  ],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_', 'ENCRYPTION_'],
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  server: mode === 'development' ? {
    allowedHosts: ['.trycloudflare.com'],
    watch: {
      ignored: ['**/scratch/**', '**/.git/**']
    }
  } : {}
}))
