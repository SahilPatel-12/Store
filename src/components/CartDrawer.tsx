import React from 'react';
import { X, ShoppingBag, Sparkles } from 'lucide-react';
import type { CartItem } from '../types';
import { isImageUrl, getDisplayImageUrl } from '../lib/imageHelper';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  const [checkoutState, setCheckoutState] = React.useState<'idle' | 'processing' | 'success'>('idle');

  React.useEffect(() => {
    if (!isOpen) {
      // Reset checkout status when closed
      setCheckoutState('idle');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingFee = subtotal > 50 || subtotal === 0 ? 0 : 5.99;
  const spiritualDiscount = subtotal > 100 ? subtotal * 0.1 : 0; // 10% auto-discount for bulk blessings
  const total = subtotal + shippingFee - spiritualDiscount;

  const handleCheckout = () => {
    setCheckoutState('processing');
    setTimeout(() => {
      setCheckoutState('success');
      setTimeout(() => {
        onClearCart();
        onClose();
      }, 2500);
    }, 2000);
  };

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

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(6px)',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end'
      }}
      onClick={onClose}
    >
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: '450px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.15)',
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={20} style={{ color: 'var(--primary-gold)' }} />
            <h2 style={{ fontSize: '1.4rem' }}>Sacred Cart</h2>
          </div>
          <button
            onClick={onClose}
            style={{
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
        </div>

        {/* Success Screen */}
        {checkoutState === 'success' ? (
          <div className="flex-center" style={{
            flexGrow: 1,
            flexDirection: 'column',
            padding: '40px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-secondary)'
          }}>
            <div className="pulse-gold-anim flex-center float-anim" style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-accent), var(--primary-gold))',
              color: '#ffffff',
              marginBottom: '24px'
            }}>
              <Sparkles size={40} />
            </div>
            <h3 style={{ fontSize: '1.6rem', marginBottom: '12px' }}>Order Placed!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Your order has been energized. May your home be filled with divine light and positive vibrations.
            </p>
          </div>
        ) : (
          <>
            {/* Scrollable Items list */}
            <div style={{
              flexGrow: 1,
              overflowY: 'auto',
              padding: '20px'
            }}>
              {cartItems.length === 0 ? (
                <div className="flex-center" style={{
                  height: '100%',
                  flexDirection: 'column',
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: 'var(--text-secondary)'
                }}>
                  <ShoppingBag size={48} strokeWidth={1} style={{ marginBottom: '16px', color: 'var(--border-color)' }} />
                  <p style={{ fontSize: '1rem', fontWeight: 500 }}>Your cart is empty</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Add sacred items to begin your spiritual journey.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {cartItems.map((item) => (
                    <div
                      key={item.product.id}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      {/* Product Thumbnail */}
                      <div
                        className="flex-center"
                        style={{
                          width: '70px',
                          height: '70px',
                          borderRadius: 'var(--radius-sm)',
                          background: getCategoryGradient(item.product.category),
                          flexShrink: 0,
                          overflow: 'hidden'
                        }}
                      >
                        {isImageUrl(item.product.image) ? (
                          <img
                            src={getDisplayImageUrl(item.product.image)}
                            alt={item.product.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span style={{ fontSize: '2rem' }}>{item.product.image}</span>
                        )}
                      </div>

                      {/* Item Details */}
                      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                        <span style={{
                          fontSize: '0.92rem',
                          fontWeight: 600,
                          color: 'var(--primary-deep)',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {item.product.name}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                          ₹{item.product.price.toFixed(2)} each
                        </span>

                        {/* Quantity controls */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden',
                            backgroundColor: '#ffffff'
                          }}>
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                              style={{ padding: '4px 10px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              -
                            </button>
                            <span style={{ fontSize: '0.88rem', fontWeight: 700, minWidth: '16px', textAlign: 'center' }}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                              style={{ padding: '4px 10px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => onRemoveItem(item.product.id)}
                            style={{
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: '#ef4444',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Checkout Order Summary Section */}
            {cartItems.length > 0 && (
              <div style={{
                padding: '24px',
                backgroundColor: '#ffffff',
                borderTop: '1px solid var(--border-color)',
                boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Items Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Divine Shipping</span>
                    <span>{shippingFee === 0 ? <span style={{ color: 'green', fontWeight: 600 }}>FREE</span> : `₹${shippingFee.toFixed(2)}`}</span>
                  </div>

                  {spiritualDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'green' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Sparkles size={14} /> Spiritual Discount
                      </span>
                      <span>-₹{spiritualDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-color)',
                    color: 'var(--primary-deep)'
                  }}>
                    <span>Total Amount</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkoutState === 'processing'}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '14px'
                  }}
                >
                  {checkoutState === 'processing' ? 'Processing Blessings...' : 'Energize & Place Order'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
