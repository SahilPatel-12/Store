export interface SitemapModuleConfig {
  id: string;
  name: string;
  enabled: boolean;
  type: 'static' | 'dynamic';
  staticPath?: string;
  supabaseTable?: string;
  slugField?: string;
  publishedField?: string;
  lastmodField?: string;
  priority: number;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  includeInHTML: boolean;
  includeInXML: boolean;
  robotsPolicy: 'index, follow' | 'noindex, nofollow' | 'noindex, follow';
  schemaType?: 'Product' | 'CollectionPage' | 'Article' | 'Event' | 'ProfilePage';
}

export interface SEOProperties {
  title: string;
  description: string;
  canonical?: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  robots?: string;
}

export interface SitemapNode {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
  images?: string[];
}
