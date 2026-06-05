import React from 'react';
import { Trash2, ArrowLeft, Ticket, ShieldCheck, Truck, Plus, Minus } from 'lucide-react';
import type { CartItem } from '../types';
import { isImageUrl, getDisplayImageUrl } from '../lib/imageHelper';

interface CartPageProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onBackToShop: () => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onBackToShop,
  onClearCart: _onClearCart,
  onCheckout,
}) => {
  const [couponCode, setCouponCode] = React.useState('');
  const [discountPercent, setDiscountPercent] = React.useState(0);
  const [couponError, setCouponError] = React.useState('');
  const [couponSuccess, setCouponSuccess] = React.useState('');
  const [postalCode, setPostalCode] = React.useState('');
  const [deliveryInfo, setDeliveryInfo] = React.useState('');

  // Dynamic calculations
  const subtotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  
  // Free shipping for orders over ₹500, else ₹49
  const shippingCost = subtotal > 500 || subtotal === 0 ? 0 : 49;
  const tax = (subtotal - discountAmount) * 0.08; // 8% sales tax
  const finalTotal = subtotal - discountAmount + shippingCost + tax;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');

    const formattedCode = couponCode.trim().toUpperCase();
    if (formattedCode === 'DEVOTION10') {
      setDiscountPercent(10);
      setCouponSuccess('Coupon DEVOTION10 applied! 10% discount subtracted.');
    } else if (formattedCode === 'TEMPLE20') {
      setDiscountPercent(20);
      setCouponSuccess('Coupon TEMPLE20 applied! 20% discount subtracted.');
    } else {
      setCouponError('Invalid coupon code. Try DEVOTION10 or TEMPLE20.');
      setDiscountPercent(0);
    }
  };

  const handlePostalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (postalCode.trim().length < 3) {
      setDeliveryInfo('Please enter a valid zip code.');
      return;
    }
    setDeliveryInfo('Estimated Delivery: Arrives in 3 business days via Sacred Express.');
  };

  const handleCheckoutSubmit = () => {
    onCheckout();
  };

  return (
    <div style={{ paddingBottom: '80px', backgroundColor: '#fafafa' }}>
      
      {/* Header Breadcrumb Row */}
      <div className="container" style={{ paddingTop: '24px', paddingBottom: '16px', textAlign: 'left' }}>
        <button
          onClick={onBackToShop}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.88rem',
            fontWeight: 700,
            color: 'var(--primary-lime)',
            transition: 'opacity 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <ArrowLeft size={16} /> Continue Shopping
        </button>
      </div>

      <section className="container">
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-dark)', marginBottom: '32px', textAlign: 'left' }}>
          Your Spiritual Cart
        </h1>

        {cart.length === 0 ? (
          /* Empty Cart State */
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <span style={{ fontSize: '4rem' }}>🛒</span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '16px' }}>Your cart is empty</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '24px' }}>
              Add some blessed items to begin your spiritual journey.
            </p>
            <button onClick={onBackToShop} className="btn-lime" style={{ padding: '12px 32px' }}>
              Browse divine items
            </button>
          </div>
        ) : (
          /* Cart Columns Split */
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr',
            gap: '40px',
            alignItems: 'start'
          }} className="hero-grid-split">
            
            {/* Left Column: Cart items listing, coupons, shipping estimates */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Product Rows List */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)'
              }}>
                {cart.map((item, idx) => (
                  <div
                    key={item.product.id + '-' + idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '20px',
                      borderBottom: idx < cart.length - 1 ? '1px solid var(--border-light)' : 'none',
                      textAlign: 'left'
                    }}
                  >
                    {/* Emoji Card */}
                    <div style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: 'var(--radius-md)',
                      background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      overflow: 'hidden'
                    }}>
                      {isImageUrl(item.product.image) ? (
                        <img
                          src={getDisplayImageUrl(item.product.image)}
                          alt={item.product.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ fontSize: '2.5rem' }}>{item.product.image}</span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div style={{ flexGrow: 1 }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--primary-lime)', fontWeight: 800, textTransform: 'uppercase' }}>
                        {item.product.spiritualType}
                      </span>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)', margin: '2px 0' }}>
                        {item.product.name}
                      </h3>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary-forest)' }}>
                        ₹{item.product.price}
                      </span>
                    </div>

                    {/* Quantity controls */}
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                        style={{ padding: '4px 10px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
                      >
                        <Minus size={14} strokeWidth={2.5} />
                      </button>
                      <span style={{ padding: '0 6px', fontSize: '0.85rem', fontWeight: 800, minWidth: '18px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        style={{ padding: '4px 10px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
                      >
                        <Plus size={14} strokeWidth={2.5} />
                      </button>
                    </div>

                    {/* Delete Bin */}
                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      style={{ color: 'var(--text-muted)', padding: '6px' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Coupon Form Card */}
              <div style={{
                backgroundColor: '#ffffff',
                padding: '24px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--shadow-sm)',
                textAlign: 'left'
              }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Ticket size={16} style={{ color: 'var(--primary-lime)' }} /> Have a Devotional Coupon?
                </h3>
                <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="Enter coupon (e.g. DEVOTION10)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    style={{
                      flexGrow: 1,
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      outline: 'none',
                      fontSize: '0.88rem'
                    }}
                  />
                  <button type="submit" className="btn-lime" style={{ padding: '10px 24px', borderRadius: 'var(--radius-md)', fontSize: '0.88rem' }}>
                    Apply
                  </button>
                </form>
                {couponError && <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '6px', fontWeight: 600 }}>{couponError}</p>}
                {couponSuccess && <p style={{ color: '#10b981', fontSize: '0.78rem', marginTop: '6px', fontWeight: 600 }}>{couponSuccess}</p>}
              </div>

              {/* Shipping Estimate Card */}
              <div style={{
                backgroundColor: '#ffffff',
                padding: '24px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--shadow-sm)',
                textAlign: 'left'
              }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Truck size={16} style={{ color: 'var(--primary-lime)' }} /> Calculate Delivery Estimate
                </h3>
                <form onSubmit={handlePostalSubmit} style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="Enter Zip / Postal Code"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    style={{
                      flexGrow: 1,
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      outline: 'none',
                      fontSize: '0.88rem'
                    }}
                  />
                  <button type="submit" className="btn-lime" style={{ padding: '10px 24px', borderRadius: 'var(--radius-md)', fontSize: '0.88rem' }}>
                    Estimate
                  </button>
                </form>
                {deliveryInfo && <p style={{ color: 'var(--text-dark)', fontSize: '0.8rem', marginTop: '8px', fontWeight: 700 }}>{deliveryInfo}</p>}
              </div>

            </div>

            {/* Right Column: Order Summary & Checkout Action */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)',
              textAlign: 'left',
              position: 'sticky',
              top: '100px'
            }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-dark)', marginBottom: '20px' }}>
                Order Summary
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>₹{subtotal.toFixed(2)}</span>
                </div>
                
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', color: '#ef4444' }}>
                    <span>Discount ({discountPercent}%)</span>
                    <span style={{ fontWeight: 700 }}>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Estimated Shipping</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>
                    {shippingCost === 0 ? 'FREE' : `₹${shippingCost.toFixed(2)}`}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Sales Tax (8%)</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>₹{tax.toFixed(2)}</span>
                </div>
              </div>

              {/* Grand Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '20px 0' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)' }}>Total Cost</span>
                <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary-forest)' }}>
                  ₹{finalTotal.toFixed(2)}
                </span>
              </div>

              {/* Checkout CTA */}
              <button
                id="cart-checkout-btn"
                onClick={handleCheckoutSubmit}
                className="btn-lime"
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                Proceed to Checkout →
              </button>

              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                <ShieldCheck size={16} style={{ color: 'var(--primary-lime)' }} />
                <span>Secure Checkout: SSL Encrypted Transaction Gateways.</span>
              </div>
            </div>

          </div>
        )}

      </section>


    </div>
  );
};

