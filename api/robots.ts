import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildRobotsTxt } from '../src/seo/robots-generator';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const robots = buildRobotsTxt();
    res.setHeader('Content-Type', 'text/plain');
    // Set 24 hour CDN edge cache
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.status(200).send(robots);
  } catch (err: any) {
    console.error('[robots] Internal compilation exception:', err);
    return res.status(500).send('User-agent: *\nDisallow: /admin/\nDisallow: /pundit-dashboard/');
  }
}
