export function middleware(request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';

  // Match common search engine spiders and social media scrapers
  const isBot = /googlebot|bingbot|yandex|baiduspider|twitterbot|facebookexternalhit|whatsapp|slackbot|telegrambot|pinterest/i.test(userAgent);

  if (isBot) {
    // Intercept dynamic product details pages
    const productMatch = url.pathname.match(/^\/product\/([^/]+)\/?$/);
    if (productMatch) {
      const slug = productMatch[1];
      url.pathname = '/api/seo-render';
      url.searchParams.set('slug', slug);
      url.searchParams.set('type', 'product');

      return new Response(null, {
        headers: {
          'x-middleware-rewrite': url.toString()
        }
      });
    }

    // Intercept dynamic category pages
    const categoryMatch = url.pathname.match(/^\/category\/([^/]+)\/?$/);
    if (categoryMatch) {
      const slug = categoryMatch[1];
      url.pathname = '/api/seo-render';
      url.searchParams.set('slug', slug);
      url.searchParams.set('type', 'category');

      return new Response(null, {
        headers: {
          'x-middleware-rewrite': url.toString()
        }
      });
    }
  }

  // Fallback to serving the standard static page to normal users
  return new Response(null, {
    headers: {
      'x-middleware-next': '1'
    }
  });
}
