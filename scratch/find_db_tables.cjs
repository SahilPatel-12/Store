const fs = require('fs');
const path = require('path');

const tables = new Set();
const dir = 'C:\\Users\\Lenovo\\Desktop\\store\\Store\\src';

function walk(currentDir) {
  const files = fs.readdirSync(currentDir);
  files.forEach(file => {
    const fullPath = path.join(currentDir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.match(/\.from\(['"]([^'"]+)['"]\)/g);
      if (matches) {
        matches.forEach(m => {
          const match = m.match(/\.from\(['"]([^'"]+)['"]\)/);
          if (match) {
            tables.add(match[1]);
          }
        });
      }
    }
  });
}

walk(dir);
console.log('Discovered tables in src:');
console.log(Array.from(tables));
