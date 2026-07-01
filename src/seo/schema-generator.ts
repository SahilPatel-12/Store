import { BASE_URL } from './seo-registry';

export const getOrganizationSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${BASE_URL}/#organization`,
    'name': 'Mantra Puja',
    'url': BASE_URL,
    'logo': `${BASE_URL}/logo.png`,
    'sameAs': [
      'https://www.facebook.com/mantrapujastore',
      'https://twitter.com/mantrapujastore',
      'https://www.instagram.com/mantrapujastore'
    ],
    'contactPoint': {
      '@type': 'ContactPoint',
      'telephone': '+1-800-108-6666',
      'contactType': 'customer support',
      'email': 'support@mantrapuja.com',
      'areaServed': 'IN'
    }
  };
};

export const getWebsiteSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BASE_URL}/#website`,
    'url': BASE_URL,
    'name': 'Mantra Puja Store',
    'description': 'Mantra Puja Store offers authentic, priest-energized Vedic puja kits, deity idols, and spiritual items from Varanasi.',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': {
        '@type': 'EntryPoint',
        'urlTemplate': `${BASE_URL}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };
};

export const getProductSchema = (product: any) => {
  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
  const image = product.image || `${BASE_URL}/logo.png`;
  const slug = product.slug || '';
  
  const offers: any = {
    '@type': 'Offer',
    'url': `${BASE_URL}/product/${slug}`,
    'priceCurrency': 'INR',
    'price': price,
    'priceValidUntil': new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    'availability': product.inStock !== false && product.in_stock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    'itemCondition': 'https://schema.org/NewCondition',
    'seller': {
      '@type': 'Organization',
      'name': 'Mantra Puja'
    }
  };

  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${BASE_URL}/product/${slug}#product`,
    'name': product.name,
    'image': image,
    'description': product.description || product.shortDescription || '',
    'sku': product.id,
    'mpn': product.id,
    'offers': offers
  };

  if (product.rating || product.reviewsCount) {
    const ratingValue = typeof product.rating === 'string' ? parseFloat(product.rating) : (product.rating || 5.0);
    const count = product.reviewsCount || product.reviews_count || 1;
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      'ratingValue': ratingValue,
      'reviewCount': count,
      'bestRating': '5',
      'worstRating': '1'
    };
  }

  return schema;
};

export const getBreadcrumbSchema = (crumbs: { name: string; url: string }[]) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': crumb.name,
      'item': crumb.url.startsWith('http') ? crumb.url : `${BASE_URL}${crumb.url}`
    }))
  };
};

export const getCollectionPageSchema = (categoryName: string, products: any[]) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${BASE_URL}/category/${categoryName.toLowerCase()}#collection`,
    'name': `${categoryName} Collection | Mantra Puja`,
    'description': `Explore our selection of energized ${categoryName} items for spiritual healing and rituals.`,
    'url': `${BASE_URL}/category/${categoryName.toLowerCase()}`,
    'mainEntity': {
      '@type': 'ItemList',
      'numberOfItems': products.length,
      'itemListElement': products.map((prod, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'url': `${BASE_URL}/product/${prod.slug || prod.id}`
      }))
    }
  };
};
