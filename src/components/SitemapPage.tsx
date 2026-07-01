import React, { useState, useMemo, useRef } from 'react';
import { Search, Compass, ShoppingBag, User, Heart, Settings, ShieldAlert, FileText, ChevronRight, HelpCircle } from 'lucide-react';

interface SitemapPageProps {
  products: any[];
  onNavigate: (
    page: 'home' | 'shop' | 'category' | 'detail' | 'search' | 'cart' | 'checkout' | 'success' | 'profile' | 'orders' | 'wishlist' | 'about' | 'contact' | 'policies' | 'admin' | 'admin-login' | 'user-auth' | 'affiliation' | 'notifications' | 'pundit-login' | 'pundit-dashboard',
    options?: any
  ) => void;
  onTrackEvent?: (eventName: string, details?: any) => void;
}

export const SitemapPage: React.FC<SitemapPageProps> = ({
  products = [],
  onNavigate,
  onTrackEvent
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Group products by category
  const productsByCategory = useMemo(() => {
    const groups: Record<string, any[]> = {};
    for (const p of products) {
      if (p.category) {
        if (!groups[p.category]) groups[p.category] = [];
        groups[p.category].push(p);
      }
    }
    return groups;
  }, [products]);

  // Clean category slug helper
  const getCategorySlug = (category: string): string => {
    return category
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[-\s]+/g, '-');
    };

  // Filtered links for search queries
  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return null;

    const matchedProducts: any[] = [];
    const matchedCategories = new Set<string>();

    products.forEach((p) => {
      if (p.name.toLowerCase().includes(query) || p.description?.toLowerCase().includes(query)) {
        matchedProducts.push(p);
      }
      if (p.category.toLowerCase().includes(query)) {
        matchedCategories.add(p.category);
      }
    });

    return {
      products: matchedProducts,
      categories: Array.from(matchedCategories)
    };
  }, [searchQuery, products]);

  const handleLinkClick = (pageName: string, path: string, options?: any) => {
    if (onTrackEvent) {
      onTrackEvent('sitemap_click', { page: pageName, path });
    }
    onNavigate(pageName as any, options);
  };

  const toggleCategory = (cat: string) => {
    if (onTrackEvent) {
      onTrackEvent('sitemap_category_toggle', { category: cat });
    }
    setExpandedCategory(expandedCategory === cat ? null : cat);
  };

  return (
    <div className="fade-in-entry" style={{
      maxWidth: '1000px',
      margin: '40px auto',
      padding: '0 24px',
      color: 'var(--text-primary)',
      textAlign: 'left'
    }}>
      {/* Sitemap Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.1), rgba(249, 115, 22, 0.1))',
          color: 'var(--primary-accent)',
          marginBottom: '16px'
        }}>
          <Compass size={32} />
        </div>
        <h1 style={{
          fontSize: '2.2rem',
          fontWeight: 900,
          color: 'var(--primary-forest)',
          marginBottom: '8px',
          letterSpacing: '-0.5px'
        }}>
          Sacred Sitemap & Directory
        </h1>
        <p style={{
          fontSize: '0.98rem',
          color: 'var(--text-secondary)',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Browse the complete catalog of priest-energized Vedic puja items, category listings, policies, and devotee account directories.
        </p>
      </div>

      {/* Dynamic Search Dashboard */}
      <div style={{
        position: 'relative',
        maxWidth: '500px',
        margin: '0 auto 40px auto',
        display: 'flex',
        alignItems: 'center'
      }}>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search site layout, items, categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search Sitemap Directory"
          style={{
            width: '100%',
            padding: '12px 16px 12px 46px',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            outline: 'none',
            fontSize: '0.95rem',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--primary-gold)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
        />
        <Search size={18} style={{
          position: 'absolute',
          left: '16px',
          color: 'var(--text-muted)',
          pointerEvents: 'none'
        }} />
      </div>

      {/* Search Results Overlay */}
      {searchQuery && filteredData && (
        <div className="glass" style={{
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '32px',
          border: '1px solid rgba(234, 88, 12, 0.15)'
        }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-accent)', marginBottom: '16px' }}>
            🔍 Search Results Matching "{searchQuery}"
          </h2>
          {filteredData.products.length === 0 && filteredData.categories.length === 0 ? (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No matches found. Try using broader keywords.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredData.categories.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Matching Categories</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {filteredData.categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => handleLinkClick('category', `/category/${getCategorySlug(cat)}`, { categoryName: cat })}
                        className="btn-outline"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {filteredData.products.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Matching Products</h3>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '6px', listStyle: 'none', padding: 0 }}>
                    {filteredData.products.map(p => (
                      <li key={p.id}>
                        <button
                          onClick={() => handleLinkClick('detail', `/product/${p.slug || p.id}`, { product: p })}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: 'var(--text-primary)',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            textAlign: 'left'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-accent)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                        >
                          <ChevronRight size={14} style={{ color: 'var(--primary-gold)' }} />
                          <span>{p.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>in {p.category}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Sitemap Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr 1fr',
        gap: '30px',
        alignItems: 'start'
      }} className="hero-grid-split">
        
        {/* Column 1: Divine Product Catalog */}
        <section aria-labelledby="catalog-heading" className="glass" style={{
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
            <ShoppingBag size={20} style={{ color: 'var(--primary-accent)' }} />
            <h2 id="catalog-heading" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
              Spiritual Shop
            </h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => handleLinkClick('shop', '/shop')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(234, 88, 12, 0.04)',
                color: 'var(--primary-accent)',
                fontWeight: 700,
                fontSize: '0.9rem',
                transition: 'all 0.2s',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(234, 88, 12, 0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(234, 88, 12, 0.04)'}
            >
              <span>View All Collections</span>
              <ChevronRight size={16} />
            </button>

            {/* Expandable Category Accordions */}
            {Object.keys(productsByCategory).map((cat) => {
              const isOpen = expandedCategory === cat;
              const catSlug = getCategorySlug(cat);
              const items = productsByCategory[cat];
              
              return (
                <div key={cat} style={{
                  border: '1.5px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    backgroundColor: isOpen ? 'var(--bg-secondary)' : '#ffffff'
                  }}>
                    <button
                      onClick={() => handleLinkClick('category', `/category/${catSlug}`, { categoryName: cat })}
                      style={{
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-accent)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                    >
                      {cat} ({items.length})
                    </button>
                    
                    <button
                      onClick={() => toggleCategory(cat)}
                      aria-expanded={isOpen}
                      aria-label={`Toggle ${cat} items`}
                      style={{
                        padding: '4px',
                        borderRadius: '4px',
                        color: 'var(--text-muted)'
                      }}
                    >
                      <ChevronRight size={16} style={{
                        transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                      }} />
                    </button>
                  </div>

                  {isOpen && (
                    <ul style={{
                      listStyle: 'none',
                      padding: '8px 12px 12px 12px',
                      borderTop: '1px solid var(--border-light)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      backgroundColor: '#ffffff'
                    }}>
                      {items.map(p => (
                        <li key={p.id}>
                          <button
                            onClick={() => handleLinkClick('detail', `/product/${p.slug || p.id}`, { product: p })}
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: 500,
                              color: 'var(--text-secondary)',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-accent)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                          >
                            <ChevronRight size={10} style={{ color: 'var(--primary-gold)' }} />
                            <span>{p.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Column 2: Devotee & Pundit Portals */}
        <section aria-labelledby="devotee-heading" className="glass" style={{
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
            <User size={20} style={{ color: 'var(--primary-accent)' }} />
            <h2 id="devotee-heading" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
              Devotee Hub
            </h2>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <li>
              <button
                onClick={() => handleLinkClick('user-auth', '/auth')}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'left' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-accent)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <User size={16} style={{ color: 'var(--primary-gold)' }} />
                <span>Devotee Login / Signup</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleLinkClick('profile', '/profile')}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'left' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-accent)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <Settings size={16} style={{ color: 'var(--primary-gold)' }} />
                <span>My Dashboard & Addresses</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleLinkClick('orders', '/orders')}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'left' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-accent)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <ShoppingBag size={16} style={{ color: 'var(--primary-gold)' }} />
                <span>Order History & Invoices</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleLinkClick('wishlist', '/wishlist')}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'left' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-accent)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <Heart size={16} style={{ color: 'var(--primary-gold)' }} />
                <span>Sacred Wishlist</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleLinkClick('affiliation', '/affiliation')}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'left' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-accent)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <Compass size={16} style={{ color: 'var(--primary-gold)' }} />
                <span>Affiliate Partner Center</span>
              </button>
            </li>
            
            <li style={{ borderTop: '1px solid var(--border-light)', paddingTop: '14px', marginTop: '6px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Pundit Gateways
              </div>
              <button
                onClick={() => handleLinkClick('pundit-login', '/pundit-login')}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'left' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-accent)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <User size={16} style={{ color: 'var(--primary-accent)' }} />
                <span>Pundit Login Portal</span>
              </button>
            </li>
          </ul>
        </section>

        {/* Column 3: Corporate, Help & Administrative */}
        <section aria-labelledby="essence-heading" className="glass" style={{
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
            <FileText size={20} style={{ color: 'var(--primary-accent)' }} />
            <h2 id="essence-heading" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
              Our Essence
            </h2>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <li>
              <button
                onClick={() => handleLinkClick('about', '/about')}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'left' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-accent)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <Compass size={16} style={{ color: 'var(--primary-gold)' }} />
                <span>Brand Story</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleLinkClick('contact', '/contact')}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'left' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-accent)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <HelpCircle size={16} style={{ color: 'var(--primary-gold)' }} />
                <span>Contact Support</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleLinkClick('policies', '/policies')}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'left' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-accent)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <FileText size={16} style={{ color: 'var(--primary-gold)' }} />
                <span>Divine Policies</span>
              </button>
            </li>
            
            <li style={{ borderTop: '1px solid var(--border-light)', paddingTop: '14px', marginTop: '6px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Administration
              </div>
              <button
                onClick={() => handleLinkClick('admin-login', '/admin')}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'left' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-accent)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <ShieldAlert size={16} style={{ color: '#dc2626' }} />
                <span>Admin Manager Gate</span>
              </button>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};
export default SitemapPage;
