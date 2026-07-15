import { sitemapRegistry, BASE_URL } from './seo-registry';

export const buildRobotsTxt = (): string => {
  let robots = 'User-agent: *\n';
  
  // Strictly disallow indexing of checkout, customer accounts, and administrative gateways
  robots += 'Disallow: /admin/\n';
  robots += 'Disallow: /admin\n';
  robots += 'Disallow: /pundit-dashboard/\n';
  robots += 'Disallow: /pundit-dashboard\n';
  robots += 'Disallow: /checkout/\n';
  robots += 'Disallow: /checkout\n';
  robots += 'Disallow: /orders/\n';
  robots += 'Disallow: /orders\n';
  robots += 'Disallow: /profile/\n';
  robots += 'Disallow: /profile\n';
  robots += 'Disallow: /wishlist/\n';
  robots += 'Disallow: /wishlist\n';
  robots += 'Disallow: /notifications/\n';
  robots += 'Disallow: /notifications\n';
  robots += 'Disallow: /cart/\n';
  robots += 'Disallow: /cart\n';
  robots += 'Disallow: /auth/\n';
  robots += 'Disallow: /auth\n';
  robots += 'Disallow: /admin-login/\n';
  robots += 'Disallow: /admin-login\n';
  robots += 'Disallow: /astrologer-dashboard/\n';
  robots += 'Disallow: /astrologer-dashboard\n';
  robots += 'Disallow: /style-login/\n';
  robots += 'Disallow: /style-login\n';
  robots += 'Disallow: /search\n'; // Block search queries parsing to prevent keyword spam
  
  // Explicitly allow indexing of public sitemap configuration paths
  for (const module of sitemapRegistry) {
    if (module.enabled && module.robotsPolicy === 'index, follow') {
      if (module.type === 'static' && module.staticPath) {
        robots += `Allow: ${module.staticPath}\n`;
      }
    }
  }

  // Reference the dynamic XML sitemap root location
  robots += `\nSitemap: ${BASE_URL}/sitemap.xml\n`;
  return robots;
};
