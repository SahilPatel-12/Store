const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logPath = '/Users/sahilpatel/.gemini/antigravity-ide/brain/95c2cdb5-9f4e-4753-9387-e792c2ce401a/.system_generated/logs/transcript.jsonl';

async function run() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let index = 0;
  for await (const line of rl) {
    index++;
    // Look for lines containing "slug" and "price" and are relatively long (meaning they contain a list of products)
    if (line.includes('"slug":') && line.includes('"price":') && line.length > 3000) {
      console.log(`Line ${index}: potential product array found! Length: ${line.length}`);
      try {
        const parsed = JSON.parse(line);
        console.log(`  Step Index: ${parsed.step_index}, Source: ${parsed.source}, Type: ${parsed.type}`);
        // Let's write it to a dump file
        const dumpPath = path.join(__dirname, `dump_products_step_${parsed.step_index}.json`);
        fs.writeFileSync(dumpPath, JSON.stringify(parsed, null, 2));
        console.log(`  Wrote full step data to ${dumpPath}`);
      } catch (e) {
        console.error('  Error parsing JSON:', e.message);
      }
    }
  }
  console.log('Done scanning.');
}

run();
