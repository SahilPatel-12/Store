import React from 'react';
import { X, Star, Check, Plus, Minus, ShoppingCart, ZoomIn } from 'lucide-react';
import type { Product, PoojaProduct } from '../types';
import { isImageUrl, getDisplayImageUrl } from '../lib/imageHelper';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = React.useState(1);
  const [showMore, setShowMore] = React.useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen]);

  React.useEffect(() => {
    // Reset quantity to 1 and showMore to false when product changes
    setQuantity(1);
    setShowMore(false);

    // Disable body scroll when modal is active
    if (product) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [product]);

  if (!product) return null;

  const firstVideo = (product as any).videoUrl || 
    ((product as PoojaProduct).galleryImages?.find((img: any) => img.isVideo) as any)?.url;
  
  const firstVideoThumbnail = (product as any).uiLabels?.videoThumbnail ||
    ((product as PoojaProduct).galleryImages?.find((img: any) => img.isVideo) as any)?.thumbnail;

  const hasDiscount = !!product.originalPrice && product.originalPrice > product.price;
  const hasMoreContent = (product.description && product.description.length > 120) || (product.benefits && product.benefits.length > 2);

  const getCategoryGradient = (category: string) => {
    switch (category) {
      case 'kits':
        return 'linear-gradient(135deg, #ffedd5 0%, #ffebd5 100%)';
      case 'idols':
        return 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
      case 'incense':
        return 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)';
      case 'books':
        return 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)';
      case 'accessories':
      default:
        return 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)';
    }
  };

  const handleIncrement = () => setQuantity(prev => prev + 1);
  const handleDecrement = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="modal-white-container"
        style={{
          width: '100%',
          maxWidth: '950px',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Content Row */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap'
          }}
          className="modal-content-container"
        >
          {/* Visual Showcase (Left Column) */}
          <div
            className="modal-image-column"
            onClick={() => {
              if (!firstVideo && product.image && isImageUrl(product.image)) {
                setIsLightboxOpen(true);
              }
            }}
            style={{
              flex: '1 1 350px',
              aspectRatio: '1 / 1',
              background: getCategoryGradient(product.category),
              position: 'relative',
              display: 'flex',
              alignItems: 'stretch',
              justifyContent: 'center',
              overflow: 'hidden',
              cursor: (!firstVideo && product.image && isImageUrl(product.image)) ? 'zoom-in' : 'default'
            }}
          >
            {firstVideo ? (
              <video
                src={firstVideo}
                poster={firstVideoThumbnail || undefined}
                autoPlay
                muted
                loop
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : product.image && isImageUrl(product.image) ? (
              <>
                <img
                  src={getDisplayImageUrl(product.image)}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    zIndex: 25,
                    color: 'var(--text-primary)',
                    transition: 'all 0.2s',
                  }}
                  title="View full screen"
                >
                  <ZoomIn size={18} />
                </div>
              </>
            ) : (
              <span
                style={{
                  fontSize: '8rem',
                  userSelect: 'none',
                  alignSelf: 'center'
                }}
              >
                {product.image}
              </span>
            )}
          </div>

          {/* Details Section (Right Column) */}
          <div
            className="modal-details-column"
            style={{
              flex: '1 1 350px',
              padding: '32px 0 0 32px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              textAlign: 'left',
              height: '100%',
              boxSizing: 'border-box'
            }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                padding: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all var(--transition-fast)',
                zIndex: 20
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--border-color)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
            >
              <X size={18} />
            </button>

            {/* Scrollable Content Container */}
            <div style={{ flex: '1 1 auto', overflowY: 'auto', paddingRight: '32px', marginBottom: '16px', overscrollBehavior: 'contain' }} className="modal-scrollable-content">
              {/* Category Tag */}
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--primary-gold)',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: '1.5px',
                  display: 'block',
                  marginBottom: '12px'
                }}
              >
                {product.category}
              </span>

              {/* Title */}
              <h2
                style={{
                  fontSize: '1.8rem',
                  marginBottom: '12px',
                  lineHeight: 1.2,
                  paddingRight: '32px'
                }}
              >
                {product.name}
              </h2>

              {/* Ratings & Stock Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Star size={16} fill="var(--primary-gold)" color="var(--primary-gold)" />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{product.rating}</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    ({product.reviewsCount} verified reviews)
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: product.inStock ? 'var(--primary-gold)' : 'var(--text-secondary)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: product.inStock ? 'rgba(217, 119, 6, 0.1)' : 'var(--border-color)'
                  }}
                >
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>

              {/* Pricing Section */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '20px' }}>
                <span
                  style={{
                    fontSize: '1.8rem',
                    fontWeight: 700,
                    color: 'var(--primary-accent)'
                  }}
                >
                  ₹{product.price.toFixed(2)}
                </span>
                {hasDiscount && (
                  <span
                    style={{
                      fontSize: '1.1rem',
                      color: 'var(--text-secondary)',
                      textDecoration: 'line-through'
                    }}
                  >
                    ₹{product.originalPrice?.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p
                style={{
                  fontSize: '0.92rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  textAlign: 'left',
                  marginBottom: '16px'
                }}
              >
                {!showMore && product.description && product.description.length > 120
                  ? `${product.description.slice(0, 120)}...`
                  : product.description}
              </p>

              {/* Key Benefits */}
              {product.benefits && product.benefits.length > 0 && (
                <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Key Divine Benefits
                  </h4>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', padding: 0, margin: 0 }}>
                    {(showMore ? product.benefits : product.benefits.slice(0, 2)).map((benefit, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.88rem' }}>
                        <span style={{ color: 'var(--primary-gold)', marginTop: '2px', display: 'flex' }}>
                          <Check size={14} strokeWidth={3} />
                        </span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* See More Toggle */}
              {hasMoreContent && (
                <button
                  onClick={() => setShowMore(!showMore)}
                  style={{
                    alignSelf: 'flex-start',
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-gold, #d97706)',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    padding: '4px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    textDecoration: 'underline'
                  }}
                >
                  {showMore ? 'See Less' : 'See More'}
                </button>
              )}
            </div>

            {/* Purchase Controls Row */}
            {product.inStock && (
              <div style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border-color)',
                padding: '16px 32px 32px 32px',
                margin: '0 -32px',
                backgroundColor: '#ffffff',
                zIndex: 10
              }}>
                {/* Quantity Selector */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1.5px solid var(--border-color)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0 20px',
                  height: '54px',
                  backgroundColor: 'var(--bg-primary)',
                  boxSizing: 'border-box'
                }}>
                  <button
                    onClick={handleDecrement}
                    style={{ padding: '4px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', border: 'none', background: 'none', cursor: 'pointer' }}
                  >
                    <Minus size={16} />
                  </button>
                  <span style={{ width: '36px', textAlign: 'center', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                    {quantity}
                  </span>
                  <button
                    onClick={handleIncrement}
                    style={{ padding: '4px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', border: 'none', background: 'none', cursor: 'pointer' }}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={() => onAddToCart(product, quantity)}
                  className="btn-primary"
                  style={{
                    flexGrow: 1,
                    maxWidth: '280px',
                    justifyContent: 'center',
                    padding: '0 28px',
                    height: '54px',
                    borderRadius: 'var(--radius-full)',
                    boxSizing: 'border-box',
                    fontSize: '1rem',
                    fontWeight: 800
                  }}
                >
                  <ShoppingCart size={18} /> Add to Cart (₹{(product.price * quantity).toFixed(2)})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .modal-white-container {
          background: #ffffff !important;
          border: 1px solid var(--border-color) !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
        }
        @media (min-width: 768px) {
          .modal-content-container {
            height: 480px !important;
            overflow: hidden !important;
            flex-wrap: nowrap !important;
          }
          .modal-image-column {
            flex: 0 0 480px !important;
            height: 480px !important;
            width: 480px !important;
          }
          .modal-details-column {
            flex: 1 1 auto !important;
            height: 480px !important;
            overflow: hidden !important;
          }
        }
        @media (max-width: 767px) {
          .modal-content-container {
            flex-direction: column !important;
          }
          .modal-content-container > div {
            flex: 1 1 100% !important;
            height: auto !important;
          }
          .modal-details-column {
            padding: 24px 20px 20px 20px !important;
          }
          .modal-scrollable-content {
            padding-right: 0 !important;
          }
        }
        /* Thin premium custom scrollbar for details section */
        .modal-scrollable-content {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
        .modal-scrollable-content::-webkit-scrollbar {
          width: 5px;
        }
        .modal-scrollable-content::-webkit-scrollbar-track {
          background: transparent;
        }
        .modal-scrollable-content::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 10px;
        }
        .modal-scrollable-content::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}</style>
      {/* Lightbox Modal */}
      {isLightboxOpen && product.image && isImageUrl(product.image) && (
        <div
          onClick={() => setIsLightboxOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              zIndex: 100000
            }}
          >
            <X size={24} />
          </button>

          {/* Center Image Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img
              src={getDisplayImageUrl(product.image)}
              alt={product.name}
              style={{
                maxWidth: '100%',
                maxHeight: '85vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
};
