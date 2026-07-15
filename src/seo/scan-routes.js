import fs from 'fs';
import path from 'url';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import fsLib from 'fs';
import pathLib from 'path';

function scanRoutes() {
  const routes = new Set();
  routes.add('/'); // Always include home

  try {
    const appPath = pathLib.join(__dirname, '../App.tsx');
    if (fsLib.existsSync(appPath)) {
      const content = fsLib.readFileSync(appPath, 'utf8');
      const matchRegex = /(?:path\s*===\s*|path\.startsWith\()(['"])([^'"]+)\1/g;
      let match;
      while ((match = matchRegex.exec(content)) !== null) {
        const rawPath = match[2];
        let cleanPath = rawPath.replace(/\/$/, '');
        if (!cleanPath) continue;

        if (cleanPath.startsWith('/category') || cleanPath.startsWith('/product') || cleanPath.startsWith('/blog') || (cleanPath.startsWith('/pundit') && cleanPath !== '/pundit-login') || cleanPath.startsWith('/temple')) {
          continue;
        }

        const isPrivate = /dashboard|checkout|cart|success|orders|profile|wishlist|notifications|search|admin|callback|error|dev/i.test(cleanPath);
        const isExcluded = /style-login|site-map|affiliation-program/i.test(cleanPath);
        if (isPrivate || isExcluded) continue;

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

  const outputPath = pathLib.join(__dirname, 'static-routes.ts');
  const codeContent = `// Automatically generated during build step by scan-routes.js. Do not edit manually.\nexport const staticRoutes = ${JSON.stringify(Array.from(routes), null, 2)};\n`;
  fsLib.writeFileSync(outputPath, codeContent, 'utf8');
  console.log('[seo-scan] Successfully compiled static routes to:', outputPath);
}

scanRoutes();
