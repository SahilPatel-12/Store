import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
const s3Client = new S3Client({ region: 'auto' });
try {
  await s3Client.send(new PutObjectCommand({ Bucket: 'test', Key: 'test', Body: 'test' }));
} catch (e) {
  console.log('Error from send:', e.message);
}
