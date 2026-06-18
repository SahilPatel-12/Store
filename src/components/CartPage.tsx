import React from 'react';
import { Trash2, ArrowLeft, Ticket, ShieldCheck, Truck, Plus, Minus } from 'lucide-react';
import type { CartItem } from '../types';
import { isImageUrl, getDisplayImageUrl } from '../lib/imageHelper';
import { supabase } from '../lib/supabase';

interface CartPageProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onBackToShop: () => void;
  onClearCart: () => void;
  onCheckout: () => void;
  loggedInUser?: { id: string; fullName: string; email: string; phoneNumber: string } | null;
  appliedCouponCode: string;
  onApplyCoupon: (code: string, percent: number, productId: string | null) => void;
  discountPercent: number;
  taxDeliverySettings: {
    globalGstPercent: number;
    globalDeliveryCharge: number;
    freeDeliveryThreshold: number;
  };
}

export const CartPage: React.FC<CartPageProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onBackToShop,
  onClearCart: _onClearCart,
  onCheckout,
  loggedInUser,
  appliedCouponCode,
  onApplyCoupon,
  discountPercent,
  taxDeliverySettings,
}) => {
  const [couponCode, setCouponCode] = React.useState(appliedCouponCode);
  const [couponError, setCouponError] = React.useState('');
  const [couponSuccess, setCouponSuccess] = React.useState('');
  const [postalCode, setPostalCode] = React.useState('');
  const [deliveryInfo, setDeliveryInfo] = React.useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = React.useState(false);

  React.useEffect(() => {
    if (appliedCouponCode) {
      setCouponSuccess(`Coupon ${appliedCouponCode} applied! ${discountPercent}% discount subtracted.`);
      setCouponCode(appliedCouponCode);
    } else {
      setCouponSuccess('');
    }
  }, [appliedCouponCode, discountPercent]);

  // Dynamic calculations
  const subtotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  
  // Dynamic shipping charge
  const maxDelivery = cart.length === 0 ? 0 : Math.max(...cart.map(item => {
    const p = item.product as any;
    return p.deliveryOverrideEnabled && p.customDelivery !== undefined && p.customDelivery !== null
      ? p.customDelivery
      : taxDeliverySettings.globalDeliveryCharge;
  }));
  const shippingCost = (subtotal - discountAmount) >= taxDeliverySettings.freeDeliveryThreshold || subtotal === 0 ? 0 : maxDelivery;

  // Dynamic tax calculation
  const tax = cart.reduce((totalTax, item) => {
    const p = item.product as any;
    const itemSubtotal = p.price * item.quantity;
    const itemDiscountedSubtotal = itemSubtotal * (1 - discountPercent / 100);
    const itemGstPercent = p.gstOverrideEnabled && p.customGst !== undefined && p.customGst !== null
      ? p.customGst
      : taxDeliverySettings.globalGstPercent;
    return totalTax + (itemDiscountedSubtotal * (itemGstPercent / 100));
  }, 0);

  const finalTotal = subtotal - discountAmount + shippingCost + tax;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');

    const formattedCode = couponCode.trim().toUpperCase();
    if (!formattedCode) {
      onApplyCoupon('', 0, null);
      return;
    }

    if (!loggedInUser) {
      setCouponError('Please log in to apply devotional coupons.');
      onApplyCoupon('', 0, null);
      return;
    }

    setIsValidatingCoupon(true);
    try {
      // 1. Fetch coupon details from Supabase
      const { data: coupon, error: fetchError } = await supabase
        .from('website_store_coupons')
        .select('*')
        .eq('code', formattedCode)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!coupon) {
        setCouponError('Invalid coupon code.');
        onApplyCoupon('', 0, null);
        return;
      }

      // 2. Validate usage limit
      if (coupon.user_limit !== null && coupon.redemptions_count >= coupon.user_limit) {
        setCouponError('This coupon has reached its total usage limit.');
        onApplyCoupon('', 0, null);
        return;
      }

      // 3. Validate single-use limit (per user)
      const { data: existingRedemption, error: redemptionError } = await supabase
        .from('website_store_coupon_redemptions')
        .select('id')
        .eq('coupon_id', coupon.id)
        .eq('user_id', loggedInUser.id)
        .maybeSingle();

      if (redemptionError) throw redemptionError;

      if (existingRedemption) {
        setCouponError('You have already used this coupon code.');
        onApplyCoupon('', 0, null);
        return;
      }

      // 4. Validate product constraint
      if (coupon.product_id) {
        const hasProduct = cart.some(item => item.product.id === coupon.product_id);
        if (!hasProduct) {
          const { data: productData } = await supabase
            .from('website_pooja_products')
            .select('name')
            .eq('id', coupon.product_id)
            .maybeSingle();
          
          const productName = productData?.name || 'a specific product';
          setCouponError(`This coupon is only valid for product: ${productName}.`);
          onApplyCoupon('', 0, null);
          return;
        }
      }

      // 5. Apply coupon
      onApplyCoupon(formattedCode, coupon.discount_percent, coupon.product_id || null);
      setCouponSuccess(`Coupon ${formattedCode} applied! ${coupon.discount_percent}% discount subtracted.`);

    } catch (err) {
      console.error('Error applying coupon:', err);
      setCouponError('An error occurred while applying coupon. Please try again.');
      onApplyCoupon('', 0, null);
    } finally {
      setIsValidatingCoupon(false);
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
                  <button type="submit" className="btn-lime" disabled={isValidatingCoupon} style={{ padding: '10px 24px', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', opacity: isValidatingCoupon ? 0.7 : 1 }}>
                    {isValidatingCoupon ? 'Validating...' : 'Apply'}
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
                  <span style={{ color: 'var(--text-muted)' }}>Sales Tax / GST</span>
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
                  padding: '18px 24px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '1.15rem',
                  fontWeight: 900,
                  boxShadow: '0 6px 20px rgba(132, 204, 22, 0.25)'
                }}
              >
                <span style={{ letterSpacing: '0.5px' }}>PROCEED TO CHECKOUT</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 900 }}>₹{finalTotal.toFixed(2)}</span>
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

