import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { supabaseAdmin } from './_lib/supabase-admin.js';
import crypto from 'crypto';

const PURPOSE_ALLOWLIST = {
  // Admin-level purposes
  'products/thumbnails': { role: 'admin', allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'], maxSizeBytes: 5 * 1024 * 1024, prefix: 'products/thumbnails' },
  'products/gallery': { role: 'admin', allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'], maxSizeBytes: 5 * 1024 * 1024, prefix: 'products/gallery' },
  'products/videos': { role: 'admin', allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'], maxSizeBytes: 50 * 1024 * 1024, prefix: 'products/videos' },
  'products/pundits': { role: 'admin', allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'], maxSizeBytes: 5 * 1024 * 1024, prefix: 'products/pundits' },
  'priests': { role: 'admin', allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'], maxSizeBytes: 5 * 1024 * 1024, prefix: 'priests' },
  'banners': { role: 'admin', allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'], maxSizeBytes: 5 * 1024 * 1024, prefix: 'banners' },
  'section-icons': { role: 'admin', allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'], maxSizeBytes: 2 * 1024 * 1024, prefix: 'section-icons' },

  // Customer-level purposes
  'referrals': { role: 'customer', allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'], maxSizeBytes: 5 * 1024 * 1024, prefix: 'referrals' },
  'astrologers/photos': { role: 'customer', allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'], maxSizeBytes: 5 * 1024 * 1024, prefix: 'astrologers/photos' },
  'pundits/photos': { role: 'customer', allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'], maxSizeBytes: 5 * 1024 * 1024, prefix: 'pundits/photos' },
  'pundits/documents': { role: 'customer', allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], maxSizeBytes: 10 * 1024 * 1024, prefix: 'pundits/documents' },
  'orders/proofs': { role: 'customer', allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'], maxSizeBytes: 5 * 1024 * 1024, prefix: 'orders/proofs' },
  'reviews/images': { role: 'customer', allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'], maxSizeBytes: 5 * 1024 * 1024, prefix: 'reviews/images' },
  'reviews/videos': { role: 'customer', allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'], maxSizeBytes: 50 * 1024 * 1024, prefix: 'reviews/videos' }
};

// Admin verification
async function verifyAdmin(token) {
  if (!token) return false;
  const { data } = await supabaseAdmin
    .from('admin_sessions')
    .select('id')
    .eq('session_token', token)
    .gt('expires_at', new Date().toISOString())
    .single();
  return !!data;
}

// Customer verification
async function verifyCustomer(token) {
  if (!token) return false;
  const { data } = await supabaseAdmin
    .from('user_sessions')
    .select('id')
    .eq('session_token', token)
    .gt('expires_at', new Date().toISOString())
    .single();
  return !!data;
}

const endpoint = process.env.CLOUDFLARE_ENDPOINT || '';
const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY || '';
const bucketName = process.env.CLOUDFLARE_BUCKET_NAME || 'mantrapujaapp';
const publicBaseUrl = process.env.CLOUDFLARE_PUBLIC_BASE_URL || '';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: endpoint,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { purpose, filename, contentType, fileSize, sessionToken, adminToken } = req.body;

    if (!purpose || !filename || !contentType || !fileSize) {
      return res.status(400).json({ error: 'Missing required parameters.' });
    }

    const rules = PURPOSE_ALLOWLIST[purpose];
    if (!rules) {
      return res.status(400).json({ error: 'Unsupported upload purpose.' });
    }

    // Role authentication check
    if (rules.role === 'admin') {
      const isAdmin = await verifyAdmin(adminToken);
      if (!isAdmin) {
        return res.status(401).json({ error: 'Unauthorized: Admin session required.' });
      }
    } else if (rules.role === 'customer') {
      const isCustomer = await verifyCustomer(sessionToken);
      if (!isCustomer) {
        return res.status(401).json({ error: 'Unauthorized: Devotee session required.' });
      }
    }

    // MIME type validation
    if (!rules.allowedMimeTypes.includes(contentType)) {
      return res.status(400).json({ error: `Invalid content type. Allowed: ${rules.allowedMimeTypes.join(', ')}` });
    }

    // File size validation
    if (fileSize > rules.maxSizeBytes) {
      return res.status(400).json({ error: `File size exceeds the limit of ${(rules.maxSizeBytes / (1024 * 1024)).toFixed(0)}MB.` });
    }

    // Generate unique object key server-side
    const uniqueId = crypto.randomUUID();
    const extension = filename.split('.').pop() || '';
    const sanitizedName = filename.split('.').slice(0, -1).join('.').replace(/[^a-zA-Z0-9]/g, '_');
    const key = `${rules.prefix}/${uniqueId}_${sanitizedName}${extension ? '.' + extension : ''}`;

    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: contentType,
      });

      const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minutes validity
      const cleanBaseUrl = publicBaseUrl.endsWith('/') ? publicBaseUrl.slice(0, -1) : publicBaseUrl;
      const cdnUrl = `${cleanBaseUrl}/${key}`;

      return res.status(200).json({
        presignedUrl,
        publicUrl: cdnUrl
      });
    } catch (error) {
      console.error('[R2 Presigned] Signature generation failed:', error);
      return res.status(500).json({ error: 'Could not generate upload signature.' });
    }
  } else if (req.method === 'DELETE') {
    const { url, adminToken } = req.body;

    if (!url || !adminToken) {
      return res.status(400).json({ error: 'Missing URL or Admin Token.' });
    }

    const isAdmin = await verifyAdmin(adminToken);
    if (!isAdmin) {
      return res.status(401).json({ error: 'Unauthorized: Admin session required.' });
    }

    try {
      const cleanBaseUrl = publicBaseUrl.endsWith('/') ? publicBaseUrl.slice(0, -1) : publicBaseUrl;
      let key = '';

      if (url.startsWith(cleanBaseUrl)) {
        key = url.replace(cleanBaseUrl + '/', '');
      } else {
        const urlObj = new URL(url);
        key = decodeURIComponent(urlObj.pathname.substring(1));
      }

      if (!key) {
        return res.status(400).json({ error: 'Could not resolve key from URL.' });
      }

      // Strict Prefix Validation: Only allow deleting admin-managed assets
      const allowedAdminPrefixes = ['products/thumbnails/', 'products/gallery/', 'products/videos/', 'products/pundits/', 'priests/', 'banners/', 'section-icons/'];
      const isPathAllowed = allowedAdminPrefixes.some(pref => key.startsWith(pref));

      if (!isPathAllowed) {
        return res.status(403).json({ error: 'Forbidden: Unauthorized object prefix.' });
      }

      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await s3Client.send(command);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('[R2 Presigned] Deletion failed:', error);
      return res.status(500).json({ error: 'Could not delete asset.' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'DELETE']);
    return res.status(450).json({ error: `Method ${req.method} Not Allowed` });
  }
}
