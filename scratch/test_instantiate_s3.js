import { S3Client } from '@aws-sdk/client-s3';
const s3Client = new S3Client({
  region: 'auto',
  endpoint: 'https://test.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
});
console.log('S3 client instantiated successfully');
