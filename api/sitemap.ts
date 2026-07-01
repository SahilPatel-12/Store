import { createClient } from '@supabase/supabase-js';

export type VercelRequest = any;
export type VercelResponse = any;

import { BASE_URL } from '../src/seo/seo-registry';
import { buildXmlSitemap } from '../src/seo/sitemap-generator';
import type { SitemapNode } from '../src/seo/types';
import { staticRoutes } from '../src/seo/static-routes';

// Enforce HTTPS canonical constraints and cleanup URLs
function cleanAndValidateUrl(loc: string, onInvalid: () => void): string | null {
  try {
    if (!loc) return null;
    let urlStr = loc.trim();
    
    if (urlStr.startsWith('http://')) {
      urlStr = 'https://' + urlStr.substring(7);
    }
    
    if (urlStr.startsWith('https://www.shop.mantrapuja.com')) {
      urlStr = 'https://shop.mantrapuja.com' + urlStr.substring(31);
    }
    
    if (!urlStr.startsWith('https://shop.mantrapuja.com')) {
      onInvalid();
      return null;
    }
    
    if (urlStr !== 'https://shop.mantrapuja.com/' && urlStr.endsWith('/')) {
      urlStr = urlStr.slice(0, -1);
    }
    
    const hashIdx = urlStr.indexOf('#');
    if (hashIdx !== -1) urlStr = urlStr.substring(0, hashIdx);
    
    const queryIdx = urlStr.indexOf('?');
    if (queryIdx !== -1) urlStr = urlStr.substring(0, queryIdx);
    
    return urlStr;
  } catch {
    onInvalid();
    return null;
  }
}

// Helper to format slug to a valid clean URL path segment
const getCategorySlug = (category: string): string => {
  return category
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[-\s]+/g, '-');
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();
  
  let staticCount = 0;
  let productsCount = 0;
  let categoriesCount = 0;
  let punditsCount = 0;
  let blogsCount = 0;
  let collectionsCount = 0;
  let brandsCount = 0;
  let articlesCount = 0;
  let festivalsCount = 0;
  let pujasCount = 0;
  let duplicatesCount = 0;
  let invalidCount = 0;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Database credentials not configured in server environment.');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { sub } = req.query || {};

    // 1. ROOT SITEMAP INDEX GENERATION
    if (!sub) {
      let indexXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      indexXml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      
      const childSitemaps = [
        'static',
        'products',
        'categories',
        'pundits',
        'blogs',
        'collections',
        'brands',
        'articles',
        'festivals',
        'pujas',
        'images'
      ];

      for (const name of childSitemaps) {
        indexXml += '  <sitemap>\n';
        indexXml += `    <loc>${BASE_URL}/sitemap-${name}.xml</loc>\n`;
        indexXml += '  </sitemap>\n';
      }

      indexXml += '</sitemapindex>';
      
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=600');
      return res.status(200).send(indexXml);
    }

    // 2. CHILD SITEMAP GENERATION
    let rawNodes: SitemapNode[] = [];
    const incrementInvalid = () => { invalidCount++; };

    if (sub === 'static') {
      const paths = staticRoutes;
      staticCount = paths.length;
      for (const p of paths) {
        let priority = 0.5;
        let changefreq = 'monthly';

        if (p === '/') {
          priority = 1.0;
          changefreq = 'daily';
        } else if (p === '/shop') {
          priority = 0.9;
          changefreq = 'daily';
        } else if (p === '/policies') {
          priority = 0.3;
          changefreq = 'monthly';
        } else if (p === '/affiliation') {
          priority = 0.6;
          changefreq = 'weekly';
        }

        rawNodes.push({
          loc: `${BASE_URL}${p}`,
          changefreq,
          priority
        });
      }
    } else if (sub === 'products') {
      const { data, error } = await supabase
        .from('website_pooja_products')
        .select('slug, updated_at')
        .eq('is_published', true);

      if (!error && data) {
        productsCount = data.length;
        for (const item of data) {
          if (item.slug) {
            rawNodes.push({
              loc: `${BASE_URL}/product/${item.slug}`,
              changefreq: 'weekly',
              priority: 0.8,
              lastmod: item.updated_at ? new Date(item.updated_at).toISOString().split('T')[0] : undefined
            });
          }
        }
      }
    } else if (sub === 'categories') {
      const { data, error } = await supabase
        .from('website_pooja_products')
        .select('category')
        .eq('is_published', true);

      if (!error && data) {
        const uniqueCategories = Array.from(new Set(data.map(item => item.category).filter(Boolean)));
        categoriesCount = uniqueCategories.length;
        for (const cat of uniqueCategories) {
          rawNodes.push({
            loc: `${BASE_URL}/category/${getCategorySlug(cat)}`,
            changefreq: 'weekly',
            priority: 0.8
          });
        }
      }
    } else if (sub === 'pundits') {
      const { data, error } = await supabase
        .from('website_store_pundits')
        .select('id, updated_at')
        .eq('status', 'approved'); // Only index fully approved pundit profiles

      if (!error && data) {
        punditsCount = data.length;
        for (const item of data) {
          rawNodes.push({
            loc: `${BASE_URL}/pundit/${item.id}`,
            changefreq: 'weekly',
            priority: 0.7,
            lastmod: item.updated_at ? new Date(item.updated_at).toISOString().split('T')[0] : undefined
          });
        }
      }
    } else if (sub === 'images') {
      // Gather images for products
      const { data: prodData } = await supabase
        .from('website_pooja_products')
        .select('slug, image')
        .eq('is_published', true);

      if (prodData) {
        for (const item of prodData) {
          if (item.slug && item.image) {
            const imgUrl = item.image.startsWith('http') ? item.image : `${BASE_URL}${item.image.startsWith('/') ? '' : '/'}${item.image}`;
            rawNodes.push({
              loc: `${BASE_URL}/product/${item.slug}`,
              images: [imgUrl]
            });
          }
        }
      }

      // Gather photos for pundits
      const { data: punditData } = await supabase
        .from('website_store_pundits')
        .select('id, profile_photo')
        .eq('status', 'approved');

      if (punditData) {
        for (const item of punditData) {
          if (item.id && item.profile_photo) {
            const imgUrl = item.profile_photo.startsWith('http') ? item.profile_photo : `${BASE_URL}${item.profile_photo.startsWith('/') ? '' : '/'}${item.profile_photo}`;
            rawNodes.push({
              loc: `${BASE_URL}/pundit/${item.id}`,
              images: [imgUrl]
            });
          }
        }
      }
    } else {
      // DYNAMIC FAIL-SOFT ADAPTIVE MODEL DISCOVERY
      const fallbacksMap: Record<string, string[]> = {
        blogs: ['website_store_blogs', 'website_blogs', 'blogs', 'posts'],
        collections: ['website_store_collections', 'website_collections', 'collections'],
        brands: ['website_store_brands', 'website_brands', 'brands'],
        articles: ['website_store_articles', 'website_articles', 'articles'],
        festivals: ['website_store_festivals', 'website_festivals', 'festivals'],
        pujas: ['website_store_pujas', 'website_pujas', 'pujas']
      };

      const candidateTables = fallbacksMap[sub] || [`website_store_${sub}`, sub];
      let activeTable = '';
      let schemaSample: any = null;

      for (const table of candidateTables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (!error) {
          activeTable = table;
          if (data && data.length > 0) {
            schemaSample = data[0];
          }
          break;
        }
      }

      if (activeTable) {
        // Auto-discover schema fields
        let statusCol = '';
        let slugCol = 'slug';
        let lastmodCol = 'updated_at';
        let imageCol = '';

        if (schemaSample) {
          const keys = Object.keys(schemaSample);
          
          const statusCandidates = ['is_published', 'published', 'is_active', 'active', 'enabled'];
          for (const cand of statusCandidates) {
            if (keys.some(k => k.toLowerCase() === cand)) {
              statusCol = keys.find(k => k.toLowerCase() === cand) || '';
              break;
            }
          }

          if (!keys.includes('slug') && keys.includes('id')) {
            slugCol = 'id';
          }

          const lastmodCandidates = ['updated_at', 'lastmod', 'last_modified', 'created_at'];
          for (const cand of lastmodCandidates) {
            if (keys.includes(cand)) {
              lastmodCol = cand;
              break;
            }
          }

          const imageCandidates = ['image', 'profile_photo', 'image_url', 'cover_image', 'thumbnail', 'cover'];
          for (const cand of imageCandidates) {
            if (keys.includes(cand)) {
              imageCol = cand;
              break;
            }
          }
        }

        let query = supabase.from(activeTable).select('*');
        if (statusCol) {
          query = query.eq(statusCol, true);
        }

        const { data: rows, error: fetchErr } = await query;
        if (!fetchErr && rows) {
          const rowCount = rows.length;
          if (sub === 'blogs') blogsCount = rowCount;
          else if (sub === 'collections') collectionsCount = rowCount;
          else if (sub === 'brands') brandsCount = rowCount;
          else if (sub === 'articles') articlesCount = rowCount;
          else if (sub === 'festivals') festivalsCount = rowCount;
          else if (sub === 'pujas') pujasCount = rowCount;

          const defaultPriority = sub === 'blogs' ? 0.7 : 0.5;
          const defaultChangefreq = sub === 'blogs' ? 'weekly' : 'monthly';

          for (const row of rows) {
            const slugVal = row[slugCol];
            if (!slugVal) continue;

            const prefix = sub.endsWith('s') ? sub.slice(0, -1) : sub;
            const node: SitemapNode = {
              loc: `${BASE_URL}/${prefix}/${slugVal}`,
              priority: defaultPriority,
              changefreq: defaultChangefreq,
              lastmod: row[lastmodCol] ? new Date(row[lastmodCol]).toISOString().split('T')[0] : undefined
            };

            if (imageCol && row[imageCol]) {
              const rawImg = row[imageCol];
              node.images = [rawImg.startsWith('http') ? rawImg : `${BASE_URL}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`];
            }

            rawNodes.push(node);
          }
        }
      } else {
        console.info(`[sitemap] Dynamic table candidate set for sub=${sub} is not available in schema cache. Gracefully returning empty child sitemap.`);
      }
    }

    // 3. APPLY CANONICAL VALIDATIONS & DEDUPLICATION
    const deduplicatedNodesMap = new Map<string, SitemapNode>();
    for (const node of rawNodes) {
      const canonicalUrl = cleanAndValidateUrl(node.loc, incrementInvalid);
      if (canonicalUrl) {
        if (deduplicatedNodesMap.has(canonicalUrl)) {
          duplicatesCount++;
          // Merge images if deduping
          if (node.images && node.images.length > 0) {
            const existingNode = deduplicatedNodesMap.get(canonicalUrl)!;
            existingNode.images = Array.from(new Set([...(existingNode.images || []), ...node.images]));
          }
        } else {
          node.loc = canonicalUrl;
          deduplicatedNodesMap.set(canonicalUrl, node);
        }
      }
    }

    const finalNodes = Array.from(deduplicatedNodesMap.values());
    let xml = buildXmlSitemap(finalNodes);

    // 4. DEVELOPMENT DIAGNOSTIC LOGGING (XML comment)
    const isDev = process.env.NODE_ENV !== 'production' || req.query.debug === 'true';
    if (isDev) {
      const genTime = Date.now() - startTime;
      xml += `\n<!--\nSitemap Diagnostic Audit (sub=${sub}):\n`;
      xml += `- Static Pages Discovered: ${staticCount}\n`;
      xml += `- Products Discovered: ${productsCount}\n`;
      xml += `- Categories Discovered: ${categoriesCount}\n`;
      xml += `- Pundits Discovered: ${punditsCount}\n`;
      xml += `- Blogs Discovered: ${blogsCount}\n`;
      xml += `- Collections Discovered: ${collectionsCount}\n`;
      xml += `- Brands Discovered: ${brandsCount}\n`;
      xml += `- Articles Discovered: ${articlesCount}\n`;
      xml += `- Festivals Discovered: ${festivalsCount}\n`;
      xml += `- Pujas Discovered: ${pujasCount}\n`;
      xml += `- Total Canonical URLs Listed: ${finalNodes.length}\n`;
      xml += `- Duplicates Merged/Removed: ${duplicatesCount}\n`;
      xml += `- Invalid URLs Filtered: ${invalidCount}\n`;
      xml += `- Generation Time: ${genTime}ms\n`;
      xml += `-->`;
    }

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=600');
    return res.status(200).send(xml);

  } catch (err: any) {
    console.error('[sitemap] Failed compilation of dynamic XML sitemap:', err);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(500).send('<?xml version="1.0" encoding="UTF-8"?>\n<error>Internal sitemap index compiler error: ' + err.message + '</error>');
  }
}
