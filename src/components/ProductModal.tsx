import React from 'react';
import { X, Star, ShoppingCart, ZoomIn } from 'lucide-react';
import type { Product, PoojaProduct } from '../types';
import { isImageUrl, getDisplayImageUrl } from '../lib/imageHelper';
import { useLanguage } from '../lib/i18n';

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
  const { language } = useLanguage();
  const isHindi = language === 'hi';
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

  const getCategoryGradient = (category?: string) => {
    if (!category) {
      return 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)';
    }
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

  return (
    <div
      className="modal-overlay-wrapper"
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
          maxWidth: '420px',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          maxHeight: '90vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            padding: '6px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(4px)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all var(--transition-fast)',
            zIndex: 40
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--border-color)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
        >
          <X size={18} />
        </button>

        {/* Main Content Column */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column'
          }}
          className="modal-content-container"
        >
          {/* Visual Showcase */}
          <div
            className="modal-image-column"
            onClick={() => {
              if (!firstVideo && product.image && isImageUrl(product.image)) {
                setIsLightboxOpen(true);
              }
            }}
            style={{
              width: '100%',
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
                  title={isHindi ? "पूर्ण स्क्रीन देखें" : "View full screen"}
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

          {/* Details Section */}
          <div
            className="modal-details-column"
            style={{
              width: '100%',
              padding: '20px 20px 0 20px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              textAlign: 'left',
              boxSizing: 'border-box'
            }}
          >
            {/* Scrollable Content Container */}
            <div style={{ flex: '1 1 auto', marginBottom: '16px' }} className="modal-scrollable-content">
              {/* Title */}
              <h2
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  marginBottom: '8px',
                  lineHeight: 1.25,
                  paddingRight: '24px'
                }}
              >
                {product.name}
              </h2>

              {/* Ratings */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
                <Star size={16} fill="var(--primary-gold)" color="var(--primary-gold)" />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{product.rating}</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  ({isHindi ? `${product.reviewsCount} समीक्षाएं` : `${product.reviewsCount} reviews`})
                </span>
              </div>

              {/* Pricing Section */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <span
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: 'var(--primary-accent)'
                  }}
                >
                  ₹{product.price.toFixed(2)}
                </span>
                {hasDiscount && (
                  <span
                    style={{
                      fontSize: '1rem',
                      color: 'var(--text-secondary)',
                      textDecoration: 'line-through'
                    }}
                  >
                    ₹{product.originalPrice?.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Purchase Controls Row */}
            {product.inStock && (
              <div
                className="modal-purchase-controls"
                style={{
                  display: 'flex',
                  borderTop: '1px solid var(--border-color)',
                  padding: '16px 20px 20px 20px',
                  margin: '0 -20px',
                  backgroundColor: '#ffffff',
                  zIndex: 10
                }}
              >
                {/* Add to Cart Button */}
                <button
                  onClick={() => onAddToCart(product, 1)}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    height: '50px',
                    borderRadius: 'var(--radius-full)',
                    boxSizing: 'border-box',
                    fontSize: '1rem',
                    fontWeight: 800,
                    backgroundColor: '#fbbf24',
                    color: '#111827',
                    border: 'none',
                    outline: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(251, 191, 36, 0.15)'
                  }}
                >
                  <ShoppingCart size={18} /> {isHindi ? `कार्ट में जोड़ें (₹${product.price.toFixed(2)})` : `Add to Cart (₹${product.price.toFixed(2)})`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .modal-overlay-wrapper {
          overflow-y: auto !important;
          align-items: center !important;
          padding: 20px 16px !important;
        }
        @media (max-width: 767px) {
          .modal-overlay-wrapper {
            align-items: center !important;
            padding: 16px 12px !important;
          }
        }
        .modal-white-container {
          background: #ffffff !important;
          border: 1px solid var(--border-color) !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
          max-height: none !important;
        }
        @media (max-width: 480px) {
          .modal-white-container {
            width: 100% !important;
          }
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
