import { SitemapModuleConfig } from './types';

export const BASE_URL = 'https://www.mantrapuja.com'; // Canonical production root domain

export const sitemapRegistry: SitemapModuleConfig[] = [
  {
    id: 'home',
    name: 'Home Altar',
    enabled: true,
    type: 'static',
    staticPath: '/',
    priority: 1.0,
    changefreq: 'daily',
    includeInHTML: true,
    includeInXML: true,
    robotsPolicy: 'index, follow'
  },
  {
    id: 'shop',
    name: 'Spiritual Shop',
    enabled: true,
    type: 'static',
    staticPath: '/shop',
    priority: 0.9,
    changefreq: 'daily',
    includeInHTML: true,
    includeInXML: true,
    robotsPolicy: 'index, follow'
  },
  {
    id: 'about',
    name: 'Brand Story',
    enabled: true,
    type: 'static',
    staticPath: '/about',
    priority: 0.5,
    changefreq: 'monthly',
    includeInHTML: true,
    includeInXML: true,
    robotsPolicy: 'index, follow'
  },
  {
    id: 'contact',
    name: 'Contact Support',
    enabled: true,
    type: 'static',
    staticPath: '/contact',
    priority: 0.5,
    changefreq: 'monthly',
    includeInHTML: true,
    includeInXML: true,
    robotsPolicy: 'index, follow'
  },
  {
    id: 'policies',
    name: 'Divine Policies',
    enabled: true,
    type: 'static',
    staticPath: '/policies',
    priority: 0.5,
    changefreq: 'monthly',
    includeInHTML: true,
    includeInXML: true,
    robotsPolicy: 'index, follow'
  },
  {
    id: 'affiliation',
    name: 'Affiliation Program',
    enabled: true,
    type: 'static',
    staticPath: '/affiliation',
    priority: 0.6,
    changefreq: 'weekly',
    includeInHTML: true,
    includeInXML: true,
    robotsPolicy: 'index, follow'
  },
  {
    id: 'products',
    name: 'Puja Products',
    enabled: true,
    type: 'dynamic',
    supabaseTable: 'website_pooja_products',
    slugField: 'slug',
    publishedField: 'is_published',
    lastmodField: 'updated_at',
    priority: 0.8,
    changefreq: 'weekly',
    includeInHTML: true,
    includeInXML: true,
    robotsPolicy: 'index, follow',
    schemaType: 'Product'
  },
  // Future Expansion Modules (Keep disabled: false, can be enabled on-demand)
  {
    id: 'blogs',
    name: 'Sacred Blogs',
    enabled: false,
    type: 'dynamic',
    supabaseTable: 'website_blogs',
    slugField: 'slug',
    publishedField: 'is_published',
    lastmodField: 'updated_at',
    priority: 0.7,
    changefreq: 'weekly',
    includeInHTML: true,
    includeInXML: true,
    robotsPolicy: 'index, follow',
    schemaType: 'Article'
  },
  {
    id: 'pundits',
    name: 'Pandit Profiles',
    enabled: false,
    type: 'dynamic',
    supabaseTable: 'website_pundits',
    slugField: 'slug',
    publishedField: 'is_active',
    lastmodField: 'updated_at',
    priority: 0.8,
    changefreq: 'weekly',
    includeInHTML: true,
    includeInXML: true,
    robotsPolicy: 'index, follow',
    schemaType: 'ProfilePage'
  },
  {
    id: 'temples',
    name: 'Temples & Shrines',
    enabled: false,
    type: 'dynamic',
    supabaseTable: 'website_temples',
    slugField: 'slug',
    publishedField: 'is_active',
    lastmodField: 'updated_at',
    priority: 0.7,
    changefreq: 'monthly',
    includeInHTML: true,
    includeInXML: true,
    robotsPolicy: 'index, follow',
    schemaType: 'CollectionPage'
  }
];
