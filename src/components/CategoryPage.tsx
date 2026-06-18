import React from 'react';
import { Search, Heart, Star, ArrowLeft, RefreshCw, ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';
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
  categoryBannerImages?: (string | { imageUrl: string; redirectUrl?: string })[];
  cart: { product: Product; quantity: number }[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onBannerClick?: (url: string) => void;
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
  cart,
  onUpdateQuantity,
  onBannerClick,
}) => {
  const activeProducts = productsProp || [];
  const [searchQuery, setSearchQuery] = React.useState('');
  const [itemsLimit, setItemsLimit] = React.useState(16);

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
  
  const isCategoryMatch = (productCategory: string, filterCategory: string) => {
    const prodCat = productCategory.toLowerCase();
    const filterCat = filterCategory.toLowerCase();
    if (prodCat === filterCat) return true;
    
    // Map legacy categories to actual product categories
    if (filterCat === 'idols' || filterCat === 'deity idols') {
      return prodCat === 'idols' || prodCat === 'deity idols' || prodCat === 'murti';
    }
    if (filterCat === 'kits' || filterCat === 'puja kits') {
      return prodCat === 'kits' || prodCat === 'puja kits';
    }
    if (filterCat === 'incense' || filterCat === 'incense & fragrance') {
      return prodCat === 'incense' || prodCat === 'incense & fragrance' || prodCat === 'incense holders' || prodCat === 'fragrance';
    }
    if (filterCat === 'books' || filterCat === 'sacred books') {
      return prodCat === 'books' || prodCat === 'sacred books';
    }
    if (filterCat === 'accessories') {
      return [
        'accessories', 'bracelet', 'anklet', 'necklaces/mala', 'yantras',
        'frames', 'rashi', 'karungali', 'jadi', 'pyrite', 'kavach',
        'siddh range', 'gemstones', 'pyramid', 'tower & tumbles',
        'crystal dome trees', 'women bracelets', 'evil eye', 'gifting'
      ].includes(prodCat);
    }
    return false;
  };

  // Filter products by category and inner search
  const categoryProducts = activeProducts.filter(product => {
    const matchesCategory = isCategoryMatch(product.category, categoryName);
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const displayedProducts = categoryProducts.slice(0, itemsLimit);
  const hasMore = categoryProducts.length > itemsLimit;
  const handleLoadMore = () => {
    setItemsLimit(prev => prev + 8);
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
            <div className="shop-banner-container" style={{
              position: 'relative',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
              border: '1px solid var(--border-light)',
              backgroundColor: '#1c1917'
            }}>
              {/* Slides */}
              {bannerImages.map((slide, idx) => {
                const imageUrl = typeof slide === 'string' ? slide : (slide as any).imageUrl;
                const redirectUrl = typeof slide === 'string' ? undefined : (slide as any).redirectUrl;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (redirectUrl && onBannerClick) {
                        onBannerClick(redirectUrl);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: idx === bannerSlide ? 1 : 0,
                      transition: 'opacity 0.8s ease-in-out',
                      zIndex: idx === bannerSlide ? 1 : 0,
                      pointerEvents: idx === bannerSlide ? 'auto' : 'none',
                      cursor: redirectUrl ? 'pointer' : 'default'
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt={`${categoryName} banner ${idx + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                  </div>
                );
              })}

              {/* Circular dots/indicators */}
              {bannerImages.length > 1 && (
                <div style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: '8px',
                  zIndex: 10
                }}>
                  {bannerImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setBannerSlide(idx)}
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: idx === bannerSlide ? 'var(--primary-lime)' : 'rgba(255,255,255,0.4)',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'background-color 0.2s',
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Chevron Left Arrow */}
              {bannerImages.length > 1 && (
                <button
                  onClick={handlePrev}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer',
                    zIndex: 10,
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.3)'}
                >
                  <ChevronLeft size={24} />
                </button>
              )}

              {/* Chevron Right Arrow */}
              {bannerImages.length > 1 && (
                <button
                  onClick={handleNext}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer',
                    zIndex: 10,
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.3)'}
                >
                  <ChevronRight size={24} />
                </button>
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
                setItemsLimit(16);
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
                      style={{
                        borderRadius: '16px',
                        border: '1px solid var(--border-light)',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        backgroundColor: '#ffffff',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        padding: '12px',
                        height: '100%',
                        gap: '12px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-6px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                        const img = e.currentTarget.querySelector('.card-image') as HTMLElement;
                        if (img) img.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                        const img = e.currentTarget.querySelector('.card-image') as HTMLElement;
                        if (img) img.style.transform = 'scale(1)';
                      }}
                    >
                      {/* Image Box */}
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '1 / 1',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          background: getCategoryGradient(product.category),
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f9fafb'
                        }}
                      >
                        {product.image && isImageUrl(product.image) ? (
                          <img 
                            src={getDisplayImageUrl(product.image)} 
                            alt={product.name} 
                            className="card-image"
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover',
                              transition: 'transform 0.3s ease'
                            }} 
                          />
                        ) : (
                          <span style={{ fontSize: '4rem' }}>{product.image}</span>
                        )}

                        {/* Ribbon Badge */}
                        {discount > 0 && product.inStock && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: '12px',
                            width: '40px',
                            padding: '8px 2px 10px 2px',
                            background: 'linear-gradient(135deg, var(--primary-accent), var(--primary-lime))',
                            color: '#ffffff',
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            lineHeight: 1.15,
                            textAlign: 'center',
                            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 6px), 0 100%)',
                            zIndex: 10,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                          }}>
                            {discount}%<br/>OFF
                          </div>
                        )}

                        {/* Heart Button */}
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
                            boxShadow: 'var(--shadow-sm)',
                            cursor: 'pointer'
                          }}
                          className="flex-center"
                        >
                          <Heart size={15} fill={isLiked ? '#ef4444' : 'none'} />
                        </button>

                        {/* Rating Badge */}
                        <div style={{
                          position: 'absolute',
                          bottom: '12px',
                          right: '12px',
                          backgroundColor: '#ffffff',
                          border: '1px solid var(--border-light)',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          boxShadow: 'var(--shadow-sm)',
                          zIndex: 10
                        }}>
                          <Star size={12} fill="#fbbf24" color="#fbbf24" />
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)' }}>{product.rating}</span>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div style={{ 
                        padding: '4px 8px 8px 8px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        flexGrow: 1,
                        textAlign: 'center',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}>
                        <div>
                          <h3
                            onClick={() => onViewDetails(product)}
                            style={{
                              fontSize: '0.95rem',
                              fontWeight: 700,
                              color: 'var(--text-dark)',
                              marginBottom: '6px',
                              cursor: 'pointer',
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: '1.2'
                            }}
                          >
                            {product.name}
                          </h3>

                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            marginBottom: '4px'
                          }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
                              ₹{product.price}
                            </span>
                            {product.originalPrice && (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                ₹{product.originalPrice}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Add to Cart Button */}
                        <div style={{ marginTop: 'auto' }}>
                          {product.inStock ? (
                            (() => {
                              const cartItem = cart.find(item => item.product.id === product.id);
                              const qty = cartItem ? cartItem.quantity : 0;
                              if (qty > 0) {
                                return (
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backgroundColor: 'var(--primary-deep)',
                                    borderRadius: '8px',
                                    padding: '4px',
                                    width: '100%',
                                    height: '40px',
                                    boxSizing: 'border-box'
                                  }}>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onUpdateQuantity(product.id, qty - 1);
                                      }}
                                      style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '6px',
                                        backgroundColor: 'rgba(255,255,255,0.15)',
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        border: 'none',
                                        transition: 'background-color 0.15s'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
                                    >
                                      <Minus size={14} strokeWidth={2.5} />
                                    </button>
                                    <span style={{
                                      color: '#ffffff',
                                      fontWeight: '800',
                                      fontSize: '0.85rem',
                                      userSelect: 'none'
                                    }}>
                                      {qty} in Cart
                                    </span>
                                    <button
                                      className="qty-plus-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onUpdateQuantity(product.id, qty + 1);
                                      }}
                                      style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '6px',
                                        backgroundColor: 'rgba(255,255,255,0.15)',
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        border: 'none',
                                        transition: 'background-color 0.15s'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
                                    >
                                      <Plus size={14} strokeWidth={2.5} />
                                    </button>
                                  </div>
                                );
                              }
                              return (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAddToCart(product, 1);
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    backgroundColor: 'var(--primary-deep)',
                                    color: '#ffffff',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    letterSpacing: '0.05em'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-lime)'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-deep)'}
                                >
                                  Add To Cart
                                </button>
                              );
                            })()
                          ) : (
                            <button
                              disabled
                              style={{
                                width: '100%',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                backgroundColor: 'var(--border-light)',
                                color: 'var(--text-muted)',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                border: 'none',
                                cursor: 'not-allowed'
                              }}
                            >
                              Out of Stock
                            </button>
                          )}
                        </div>
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
