import React from 'react';
import { X, ShoppingBag, Sparkles, Plus, Minus, Trash2, Ticket, ChevronDown, Gift } from 'lucide-react';
import type { CartItem, Product } from '../types';
import { isImageUrl, getDisplayImageUrl } from '../lib/imageHelper';
import { supabase } from '../lib/supabase';

const formatPrice = (val: any): string => {
  if (val === undefined || val === null) return '0.00';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return (typeof num === 'number' && !isNaN(num)) ? num.toFixed(2) : '0.00';
};

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  loggedInUser?: { id: string; fullName: string; email: string; phoneNumber: string } | null;
  appliedCouponCode: string;
  onApplyCoupon: (code: string, percent: number, productId: string | null) => void;
  discountPercent: number;
  products: Product[];
  exploreMoreProductIds?: string[];
  onAddToCart?: (product: Product, quantity?: number) => void;
  taxDeliverySettings: {
    globalGstPercent: number;
    globalDeliveryCharge: number;
    freeDeliveryThreshold: number;
  };
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems = [],
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  loggedInUser,
  appliedCouponCode,
  onApplyCoupon,
  discountPercent,
  products = [],
  exploreMoreProductIds = [],
  onAddToCart,
  taxDeliverySettings,
}) => {
  const [couponCodeInput, setCouponCodeInput] = React.useState(appliedCouponCode);
  const [couponError, setCouponError] = React.useState('');
  const [couponSuccess, setCouponSuccess] = React.useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = React.useState(false);
  const [isCouponSectionExpanded, setIsCouponSectionExpanded] = React.useState(false);



  // Sync coupon code input when appliedCouponCode changes
  React.useEffect(() => {
    setCouponCodeInput(appliedCouponCode);
    if (appliedCouponCode) {
      setCouponSuccess(`Coupon ${appliedCouponCode} applied! (${discountPercent}% OFF)`);
      setCouponError('');
    } else {
      setCouponSuccess('');
    }
  }, [appliedCouponCode, discountPercent]);



  // Pricing calculations
  const items = Array.isArray(cartItems) ? cartItems.filter(Boolean) : [];
  const subtotal = items.reduce((sum, item) => sum + (item?.product?.price || 0) * (item?.quantity || 1), 0);
  const couponDiscount = subtotal * (discountPercent / 100);
  
  // Free Pyrite gift calculation (priced at 0 in cart, original 1400)
  const giftItem = items.find(item => item?.product?.id === 'gift-pyrite-bracelet');
  const hasGift = !!giftItem;
  const giftValue = 1400;

  // Dynamic shipping charge
  const maxDelivery = items.length === 0 ? 0 : Math.max(...items.map(item => {
    const p = item.product as any;
    return p.deliveryOverrideEnabled && p.customDelivery !== undefined && p.customDelivery !== null
      ? p.customDelivery
      : taxDeliverySettings.globalDeliveryCharge;
  }));
  const shippingCost = (subtotal - couponDiscount) >= taxDeliverySettings.freeDeliveryThreshold || subtotal === 0 ? 0 : maxDelivery;

  // Dynamic tax calculation
  const tax = items.reduce((totalTax, item) => {
    const p = item.product as any;
    const itemSubtotal = (p.price || 0) * (item.quantity || 1);
    const itemDiscountedSubtotal = itemSubtotal * (1 - discountPercent / 100);
    const itemGstPercent = p.gstOverrideEnabled && p.customGst !== undefined && p.customGst !== null
      ? p.customGst
      : taxDeliverySettings.globalGstPercent;
    return totalTax + (itemDiscountedSubtotal * (itemGstPercent / 100));
  }, 0);

  const estimatedTotal = Math.max(0, subtotal - couponDiscount + shippingCost + tax);

  // Calculate actual savings
  const originalTotal = items.reduce((sum, item) => {
    if (!item?.product) return sum;
    const origPrice = item.product.originalPrice || item.product.price;
    // Special case for gift: original price is 1400, selling price is 0
    if (item.product.id === 'gift-pyrite-bracelet') {
      return sum + giftValue;
    }
    return sum + origPrice * (item?.quantity || 1);
  }, 0);

  const totalSaved = Math.max(0, originalTotal - (subtotal - couponDiscount) + (hasGift ? giftValue : 0));

  // Explore more items (filtering out cart items)
  const crossSellProducts = React.useMemo(() => {
    const cartIds = new Set(items.map(item => item?.product?.id).filter(Boolean));
    let pool = Array.isArray(products) ? products : [];
    const validIds = Array.isArray(exploreMoreProductIds) ? exploreMoreProductIds : [];
    if (validIds.length > 0) {
      const selectedPool = pool.filter(p => p && p.id && validIds.includes(p.id));
      if (selectedPool.length > 0) {
        pool = selectedPool;
      }
    }
    return pool.filter(p => p && p.id && !cartIds.has(p.id)).slice(0, 6);
  }, [products, items, exploreMoreProductIds]);

  const handleApplyCoupon = async (code: string) => {
    setCouponError('');
    setCouponSuccess('');
    const formattedCode = code.trim().toUpperCase();
    if (!formattedCode) {
      onApplyCoupon('', 0, null);
      return;
    }

    if (!loggedInUser) {
      setCouponError('Please log in to apply coupons.');
      return;
    }

    setIsValidatingCoupon(true);
    try {
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

      if (coupon.user_limit !== null && coupon.redemptions_count >= coupon.user_limit) {
        setCouponError('Coupon usage limit reached.');
        onApplyCoupon('', 0, null);
        return;
      }

      const { data: existingRedemption, error: redemptionError } = await supabase
        .from('website_store_coupon_redemptions')
        .select('id')
        .eq('coupon_id', coupon.id)
        .eq('user_id', loggedInUser.id)
        .maybeSingle();

      if (redemptionError) throw redemptionError;

      if (existingRedemption) {
        setCouponError('You have already used this coupon.');
        onApplyCoupon('', 0, null);
        return;
      }

      if (coupon.product_id) {
        const hasProduct = items.some(item => item?.product?.id === coupon.product_id);
        if (!hasProduct) {
          const { data: productData } = await supabase
            .from('website_pooja_products')
            .select('name')
            .eq('id', coupon.product_id)
            .maybeSingle();
          const productName = productData?.name || 'a specific product';
          setCouponError(`This coupon is only valid for: ${productName}.`);
          onApplyCoupon('', 0, null);
          return;
        }
      }

      onApplyCoupon(formattedCode, coupon.discount_percent, coupon.product_id || null);
      setCouponSuccess(`Coupon ${formattedCode} applied successfully!`);
    } catch (err) {
      console.error('Error applying coupon:', err);
      setCouponError('Error occurred applying coupon.');
      onApplyCoupon('', 0, null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    onApplyCoupon('', 0, null);
    setCouponCodeInput('');
    setCouponSuccess('');
    setCouponError('');
  };

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          height: '100%',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.12)',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff'
        }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)' }}>
            Your Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: '50%',
              backgroundColor: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-dark)',
              transition: 'background-color 0.2s'
            }}
          >
            <X size={18} />
          </button>
        </div>



        {/* Scrollable Body */}
        <div style={{
          flexGrow: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          backgroundColor: '#f9fafb'
        }}>
          {/* Cart Items List */}
          {items.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              flexGrow: 1
            }}>
              <ShoppingBag size={48} strokeWidth={1} style={{ marginBottom: '12px', color: '#cbd5e1' }} />
              <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>Your cart is empty</p>
              <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Add some divine items to begin your spiritual journey.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {items.map((item) => {
                if (!item || !item.product) return null;
                const isGift = false;
                const originalPrice = item.product.originalPrice || item.product.price;
                const hasDiscount = !!item.product.originalPrice && item.product.originalPrice > item.product.price;
                const discountPct = hasDiscount ? Math.round(((originalPrice - item.product.price) / originalPrice) * 100) : 0;

                return (
                  <div
                    key={item.product.id}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}
                  >
                    {/* Item Image */}
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '6px',
                      backgroundColor: '#f3f4f6',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isImageUrl(item.product.image) ? (
                        <img
                          src={getDisplayImageUrl(item.product.image)}
                          alt={item.product.name || 'product'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ fontSize: '2rem' }}>{typeof item.product.image === 'string' ? item.product.image : '📿'}</span>
                      )}
                    </div>

                    {/* Metadata & Title */}
                    <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left' }}>
                      <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1.2 }}>
                          {isGift && <Gift size={13} style={{ display: 'inline-block', color: 'var(--primary-lime, #f97316)', marginRight: '4px', verticalAlign: 'text-bottom' }} />}
                          {item.product.name}
                        </h4>
                        
                        {/* Price details */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                          {isGift ? (
                            <>
                              <span style={{ textDecoration: 'line-through', fontSize: '0.8rem', color: '#9ca3af' }}>₹{formatPrice(giftValue)}</span>
                              <span style={{ color: '#16a34a', fontWeight: 800, fontSize: '0.82rem' }}>FREE</span>
                            </>
                          ) : (
                            <>
                              {hasDiscount && (
                                <span style={{ textDecoration: 'line-through', fontSize: '0.8rem', color: '#9ca3af' }}>₹{formatPrice(originalPrice)}</span>
                              )}
                              <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#111827' }}>₹{formatPrice(item.product.price)}</span>
                              {hasDiscount && (
                                <span style={{ color: '#16a34a', fontSize: '0.72rem', fontWeight: 700 }}>({discountPct}% OFF)</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Quantity & Delete buttons row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        {isGift ? (
                          <div style={{
                            padding: '3px 8px',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '4px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: '#4b5563'
                          }}>
                            Qty: 1
                          </div>
                        ) : (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            backgroundColor: '#ffffff'
                          }}>
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                              style={{ padding: '3px 8px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                              <Minus size={12} strokeWidth={2.5} />
                            </button>
                            <span style={{ padding: '0 4px', fontSize: '0.8rem', fontWeight: 800, minWidth: '16px', textAlign: 'center' }}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                              style={{ padding: '3px 8px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                              <Plus size={12} strokeWidth={2.5} />
                            </button>
                          </div>
                        )}

                        {!isGift && (
                          <button
                            onClick={() => onRemoveItem(item.product.id)}
                            style={{ color: '#9ca3af', border: 'none', background: 'none', cursor: 'pointer', transition: 'color 0.2s', display: 'flex', alignItems: 'center' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Explore More upselling section */}
          {items.length > 0 && crossSellProducts.length > 0 && (
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '10px' }}>
                Explore More
              </h3>
              
              <div
                className="no-scrollbar"
                style={{
                  display: 'flex',
                  gap: '12px',
                  overflowX: 'auto',
                  paddingBottom: '4px',
                  scrollSnapType: 'x mandatory',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {crossSellProducts.map((product) => {
                  const hasDiscount = !!product.originalPrice && product.originalPrice > product.price;
                  const discountPct = hasDiscount ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100) : 0;

                  return (
                    <div
                      key={product.id}
                      style={{
                        width: '180px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        flexShrink: 0,
                        scrollSnapAlign: 'start',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                      }}
                    >
                      {/* Product Thumbnail */}
                      <div style={{
                        width: '100%',
                        height: '110px',
                        borderRadius: '6px',
                        backgroundColor: '#f3f4f6',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {isImageUrl(product.image) ? (
                          <img
                            src={getDisplayImageUrl(product.image)}
                            alt={product.name || 'product'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span style={{ fontSize: '2.5rem' }}>{typeof product.image === 'string' ? product.image : '📿'}</span>
                        )}
                      </div>

                      {/* Product details */}
                      <h4 style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--text-dark)',
                        marginTop: '8px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        height: '32px',
                        lineHeight: 1.2
                      }} title={product.name}>
                        {product.name}
                      </h4>

                      {/* Pricing with originalPrice */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                        {hasDiscount && (
                          <span style={{ textDecoration: 'line-through', fontSize: '0.74rem', color: '#9ca3af' }}>₹{product.originalPrice}</span>
                        )}
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-dark)' }}>₹{product.price}</span>
                      </div>

                      {/* Discount Tag & Add to Cart button */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px' }}>
                        {hasDiscount ? (
                          <span style={{
                            backgroundColor: '#e6f4ea',
                            color: '#137333',
                            fontSize: '0.68rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 700
                          }}>
                            {discountPct}% off
                          </span>
                        ) : (
                          <div />
                        )}

                        <button
                          onClick={() => onAddToCart ? onAddToCart(product, 1) : onUpdateQuantity(product.id, 1)}
                          style={{
                            padding: '4px 12px',
                            border: '1px solid var(--primary-lime, #f97316)',
                            backgroundColor: 'transparent',
                            color: 'var(--primary-lime, #f97316)',
                            borderRadius: '4px',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--primary-lime, #f97316)';
                            e.currentTarget.style.color = '#ffffff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--primary-lime, #f97316)';
                          }}
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Coupon Code Input Card */}
          {items.length > 0 && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              overflow: 'hidden',
              flexShrink: 0,
              marginTop: '16px'
            }}>
              {/* Compact Toggle Button Header */}
              <button
                onClick={() => setIsCouponSectionExpanded(prev => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Ticket size={16} style={{ color: 'var(--primary-lime, #f97316)' }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                    {appliedCouponCode ? `Coupon applied: ${appliedCouponCode}` : 'Apply Coupon Code'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {appliedCouponCode ? (
                    <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700 }}>
                      {discountPercent}% OFF
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.74rem', color: 'var(--primary-lime, #f97316)', fontWeight: 700 }}>
                      View Offers
                    </span>
                  )}
                  <ChevronDown size={14} style={{ color: '#9ca3af', transform: isCouponSectionExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
              </button>

              {/* Collapsible Content Section */}
              {isCouponSectionExpanded && (
                <div style={{
                  padding: '0 14px 14px 14px',
                  borderTop: '1px solid #f3f4f6',
                  backgroundColor: '#ffffff',
                  textAlign: 'left',
                  paddingTop: '12px'
                }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Enter Coupon Code"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value)}
                      style={{
                        flexGrow: 1,
                        padding: '8px 10px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.82rem',
                        outline: 'none'
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleApplyCoupon(couponCodeInput);
                        }
                      }}
                    />
                    {appliedCouponCode ? (
                      <button
                        onClick={handleRemoveCoupon}
                        style={{
                          padding: '8px 14px',
                          backgroundColor: '#fee2e2',
                          color: '#b91c1c',
                          borderRadius: '4px',
                          fontSize: '0.82rem',
                          fontWeight: 700
                        }}
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApplyCoupon(couponCodeInput)}
                        disabled={isValidatingCoupon}
                        style={{
                          padding: '8px 14px',
                          backgroundColor: 'var(--primary-lime, #f97316)',
                          color: '#ffffff',
                          borderRadius: '4px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          opacity: isValidatingCoupon ? 0.7 : 1
                        }}
                      >
                        Apply
                      </button>
                    )}
                  </div>

                  {couponError && <p style={{ color: '#ef4444', fontSize: '0.74rem', marginTop: '4px', fontWeight: 600 }}>{couponError}</p>}
                  {couponSuccess && <p style={{ color: '#16a34a', fontSize: '0.74rem', marginTop: '4px', fontWeight: 600 }}>{couponSuccess}</p>}


                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Area: Savings, Total breakdown, and Checkout button */}
        {items.length > 0 && (
          <div style={{
            borderTop: '1px solid var(--border-light)',
            boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.04)',
            backgroundColor: '#ffffff',
            padding: '16px'
          }}>
            {/* Savings Banner */}
            {totalSaved > 0 && (
              <div style={{
                backgroundColor: '#e6f4ea',
                color: '#137333',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginBottom: '12px'
              }}>
                <Sparkles size={14} fill="#137333" />
                <span>₹{formatPrice(totalSaved)} Saved so far!</span>
              </div>
            )}

            {/* Estimated Total Details Section (Always Open) */}
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                  <span>Estimated Total</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  {originalTotal > estimatedTotal && (
                    <span style={{ textDecoration: 'line-through', fontSize: '0.82rem', color: '#9ca3af' }}>₹{formatPrice(originalTotal)}</span>
                  )}
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-dark)' }}>
                    ₹{formatPrice(estimatedTotal)}
                  </span>
                  {originalTotal > estimatedTotal && (
                    <span style={{ color: '#16a34a', fontSize: '0.74rem', fontWeight: 700 }}>
                      ({Math.round(((originalTotal - estimatedTotal) / originalTotal) * 100)}% OFF)
                    </span>
                  )}
                </div>
              </div>

              {/* Breakdown detail block (always visible) */}
              <div style={{
                marginTop: '10px',
                padding: '10px 12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '0.78rem',
                color: '#4b5563',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Items Subtotal</span>
                  <span>₹{formatPrice(subtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b91c1c' }}>
                    <span>Coupon Discount ({discountPercent}%)</span>
                    <span>-₹{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                {hasGift && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                    <span>🎁 Free Gift Value</span>
                    <span>-₹{formatPrice(giftValue)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Delivery Charges</span>
                  <span>{shippingCost === 0 ? <strong style={{ color: '#16a34a' }}>FREE</strong> : `₹${formatPrice(shippingCost)}`}</span>
                </div>
              </div>
            </div>

            {/* Branded Brown Checkout Button */}
            <button
              onClick={onCheckout}
              style={{
                width: '100%',
                backgroundColor: '#9a3412', // rich terracotta brown
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '18px 24px',
                fontSize: '1.15rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease-in-out',
                boxShadow: '0 6px 20px rgba(154, 52, 18, 0.25)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#7c2d12';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(154, 52, 18, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#9a3412';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(154, 52, 18, 0.25)';
              }}
            >
              <span style={{ letterSpacing: '0.5px' }}>CHECKOUT NOW</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 900 }}>
                ₹{formatPrice(estimatedTotal)}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
