import { buildRobotsTxt } from '../robots-generator';

export type VercelRequest = any;
export type VercelResponse = any;

export default function handler(_req: VercelRequest, res: VercelResponse) {
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
