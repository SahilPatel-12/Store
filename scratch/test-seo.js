import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildRobotsTxt } from '../src/seo/robots-generator.js';
import { sitemapRegistry } from '../src/seo/seo-registry.js';

// Resolve directory paths for loading environmental settings
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

console.log('==========================================');
console.log('   SEO & Sitemap Verification Test Suite  ');
console.log('==========================================\n');

console.log('1. Testing Robots.txt Builder...');
try {
  const robots = buildRobotsTxt();
  console.log('Robots.txt Output:');
  console.log('------------------------------------------');
  console.log(robots);
  console.log('------------------------------------------');
  console.log('✅ Robots.txt generated successfully!\n');
} catch (err) {
  console.error('❌ Robots.txt Generation Failed:', err);
}

console.log('2. Inspecting SEO Sitemap Module Registry...');
try {
  console.log('Sitemap Modules Status:');
  sitemapRegistry.forEach(m => {
    console.log(`  - ${m.name.padEnd(20)} [Type: ${m.type.padEnd(8)}] [Enabled: ${m.enabled ? 'Yes' : 'No'}] [XML Index: ${m.includeInXML ? 'Yes' : 'No'}]`);
  });
  console.log('✅ Sitemap Module Registry loaded successfully!\n');
} catch (err) {
  console.error('❌ Sitemap Registry Parsing Failed:', err);
}
