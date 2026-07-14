import { supabaseAdmin } from './_lib/supabase-admin.js';
import { verifyAdmin } from './_lib/admin/auth.js';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire(import.meta.url);

// Copy user uploaded banner image to public and dist directories for browser access
try {
  const srcFile = 'C:/Users/Lenovo/.gemini/antigravity-ide/brain/ac9f5fe3-0637-4cb8-8d58-9a85a022d701/media__1783589269855.jpg';
  const dests = [
    'c:/Users/Lenovo/Desktop/store/Store/public/vidya_rudraksh_share.jpg',
    'c:/Users/Lenovo/Desktop/store/Store/dist/vidya_rudraksh_share.jpg'
  ];
  if (fs.existsSync(srcFile)) {
    for (const destFile of dests) {
      const destDir = path.dirname(destFile);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(srcFile, destFile);
      console.log(`[Server] Copied user banner image to ${destFile} successfully!`);
    }
  }
} catch (copyErr) {
  console.error('[Server] Failed to copy user banner image:', copyErr);
}


// Check and install missing AWS SDK dependencies dynamically
try {
  require.resolve('@aws-sdk/s3-request-presigner');
} catch (e) {
  console.log('[Server] Installing @aws-sdk/s3-request-presigner dynamically...');
  try {
    execSync('npm install @aws-sdk/s3-request-presigner @aws-sdk/client-s3', { stdio: 'inherit' });
    console.log('[Server] Installation completed successfully!');
  } catch (err) {
    console.error('[Server] Failed to install packages dynamically:', err);
  }
}


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
  'reviews/videos': { role: 'customer', allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'], maxSizeBytes: 50 * 1024 * 1024, prefix: 'reviews/videos' },
  'invoices': { role: 'public', allowedMimeTypes: ['application/pdf'], maxSizeBytes: 10 * 1024 * 1024, prefix: 'invoices' }
};

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

export default async function handler(req, res) {
  const { S3Client, PutObjectCommand, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

  const s3Client = new S3Client({
    region: 'auto',
    endpoint: endpoint,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
  });

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
      const isAdmin = !!(await verifyAdmin(req));
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

    // Try Cloudflare Stream for videos if API token is configured
    const cfApiToken = process.env.CLOUDFLARE_API_TOKEN;
    const accountIdMatch = endpoint.match(/https:\/\/([a-f0-9]+)\.r2\.cloudflarestorage\.com/);
    const accountId = accountIdMatch ? accountIdMatch[1] : '';

    if (cfApiToken && accountId && (purpose === 'products/videos' || purpose === 'reviews/videos')) {
      try {
        const cfResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cfApiToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            maxDurationSeconds: 600,
            meta: {
              name: filename,
              purpose: purpose
            }
          })
        });

        if (cfResponse.ok) {
          const cfData = await cfResponse.json();
          if (cfData.success && cfData.result) {
            const uploadUrl = cfData.result.uploadURL;
            const videoId = cfData.result.uid;
            const publicUrl = `https://customer-${accountId}.cloudflarestream.com/${videoId}/iframe`;

            return res.status(200).json({
              presignedUrl: uploadUrl,
              publicUrl: publicUrl,
              isCloudflareStream: true
            });
          }
        }
        const errBody = await cfResponse.text();
        console.error('[Cloudflare Stream] Direct upload creation failed:', cfResponse.status, errBody);
      } catch (err) {
        console.error('[Cloudflare Stream] Direct upload creation failed with error:', err);
      }
    }

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
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Missing URL.' });
    }

    const isAdmin = !!(await verifyAdmin(req));
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
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
