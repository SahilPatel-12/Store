const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// Load env variables from .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

const s3Client = new S3Client({
  endpoint: env['VITE_CLOUDFLARE_ENDPOINT'],
  credentials: {
    accessKeyId: env['VITE_CLOUDFLARE_ACCESS_KEY_ID'],
    secretAccessKey: env['VITE_CLOUDFLARE_SECRET_ACCESS_KEY'],
  },
  region: 'auto',
});

async function run() {
  try {
    console.log('Listing objects in R2 bucket...');
    const command = new ListObjectsV2Command({
      Bucket: env['VITE_CLOUDFLARE_BUCKET_NAME'],
      MaxKeys: 1000
    });

    const response = await s3Client.send(command);
    console.log(`Found ${response.Contents ? response.Contents.length : 0} objects.`);
    
    if (response.Contents) {
      // Group by directory/prefix
      const prefixes = {};
      response.Contents.forEach(obj => {
        const key = obj.Key;
        const parts = key.split('/');
        const prefix = parts.length > 1 ? parts[0] : 'root';
        if (!prefixes[prefix]) {
          prefixes[prefix] = [];
        }
        prefixes[prefix].push({ key: obj.Key, size: obj.Size, lastModified: obj.LastModified });
      });

      Object.keys(prefixes).forEach(prefix => {
        console.log(`Prefix: ${prefix} (${prefixes[prefix].length} files)`);
        // print up to 15 files for each prefix
        prefixes[prefix].slice(0, 30).forEach(file => {
          console.log(` - ${file.key} (${file.size} bytes)`);
        });
        if (prefixes[prefix].length > 30) {
          console.log(` ... and ${prefixes[prefix].length - 30} more`);
        }
      });
    }
  } catch (err) {
    console.error('Error listing R2:', err);
  }
}

run();
