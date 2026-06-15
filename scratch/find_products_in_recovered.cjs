const fs = require('fs');
const path = require('path');

const scratchDir = __dirname;
const files = fs.readdirSync(scratchDir).filter(f => f.startsWith('recovered_') && f.endsWith('.json'));

console.log(`Scanning ${files.length} recovered files...`);

for (const file of files) {
  const filePath = path.join(scratchDir, file);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    // We want to check if there is an array of products inside the content or args
    const str = JSON.stringify(data);
    
    // Count how many products are mentioned (by matching UUID format or specific fields)
    const productMatches = str.match(/14 Mukhi Rudraksha|Dhan Yog Bracelet|Lakshmi Yantra Pyramid/g);
    if (productMatches && productMatches.length >= 2) {
      console.log(`File ${file} has match! Product terms: ${Array.from(new Set(productMatches))}`);
      // Let's print some details
      if (data.content && data.content.length > 500) {
        console.log(`  Content length: ${data.content.length}`);
        console.log(`  Content snippet: ${data.content.substring(0, 300)}...`);
      }
      if (data.tool_calls) {
        console.log(`  Tool Calls: ${data.tool_calls.length}`);
        data.tool_calls.forEach((tc, idx) => {
          console.log(`    Tool Call ${idx}: name=${tc.name}`);
          const argsStr = JSON.stringify(tc.args);
          if (argsStr.length > 500) {
            console.log(`      Args length: ${argsStr.length}`);
            console.log(`      Args snippet: ${argsStr.substring(0, 300)}...`);
          }
        });
      }
    }
  } catch (e) {
    // Ignore error
  }
}
console.log('Finished scan.');
