import React from 'react';
import { Star, ShoppingCart, Eye, Upload } from 'lucide-react';
import type { Product, PoojaProduct } from '../types';
import { isImageUrl, getDisplayImageUrl } from '../lib/imageHelper';
import { InlineEdit } from './InlineEdit';
import { uploadToR2 } from '../lib/cloudflare/r2';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  editable?: boolean;
  onUpdate?: (updatedFields: Partial<PoojaProduct>) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onViewDetails,
  editable = false,
  onUpdate,
}) => {
  const hasDiscount = !!product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  // Curate a gorgeous spiritual background gradient based on category
  const getCategoryGradient = (category: string) => {
    switch (category) {
      case 'kits':
        return 'linear-gradient(135deg, #ffedd5 0%, #ffebd5 100%)'; /* warm peach */
      case 'idols':
        return 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'; /* warm brass gold */
      case 'incense':
        return 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)'; /* soothing lavender purple */
      case 'books':
        return 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)'; /* peaceful blue */
      case 'accessories':
      default:
        return 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'; /* clean sage green */
    }
  };

  return (
    <div
      className="glass fade-in-entry"
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
        transition: 'all var(--transition-normal)',
        position: 'relative',
        height: '100%'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg), var(--shadow-gold)';
        const img = e.currentTarget.querySelector('.product-emoji, .product-image-el') as HTMLElement;
        if (img) img.style.transform = 'scale(1.2) rotate(5deg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        const img = e.currentTarget.querySelector('.product-emoji, .product-image-el') as HTMLElement;
        if (img) img.style.transform = 'scale(1) rotate(0deg)';
      }}
    >
      {/* Discount Badge */}
      {hasDiscount && product.inStock && (
        <span style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          backgroundColor: 'var(--primary-accent)',
          color: '#ffffff',
          fontSize: '0.75rem',
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          zIndex: 10,
          boxShadow: 'var(--shadow-sm)'
        }}>
          {discountPercent}% OFF
        </span>
      )}

      {/* Out of stock Badge */}
      {!product.inStock && (
        <span style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          backgroundColor: 'var(--text-secondary)',
          color: '#ffffff',
          fontSize: '0.75rem',
          fontWeight: 600,
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          zIndex: 10,
          boxShadow: 'var(--shadow-sm)'
        }}>
          Sold Out
        </span>
      )}

      {/* Custom Badges (Dynamic from Supabase) */}
      {(product as any).badges && (product as any).badges.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          zIndex: 10
        }}>
          {(product as any).badges.map((badge: string, index: number) => (
            <span key={index} style={{
              backgroundColor: 'rgba(217, 119, 6, 0.95)', /* warm temple orange/amber */
              color: '#ffffff',
              fontSize: '0.65rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm, 4px)',
              boxShadow: 'var(--shadow-sm)',
              textTransform: 'uppercase'
            }}>
              {badge}
            </span>
          ))}
        </div>
      )}

      {/* Visual Image / Placeholder */}
      <div
        className="flex-center"
        style={{
          width: '100%',
          height: '200px',
          background: getCategoryGradient(product.category),
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid var(--border-color)'
        }}
      >
        {product.image && isImageUrl(product.image) ? (
          <img
            src={getDisplayImageUrl(product.image)}
            alt={(product as any).imageAlt || product.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'all var(--transition-normal)'
            }}
            className="product-image-el"
          />
        ) : (
          <span
            className="product-emoji"
            style={{
              fontSize: '5rem',
              transition: 'all var(--transition-normal)',
              userSelect: 'none'
            }}
          >
            {product.image}
          </span>
        )}

        {/* Cloudflare R2 Upload Overlay when Editable */}
        {editable && (
          <>
            <label
              htmlFor={`card-image-upload-${product.id}`}
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                opacity: 0,
                transition: 'opacity 0.2s',
                zIndex: 20
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
            >
              <Upload size={24} />
              <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>Upload Image to R2</span>
            </label>
            <input
              id={`card-image-upload-${product.id}`}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file && onUpdate) {
                  try {
                    const cdnUrl = await uploadToR2(file, 'products/thumbnails');
                    onUpdate({ image: cdnUrl });
                  } catch (err) {
                    alert('Upload failed: ' + (err as Error).message);
                  }
                }
              }}
            />
          </>
        )}

        {/* Quick View Overlay Button */}
        <button
          onClick={() => onViewDetails(product)}
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            backgroundColor: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            color: 'var(--primary-deep)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: 'var(--shadow-sm)',
            backdropFilter: 'blur(4px)',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--primary-deep)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--glass-bg)';
            e.currentTarget.style.color = 'var(--primary-deep)';
          }}
        >
          <Eye size={14} /> Quick View
        </button>
      </div>

      {/* Info Container */}
      <div style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1
      }}>
        {/* Rating and Category */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}>
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--primary-gold)',
            textTransform: 'uppercase',
            fontWeight: 600,
            letterSpacing: '1px'
          }}>
            {editable ? (
              <InlineEdit
                value={product.category}
                onChange={(val) => onUpdate && onUpdate({ category: val })}
                placeholder="Category"
              />
            ) : (
              product.category
            )}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Star size={14} fill="var(--primary-gold)" color="var(--primary-gold)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {product.rating}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              ({product.reviewsCount})
            </span>
          </div>
        </div>

        {/* Title & Sanskrit Name */}
        <div style={{ marginBottom: '8px', textAlign: 'left' }}>
          <h3 style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            cursor: editable ? 'text' : 'pointer',
            color: 'var(--text-dark)',
            lineHeight: '1.2',
            margin: 0
          }} onClick={() => !editable && onViewDetails(product)}>
            {editable ? (
              <InlineEdit
                value={product.name}
                onChange={(val) => onUpdate && onUpdate({ name: val })}
                placeholder="Product Name"
              />
            ) : (
              product.name
            )}
          </h3>
          {(editable || (product as any).sanskritName) && (
            <div style={{
              fontSize: '0.78rem',
              color: 'var(--primary-accent, #ea580c)',
              fontWeight: 600,
              fontStyle: 'italic',
              marginTop: '2px',
              fontFamily: 'var(--font-serif, serif)'
            }}>
              {editable ? (
                <InlineEdit
                  value={(product as any).sanskritName || ''}
                  onChange={(val) => onUpdate && onUpdate({ sanskritName: val })}
                  placeholder="Sanskrit Name"
                />
              ) : (
                (product as any).sanskritName
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <p style={{
          fontSize: '0.88rem',
          color: 'var(--text-secondary)',
          marginBottom: '16px',
          textAlign: 'left',
          display: '-webkit-box',
          WebkitLineClamp: editable ? undefined : 2,
          WebkitBoxOrient: 'vertical',
          overflow: editable ? 'visible' : 'hidden',
          textOverflow: editable ? 'clip' : 'ellipsis',
          height: editable ? 'auto' : '42px',
          lineHeight: '1.35'
        }}>
          {editable ? (
            <InlineEdit
              type="textarea"
              value={(product as any).shortDescription || product.description || ''}
              onChange={(val) => onUpdate && onUpdate({ shortDescription: val, description: val })}
              placeholder="Short description..."
            />
          ) : (
            (product as any).shortDescription || product.description
          )}
        </p>

        {/* Pricing & Add to Cart Row */}
        <div style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            {(hasDiscount || editable) && (
              <span style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                textDecoration: 'line-through',
                lineHeight: 1
              }}>
                {editable ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    Orig: ₹
                    <InlineEdit
                      type="number"
                      value={product.originalPrice ? product.originalPrice.toString() : ''}
                      onChange={(val) => onUpdate && onUpdate({ originalPrice: val ? parseFloat(val) : undefined })}
                      placeholder="No discount"
                    />
                  </span>
                ) : (
                  `₹${product.originalPrice?.toFixed(2)}`
                )}
              </span>
            )}
            <span style={{
              fontSize: '1.3rem',
              fontWeight: 700,
              color: 'var(--primary-accent)',
              lineHeight: 1.1
            }}>
              {editable ? (
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  ₹
                  <InlineEdit
                    type="number"
                    value={product.price.toString()}
                    onChange={(val) => onUpdate && onUpdate({ price: parseFloat(val) || 0 })}
                    placeholder="Price"
                  />
                </span>
              ) : (
                `₹${product.price.toFixed(2)}`
              )}
            </span>
          </div>

          <button
            onClick={() => product.inStock && onAddToCart(product)}
            disabled={!product.inStock}
            style={{
              padding: '10px 16px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: product.inStock ? 'var(--primary-deep)' : 'var(--border-color)',
              color: product.inStock ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: product.inStock ? 'var(--shadow-sm)' : 'none',
              transition: 'all var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              if (product.inStock) {
                e.currentTarget.style.backgroundColor = 'var(--primary-accent)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (product.inStock) {
                e.currentTarget.style.backgroundColor = 'var(--primary-deep)';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            <ShoppingCart size={16} /> Add
          </button>
        </div>
      </div>
    </div>
  );
};
