import { useEffect } from 'react';
import { BASE_URL } from './seo-registry';
import type { SEOProperties } from './types';

export const useSEO = (seo: SEOProperties | null) => {
  useEffect(() => {
    if (!seo) return;

    // 1. Title Update
    document.title = seo.title || 'Mantra Puja Store | Authentic Vedic Items';

    // 2. Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', seo.description || '');

    // 3. Canonical Link
    const canonicalHref = seo.canonical || `${BASE_URL}${window.location.pathname}`;
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', canonicalHref);

    // 4. Open Graph Meta Tags
    updateMetaTag('property', 'og:title', seo.ogTitle || seo.title);
    updateMetaTag('property', 'og:description', seo.ogDescription || seo.description);
    if (seo.ogImage) {
      updateMetaTag('property', 'og:image', seo.ogImage);
    }
    updateMetaTag('property', 'og:url', canonicalHref);

    // 5. Twitter Cards
    updateMetaTag('name', 'twitter:title', seo.ogTitle || seo.title);
    updateMetaTag('name', 'twitter:description', seo.ogDescription || seo.description);
    if (seo.ogImage) {
      updateMetaTag('name', 'twitter:image', seo.ogImage);
    }
    updateMetaTag('name', 'twitter:card', seo.twitterCard || 'summary_large_image');

    // 6. Robots instructions
    if (seo.robots) {
      updateMetaTag('name', 'robots', seo.robots);
    } else {
      updateMetaTag('name', 'robots', 'index, follow');
    }

  }, [seo]);
};

const updateMetaTag = (attribute: 'name' | 'property', nameValue: string, contentValue: string) => {
  let meta = document.querySelector(`meta[${attribute}="${nameValue}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, nameValue);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', contentValue || '');
};
