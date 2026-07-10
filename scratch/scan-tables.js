const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        walk(filePath, fileList);
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

const tables = new Set();
const tableOccurrences = [];
const srcDir = path.join(__dirname, '..', 'src');
const apiDir = path.join(__dirname, '..', 'api');

const files = [...walk(srcDir), ...walk(apiDir)];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const relativePath = path.relative(path.join(__dirname, '..'), file).replace(/\\/g, '/');
  
  // Look for .from('table_name') or .from("table_name")
  const fromRegex = /\.from\(['"]([^'"]+)['"]\)/g;
  let match;
  while ((match = fromRegex.exec(content)) !== null) {
    const table = match[1];
    tables.add(table);
    tableOccurrences.push({
      table,
      file: relativePath,
      line: content.substring(0, match.index).split('\n').length,
      snippet: content.substring(match.index, match.index + 100).split('\n')[0]
    });
  }
  
  // Look for rpc('function_name') or rpc("function_name")
  const rpcRegex = /\.rpc\(['"]([^'"]+)['"]\)/g;
  while ((match = rpcRegex.exec(content)) !== null) {
    const func = match[1];
    tables.add(`rpc: ${func}`);
    tableOccurrences.push({
      table: `rpc: ${func}`,
      file: relativePath,
      line: content.substring(0, match.index).split('\n').length,
      snippet: content.substring(match.index, match.index + 100).split('\n')[0]
    });
  }
}

console.log('--- UNIQUE TABLES AND FUNCTIONS ---');
Array.from(tables).sort().forEach(t => console.log(t));

console.log('\n--- DETAILED OCCURRENCES ---');
fs.writeFileSync(path.join(__dirname, 'scan-result.json'), JSON.stringify(tableOccurrences, null, 2));
console.log(`Saved ${tableOccurrences.length} occurrences to scratch/scan-result.json`);
