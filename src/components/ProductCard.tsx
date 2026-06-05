import React from 'react';
import { Star, Eye, Upload } from 'lucide-react';
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
      className="fade-in-entry"
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
            alt={(product as any).imageAlt || product.name}
            className="card-image"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease'
            }}
          />
        ) : (
          <span
            className="product-emoji"
            style={{
              fontSize: '4rem',
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

        {/* Ribbon Badge for Discount */}
        {hasDiscount && product.inStock && (
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
            {discountPercent}%<br/>OFF
          </div>
        )}

        {/* Out of stock Ribbon Badge */}
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
                backgroundColor: 'rgba(217, 119, 6, 0.95)',
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

        {/* Quick View Overlay Button */}
        {!editable && (
          <button
            onClick={() => onViewDetails(product)}
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-dark)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.15s ease',
              zIndex: 10
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary-deep)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.color = 'var(--text-dark)';
            }}
          >
            <Eye size={13} /> Quick View
          </button>
        )}

        {/* Floating Rating Badge */}
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

      {/* Info Container */}
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
          {/* Category Edit */}
          {editable && (
            <div style={{
              fontSize: '0.72rem',
              color: 'var(--primary-gold)',
              textTransform: 'uppercase',
              fontWeight: 800,
              letterSpacing: '1px',
              marginBottom: '4px'
            }}>
              <InlineEdit
                value={product.category}
                onChange={(val) => onUpdate && onUpdate({ category: val })}
                placeholder="Category"
              />
            </div>
          )}

          {/* Title */}
          <h3 style={{
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: editable ? 'text' : 'pointer',
            color: 'var(--text-dark)',
            lineHeight: '1.2',
            margin: '0 0 6px 0',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
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

          {/* Sanskrit Name Edit */}
          {(editable || (product as any).sanskritName) && (
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--primary-accent, #ea580c)',
              fontWeight: 600,
              fontStyle: 'italic',
              marginBottom: '6px',
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

          {/* Pricing Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '4px'
          }}>
            <span style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              color: 'var(--primary-forest)'
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
            {(hasDiscount || editable) && (
              <span style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                textDecoration: 'line-through'
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
          </div>
        </div>

        {/* Add to Cart Button / Description Edit */}
        <div style={{ marginTop: 'auto' }}>
          {editable ? (
            <div style={{ fontSize: '0.75rem', border: '1px dashed var(--border-light)', padding: '4px', borderRadius: '4px' }}>
              <InlineEdit
                type="textarea"
                value={(product as any).shortDescription || product.description || ''}
                onChange={(val) => onUpdate && onUpdate({ shortDescription: val, description: val })}
                placeholder="Short description..."
              />
            </div>
          ) : product.inStock ? (
            <button
              onClick={() => onAddToCart(product)}
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
};
