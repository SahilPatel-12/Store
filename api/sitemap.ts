import { createClient } from '@supabase/supabase-js';

export type VercelRequest = any;
export type VercelResponse = any;
import { sitemapRegistry, BASE_URL } from '../src/seo/seo-registry';
import { buildXmlSitemap } from '../src/seo/sitemap-generator';
import type { SitemapNode } from '../src/seo/types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Database credentials not configured in server environment.');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const nodes: SitemapNode[] = [];

    // Helper to format slug to a valid clean URL path
    const getCategorySlug = (category: string): string => {
      return category
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/[-\s]+/g, '-');
    };

    for (const moduleConfig of sitemapRegistry) {
      if (!moduleConfig.enabled || !moduleConfig.includeInXML) continue;

      if (moduleConfig.type === 'static' && moduleConfig.staticPath) {
        nodes.push({
          loc: `${BASE_URL}${moduleConfig.staticPath}`,
          changefreq: moduleConfig.changefreq,
          priority: moduleConfig.priority
        });
      } else if (moduleConfig.type === 'dynamic' && moduleConfig.supabaseTable) {
        const slugCol = moduleConfig.slugField || 'slug';
        const publishedCol = moduleConfig.publishedField || 'is_published';
        const lastmodCol = moduleConfig.lastmodField || 'updated_at';

        // Query dynamic database records from Supabase
        const { data, error } = await supabase
          .from(moduleConfig.supabaseTable as any)
          .select(`${slugCol}, ${publishedCol}, ${lastmodCol}, image, category` as any)
          .eq(publishedCol, true);

        if (error) {
          console.error(`[sitemap] Failed querying Supabase for table ${moduleConfig.supabaseTable}:`, error);
          continue;
        }

        const queryData = data as any[] | null;
        if (queryData && queryData.length > 0) {
          let prefix = '/';
          if (moduleConfig.id === 'products') prefix = '/product/';
          else if (moduleConfig.id === 'blogs') prefix = '/blog/';
          else if (moduleConfig.id === 'pundits') prefix = '/pundit/';
          else if (moduleConfig.id === 'temples') prefix = '/temple/';

          for (const item of queryData) {
            const slug = item[slugCol];
            if (!slug) continue;

            const node: SitemapNode = {
              loc: `${BASE_URL}${prefix}${slug}`,
              changefreq: moduleConfig.changefreq,
              priority: moduleConfig.priority,
              lastmod: item[lastmodCol] ? new Date(item[lastmodCol]).toISOString().split('T')[0] : undefined
            };

            // Set dynamic images in nodes to allow Google Image index matching
            if (item.image && typeof item.image === 'string' && !item.image.startsWith('http')) {
              // Convert relative paths to fully qualified URIs
              node.images = [item.image.startsWith('/') ? `${BASE_URL}${item.image}` : item.image];
            } else if (item.image && typeof item.image === 'string') {
              node.images = [item.image];
            }

            nodes.push(node);
          }

          // Special logic for dynamic products: generate category pages dynamically from categories active in database
          if (moduleConfig.id === 'products') {
            const uniqueCategories = Array.from(new Set(queryData.map(item => item.category).filter(Boolean)));
            for (const cat of uniqueCategories) {
              nodes.push({
                loc: `${BASE_URL}/category/${getCategorySlug(cat)}`,
                changefreq: 'weekly',
                priority: 0.8
              });
            }
          }
        }
      }
    }

    const xml = buildXmlSitemap(nodes);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    // Configure cache headers: 1 hour in browser, 24 hours on Vercel Edge CDN, stale-while-revalidate background refresh
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=600');
    return res.status(200).send(xml);
  } catch (err: any) {
    console.error('[sitemap] Internal builder failure:', err);
    return res.status(500).send('<?xml version="1.0" encoding="UTF-8"?>\n<error>Failed to compile dynamic sitemap</error>');
  }
}
