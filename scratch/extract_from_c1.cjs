const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logPath = '/Users/sahilpatel/.gemini/antigravity-ide/brain/c1c6ad90-a17f-4682-b9ff-e25d054ce912/.system_generated/logs/transcript.jsonl';

async function run() {
  if (!fs.existsSync(logPath)) {
    console.error('Log file does not exist');
    return;
  }
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let index = 0;
  for await (const line of rl) {
    index++;
    if (line.includes('7 Horses on Raw Pyrite Frame') || line.includes('7 Mukhi Rudraksha')) {
      try {
        const parsed = JSON.parse(line);
        console.log(`Match at line ${index}, step_index = ${parsed.step_index}, type = ${parsed.type}, len = ${line.length}`);
        
        // Write the matching step to a file
        const dumpPath = path.join(__dirname, `c1_step_${parsed.step_index}.json`);
        fs.writeFileSync(dumpPath, JSON.stringify(parsed, null, 2));
        console.log(`  Wrote step to ${path.basename(dumpPath)}`);
      } catch (e) {
        console.error('  Error parsing JSON:', e.message);
      }
    }
  }
  console.log('Finished extraction.');
}

run();
