import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function scanRoutes() {
  const routes = new Set();
  routes.add('/'); // Always include home

  try {
    const appPath = path.join(__dirname, '../App.tsx');
    if (fs.existsSync(appPath)) {
      const content = fs.readFileSync(appPath, 'utf8');
      const matchRegex = /(?:path\s*===\s*|path\.startsWith\()(['"])([^'"]+)\1/g;
      let match;
      while ((match = matchRegex.exec(content)) !== null) {
        const rawPath = match[2];
        let cleanPath = rawPath.replace(/\/$/, '');
        if (!cleanPath) continue;

        if (cleanPath.startsWith('/category') || cleanPath.startsWith('/product') || cleanPath.startsWith('/blog') || cleanPath.startsWith('/pundit') || cleanPath.startsWith('/temple')) {
          continue;
        }

        const isPrivate = /dashboard|checkout|cart|success|orders|profile|wishlist|notifications|search|admin|callback|error|dev/i.test(cleanPath);
        if (isPrivate) continue;

        routes.add(cleanPath);
      }
      console.log('[seo-scan] Discovered static routes:', Array.from(routes));
    } else {
      console.warn('[seo-scan] App.tsx not found at:', appPath);
    }
  } catch (err) {
    console.error('[seo-scan] Failed scanning routes:', err);
  }

  // Fallback default list if empty/failed
  if (routes.size <= 1) {
    const fallbacks = [
      '/shop',
      '/about',
      '/contact',
      '/policies',
      '/affiliation',
      '/auth',
      '/pundit-login',
      '/astrologer-login',
      '/sitemap'
    ];
    for (const r of fallbacks) {
      routes.add(r);
    }
  }

  const outputPath = path.join(__dirname, 'static-routes.json');
  fs.writeFileSync(outputPath, JSON.stringify(Array.from(routes), null, 2), 'utf8');
  console.log('[seo-scan] Successfully compiled static routes to:', outputPath);
}

scanRoutes();
