const fs = require('fs');
const readline = require('readline');
const path = require('path');

const transcripts = [
  '/Users/sahilpatel/.gemini/antigravity-ide/brain/95c2cdb5-9f4e-4753-9387-e792c2ce401a/.system_generated/logs/transcript.jsonl',
  '/Users/sahilpatel/.gemini/antigravity-ide/brain/455feb54-1ece-4721-a220-3b7b87cde506/.system_generated/logs/transcript.jsonl',
  '/Users/sahilpatel/.gemini/antigravity-ide/brain/cb3a4cc0-f00d-4dea-adca-ce028150a0b5/.system_generated/logs/transcript.jsonl',
  '/Users/sahilpatel/.gemini/antigravity-ide/brain/71e7d6b4-46bc-4ee9-b262-472165b231fd/.system_generated/logs/transcript.jsonl',
  '/Users/sahilpatel/.gemini/antigravity-ide/brain/52c0f98d-ceaf-4390-98ed-66ece673d8e1/.system_generated/logs/transcript.jsonl',
  '/Users/sahilpatel/.gemini/antigravity-ide/brain/aa598a34-3d43-4dfc-9556-e9fa75f9c62c/.system_generated/logs/transcript.jsonl',
  '/Users/sahilpatel/.gemini/antigravity-ide/brain/03a43aff-4553-40a0-bbe5-33e632231ae1/.system_generated/logs/transcript.jsonl',
  '/Users/sahilpatel/.gemini/antigravity-ide/brain/9e4e15a1-6c8e-46d7-bb37-4ca2b5c84c73/.system_generated/logs/transcript.jsonl',
  '/Users/sahilpatel/.gemini/antigravity-ide/brain/db541506-34cb-491a-8356-4a5d282bd8dd/.system_generated/logs/transcript.jsonl',
  '/Users/sahilpatel/.gemini/antigravity-ide/brain/10f7e628-4b67-4154-8e9f-1b0559e46679/.system_generated/logs/transcript.jsonl',
  '/Users/sahilpatel/.gemini/antigravity-ide/brain/19c63f99-2cae-4ccf-ba04-d35b5e5584bf/.system_generated/logs/transcript.jsonl',
  '/Users/sahilpatel/.gemini/antigravity-ide/brain/eddeffad-160a-4a63-af5b-957dc3433c28/.system_generated/logs/transcript.jsonl',
  '/Users/sahilpatel/.gemini/antigravity-ide/brain/b0358a4d-fa41-4f34-b479-4d3ccd0467a7/.system_generated/logs/transcript.jsonl',
  '/Users/sahilpatel/.gemini/antigravity-ide/brain/904ec316-0b09-4127-bc3f-4ffce23dd778/.system_generated/logs/transcript.jsonl',
  '/Users/sahilpatel/.gemini/antigravity-ide/brain/00100fe0-c315-4095-980b-85f4acf113a8/.system_generated/logs/transcript.jsonl',
  '/Users/sahilpatel/.gemini/antigravity-ide/brain/f03e047f-420e-4932-aadd-5556b435e976/.system_generated/logs/transcript.jsonl',
  '/Users/sahilpatel/.gemini/antigravity-ide/brain/c1c6ad90-a17f-4682-b9ff-e25d054ce912/.system_generated/logs/transcript.jsonl',
  '/Users/sahilpatel/.gemini/antigravity-ide/brain/92a99959-3c35-44dd-bda6-7eed131b0153/.system_generated/logs/transcript.jsonl',
  '/Users/sahilpatel/.gemini/antigravity-ide/brain/ce293024-3654-4586-bb22-7901ea5bf875/.system_generated/logs/transcript.jsonl',
  '/Users/sahilpatel/.gemini/antigravity-ide/brain/05b3a461-74e4-4af3-b26d-896b5685d72f/.system_generated/logs/transcript.jsonl'
];

async function scanFile(logPath) {
  if (!fs.existsSync(logPath)) return null;
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let index = 0;
  for await (const line of rl) {
    index++;
    if (line.includes('website_pooja_products') && line.includes('[')) {
      // Find if this is a response from Supabase or printout
      const sizeK = Math.round(line.length / 1024);
      console.log(`Match in ${path.basename(path.dirname(path.dirname(logPath)))} line ${index}, length: ${line.length} (${sizeK} KB)`);
      if (line.length > 2000) {
        try {
          const parsed = JSON.parse(line);
          const outName = `recovered_${path.basename(path.dirname(path.dirname(logPath)))}_${parsed.step_index}.json`;
          const dumpPath = path.join(__dirname, outName);
          fs.writeFileSync(dumpPath, JSON.stringify(parsed, null, 2));
          console.log(`  Wrote step to ${outName}`);
        } catch (e) {
          console.error('  Error parsing JSON:', e.message);
        }
      }
    }
  }
}

async function run() {
  for (const t of transcripts) {
    await scanFile(t);
  }
  console.log('Recovery search finished.');
}

run();
