// src/seo/seo-registry.ts
var BASE_URL = "https://shop.mantrapuja.com";
var sitemapRegistry = [
  {
    id: "home",
    name: "Home Altar",
    enabled: true,
    type: "static",
    staticPath: "/",
    priority: 1,
    changefreq: "daily",
    includeInHTML: true,
    includeInXML: true,
    robotsPolicy: "index, follow"
  },
  {
    id: "shop",
    name: "Spiritual Shop",
    enabled: true,
    type: "static",
    staticPath: "/shop",
    priority: 0.9,
    changefreq: "daily",
    includeInHTML: true,
    includeInXML: true,
    robotsPolicy: "index, follow"
  },
  {
    id: "about",
    name: "Brand Story",
    enabled: true,
    type: "static",
    staticPath: "/about",
    priority: 0.5,
    changefreq: "monthly",
    includeInHTML: true,
    includeInXML: true,
    robotsPolicy: "index, follow"
  },
  {
    id: "contact",
    name: "Contact Support",
    enabled: true,
    type: "static",
    staticPath: "/contact",
    priority: 0.5,
    changefreq: "monthly",
    includeInHTML: true,
    includeInXML: true,
    robotsPolicy: "index, follow"
  },
  {
    id: "policies",
    name: "Divine Policies",
    enabled: true,
    type: "static",
    staticPath: "/policies",
    priority: 0.5,
    changefreq: "monthly",
    includeInHTML: true,
    includeInXML: true,
    robotsPolicy: "index, follow"
  },
  {
    id: "affiliation",
    name: "Affiliation Program",
    enabled: true,
    type: "static",
    staticPath: "/affiliation",
    priority: 0.6,
    changefreq: "weekly",
    includeInHTML: true,
    includeInXML: true,
    robotsPolicy: "index, follow"
  },
  {
    id: "auth",
    name: "Devotee Login Portal",
    enabled: true,
    type: "static",
    staticPath: "/auth",
    priority: 0.5,
    changefreq: "monthly",
    includeInHTML: true,
    includeInXML: true,
    robotsPolicy: "index, follow"
  },
  {
    id: "sitemap",
    name: "Sacred Sitemap",
    enabled: true,
    type: "static",
    staticPath: "/sitemap",
    priority: 0.5,
    changefreq: "weekly",
    includeInHTML: true,
    includeInXML: true,
    robotsPolicy: "index, follow"
  },
  {
    id: "pundit-login",
    name: "Pundit Portal Login",
    enabled: true,
    type: "static",
    staticPath: "/pundit-login",
    priority: 0.5,
    changefreq: "monthly",
    includeInHTML: true,
    includeInXML: true,
    robotsPolicy: "index, follow"
  },
  {
    id: "astrologer-login",
    name: "Astrologer Portal Login",
    enabled: true,
    type: "static",
    staticPath: "/astrologer-login",
    priority: 0.5,
    changefreq: "monthly",
    includeInHTML: true,
    includeInXML: true,
    robotsPolicy: "index, follow"
  },
  {
    id: "products",
    name: "Puja Products",
    enabled: true,
    type: "dynamic",
    supabaseTable: "website_pooja_products",
    slugField: "slug",
    publishedField: "is_published",
    lastmodField: "updated_at",
    priority: 0.8,
    changefreq: "weekly",
    includeInHTML: true,
    includeInXML: true,
    robotsPolicy: "index, follow",
    schemaType: "Product"
  },
  // Future Expansion Modules (Keep disabled: false, can be enabled on-demand)
  {
    id: "blogs",
    name: "Sacred Blogs",
    enabled: false,
    type: "dynamic",
    supabaseTable: "website_blogs",
    slugField: "slug",
    publishedField: "is_published",
    lastmodField: "updated_at",
    priority: 0.7,
    changefreq: "weekly",
    includeInHTML: true,
    includeInXML: true,
    robotsPolicy: "index, follow",
    schemaType: "Article"
  },
  {
    id: "pundits",
    name: "Pandit Profiles",
    enabled: false,
    type: "dynamic",
    supabaseTable: "website_pundits",
    slugField: "slug",
    publishedField: "is_active",
    lastmodField: "updated_at",
    priority: 0.8,
    changefreq: "weekly",
    includeInHTML: true,
    includeInXML: true,
    robotsPolicy: "index, follow",
    schemaType: "ProfilePage"
  },
  {
    id: "temples",
    name: "Temples & Shrines",
    enabled: false,
    type: "dynamic",
    supabaseTable: "website_temples",
    slugField: "slug",
    publishedField: "is_active",
    lastmodField: "updated_at",
    priority: 0.7,
    changefreq: "monthly",
    includeInHTML: true,
    includeInXML: true,
    robotsPolicy: "index, follow",
    schemaType: "CollectionPage"
  }
];

// src/seo/robots-generator.ts
var buildRobotsTxt = () => {
  let robots = "User-agent: *\n";
  robots += "Disallow: /admin/\n";
  robots += "Disallow: /admin\n";
  robots += "Disallow: /pundit-dashboard/\n";
  robots += "Disallow: /pundit-dashboard\n";
  robots += "Disallow: /checkout/\n";
  robots += "Disallow: /checkout\n";
  robots += "Disallow: /orders/\n";
  robots += "Disallow: /orders\n";
  robots += "Disallow: /profile/\n";
  robots += "Disallow: /profile\n";
  robots += "Disallow: /wishlist/\n";
  robots += "Disallow: /wishlist\n";
  robots += "Disallow: /notifications/\n";
  robots += "Disallow: /notifications\n";
  robots += "Disallow: /cart/\n";
  robots += "Disallow: /cart\n";
  robots += "Disallow: /auth/\n";
  robots += "Disallow: /auth\n";
  robots += "Disallow: /admin-login/\n";
  robots += "Disallow: /admin-login\n";
  robots += "Disallow: /astrologer-dashboard/\n";
  robots += "Disallow: /astrologer-dashboard\n";
  robots += "Disallow: /style-login/\n";
  robots += "Disallow: /style-login\n";
  robots += "Disallow: /search\n";
  for (const module of sitemapRegistry) {
    if (module.enabled && module.robotsPolicy === "index, follow") {
      if (module.type === "static" && module.staticPath) {
        robots += `Allow: ${module.staticPath}
`;
      }
    }
  }
  robots += `
Sitemap: ${BASE_URL}/sitemap.xml
`;
  return robots;
};

// src/seo/api/robots.ts
function handler(_req, res) {
  try {
    const robots = buildRobotsTxt();
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    return res.status(200).send(robots);
  } catch (err) {
    console.error("[robots] Internal compilation exception:", err);
    return res.status(500).send("User-agent: *\nDisallow: /admin/\nDisallow: /pundit-dashboard/");
  }
}
export {
  handler as default
};
