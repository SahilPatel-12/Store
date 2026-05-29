import React from 'react';
import { Search, Heart, ShoppingBag, Star, Eye, ArrowLeft, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '../types';
import { isImageUrl, getDisplayImageUrl } from '../lib/imageHelper';

interface CategoryPageProps {
  categoryName: string;
  onAddToCart: (product: Product, quantity?: number) => void;
  onViewDetails: (product: Product) => void;
  wishlist: Record<string, boolean>;
  onToggleWishlist: (productId: string) => void;
  onBackToShop: () => void;
  products?: Product[];
  /** Images uploaded by admin for this specific category */
  categoryBannerImages?: string[];
}

// Category Descriptions database matching prompt
const categoryDescriptions: Record<string, string> = {
  'Rudraksha': 'Stabilize mind, body, and spiritual frequencies with authentic Himalayan Rudraksha beads, pre-blessed and energized with Shiva mantras.',
  'Bracelet': 'Sacred wrist malas combining red sandalwood and sacred seeds, designed to shield your daily energy fields.',
  'Murti': 'Handcrafted brass idols of divine deities, placed at altars to ward off obstacles and invite prosperity and peace.',
  'Yantras': 'Perfect geometric gold-plated copper Yantras to attract positive energy fields and balance Vastu defects.',
  'Anklet': 'Elegant spiritual silver anklets designed to ground energies and keep spiritual balance at every step.',
  'Frames': 'Premium framed devotional artwork and sacred geometry symbols to elevate the spiritual vibe of your home or workspace.',
  'Rashi': 'Planetary correction items tailored specifically for your zodiac sign, promoting harmony and prosperity.',
  'Karungali': 'Authentic ebony wood Karungali items representing protection, mental strength, and success in endeavors.',
  'Jadi': 'Ancient herbal roots used for protection, Vastu correction, and attracting wealth energies.',
  'Pyrite': 'Natural sparkling Pyrite crystals, also known as Fools Gold, powerful for manifesting wealth and boosting confidence.',
  'Kavach': 'Micro-etched pendants housing sacred protection texts, functioning as an energetic shield for daily wear.',
  'Siddh Range': 'Extremely powerful spiritual items energized by advanced temple rituals for high-performance protection.',
  'Gemstones': 'Lab-certified natural gemstones, pre-blessed with mantras to align planetary benefits.',
  'Pyramid': 'Vastu-corrective copper and crystal pyramids to align cosmic frequencies and charge active energy spaces.',
  'Necklaces/Mala': '108+1 hand-knotted sacred prayer malas sourcing natural seeds, basil, and crystal elements for Japa and meditation.',
  'Tower & Tumbles': 'Polished crystal towers and natural tumble stones to cleanse surrounding spaces and elevate meditation circles.',
  'Crystal Dome Trees': 'Ornate gemstone trees set on natural crystal clusters, bringing peaceful abundance and energy balancing home.',
  'Women Bracelets': 'Exquisite, delicate crystal bracelets handcrafted for feminine energy, grace, and protection.',
  'Evil Eye': 'Protective blue glass amulets and silver accessories designed to deflect malevolent gazes and negative intentions.',
  'Gifting': 'Auspicious temple puja essentials, incense burners, brass diyas, and divine kits for conscious spiritual gifting.'
};

export const CategoryPage: React.FC<CategoryPageProps> = ({
  categoryName,
  onAddToCart,
  onViewDetails,
  wishlist,
  onToggleWishlist,
  onBackToShop,
  products: productsProp,
  categoryBannerImages,
}) => {
  const activeProducts = productsProp || [];
  const [searchQuery, setSearchQuery] = React.useState('');
  const [itemsLimit, setItemsLimit] = React.useState(2); // Start small for paginated scrolling

  // Category banner carousel
  const bannerImages = categoryBannerImages && categoryBannerImages.length > 0 ? categoryBannerImages : [];
  const [bannerSlide, setBannerSlide] = React.useState(0);
  React.useEffect(() => {
    setBannerSlide(0); // reset when category changes
  }, [categoryName]);
  React.useEffect(() => {
    if (bannerImages.length <= 1) return;
    const interval = setInterval(() => {
      setBannerSlide(prev => (prev + 1) % bannerImages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [bannerImages.length]);
  const handlePrev = () => setBannerSlide(prev => (prev - 1 + bannerImages.length) % bannerImages.length);
  const handleNext = () => setBannerSlide(prev => (prev + 1) % bannerImages.length);
  
  // Filter products by category and inner search
  const categoryProducts = activeProducts.filter(product => {
    const matchesCategory = product.category.toLowerCase() === categoryName.toLowerCase();
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const displayedProducts = categoryProducts.slice(0, itemsLimit);
  const hasMore = categoryProducts.length > itemsLimit;

  const handleLoadMore = () => {
    setItemsLimit(prev => prev + 2); // load 2 more items (simulates pagination)
  };

  const getCategoryGradient = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'rudraksha':
      case 'tulsi mala':
      case 'crystal mala':
        return 'linear-gradient(135deg, #f5f3ff 0%, #ddd6fe 100%)';
      case 'shiva murti':
      case 'ganesh murti':
      case 'hanuman murti':
      case 'lakshmi murti':
        return 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
      default:
        return 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)';
    }
  };

  return (
    <div style={{ paddingBottom: '60px' }}>
      
      {/* Back button & Breadcrumb row */}
      <div className="container" style={{ paddingTop: '20px', textAlign: 'left' }}>
        <button
          onClick={onBackToShop}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.88rem',
            fontWeight: 700,
            color: 'var(--primary-lime)',
            transition: 'opacity 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <ArrowLeft size={16} /> Back to Shop
        </button>
      </div>

      {/* 1. Category Hero Banner — dynamic image carousel or styled fallback */}
      <section style={{ padding: '20px 0 32px 0' }}>
        <div className="container">
          {bannerImages.length > 0 ? (
            /* === Dynamic Image Carousel === */
            <div style={{
              position: 'relative',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              height: '280px',
              backgroundColor: '#1c1917',
              boxShadow: 'var(--shadow-lg)'
            }}>
              {/* Slides */}
              {bannerImages.map((src, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    transition: 'opacity 0.7s ease',
                    opacity: idx === bannerSlide ? 1 : 0,
                    pointerEvents: idx === bannerSlide ? 'auto' : 'none',
                  }}
                >
                  <img
                    src={src}
                    alt={`${categoryName} banner ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  {/* Gradient overlay */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)'
                  }} />
                </div>
              ))}

              {/* Text overlay */}
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '32px 48px',
                zIndex: 2
              }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  color: 'var(--primary-lime)',
                  marginBottom: '8px',
                  textShadow: '0 1px 4px rgba(0,0,0,0.5)'
                }}>
                  Collection
                </span>
                <h1 style={{
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  lineHeight: 1.2,
                  marginBottom: '10px',
                  color: '#ffffff',
                  textShadow: '0 2px 12px rgba(0,0,0,0.5)'
                }}>
                  {categoryName}
                </h1>
                <p style={{
                  fontSize: '0.9rem',
                  color: 'rgba(255,255,255,0.85)',
                  lineHeight: 1.5,
                  maxWidth: '460px',
                  textShadow: '0 1px 6px rgba(0,0,0,0.4)'
                }}>
                  {categoryDescriptions[categoryName] || 'Explore our energized devotional items blessed under traditional temple rituals.'}
                </p>
              </div>

              {/* Prev / Next arrows */}
              {bannerImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    aria-label="Previous"
                    style={{
                      position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                      zIndex: 4, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(255,255,255,0.3)', borderRadius: '50%',
                      width: '38px', height: '38px', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', cursor: 'pointer', color: '#ffffff', transition: 'background 0.2s'
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={handleNext}
                    aria-label="Next"
                    style={{
                      position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                      zIndex: 4, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(255,255,255,0.3)', borderRadius: '50%',
                      width: '38px', height: '38px', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', cursor: 'pointer', color: '#ffffff', transition: 'background 0.2s'
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>

                  {/* Dot indicators */}
                  <div style={{
                    position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)',
                    display: 'flex', gap: '7px', zIndex: 4
                  }}>
                    {bannerImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setBannerSlide(idx)}
                        aria-label={`Slide ${idx + 1}`}
                        style={{
                          width: idx === bannerSlide ? '22px' : '7px',
                          height: '7px',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          backgroundColor: idx === bannerSlide ? '#ffffff' : 'rgba(255,255,255,0.4)'
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* === Fallback: Original styled green banner === */
            <div style={{
              backgroundColor: 'var(--primary-forest)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              minHeight: '260px',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute', top: '10%', left: '5%',
                width: '100px', height: '100px', borderRadius: '50%',
                background: 'rgba(249, 115, 22, 0.15)', filter: 'blur(40px)', zIndex: 0
              }}></div>

              <div style={{
                display: 'grid', gridTemplateColumns: '1.3fr 1fr',
                width: '100%', height: '100%', zIndex: 1
              }} className="hero-grid-split">
                <div style={{
                  padding: '32px 40px', display: 'flex', flexDirection: 'column',
                  justifyContent: 'center', textAlign: 'left', color: '#ffffff'
                }}>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase',
                    letterSpacing: '2px', color: 'var(--primary-lime)', marginBottom: '8px'
                  }}>
                    Collection
                  </span>
                  <h1 style={{
                    fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.2,
                    marginBottom: '12px', fontFamily: 'var(--font-sans)', color: '#ffffff'
                  }}>
                    {categoryName}
                  </h1>
                  <p style={{ fontSize: '0.92rem', opacity: 0.85, lineHeight: 1.5, maxWidth: '520px' }}>
                    {categoryDescriptions[categoryName] || 'Explore our energized devotional items blessed under traditional temple rituals to bring auspiciousness.'}
                  </p>
                </div>

                <div className="flex-center float-anim" style={{ position: 'relative', height: '220px' }}>
                  <div style={{
                    position: 'absolute', width: '160px', height: '160px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(255,255,255,0.05))',
                    border: '1px solid rgba(255,255,255,0.1)', zIndex: 0
                  }}></div>
                  <span style={{
                    fontSize: '6rem', zIndex: 2, userSelect: 'none',
                    filter: 'drop-shadow(0 10px 15px rgba(249, 115, 22, 0.25))'
                  }}>🕉️</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2. Search Toolbar Inside Category */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-light)',
        padding: '16px 0',
        marginBottom: '32px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Search In {categoryName}</h3>
          
          <div style={{ position: 'relative', flex: '0 1 320px', width: '100%' }}>
            <input
              type="text"
              placeholder={`Search products in ${categoryName}...`}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setItemsLimit(2); // reset limit on search
              }}
              style={{
                width: '100%',
                padding: '8px 16px 8px 36px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                outline: 'none',
                fontSize: '0.88rem',
                backgroundColor: '#f9fafb'
              }}
            />
            <Search size={16} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }} />
          </div>
        </div>
      </div>

      {/* 3. Products Grid System */}
      <section>
        <div className="container">
          
          {displayedProducts.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-muted)'
            }}>
              <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                No items in this collection
              </p>
              <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                We currently don't have matching items in the {categoryName} catalog.
              </p>
            </div>
          ) : (
            <>
              {/* Product Cards layout grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '30px'
              }} className="category-product-grid">
                
                {displayedProducts.map((product) => {
                  const isLiked = wishlist[product.id];
                  const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
                  
                  return (
                    <div
                      key={product.id}
                      className="glass"
                      style={{
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        border: '1px solid var(--border-light)',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        backgroundColor: '#ffffff',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        height: '100%'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                      }}
                    >
                      {/* Discount Tag */}
                      {discount > 0 && product.inStock && (
                        <span style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          backgroundColor: '#ef4444',
                          color: '#ffffff',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          zIndex: 10
                        }}>
                          -{discount}%
                        </span>
                      )}

                      {/* Wishlist Heart */}
                      <button
                        onClick={() => onToggleWishlist(product.id)}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          backgroundColor: '#ffffff',
                          border: '1px solid var(--border-light)',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          color: isLiked ? '#ef4444' : 'var(--text-muted)',
                          zIndex: 10,
                          boxShadow: 'var(--shadow-sm)'
                        }}
                        className="flex-center"
                      >
                        <Heart size={16} fill={isLiked ? '#ef4444' : 'none'} />
                      </button>

                      {/* Image Card */}
                      <div
                        onClick={() => onViewDetails(product)}
                        style={{
                          height: '180px',
                          background: getCategoryGradient(product.category),
                          cursor: 'pointer',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderBottom: '1px solid var(--border-light)'
                        }}
                      >
                        {product.image && isImageUrl(product.image) ? (
                          <img 
                            src={getDisplayImageUrl(product.image)} 
                            alt={product.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        ) : (
                          <span style={{ fontSize: '4.4rem', userSelect: 'none' }}>{product.image}</span>
                        )}
                        
                        {/* Hover Overlay */}
                        <div className="flex-center hover-overlay" style={{
                          position: 'absolute',
                          top: 0, right: 0, bottom: 0, left: 0,
                          backgroundColor: 'rgba(0,0,0,0.05)',
                          opacity: 0,
                          transition: 'opacity 0.2s ease'
                        }}>
                          <Eye size={24} style={{ color: '#ffffff' }} />
                        </div>
                      </div>

                      {/* Details Info */}
                      <div style={{
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        flexGrow: 1,
                        textAlign: 'left'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--primary-lime)', fontWeight: 700, textTransform: 'uppercase' }}>
                            {product.spiritualType}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <Star size={12} fill="#fbbf24" color="#fbbf24" />
                            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{product.rating}</span>
                          </div>
                        </div>

                        <h3
                          onClick={() => onViewDetails(product)}
                          style={{
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: 'var(--text-dark)',
                            marginBottom: '6px',
                            cursor: 'pointer',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {product.name}
                        </h3>

                        <p style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                          lineHeight: 1.4,
                          marginBottom: '16px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          height: '32px'
                        }}>
                          {product.description}
                        </p>

                        <div style={{
                          marginTop: 'auto',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '12px',
                          borderTop: '1px solid var(--border-light)'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {product.originalPrice && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                ₹{product.originalPrice}
                              </span>
                            )}
                            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
                              ₹{product.price}
                            </span>
                          </div>
                        </div>

                        {/* Floating Add to Cart circle button */}
                        {product.inStock && (
                          <button
                            onClick={() => onAddToCart(product, 1)}
                            style={{
                              position: 'absolute',
                              bottom: '12px',
                              right: '12px',
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--primary-lime)',
                              color: 'var(--text-dark)',
                              boxShadow: 'var(--shadow-sm)',
                              transition: 'transform 0.15s ease'
                            }}
                            className="flex-center"
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            <ShoppingBag size={15} />
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Paginated / Infinite Scrolling Trigger */}
              {hasMore && (
                <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
                  <button
                    onClick={handleLoadMore}
                    className="btn-lime"
                    style={{
                      padding: '12px 32px',
                      borderRadius: 'var(--radius-full)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <RefreshCw size={16} /> Load More Items
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </section>

    </div>
  );
};
