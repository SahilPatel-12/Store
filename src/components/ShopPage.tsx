import React from 'react';
import { Search, Heart, Star, SlidersHorizontal, ArrowUpDown, Clock, ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';
import type { Product } from '../types';
import { isImageUrl, getDisplayImageUrl } from '../lib/imageHelper';
interface ShopPageProps {
  onAddToCart: (product: Product, quantity?: number) => void;
  onViewDetails: (product: Product) => void;
  wishlist: Record<string, boolean>;
  onToggleWishlist: (productId: string) => void;
  products?: Product[];
  shopBanners?: {
    mainBanners?: string[];
    categoryBanners?: Record<string, string[]>;
  };
  cart: { product: Product; quantity: number }[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  categoriesOrder?: string[];
  productsOrder?: Record<string, string[]>;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  onAddToCart,
  onViewDetails,
  wishlist,
  onToggleWishlist,
  products: productsProp,
  shopBanners,
  cart,
  onUpdateQuantity,
  categoriesOrder,
  productsOrder,
}) => {
  const activeProducts = productsProp || [];
  // Filter and Sort states
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [selectedSpiritualTypes, setSelectedSpiritualTypes] = React.useState<string[]>([]);
  const [maxPrice, setMaxPrice] = React.useState(1000);
  const [sortBy, setSortBy] = React.useState('popularity');
  const [showFilters, setShowFilters] = React.useState(false);
  const [recentlyViewed, setRecentlyViewed] = React.useState<Product[]>([]);

  // Dynamically set default max price based on loaded products
  const defaultMaxPrice = React.useMemo(() => {
    if (activeProducts.length === 0) return 1000;
    const prices = activeProducts.map(p => p.price).filter(p => !isNaN(p));
    if (prices.length === 0) return 1000;
    return Math.ceil(Math.max(...prices, 1000));
  }, [activeProducts]);

  const hasInitializedPrice = React.useRef(false);

  React.useEffect(() => {
    if (activeProducts.length > 0 && !hasInitializedPrice.current) {
      setMaxPrice(defaultMaxPrice);
      hasInitializedPrice.current = true;
    }
  }, [activeProducts, defaultMaxPrice]);

  // Load recently viewed on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('ridae_recently_viewed');
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        const viewedProducts = ids
          .map(id => activeProducts.find(p => p.id === id))
          .filter((p): p is Product => !!p);
        setRecentlyViewed(viewedProducts.slice(0, 4));
      }
    } catch (e) {
      console.error('Error reading recently viewed from localStorage:', e);
    }
  }, [activeProducts]);

  const handleProductClick = (product: Product) => {
    // Save to recently viewed in localStorage
    try {
      const stored = localStorage.getItem('ridae_recently_viewed') || '[]';
      let ids: string[] = JSON.parse(stored);
      // Filter out if already exists and add to front
      ids = [product.id, ...ids.filter(id => id !== product.id)];
      localStorage.setItem('ridae_recently_viewed', JSON.stringify(ids));
      
      // Update state
      const viewedProducts = ids
        .map(id => activeProducts.find(p => p.id === id))
        .filter((p): p is Product => !!p);
      setRecentlyViewed(viewedProducts.slice(0, 4));
    } catch (e) {
      console.error(e);
    }

    onViewDetails(product);
  };

  const handleSpiritualTypeToggle = (type: string) => {
    setSelectedSpiritualTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedSpiritualTypes([]);
    setMaxPrice(defaultMaxPrice);
    setSortBy('popularity');
  };

  // Main shop banner carousel state
  const mainBannerImages = shopBanners?.mainBanners && shopBanners.mainBanners.length > 0
    ? shopBanners.mainBanners
    : [];
  const [mainBannerSlide, setMainBannerSlide] = React.useState(0);

  React.useEffect(() => {
    if (mainBannerImages.length <= 1) return;
    const interval = setInterval(() => {
      setMainBannerSlide(prev => (prev + 1) % mainBannerImages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [mainBannerImages.length]);

  const handlePrevBanner = () =>
    setMainBannerSlide(prev => (prev - 1 + mainBannerImages.length) % mainBannerImages.length);
  const handleNextBanner = () =>
    setMainBannerSlide(prev => (prev + 1) % mainBannerImages.length);

  // Dynamically extract categories that have active products and sort them
  const categories = React.useMemo(() => {
    const uniqueCats = Array.from(new Set(activeProducts.map(p => p.category).filter(Boolean)));
    const allCategories = [
      { id: 'all', label: 'All Items' },
      ...uniqueCats.map(cat => ({ id: cat, label: cat }))
    ];

    if (categoriesOrder && categoriesOrder.length > 0) {
      return allCategories.sort((a, b) => {
        const idxA = categoriesOrder.indexOf(a.id);
        const idxB = categoriesOrder.indexOf(b.id);
        
        // If both are present in custom order, sort by index
        if (idxA !== -1 && idxB !== -1) {
          return idxA - idxB;
        }
        // If a is in custom order but b is not, a comes first
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        // If neither is in custom order, sort alphabetically (case-insensitive)
        return a.label.localeCompare(b.label, 'en', { sensitivity: 'base' });
      });
    }

    return allCategories;
  }, [activeProducts, categoriesOrder]);

  const spiritualTypes = ['Rituals', 'Meditation', 'Vastu', 'Wisdom', 'Aromatherapy'];

  // Filtering & Sorting calculations
  const filteredProducts = activeProducts.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    
    const matchesSpiritualType =
      selectedSpiritualTypes.length === 0 || selectedSpiritualTypes.includes(product.spiritualType);
    
    const matchesPrice = product.price <= maxPrice;

    return matchesSearch && matchesCategory && matchesSpiritualType && matchesPrice;
  });
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'popularity':
      default: {
        const customOrderList = productsOrder?.[selectedCategory];
        if (customOrderList && customOrderList.length > 0) {
          const idxA = customOrderList.indexOf(a.id);
          const idxB = customOrderList.indexOf(b.id);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
        }
        return b.popularity - a.popularity;
      }
    }
  });  // Product categories background colors for image cards
  const getCategoryGradient = (category: string) => {
    if (!category) return 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)';
    const cat = category.toLowerCase();
    if (cat.includes('kit')) {
      return 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)';
    }
    if (cat.includes('idol') || cat.includes('murti')) {
      return 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
    }
    if (cat.includes('incense') || cat.includes('fragrance')) {
      return 'linear-gradient(135deg, #f5f3ff 0%, #ddd6fe 100%)';
    }
    if (cat.includes('book') || cat.includes('sacred')) {
      return 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)';
    }
    return 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)';
  };

  return (
    <div style={{ paddingBottom: '60px' }}>

      {/* 1. Header Banner — image carousel if images exist, else decorated fallback */}
      <section style={{ padding: '0 0 32px 0' }}>
        {mainBannerImages.length > 0 ? (
          /* === Dynamic Image Carousel === */
          <div style={{
            position: 'relative',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            height: '320px',
            backgroundColor: '#1c1917',
            boxShadow: 'var(--shadow-lg)'
          }}>
            {/* Slides */}
            {mainBannerImages.map((src, idx) => (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  inset: 0,
                  transition: 'opacity 0.7s ease',
                  opacity: idx === mainBannerSlide ? 1 : 0,
                  pointerEvents: idx === mainBannerSlide ? 'auto' : 'none',
                }}
              >
                <img
                  src={src}
                  alt={`Shop banner ${idx + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                {/* Gradient overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.05) 60%, transparent 100%)'
                }} />
              </div>
            ))}

            {/* Text overlay on top of image */}
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '32px 48px',
              zIndex: 2
            }}>
              <h1 style={{
                fontSize: '2.4rem',
                fontWeight: 800,
                lineHeight: 1.2,
                marginBottom: '10px',
                color: '#ffffff',
                textShadow: '0 2px 12px rgba(0,0,0,0.5)'
              }}>
                The Divine Shop
              </h1>
              <p style={{
                fontSize: '0.95rem',
                color: 'rgba(255,255,255,0.88)',
                lineHeight: 1.6,
                maxWidth: '480px',
                textShadow: '0 1px 6px rgba(0,0,0,0.4)'
              }}>
                Authentic, priest-energized spiritual items for your sacred space.
              </p>
            </div>

            {/* Nav arrows */}
            {mainBannerImages.length > 1 && (
              <>
                <button
                  onClick={handlePrevBanner}
                  aria-label="Previous banner"
                  style={{
                    position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                    zIndex: 4, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255,255,255,0.3)', borderRadius: '50%',
                    width: '40px', height: '40px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer', color: '#ffffff',
                    transition: 'background 0.2s'
                  }}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={handleNextBanner}
                  aria-label="Next banner"
                  style={{
                    position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                    zIndex: 4, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255,255,255,0.3)', borderRadius: '50%',
                    width: '40px', height: '40px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer', color: '#ffffff',
                    transition: 'background 0.2s'
                  }}
                >
                  <ChevronRight size={20} />
                </button>

                {/* Dot indicators */}
                <div style={{
                  position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
                  display: 'flex', gap: '8px', zIndex: 4
                }}>
                  {mainBannerImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setMainBannerSlide(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      style={{
                        width: idx === mainBannerSlide ? '24px' : '8px',
                        height: '8px',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        backgroundColor: idx === mainBannerSlide
                          ? '#ffffff'
                          : 'rgba(255,255,255,0.45)'
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          /* === Fallback: Decorated Static Banner === */
          <div style={{
            backgroundColor: 'var(--primary-forest)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            minHeight: '280px',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute', top: '10%', left: '5%',
              width: '100px', height: '100px', borderRadius: '50%',
              background: 'rgba(249, 115, 22, 0.15)', filter: 'blur(40px)', zIndex: 0
            }}></div>

            <div style={{
              display: 'grid', gridTemplateColumns: '1.2fr 1fr',
              width: '100%', height: '100%', zIndex: 1
            }} className="hero-grid-split">
              <div style={{
                padding: '32px 40px', display: 'flex', flexDirection: 'column',
                justifyContent: 'center', textAlign: 'left', color: '#ffffff'
              }}>
                <h1 style={{
                  fontSize: '2.4rem', fontWeight: 800, lineHeight: 1.2,
                  marginBottom: '12px', fontFamily: 'var(--font-sans)', color: '#ffffff'
                }}>
                  The Divine Shop
                </h1>
                <p style={{ fontSize: '0.95rem', opacity: 0.8, lineHeight: 1.5, maxWidth: '480px' }}>
                  Explore our curated collections of authentic, priest-energized spiritual items designed to invite divine energy, focus, and peace into your sacred space.
                </p>
              </div>

              <div className="flex-center float-anim" style={{ position: 'relative', height: '240px' }}>
                <div style={{
                  position: 'absolute', width: '180px', height: '180px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(255,255,255,0.05))',
                  border: '1px solid rgba(255,255,255,0.1)', zIndex: 0
                }}></div>
                <div style={{
                  position: 'absolute', width: '130px', height: '130px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(254, 243, 237, 0.15) 0%, rgba(253, 230, 138, 0.05) 100%)',
                  zIndex: 1
                }}></div>
                <span style={{
                  fontSize: '6.5rem', zIndex: 2, userSelect: 'none',
                  filter: 'drop-shadow(0 10px 20px rgba(249, 115, 22, 0.2))'
                }}>🕉️</span>
              </div>
            </div>
          </div>
        )}
      </section>



      {/* 2. Sticky Toolbar Wrapper */}
      <div style={{
        position: 'sticky',
        top: '68px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-light)',
        padding: '16px 0',
        zIndex: 40,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div className="container" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Top row: Search, Filter toggle, Sort selection */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            
            {/* Search Input Box */}
            <div style={{
              position: 'relative',
              flex: '1 1 300px'
            }}>
              <input
                type="text"
                placeholder="Search by product name, benefits, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 16px 10px 40px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  outline: 'none',
                  fontSize: '0.9rem',
                  backgroundColor: '#f9fafb'
                }}
              />
              <Search size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
            </div>

            {/* Filter and Sort toggles */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  backgroundColor: showFilters ? 'var(--primary-lime)' : '#ffffff',
                  color: 'var(--text-dark)',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <SlidersHorizontal size={16} />
                Filters
                {selectedSpiritualTypes.length > 0 || maxPrice < 100 ? (
                  <span style={{
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    padding: '2px 6px',
                    borderRadius: '50%',
                    marginLeft: '4px'
                  }}>
                    {(selectedSpiritualTypes.length + (maxPrice < 100 ? 1 : 0))}
                  </span>
                ) : null}
              </button>

              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '4px 12px',
                backgroundColor: '#ffffff'
              }}>
                <ArrowUpDown size={16} style={{ color: 'var(--text-muted)', marginRight: '6px' }} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    padding: '6px 0',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--text-dark)'
                  }}
                >
                  <option value="popularity">Popularity</option>
                  <option value="rating">Top Rated</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>

            </div>
          </div>

          {/* Expandable/Slidable filter panel drawer */}
          <div style={{
            maxHeight: showFilters ? '200px' : '0px',
            overflow: 'hidden',
            transition: 'max-height 0.3s ease-in-out',
            borderTop: showFilters ? '1px solid var(--border-light)' : 'none',
            paddingTop: showFilters ? '16px' : '0px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '24px',
              textAlign: 'left'
            }}>
              
              {/* Spiritual Type filters */}
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Spiritual Type
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {spiritualTypes.map(type => {
                    const isChecked = selectedSpiritualTypes.includes(type);
                    return (
                      <button
                        key={type}
                        onClick={() => handleSpiritualTypeToggle(type)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          border: `1px solid ${isChecked ? 'var(--primary-lime)' : 'var(--border-light)'}`,
                          backgroundColor: isChecked ? 'var(--primary-lime-light)' : '#ffffff',
                          color: isChecked ? 'var(--primary-forest)' : 'var(--text-muted)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price filter range */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Max Price
                  </h4>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary-lime)' }}>
                    ₹{maxPrice}
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max={defaultMaxPrice}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: 'var(--primary-lime)',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <span>₹10</span>
                  <span>₹{defaultMaxPrice}</span>
                </div>
              </div>

              {/* Reset actions */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                <button
                  onClick={resetFilters}
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--primary-lime)',
                    textDecoration: 'underline'
                  }}
                >
                  Reset All Filters
                </button>
              </div>

            </div>
          </div>

          {/* Category Tabs Scroll Bar */}
          <div style={{
            display: 'flex',
            overflowX: 'auto',
            gap: '8px',
            padding: '4px 0',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }} className="shop-categories-scroll">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                    border: '1px solid var(--border-light)',
                    backgroundColor: isActive ? 'var(--primary-forest)' : '#ffffff',
                    color: isActive ? '#ffffff' : 'var(--text-muted)'
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* 3. Product Browsing Grid */}
      <section style={{ padding: '40px 0' }}>
        <div className="container">
          
          {sortedProducts.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '65px 20px',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-muted)'
            }}>
              <p style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                No divine items found
              </p>
              <p style={{ fontSize: '0.9rem', marginTop: '6px' }}>
                No items match your selected filters. Try broadening your criteria.
              </p>
              <button
                onClick={resetFilters}
                className="btn-lime"
                style={{ marginTop: '20px' }}
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '30px'
            }} className="shop-product-grid">
              
              {sortedProducts.map((product) => {
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

                      {/* Out of Stock Label overlay (non-ribbon) */}
                      {!product.inStock && (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: '12px',
                          width: '40px',
                          padding: '8px 2px 10px 2px',
                          background: '#9ca3af',
                          color: '#ffffff',
                          fontSize: '0.55rem',
                          fontWeight: 900,
                          lineHeight: 1.15,
                          textAlign: 'center',
                          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 6px), 0 100%)',
                          zIndex: 10
                        }}>
                          SOLD<br/>OUT
                        </div>
                      )}

                      {/* Heart Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWishlist(product.id);
                        }}
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
                          onClick={() => handleProductClick(product)}
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
              })}</div>
          )}
          
        </div>
      </section>

      {/* 4. Recently Viewed state Persistence */}
      {recentlyViewed.length > 0 && (
        <section style={{
          borderTop: '1px solid var(--border-light)',
          paddingTop: '40px',
          marginTop: '20px'
        }}>
          <div className="container" style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <Clock size={18} style={{ color: 'var(--primary-lime)' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Recently Viewed</h3>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '20px'
            }}>
              {recentlyViewed.map(item => (
                <div
                  key={item.id}
                  onClick={() => onViewDetails(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div className="flex-center" style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: 'var(--radius-sm)',
                    background: getCategoryGradient(item.category),
                    flexShrink: 0
                  }}>
                    {item.image && isImageUrl(item.image) ? (
                      <img 
                        src={getDisplayImageUrl(item.image)} 
                        alt={item.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} 
                      />
                    ) : (
                      <span style={{ fontSize: '1.6rem' }}>{item.image}</span>
                    )}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.name}
                    </h4>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary-lime)' }}>
                      ₹{item.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CSS overrides for shop category scrollbar hiding */}
      <style>{`
        .shop-categories-scroll::-webkit-scrollbar {
          display: none;
        }
        .shop-product-grid > div:hover .hover-overlay {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};



