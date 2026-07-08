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
          let pathname = url.pathname;
          
          // Parse query parameters
          const query: Record<string, string> = {};
          url.searchParams.forEach((val, key) => {
            query[key] = val;
          });

          // Simulate vercel.json rewrites locally
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

          let filePath = '';
          const fs = await import('fs');
          const relativePathJs = `./api${pathname.substring(4)}.js`;
          const relativePathTs = `./api${pathname.substring(4)}.ts`;

          if (fs.existsSync(relativePathJs)) {
            filePath = relativePathJs;
          } else if (fs.existsSync(relativePathTs)) {
            filePath = relativePathTs;
          }
          
          if (filePath) {
            try {
              const module = await server.ssrLoadModule(filePath);
              const handler = module.default;
              
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
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
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
