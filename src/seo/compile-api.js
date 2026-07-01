import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiFiles = ['robots.ts', 'sitemap.ts', 'seo-render.ts'];

function compile() {
  console.log('[api-compile] Starting esbuild bundling for Serverless Functions...');
  
  for (const file of apiFiles) {
    const srcPath = path.join(__dirname, 'api', file);
    const destName = file.replace('.ts', '.js');
    const destPath = path.join(__dirname, '../../api', destName);
    
    console.log(`[api-compile] Bundling ${file} -> api/${destName}...`);
    try {
      execSync(`npx esbuild "${srcPath}" --bundle --platform=node --format=esm --outfile="${destPath}"`, {
        stdio: 'inherit'
      });
    } catch (err) {
      console.error(`[api-compile] Failed compiling ${file}:`, err);
      process.exit(1);
    }
  }
  
  console.log('[api-compile] Successfully bundled all functions.');
}

compile();
