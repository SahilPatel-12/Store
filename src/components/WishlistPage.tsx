import React from 'react';
import { Heart, Trash2, ShoppingBag, ArrowRight, Star, ShoppingCart } from 'lucide-react';
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
            Your personal collection of energetic beads, hand-selected idols, and pure aromatics awaiting your pooja altars.
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
            }}>
              {wishlistedItems.map((product) => {
                const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
                
                return (
                  <div
                    key={product.id}
                    style={{
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      border: '1px solid var(--border-light)',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      backgroundColor: '#ffffff',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      height: '100%',
                      textAlign: 'left'
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

                    {/* Toggle heart button */}
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
                        zIndex: 10
                      }}
                      className="flex-center"
                      title="Remove from Wishlist"
                    >
                      <Heart size={16} fill="#ef4444" />
                    </button>

                    {/* Image Box */}
                    <div
                      onClick={() => onViewDetails(product)}
                      style={{
                        height: '180px',
                        background: getCategoryGradient(product.category),
                        cursor: 'pointer',
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
                        <span style={{ fontSize: '4.4rem' }}>{product.image}</span>
                      )}
                    </div>

                    {/* Content Details */}
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
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

                      {/* Card actions bottom bar */}
                      <div style={{
                        marginTop: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '12px',
                        borderTop: '1px solid var(--border-light)'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
                            ₹{product.price}
                          </span>
                          {product.originalPrice && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                              ₹{product.originalPrice}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          {/* Remove button */}
                          <button
                            onClick={() => onToggleWishlist(product.id)}
                            style={{
                              border: '1px solid var(--border-light)',
                              borderRadius: 'var(--radius-md)',
                              padding: '8px',
                              color: 'var(--text-muted)'
                            }}
                            className="flex-center"
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>

                          {/* Move to Cart button */}
                          {product.inStock ? (
                            <button
                              onClick={() => handleMoveToCart(product)}
                              className="btn-lime"
                              style={{
                                padding: '8px 14px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                borderRadius: 'var(--radius-md)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <ShoppingBag size={13} />
                              <span>Move to Cart</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 700, padding: '8px 4px' }}>Out of Stock</span>
                          )}
                        </div>
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
