import React from 'react';
import { X, Star, Check, Plus, Minus, ShoppingCart } from 'lucide-react';
import type { Product } from '../types';
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

  React.useEffect(() => {
    // Reset quantity to 1 when product changes
    setQuantity(1);
  }, [product]);

  if (!product) return null;

  const hasDiscount = !!product.originalPrice && product.originalPrice > product.price;

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
        className="glass"
        style={{
          width: '100%',
          maxWidth: '800px',
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
            flexWrap: 'wrap',
            overflowY: 'auto'
          }}
          className="modal-content-container"
        >
          {/* Visual Showcase (Left Column) */}
          <div
            style={{
              flex: '1 1 350px',
              minHeight: '350px',
              background: getCategoryGradient(product.category),
              position: 'relative',
              display: 'flex',
              alignItems: 'stretch',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            {product.image && isImageUrl(product.image) ? (
              <img 
                src={getDisplayImageUrl(product.image)} 
                alt={product.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
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
            style={{
              flex: '1 1 350px',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              textAlign: 'left'
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
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--border-color)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
            >
              <X size={18} />
            </button>

            {/* Category Tag */}
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--primary-gold)',
                textTransform: 'uppercase',
                fontWeight: 700,
                letterSpacing: '1.5px',
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
                marginBottom: '24px'
              }}
            >
              {product.description}
            </p>

            {/* Key Benefits */}
            <div style={{ marginBottom: '28px', textAlign: 'left' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Key Divine Benefits
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', padding: 0, margin: 0 }}>
                {product.benefits.map((benefit, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.88rem' }}>
                    <span style={{ color: 'var(--primary-gold)', marginTop: '2px', display: 'flex' }}>
                      <Check size={14} strokeWidth={3} />
                    </span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Purchase Controls Row */}
            {product.inStock && (
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: 'auto' }}>
                {/* Quantity Selector */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-full)',
                  padding: '6px 12px',
                  backgroundColor: 'var(--bg-primary)'
                }}>
                  <button
                    onClick={handleDecrement}
                    style={{ padding: '2px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', border: 'none', background: 'none', cursor: 'pointer' }}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{ width: '32px', textAlign: 'center', fontWeight: 600, fontSize: '0.95rem' }}>
                    {quantity}
                  </span>
                  <button
                    onClick={handleIncrement}
                    style={{ padding: '2px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', border: 'none', background: 'none', cursor: 'pointer' }}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={() => onAddToCart(product, quantity)}
                  className="btn-primary"
                  style={{
                    flexGrow: 1,
                    justifyContent: 'center',
                    padding: '14px 28px'
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
        @media (max-width: 767px) {
          .modal-content-container {
            flex-direction: column !important;
          }
          .modal-content-container > div {
            flex: 1 1 100% !important;
            height: auto !important;
          }
        }
      `}</style>
    </div>
  );
};
