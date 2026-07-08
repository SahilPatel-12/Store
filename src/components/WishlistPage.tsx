import React from 'react';
import { Heart, ArrowRight, Star, ShoppingCart } from 'lucide-react';
import type { Product } from '../types';
import { isImageUrl, getDisplayImageUrl } from '../lib/imageHelper';

interface WishlistPageProps {
  wishlist: Record<string, boolean>;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onViewDetails: (product: Product) => void;
  onNavigateToShop: () => void;
  products?: Product[];
}

export const WishlistPage: React.FC<WishlistPageProps> = ({
  wishlist,
  onToggleWishlist,
  onAddToCart,
  onViewDetails,
  onNavigateToShop,
  products: productsProp,
}) => {
  const activeProducts = productsProp || [];
  // Sync wishlisted products list
  const wishlistedItems = activeProducts.filter((p) => wishlist[p.id]);

  const [toastMessage, setToastMessage] = React.useState('');

  React.useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleMoveToCart = (product: Product) => {
    onAddToCart(product, 1);
    onToggleWishlist(product.id); // Remove from wishlist on move to cart
    setToastMessage(`"${product.name}" moved to cart successfully!`);
  };

  const getCategoryGradient = (cat?: string) => {
    if (!cat) {
      return 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)';
    }
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
    <div style={{ backgroundColor: '#fafafa', minHeight: '80vh', paddingBottom: '100px' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: 'var(--primary-forest)',
          color: '#ffffff',
          padding: '16px 24px',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.9rem',
          fontWeight: 700,
          border: '1.5px solid var(--primary-lime)',
          animation: 'slideUp 0.3s ease-out'
        }}>
          <ShoppingCart size={18} style={{ color: 'var(--primary-lime)' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <section style={{
        background: 'linear-gradient(135deg, var(--primary-forest) 0%, #4c1f13 100%)',
        color: '#ffffff',
        padding: '48px 0 40px 0',
        borderBottom: '4px solid var(--primary-lime)',
        textAlign: 'center'
      }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
            <Heart size={28} fill="var(--primary-lime)" style={{ color: 'var(--primary-lime)' }} />
            <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>
              My Sacred Wishlist
            </h1>
          </div>
          <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.88rem', maxWidth: '500px', margin: '0 auto' }}>
            Your personal collection of energetic beads, hand-selected idols, and pure aromatics awaiting your puja altars.
          </p>
        </div>
      </section>

      {/* Wishlist Grid */}
      <div className="container" style={{ marginTop: '40px' }}>
        
        {wishlistedItems.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '16px' }}>❤️</span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)' }}>Your Wishlist is empty</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '24px' }}>
              Tap the heart icon on any sacred items as you browse our spiritual shop collections.
            </p>
            <button onClick={onNavigateToShop} className="btn-lime" style={{ fontSize: '0.88rem', padding: '12px 28px' }}>
              Browse Sacred Store
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                Saved Spiritual Items ({wishlistedItems.length})
              </h2>
              <button
                onClick={onNavigateToShop}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--primary-lime)'
                }}
              >
                Back to Shop <ArrowRight size={14} />
              </button>
            </div>

            {/* Product Card list grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '30px'
            }} className="wishlist-product-grid">
              {wishlistedItems.map((product) => {
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
                            color: '#ef4444',
                            zIndex: 10,
                            boxShadow: 'var(--shadow-sm)',
                            cursor: 'pointer'
                          }}
                          className="flex-center"
                          title="Remove from Wishlist"
                        >
                          <Heart size={15} fill="#ef4444" />
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

                        {/* Move to Cart Button */}
                        <div style={{ marginTop: 'auto' }}>
                          {product.inStock ? (
                            <button
                              onClick={() => handleMoveToCart(product)}
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
                              Move To Cart
                            </button>
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
          </div>
        )}

      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

    </div>
  );
};
