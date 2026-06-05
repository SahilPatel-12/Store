import React from 'react';
import { Search, Mic, Trash2, Heart, X, Star, ArrowUpRight, Plus, Minus } from 'lucide-react';
import type { Product } from '../types';
import { isImageUrl, getDisplayImageUrl } from '../lib/imageHelper';

interface SearchPageProps {
  initialQuery?: string;
  onAddToCart: (product: Product, quantity?: number) => void;
  onViewDetails: (product: Product) => void;
  wishlist: Record<string, boolean>;
  onToggleWishlist: (productId: string) => void;
  products?: Product[];
  cart: { product: Product; quantity: number }[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
}

const trendingSearches = [
  'Himalayan Rudraksha',
  'Vrindavan Tulsi Mala',
  'Pure Bhimseni Camphor',
  'Solid Brass Nataraja',
  'Peacock Brass Diya',
  'Mysore Sandalwood Incense'
];

export const SearchPage: React.FC<SearchPageProps> = ({
  initialQuery = '',
  onAddToCart,
  onViewDetails,
  wishlist,
  onToggleWishlist,
  products: productsProp,
  cart,
  onUpdateQuantity,
}) => {
  const activeProducts = productsProp || [];
  const [query, setQuery] = React.useState(initialQuery);
  const [recentSearches, setRecentSearches] = React.useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('ridae_recent_searches');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const [voiceListening, setVoiceListening] = React.useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = React.useState('All');

  // Sync recent searches to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('ridae_recent_searches', JSON.stringify(recentSearches));
    } catch (e) {
      console.error(e);
    }
  }, [recentSearches]);

  // Sync initial query if changed from parent
  React.useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      addToRecent(initialQuery);
    }
  }, [initialQuery]);

  const addToRecent = (term: string) => {
    if (!term.trim()) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(t => t.toLowerCase() !== term.toLowerCase());
      return [term, ...filtered].slice(0, 5); // limit to 5
    });
  };

  const handleSearchSubmit = (term: string) => {
    setQuery(term);
    addToRecent(term);
  };

  const clearRecent = () => {
    setRecentSearches([]);
  };

  // Voice recognition simulation
  const handleVoiceTrigger = () => {
    setVoiceListening(true);
    setTimeout(() => {
      const randomMantras = ['Rudraksha', 'Tulsi Mala', 'Camphor', 'Brass Diya', 'Shiva Murti'];
      const selectRandom = randomMantras[Math.floor(Math.random() * randomMantras.length)];
      setQuery(selectRandom);
      addToRecent(selectRandom);
      setVoiceListening(false);
    }, 2000);
  };

  // Autocomplete suggestions as user types
  const autoSuggestions = query.trim().length > 1
    ? activeProducts
        .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5)
    : [];

  // Filtered search results
  const searchResults = activeProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(query.toLowerCase()) ||
                          product.description.toLowerCase().includes(query.toLowerCase()) ||
                          product.category.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'All' || product.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Unique categories in search results for filter tabs
  const resultCategories = Array.from(
    new Set(
      activeProducts
        .filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.description.toLowerCase().includes(query.toLowerCase()))
        .map(p => p.category)
    )
  );

  // Default suggestions if no search
  const popularSuggestions = activeProducts.slice(0, 3);

  const getCategoryGradient = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'rudraksha':
      case 'tulsi mala':
      case 'crystal mala':
        return 'linear-gradient(135deg, #f5f3ff 0%, #ddd6fe 100%)';
      case 'shiva nataraja':
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
    <div style={{ paddingBottom: '80px', backgroundColor: '#fafafa' }}>
      
      {/* Search Input Bar (Homepage styled architecture) */}
      <section style={{ padding: '32px 0 16px 0', backgroundColor: '#ffffff', borderBottom: '1px solid var(--border-light)' }}>
        <div className="container">
          <div style={{ position: 'relative', maxWidth: '640px', margin: '0 auto' }}>
            <input
              type="text"
              placeholder="Search sacred kits, malas, idols, or spiritual remedies..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchSubmit(query);
              }}
              style={{
                width: '100%',
                padding: '16px 48px 16px 48px',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--primary-lime)',
                outline: 'none',
                fontSize: '1.05rem',
                fontWeight: 600,
                backgroundColor: '#ffffff',
                boxShadow: 'var(--shadow-sm)',
                color: 'var(--text-dark)'
              }}
            />
            <Search size={22} style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }} />

            {/* Clear & Voice Triggers */}
            <div style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              {query && (
                <button onClick={() => setQuery('')} style={{ color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              )}
              <button
                onClick={handleVoiceTrigger}
                style={{
                  color: 'var(--primary-lime)',
                  backgroundColor: 'var(--primary-lime-light)',
                  padding: '6px',
                  borderRadius: '50%'
                }}
                title="Voice Search"
              >
                <Mic size={18} />
              </button>
            </div>

            {/* Auto-complete dropdown list as typing */}
            {query.trim().length > 1 && autoSuggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 250,
                marginTop: '4px',
                textAlign: 'left',
                overflow: 'hidden'
              }}>
                <div style={{ padding: '10px 16px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 800, borderBottom: '1px solid var(--border-light)' }}>
                  Auto-Complete Suggestions
                </div>
                {autoSuggestions.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onViewDetails(p);
                      addToRecent(p.name);
                    }}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {p.image && isImageUrl(p.image) ? (
                        <img 
                          src={getDisplayImageUrl(p.image)} 
                          alt={p.name} 
                          style={{ width: '24px', height: '24px', objectFit: 'cover', borderRadius: '4px' }} 
                        />
                      ) : (
                        <span style={{ fontSize: '1.4rem' }}>{p.image}</span>
                      )}
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-dark)' }}>{p.name}</span>
                    </div>
                    <ArrowUpRight size={14} style={{ color: 'var(--text-muted)' }} />
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </section>

      {/* Main Results or Default Suggestion State */}
      <div className="container" style={{ marginTop: '32px' }}>
        
        {!query.trim() ? (
          /* Default state when search is empty */
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.3fr 1.7fr',
            gap: '40px',
            alignItems: 'start'
          }} className="hero-grid-split">
            
            {/* Left Column: Recent & Trending */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', textAlign: 'left' }}>
              
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)' }}>Recent Searches</h3>
                    <button
                      onClick={clearRecent}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        fontWeight: 700
                      }}
                    >
                      <Trash2 size={12} /> Clear All
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {recentSearches.map((term, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSearchSubmit(term)}
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid var(--border-light)',
                          padding: '8px 16px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: 'var(--text-dark)',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary-lime)';
                          e.currentTarget.style.color = 'var(--primary-lime)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-light)';
                          e.currentTarget.style.color = 'var(--text-dark)';
                        }}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Searches */}
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '12px' }}>Trending Searches</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {trendingSearches.map((term, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSearchSubmit(term)}
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'left',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary-lime)';
                        e.currentTarget.style.backgroundColor = 'var(--primary-lime-light)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-light)';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                    >
                      <span>{term}</span>
                      <ArrowUpRight size={14} style={{ color: 'var(--primary-lime)' }} />
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Suggested Products */}
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '16px' }}>Suggested Spiritual Items</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {popularSuggestions.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onViewDetails(p)}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-light)',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-sm)',
                      position: 'relative',
                      transition: 'transform 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: 'var(--radius-md)',
                      background: getCategoryGradient(p.category),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {p.image && isImageUrl(p.image) ? (
                        <img 
                          src={getDisplayImageUrl(p.image)} 
                          alt={p.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} 
                        />
                      ) : (
                        <span style={{ fontSize: '2rem' }}>{p.image}</span>
                      )}
                    </div>

                    <div style={{ flexGrow: 1 }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--primary-lime)', fontWeight: 800, textTransform: 'uppercase' }}>{p.spiritualType}</span>
                      <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-dark)', margin: '2px 0' }}>{p.name}</h4>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary-forest)' }}>₹{p.price}</span>
                    </div>

                    <ArrowUpRight size={16} style={{ color: 'var(--text-muted)' }} />
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          /* Results grid layout */
          <div style={{ textAlign: 'left' }}>
            
            {/* Filter tags header row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              marginBottom: '28px',
              borderBottom: '1px solid var(--border-light)',
              paddingBottom: '16px'
            }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Search Results for "{query}"</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Found {searchResults.length} matches</span>
              </div>

              {/* Category tabs */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                <button
                  onClick={() => setSelectedCategoryFilter('All')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    border: selectedCategoryFilter === 'All' ? '1px solid var(--primary-lime)' : '1px solid var(--border-light)',
                    backgroundColor: selectedCategoryFilter === 'All' ? 'var(--primary-lime-light)' : '#ffffff',
                    color: selectedCategoryFilter === 'All' ? 'var(--primary-lime)' : 'var(--text-dark)'
                  }}
                >
                  All Categories
                </button>
                {resultCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      border: selectedCategoryFilter === cat ? '1px solid var(--primary-lime)' : '1px solid var(--border-light)',
                      backgroundColor: selectedCategoryFilter === cat ? 'var(--primary-lime-light)' : '#ffffff',
                      color: selectedCategoryFilter === cat ? 'var(--primary-lime)' : 'var(--text-dark)'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Grid list */}
            {searchResults.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '80px 20px',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)'
              }}>
                <span style={{ fontSize: '3rem' }}>🔍</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '16px' }}>No matches found</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Try using different spiritual terms, checking spelling, or resetting category filters.
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '30px'
              }} className="category-product-grid">
                {searchResults.map((product) => {
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
            )}

          </div>
        )}

      </div>

      {/* Simulated voice input listening popup modal */}
      {voiceListening && (
        <div style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0, left: 0,
          backgroundColor: 'rgba(45, 20, 14, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '40px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <div
              className="flex-center"
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-lime-light)',
                border: '2px solid var(--primary-lime)',
                animation: 'pulse 1.5s infinite'
              }}
            >
              <Mic size={36} style={{ color: 'var(--primary-lime)' }} />
            </div>
            
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)' }}>Listening for Mantras...</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Speak product names like "Rudraksha" or "Diyas"...
              </p>
            </div>

            <button
              onClick={() => setVoiceListening(false)}
              className="btn-outline"
              style={{ padding: '8px 24px', borderRadius: 'var(--radius-full)' }}
            >
              Cancel Listening
            </button>
          </div>
        </div>
      )}

      {/* Embedded Pulse CSS Animation */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.4); }
          70% { transform: scale(1.08); box-shadow: 0 0 0 15px rgba(249, 115, 22, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
        }
      `}</style>

    </div>
  );
};
