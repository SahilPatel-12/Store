const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

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

const endpoint = env['VITE_CLOUDFLARE_ENDPOINT'];
const accessKeyId = env['VITE_CLOUDFLARE_ACCESS_KEY_ID'];
const secretAccessKey = env['VITE_CLOUDFLARE_SECRET_ACCESS_KEY'];
const bucketName = env['VITE_CLOUDFLARE_BUCKET_NAME'] || 'mantrapujaapp';
const publicBaseUrl = env['VITE_CLOUDFLARE_PUBLIC_BASE_URL'];

console.log('R2 Configs loaded:');
console.log('Endpoint:', endpoint);
console.log('Bucket:', bucketName);
console.log('Public Base URL:', publicBaseUrl);

const s3Client = new S3Client({
  region: 'auto',
  endpoint: endpoint,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
});

async function run() {
  try {
    const testKey = `test/test_file_${Date.now()}.txt`;
    console.log(`Uploading test file to key: ${testKey}`);
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: Buffer.from('Hello R2 storage testing!'),
      ContentType: 'text/plain',
    });

    const result = await s3Client.send(command);
    console.log('Upload success result:', result);
    console.log('CDN URL should be:', `${publicBaseUrl}/${testKey}`);
  } catch (err) {
    console.error('R2 upload failed with error:', err);
  }
}

run();
