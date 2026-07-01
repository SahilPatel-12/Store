import { createClient } from '@supabase/supabase-js';

export type VercelRequest = any;
export type VercelResponse = any;
import path from 'path';
import fs from 'fs';
import { BASE_URL } from '../seo-registry';
import { getProductSchema, getBreadcrumbSchema, getCollectionPageSchema } from '../schema-generator';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { slug, type } = req.query || {};

    if (!slug || !type) {
      return res.status(400).send('Missing parameter query.');
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Read index.html template from local workspace
    const templatePath = path.join(process.cwd(), 'index.html');
    let html = fs.readFileSync(templatePath, 'utf8');

    let title = 'Mantra Puja Store | Authentic Vedic Items';
    let description = 'Mantra Puja Store offers authentic, priest-energized Vedic puja kits, deity idols, and spiritual items from Varanasi.';
    let image = `${BASE_URL}/logo.png`;
    let canonical = `${BASE_URL}/${type}/${slug}`;
    let schemaJson: any = null;
    let isFound = false;

    if (type === 'product') {
      // Query product details from database
      const { data: product, error } = await supabase
        .from('website_pooja_products')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();

      if (!error && product) {
        isFound = true;
        title = product.seo_title || `${product.name} | Mantra Puja Store`;
        description = product.seo_description || product.description || product.short_description || description;
        
        // Format absolute image URL
        if (product.image && typeof product.image === 'string' && !product.image.startsWith('http')) {
          image = product.image.startsWith('/') ? `${BASE_URL}${product.image}` : `${BASE_URL}/${product.image}`;
        } else if (product.image) {
          image = product.image;
        }

        if (product.canonical_url) {
          canonical = product.canonical_url;
        }

        // Generate JSON-LD schemas
        const productSchema = getProductSchema(product);
        const breadcrumbs = getBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Shop', url: '/shop' },
          { name: product.category, url: `/category/${getCategorySlug(product.category)}` },
          { name: product.name, url: `/product/${product.slug}` }
        ]);
        
        schemaJson = [productSchema, breadcrumbs];
      }
    } else if (type === 'category') {
      // Category metadata retrieval
      const { data: products, error } = await supabase
        .from('website_pooja_products')
        .select('slug, category, is_published')
        .eq('is_published', true);

      if (!error && products) {
        const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
        const matchingCategory = uniqueCategories.find(cat => getCategorySlug(cat) === slug);

        if (matchingCategory) {
          isFound = true;
          title = `${matchingCategory} Collections | Mantra Puja Store`;
          description = `Explore our authentic, priest-energized selection of ${matchingCategory} items direct from Varanasi.`;
          
          const categoryProducts = products.filter(p => p.category === matchingCategory);
          const collectionSchema = getCollectionPageSchema(matchingCategory, categoryProducts);
          const breadcrumbs = getBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Shop', url: '/shop' },
            { name: matchingCategory, url: `/category/${slug}` }
          ]);
          schemaJson = [collectionSchema, breadcrumbs];
        }
      }
    }

    if (!isFound) {
      // Soft 404 Prevention: return true HTTP 404 Not Found
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      
      html = html.replace('<head>', '<head>\n    <meta name="robots" content="noindex, nofollow" />');
      html = html.replace(/<title>[^<]*<\/title>/, '<title>Page Not Found | Mantra Puja</title>');
      return res.status(404).send(html);
    }

    // Escape helper
    const escapeAttr = (str: string) => str.replace(/"/g, '&quot;');

    // Title replacements
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
    
    // Injects/Updates meta description
    html = replaceMetaTag(html, 'name', 'description', escapeAttr(description));
    
    // Injects/Updates Open Graph meta
    html = replaceMetaTag(html, 'property', 'og:title', escapeAttr(title));
    html = replaceMetaTag(html, 'property', 'og:description', escapeAttr(description));
    html = replaceMetaTag(html, 'property', 'og:image', escapeAttr(image));
    html = replaceMetaTag(html, 'property', 'og:url', escapeAttr(canonical));
    
    // Injects/Updates Twitter meta
    html = replaceMetaTag(html, 'name', 'twitter:title', escapeAttr(title));
    html = replaceMetaTag(html, 'name', 'twitter:description', escapeAttr(description));
    html = replaceMetaTag(html, 'name', 'twitter:image', escapeAttr(image));
    html = replaceMetaTag(html, 'name', 'twitter:card', 'summary_large_image');

    // Injects canonical link and JSON-LD structured data script
    let headAdditions = `\n    <link rel="canonical" href="${canonical}" />`;
    if (schemaJson) {
      headAdditions += `\n    <script type="application/ld+json">\n${JSON.stringify(schemaJson, null, 2)}\n    </script>`;
    }
    
    html = html.replace('</head>', `${headAdditions}\n  </head>`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    // Edge cache rules for bots (1 hour in browser, 24 hours edge CDN cache)
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=600');
    return res.status(200).send(html);

  } catch (err: any) {
    console.error('[seo-render] Pre-render failure exception:', err);
    return res.status(500).send('Internal pre-render failure: ' + err.message);
  }
}

// Category slug helper
const getCategorySlug = (category: string): string => {
  return category
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[-\s]+/g, '-');
};

// Resilient helper to replace or insert meta tags
function replaceMetaTag(htmlContent: string, attributeName: 'name' | 'property', attributeValue: string, newContent: string): string {
  const regex = new RegExp(`<meta\\s+[^>]*(?:${attributeName})="\\s*${attributeValue.replace(/:/g, '\\:')}\\s*"[^>]*content="[^"]*"[^>]*\\/?>|<meta\\s+content="[^"]*"\\s+[^>]*(?:${attributeName})="\\s*${attributeValue.replace(/:/g, '\\:')}\\s*"[^>]*\\/?>`, 'i');
  
  const newTag = `<meta ${attributeName}="${attributeValue}" content="${newContent}" />`;
  
  if (regex.test(htmlContent)) {
    return htmlContent.replace(regex, newTag);
  }
  
  // Fallback: inject in head before closure
  return htmlContent.replace('</head>', `    ${newTag}\n  </head>`);
}
