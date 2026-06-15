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
    if (line.includes('Ganesh Rudraksha')) {
      console.log(`Line ${index}: contains Ganesh Rudraksha, length = ${line.length}`);
      try {
        const parsed = JSON.parse(line);
        console.log(`  Step Index: ${parsed.step_index}, Source: ${parsed.source}, Type: ${parsed.type}`);
        if (line.length > 2000) {
          const outPath = path.join(__dirname, `step_${parsed.step_index}_match.json`);
          fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2));
          console.log(`  Wrote step ${parsed.step_index} to ${outPath}`);
        }
      } catch (e) {
        console.error('  Error parsing JSON:', e.message);
      }
    }
  }
  console.log('Finished scanning.');
}

run();
