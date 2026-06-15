const fs = require('fs');
const path = require('path');

const files = fs.readdirSync(__dirname).filter(f => f.startsWith('recovered_') && f.endsWith('.json'));
console.log(`Checking ${files.length} files for detailed product lists...`);

for (const file of files) {
  const filePath = path.join(__dirname, file);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    
    // Look for fields that indicate complete database rows:
    // e.g. "benefits", "price", "description"
    const text = JSON.stringify(parsed);
    if (text.includes('"price"') && text.includes('"description"') && text.includes('"benefits"') && text.length > 5000) {
      console.log(`MATCH found in ${file}: length = ${text.length}`);
      console.log(`  Step Index: ${parsed.step_index}`);
      if (parsed.content) {
        console.log(`  Content snippet: ${parsed.content.substring(0, 300)}...`);
      }
      if (parsed.tool_calls) {
        console.log(`  Tool Calls: ${parsed.tool_calls.length}`);
      }
    }
  } catch (e) {
    // Ignore parse error
  }
}
console.log('Finished checking.');
