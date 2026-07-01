import type { SitemapNode } from './types';

export const buildXmlSitemap = (nodes: SitemapNode[]): string => {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
  xml += ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

  for (const node of nodes) {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(node.loc)}</loc>\n`;
    if (node.lastmod) {
      xml += `    <lastmod>${node.lastmod}</lastmod>\n`;
    }
    if (node.changefreq) {
      xml += `    <changefreq>${node.changefreq}</changefreq>\n`;
    }
    if (node.priority !== undefined) {
      xml += `    <priority>${node.priority.toFixed(1)}</priority>\n`;
    }
    if (node.images && node.images.length > 0) {
      for (const img of node.images) {
        if (img) {
          xml += '    <image:image>\n';
          xml += `      <image:loc>${escapeXml(img)}</image:loc>\n`;
          xml += '    </image:image>\n';
        }
      }
    }
    xml += '  </url>\n';
  }

  xml += '</urlset>';
  return xml;
};

const escapeXml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};
