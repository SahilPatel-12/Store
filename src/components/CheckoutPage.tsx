import React from 'react';
import {
  ArrowLeft,
  Check,
  MapPin,
  ShieldCheck,
  Truck,
  Package,
  ChevronRight,
  Sparkles,
  Lock,
  Star,
  Plus,
  Upload,
  Copy,
} from 'lucide-react';
import type { CartItem } from '../types';
import type { OrderDetails } from './OrderSuccessPage';
import { isImageUrl, getDisplayImageUrl } from '../lib/imageHelper';
import { supabase } from '../lib/supabase';
import { uploadToR2 } from '../lib/cloudflare/r2';


interface Address {
  id: string;
  type: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
}

interface CheckoutPageProps {
  cart: CartItem[];
  onBackToCart: () => void;
  onBackToShop: () => void;
  onOrderComplete: () => void;
  onOrderSuccess: (details: OrderDetails) => void;
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

type Step = 'address' | 'payment' | 'confirmation';
type PaymentMethod = 'upi' | 'card' | 'cod' | 'netbanking';

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  cart,
  onBackToCart,
  onBackToShop,
  onOrderComplete,
  onOrderSuccess,
  loggedInUser,
  appliedCouponCode,
  onApplyCoupon,
  discountPercent,
  taxDeliverySettings,
}) => {
  const [step, setStep] = React.useState<Step>('address');
  const [paymentMethod] = React.useState<PaymentMethod>('upi');

  // Barcode / UPI QR direct payment states
  const [barcodeSettings, setBarcodeSettings] = React.useState<{ upiId?: string; barcodeUrl?: string } | null>(null);
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = React.useState('');
  const [isUploadingScreenshot, setIsUploadingScreenshot] = React.useState(false);
  const [copiedUpi, setCopiedUpi] = React.useState(false);

  // Address fields
  const [fullName, setFullName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [addressLine1, setAddressLine1] = React.useState('');
  const [addressLine2, setAddressLine2] = React.useState('');
  const [city, setCity] = React.useState('');
  const [state, setState] = React.useState('');
  const [pincode, setPincode] = React.useState('');
  const [addressErrors, setAddressErrors] = React.useState<Record<string, string>>({});

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = React.useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = React.useState<string>('');

  // Payment fields
  const [paymentErrors, setPaymentErrors] = React.useState<Record<string, string>>({});

  // Coupon
  const [couponCode, setCouponCode] = React.useState(appliedCouponCode);
  const [couponMessage, setCouponMessage] = React.useState({ text: '', type: '' });
  const [isValidatingCoupon, setIsValidatingCoupon] = React.useState(false);

  React.useEffect(() => {
    if (appliedCouponCode) {
      setCouponMessage({ text: `✓ Coupon applied! ${discountPercent}% off`, type: 'success' });
      setCouponCode(appliedCouponCode);
    } else {
      setCouponMessage({ text: '', type: '' });
      setCouponCode('');
    }
  }, [appliedCouponCode, discountPercent]);

  // Order ID generated once for confirmation
  const [orderId] = React.useState(`MANTRA-${Math.floor(100000 + Math.random() * 900000)}`);

  React.useEffect(() => {
    async function loadConfigs() {
      try {
        const { data: barcodeData } = await supabase
          .from('website_settings')
          .select('value')
          .eq('key', 'payment_barcode_settings')
          .single();
        if (barcodeData && barcodeData.value) {
          const val = barcodeData.value as { upi_id?: string; barcode_url?: string };
          setBarcodeSettings({ upiId: val.upi_id, barcodeUrl: val.barcode_url });
        }
      } catch (err) {
        console.error('Barcode settings load error:', err);
      }
    }
    loadConfigs();
  }, []);

  React.useEffect(() => {
    if (loggedInUser) {
      const user = loggedInUser;
      setFullName(prev => prev || user.fullName || '');
      setEmail(prev => prev || user.email || '');
      setPhone(prev => prev || user.phoneNumber || '');

      async function fetchUserAddresses() {
        try {
          const { data, error } = await supabase
            .from('website_store_addresses')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });
          
          if (error) throw error;
          if (data) {
            const mapped: Address[] = data.map((item: any) => ({
              id: item.id,
              type: item.type,
              name: item.name,
              phone: item.phone,
              street: item.street,
              city: item.city,
              state: item.state,
              zip: item.zip,
              isDefault: item.is_default
            }));
            setSavedAddresses(mapped);

            const defaultAddress = mapped.find(a => a.isDefault);
            if (defaultAddress) {
              setFullName(defaultAddress.name);
              setPhone(defaultAddress.phone);
              setAddressLine1(defaultAddress.street);
              setAddressLine2('');
              setCity(defaultAddress.city);
              setState(defaultAddress.state);
              setPincode(defaultAddress.zip);
              setSelectedAddressId(defaultAddress.id);
            }
          }
        } catch (err) {
          console.error('Error fetching addresses in checkout:', err);
        }
      }
      fetchUserAddresses();
    }
  }, [loggedInUser]);

  // Reset checkout/screenshot states on mount to prevent leakage
  React.useEffect(() => {
    setPaymentScreenshotUrl('');
    setIsUploadingScreenshot(false);
    setCopiedUpi(false);
    setPaymentErrors({});
  }, []);

  const handleBackToCart = () => {
    setPaymentScreenshotUrl('');
    setIsUploadingScreenshot(false);
    setCopiedUpi(false);
    onBackToCart();
  };

  const handleBackToShop = () => {
    setPaymentScreenshotUrl('');
    setIsUploadingScreenshot(false);
    setCopiedUpi(false);
    onBackToShop();
  };

  const handleSelectSavedAddress = (id: string) => {
    setSelectedAddressId(id);
    const addr = savedAddresses.find(a => a.id === id);
    if (addr) {
      setFullName(addr.name);
      setPhone(addr.phone);
      setAddressLine1(addr.street);
      setAddressLine2('');
      setCity(addr.city);
      setState(addr.state);
      setPincode(addr.zip);
    }
  };

  // Calculations
  const subtotal = cart.reduce((t, i) => t + i.product.price * i.quantity, 0);
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

  const handleApplyCoupon = async () => {
    const formattedCode = couponCode.trim().toUpperCase();
    setCouponMessage({ text: '', type: '' });

    if (!formattedCode) {
      onApplyCoupon('', 0, null);
      return;
    }

    if (!loggedInUser) {
      setCouponMessage({ text: 'Please log in to apply devotional coupons.', type: 'error' });
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
        setCouponMessage({ text: 'Invalid coupon code.', type: 'error' });
        onApplyCoupon('', 0, null);
        return;
      }

      // 2. Validate usage limit
      if (coupon.user_limit !== null && coupon.redemptions_count >= coupon.user_limit) {
        setCouponMessage({ text: 'This coupon has reached its total usage limit.', type: 'error' });
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
        setCouponMessage({ text: 'You have already used this coupon code.', type: 'error' });
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
          setCouponMessage({ text: `This coupon is only valid for product: ${productName}.`, type: 'error' });
          onApplyCoupon('', 0, null);
          return;
        }
      }

      // 5. Apply coupon
      onApplyCoupon(formattedCode, coupon.discount_percent, coupon.product_id || null);
      setCouponMessage({ text: `✓ Coupon applied! ${coupon.discount_percent}% off`, type: 'success' });

    } catch (err) {
      console.error('Error applying coupon:', err);
      setCouponMessage({ text: 'An error occurred while applying coupon. Please try again.', type: 'error' });
      onApplyCoupon('', 0, null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const validateAddress = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required';
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) errs.phone = 'Valid phone number required';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Valid email required';
    if (!addressLine1.trim()) errs.addressLine1 = 'Address is required';
    if (!city.trim()) errs.city = 'City is required';
    if (!state.trim()) errs.state = 'State is required';
    if (!pincode.trim() || pincode.replace(/\D/g, '').length < 5) errs.pincode = 'Valid pincode required';
    setAddressErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const getQrCodeUrl = () => {
    const subtotalVal = cart.reduce((t, i) => t + i.product.price * i.quantity, 0);
    const discountAmt = subtotalVal * (discountPercent / 100);
    
    const maxDeliveryVal = cart.length === 0 ? 0 : Math.max(...cart.map(item => {
      const p = item.product as any;
      return p.deliveryOverrideEnabled && p.customDelivery !== undefined && p.customDelivery !== null
        ? p.customDelivery
        : taxDeliverySettings.globalDeliveryCharge;
    }));
    const shippingVal = (subtotalVal - discountAmt) >= taxDeliverySettings.freeDeliveryThreshold || subtotalVal === 0 ? 0 : maxDeliveryVal;

    const taxVal = cart.reduce((totalTax, item) => {
      const p = item.product as any;
      const itemSubtotal = p.price * item.quantity;
      const itemDiscountedSubtotal = itemSubtotal * (1 - discountPercent / 100);
      const itemGstPercent = p.gstOverrideEnabled && p.customGst !== undefined && p.customGst !== null
        ? p.customGst
        : taxDeliverySettings.globalGstPercent;
      return totalTax + (itemDiscountedSubtotal * (itemGstPercent / 100));
    }, 0);

    const calculatedTotal = subtotalVal - discountAmt + shippingVal + taxVal;

    const upi = barcodeSettings?.upiId || '7974478098@paytm';
    const upiUri = `upi://pay?pa=${upi}&pn=Mantra%20Puja&am=${calculatedTotal.toFixed(2)}&cu=INR&tn=Order%20${orderId}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;
  };

  const handleCopyUpi = () => {
    const upi = barcodeSettings?.upiId || '7974478098@paytm';
    try {
      navigator.clipboard.writeText(upi);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } catch (err) {
      console.error('Failed to copy UPI ID:', err);
    }
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingScreenshot(true);
    setPaymentErrors(prev => {
      const copy = { ...prev };
      delete copy.screenshot;
      return copy;
    });

    try {
      const url = await uploadToR2(file, 'orders/proofs');
      setPaymentScreenshotUrl(url);
    } catch (err) {
      console.error('Failed to upload proof of payment:', err);
      alert('Failed to upload screenshot. Please verify connection and try again.');
    } finally {
      setIsUploadingScreenshot(false);
    }
  };

  const validatePayment = () => {
    const errs: Record<string, string> = {};
    if (paymentMethod === 'upi') {
      if (!paymentScreenshotUrl) {
        errs.screenshot = 'Please scan the QR code and upload your payment confirmation screenshot';
      }
    }
    setPaymentErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddressNext = () => {
    if (validateAddress()) setStep('payment');
  };

  const completeOrder = (paymentLabel: string, razorpayPaymentId?: string) => {
    const subtotalVal = cart.reduce((t, i) => t + i.product.price * i.quantity, 0);
    const discountAmt = subtotalVal * (discountPercent / 100);
    
    // Dynamic shipping charge
    const maxDeliveryVal = cart.length === 0 ? 0 : Math.max(...cart.map(item => {
      const p = item.product as any;
      return p.deliveryOverrideEnabled && p.customDelivery !== undefined && p.customDelivery !== null
        ? p.customDelivery
        : taxDeliverySettings.globalDeliveryCharge;
    }));
    const shippingVal = (subtotalVal - discountAmt) >= taxDeliverySettings.freeDeliveryThreshold || subtotalVal === 0 ? 0 : maxDeliveryVal;

    // Dynamic tax calculation
    const taxVal = cart.reduce((totalTax, item) => {
      const p = item.product as any;
      const itemSubtotal = p.price * item.quantity;
      const itemDiscountedSubtotal = itemSubtotal * (1 - discountPercent / 100);
      const itemGstPercent = p.gstOverrideEnabled && p.customGst !== undefined && p.customGst !== null
        ? p.customGst
        : taxDeliverySettings.globalGstPercent;
      return totalTax + (itemDiscountedSubtotal * (itemGstPercent / 100));
    }, 0);

    const isFreeEligible = (subtotalVal - discountAmt) >= taxDeliverySettings.freeDeliveryThreshold;

    onOrderSuccess({
      orderId,
      items: cart,
      subtotal: subtotalVal,
      discount: discountAmt,
      discountPercent,
      shipping: shippingVal,
      tax: taxVal,
      total: subtotalVal - discountAmt + shippingVal + taxVal,
      paymentMethod: paymentLabel,
      deliveryCity: city,
      deliveryState: state,
      fullName,
      email,
      phoneNumber: phone,
      addressLine1,
      addressLine2,
      pincode,
      placedAt: new Date(),
      razorpayPaymentId,
      paymentScreenshot: paymentScreenshotUrl || undefined,
      appliedCouponCode: appliedCouponCode || undefined,
      paymentStatus: paymentLabel === 'Scan & Pay (UPI)' ? 'Pending' : 'Confirmed',
      status: 'Being Packed',
      gstPercentSnapshot: taxDeliverySettings.globalGstPercent,
      gstAmountSnapshot: taxVal,
      deliveryAmountSnapshot: shippingVal,
      freeDeliveryEligibleSnapshot: isFreeEligible
    });

    setStep('confirmation');
    onOrderComplete();

    // Reset screenshot states on order complete
    setPaymentScreenshotUrl('');
    setIsUploadingScreenshot(false);
    setCopiedUpi(false);
  };

  const handlePaymentNext = async () => {
    if (!validatePayment()) return;
    completeOrder('Scan & Pay (UPI)');
  };

  const stepIndex = step === 'address' ? 0 : step === 'payment' ? 1 : 2;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--border-light)',
    fontSize: '0.9rem',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    backgroundColor: '#ffffff',
    color: 'var(--text-dark)',
    transition: 'border-color 0.2s ease',
  };

  const errorStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: '#ef4444',
    marginTop: '4px',
    fontWeight: 600,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--text-dark)',
    marginBottom: '6px',
    display: 'block',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa', paddingBottom: '80px' }}>

      {/* ── Back nav ── */}
      <div className="container" style={{ paddingTop: '24px', paddingBottom: '8px' }}>
        <button
          onClick={() => {
            if (step === 'address') {
              handleBackToCart();
            } else if (step === 'payment') {
              if (window.confirm('Are you sure you want to go back? Your payment will be cancelled by this action.')) {
                setStep('address');
              }
            } else {
              setStep('payment');
            }
          }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary-lime)',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <ArrowLeft size={16} />
          {step === 'address' ? 'Back to Cart' : step === 'payment' ? 'Back to Address' : 'Back to Payment'}
        </button>
      </div>

      <div className="container">

        {/* ── Page Title ── */}
        <h1 style={{
          fontSize: '2rem', fontWeight: 900, color: 'var(--text-dark)',
          marginBottom: '28px', textAlign: 'left'
        }}>
          Secure Checkout
        </h1>

        {/* ── Step Indicator ── */}
        {step !== 'confirmation' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0',
            marginBottom: '36px',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 24px',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            {['Shipping Address', 'Payment', 'Confirmation'].map((label, idx) => (
              <React.Fragment key={label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: idx < 2 ? undefined : undefined }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: idx < stepIndex ? '#10b981' : idx === stepIndex ? 'var(--primary-lime)' : 'var(--border-light)',
                    color: idx <= stepIndex ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: 800, fontSize: '0.82rem',
                    transition: 'all 0.3s ease',
                    flexShrink: 0,
                  }}>
                    {idx < stepIndex ? <Check size={16} /> : idx + 1}
                  </div>
                  <span style={{
                    fontSize: '0.82rem', fontWeight: idx === stepIndex ? 800 : 600,
                    color: idx === stepIndex ? 'var(--text-dark)' : 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                  }}>
                    {label}
                  </span>
                </div>
                {idx < 2 && (
                  <div style={{
                    flex: 1, height: '2px', margin: '0 12px',
                    backgroundColor: idx < stepIndex ? '#10b981' : 'var(--border-light)',
                    transition: 'background-color 0.3s ease',
                    minWidth: '24px',
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* ── Main Layout ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: step === 'confirmation' ? '1fr' : '1.4fr 1fr',
          gap: '32px',
          alignItems: 'start',
        }} className={step !== 'confirmation' ? 'hero-grid-split' : ''}>

          {/* ══════════════════════════════════════
              LEFT COLUMN: Step Content
          ══════════════════════════════════════ */}
          <div>

            {/* ── STEP 1: Address ── */}
            {step === 'address' && (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)',
                padding: '28px',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-dark)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={18} style={{ color: 'var(--primary-lime)' }} />
                  Shipping Address
                </h2>

                {savedAddresses.length > 0 && (
                  <div style={{
                    marginBottom: '24px',
                    padding: '16px',
                    backgroundColor: 'var(--primary-lime-light)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--primary-lime)',
                  }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '10px' }}>
                      Select a Saved Delivery Address:
                    </p>
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      overflowX: 'auto',
                      paddingBottom: '8px',
                    }} className="no-scrollbar">
                      {savedAddresses.map((addr) => (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => handleSelectSavedAddress(addr.id)}
                          style={{
                            flexShrink: 0,
                            width: '200px',
                            padding: '12px',
                            borderRadius: 'var(--radius-md)',
                            border: selectedAddressId === addr.id ? '2px solid var(--primary-lime)' : '1px solid var(--border-light)',
                            backgroundColor: '#ffffff',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                              {addr.type}
                            </span>
                            {addr.isDefault && <span style={{ fontSize: '0.65rem', color: 'var(--primary-lime)', fontWeight: 800 }}>Default</span>}
                          </div>
                          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dark)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {addr.name}
                          </p>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {addr.street}, {addr.city}
                          </p>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAddressId('custom');
                          setFullName('');
                          setPhone('');
                          setAddressLine1('');
                          setAddressLine2('');
                          setCity('');
                          setState('');
                          setPincode('');
                        }}
                        style={{
                          flexShrink: 0,
                          width: '120px',
                          padding: '12px',
                          borderRadius: 'var(--radius-md)',
                          border: selectedAddressId === 'custom' ? '2px solid var(--primary-lime)' : '1px dashed var(--border-light)',
                          backgroundColor: '#ffffff',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          gap: '6px',
                        }}
                      >
                        <Plus size={16} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Custom Address</span>
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="form-grid-2col">
                  {/* Full Name */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Full Name *</label>
                    <input
                      id="checkout-fullname"
                      style={{ ...inputStyle, borderColor: addressErrors.fullName ? '#ef4444' : 'var(--border-light)' }}
                      placeholder="e.g. Rahul Sharma"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      onFocus={e => (e.target.style.borderColor = 'var(--primary-lime)')}
                      onBlur={e => (e.target.style.borderColor = addressErrors.fullName ? '#ef4444' : 'var(--border-light)')}
                    />
                    {addressErrors.fullName && <p style={errorStyle}>{addressErrors.fullName}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label style={labelStyle}>Phone Number *</label>
                    <input
                      id="checkout-phone"
                      style={{ ...inputStyle, borderColor: addressErrors.phone ? '#ef4444' : 'var(--border-light)' }}
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      onFocus={e => (e.target.style.borderColor = 'var(--primary-lime)')}
                      onBlur={e => (e.target.style.borderColor = addressErrors.phone ? '#ef4444' : 'var(--border-light)')}
                    />
                    {addressErrors.phone && <p style={errorStyle}>{addressErrors.phone}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label style={labelStyle}>Email Address *</label>
                    <input
                      id="checkout-email"
                      type="email"
                      style={{ ...inputStyle, borderColor: addressErrors.email ? '#ef4444' : 'var(--border-light)' }}
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onFocus={e => (e.target.style.borderColor = 'var(--primary-lime)')}
                      onBlur={e => (e.target.style.borderColor = addressErrors.email ? '#ef4444' : 'var(--border-light)')}
                    />
                    {addressErrors.email && <p style={errorStyle}>{addressErrors.email}</p>}
                  </div>

                  {/* Address Line 1 */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Address Line 1 *</label>
                    <input
                      id="checkout-addr1"
                      style={{ ...inputStyle, borderColor: addressErrors.addressLine1 ? '#ef4444' : 'var(--border-light)' }}
                      placeholder="House/Flat No., Street Name"
                      value={addressLine1}
                      onChange={e => setAddressLine1(e.target.value)}
                      onFocus={e => (e.target.style.borderColor = 'var(--primary-lime)')}
                      onBlur={e => (e.target.style.borderColor = addressErrors.addressLine1 ? '#ef4444' : 'var(--border-light)')}
                    />
                    {addressErrors.addressLine1 && <p style={errorStyle}>{addressErrors.addressLine1}</p>}
                  </div>

                  {/* Address Line 2 */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Address Line 2 <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>(optional)</span></label>
                    <input
                      id="checkout-addr2"
                      style={inputStyle}
                      placeholder="Landmark, Colony, etc."
                      value={addressLine2}
                      onChange={e => setAddressLine2(e.target.value)}
                      onFocus={e => (e.target.style.borderColor = 'var(--primary-lime)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border-light)')}
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label style={labelStyle}>City *</label>
                    <input
                      id="checkout-city"
                      style={{ ...inputStyle, borderColor: addressErrors.city ? '#ef4444' : 'var(--border-light)' }}
                      placeholder="e.g. Varanasi"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      onFocus={e => (e.target.style.borderColor = 'var(--primary-lime)')}
                      onBlur={e => (e.target.style.borderColor = addressErrors.city ? '#ef4444' : 'var(--border-light)')}
                    />
                    {addressErrors.city && <p style={errorStyle}>{addressErrors.city}</p>}
                  </div>

                  {/* State */}
                  <div>
                    <label style={labelStyle}>State *</label>
                    <select
                      id="checkout-state"
                      style={{ ...inputStyle, borderColor: addressErrors.state ? '#ef4444' : 'var(--border-light)', cursor: 'pointer' }}
                      value={state}
                      onChange={e => setState(e.target.value)}
                      onFocus={e => (e.target.style.borderColor = 'var(--primary-lime)')}
                      onBlur={e => (e.target.style.borderColor = addressErrors.state ? '#ef4444' : 'var(--border-light)')}
                    >
                      <option value="">Select State</option>
                      {['Andhra Pradesh','Assam','Bihar','Delhi','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','Uttarakhand','West Bengal'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {addressErrors.state && <p style={errorStyle}>{addressErrors.state}</p>}
                  </div>

                  {/* Pincode */}
                  <div>
                    <label style={labelStyle}>Pincode *</label>
                    <input
                      id="checkout-pincode"
                      style={{ ...inputStyle, borderColor: addressErrors.pincode ? '#ef4444' : 'var(--border-light)' }}
                      placeholder="e.g. 221001"
                      maxLength={6}
                      value={pincode}
                      onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
                      onFocus={e => (e.target.style.borderColor = 'var(--primary-lime)')}
                      onBlur={e => (e.target.style.borderColor = addressErrors.pincode ? '#ef4444' : 'var(--border-light)')}
                    />
                    {addressErrors.pincode && <p style={errorStyle}>{addressErrors.pincode}</p>}
                  </div>
                </div>

                <button
                  id="checkout-address-next"
                  onClick={handleAddressNext}
                  className="btn-lime"
                  style={{ width: '100%', padding: '15px', marginTop: '24px', justifyContent: 'center', borderRadius: 'var(--radius-md)', fontSize: '1rem', fontWeight: 800 }}
                >
                  Continue to Payment <ChevronRight size={18} />
                </button>
              </div>
            )}

            {/* ── STEP 2: Payment ── */}
            {step === 'payment' && (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)',
                padding: '28px',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-dark)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={18} style={{ color: 'var(--primary-lime)' }} />
                  Direct Payment Details (UPI)
                </h2>

                {/* UPI QR Direct Scan & Pay Form */}
                {paymentMethod === 'upi' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Amount to be Paid Badge */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '14px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--primary-lime-light)',
                      border: '1px solid var(--primary-lime)',
                      textAlign: 'center'
                    }}>
                      <span style={{ fontSize: '0.8rem', color: '#4b5563', fontWeight: 650 }}>Amount to Pay</span>
                      <span style={{ fontSize: '1.7rem', fontWeight: 900, color: 'var(--primary-lime)' }}>
                        ₹{finalTotal.toFixed(2)}
                      </span>
                    </div>

                    {/* QR Code Container with sleek card styling */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      backgroundColor: '#ffffff',
                      padding: '24px 16px',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                      border: '1px solid #e5e7eb',
                      position: 'relative'
                    }}>
                      <img 
                        src={getQrCodeUrl()} 
                        alt="UPI QR Code Barcode" 
                        style={{
                          width: '190px',
                          height: '190px',
                          objectFit: 'contain',
                          borderRadius: '6px',
                          border: '1px solid #f3f4f6',
                          padding: '6px',
                          marginBottom: '14px'
                        }}
                      />

                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        color: 'var(--primary-lime)',
                        backgroundColor: 'var(--primary-lime-light)',
                        padding: '2px 10px',
                        borderRadius: '999px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '12px'
                      }}>
                        Scan to Pay
                      </span>

                      {/* UPI ID display & copy button */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: '#f9fafb',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        width: '100%',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                          <span style={{ fontSize: '0.62rem', color: '#9ca3af', fontWeight: 700 }}>UPI ID / VPA</span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#374151', fontFamily: 'monospace' }}>
                            {barcodeSettings?.upiId || '7974478098@paytm'}
                          </span>
                        </div>
                        <button
                          onClick={handleCopyUpi}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: copiedUpi ? '#10b981' : 'var(--primary-lime)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                        >
                          {copiedUpi ? <Check size={12} /> : <Copy size={12} />}
                          {copiedUpi ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    {/* Screenshot Uploader Area */}
                    <div>
                      <label style={{ ...labelStyle, marginBottom: '6px', display: 'block' }}>
                        Upload Payment Screenshot *
                      </label>
                      
                      <div style={{
                        position: 'relative',
                        border: `2px dashed ${paymentErrors.screenshot ? '#ef4444' : (paymentScreenshotUrl ? '#10b981' : '#d1d5db')}`,
                        borderRadius: '8px',
                        padding: '24px 14px',
                        textAlign: 'center',
                        backgroundColor: paymentScreenshotUrl ? '#f0fdf4' : '#fafafa',
                        cursor: isUploadingScreenshot ? 'wait' : 'pointer',
                        transition: 'all 0.2s ease'
                      }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshotUpload}
                          disabled={isUploadingScreenshot}
                          style={{
                            position: 'absolute',
                            top: 0, left: 0, width: '100%', height: '100%',
                            opacity: 0, cursor: 'pointer'
                          }}
                        />

                        {isUploadingScreenshot ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <div className="spinner" style={{
                              width: '24px', height: '24px',
                              border: '3px solid #e5e7eb',
                              borderTop: '3px solid var(--primary-lime)',
                              borderRadius: '50%'
                            }} />
                            <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 700 }}>
                              Uploading proof...
                            </span>
                          </div>
                        ) : paymentScreenshotUrl ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '34px', height: '34px',
                              borderRadius: '50%',
                              backgroundColor: '#dcfce7',
                              color: '#15803d'
                            }}>
                              <Check size={18} />
                            </div>
                            <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 800 }}>
                              Screenshot Uploaded Successfully!
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#6b7280', textDecoration: 'underline' }}>
                              Click to change image
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                            <Upload size={26} style={{ color: '#9ca3af', marginBottom: '2px' }} />
                            <span style={{ fontSize: '0.82rem', color: '#374151', fontWeight: 800 }}>
                              Click to select screenshot
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>
                              PNG, JPG, or WEBP confirmation image
                            </span>
                          </div>
                        )}
                      </div>
                      {paymentErrors.screenshot && (
                        <p style={{ ...errorStyle, marginTop: '6px' }}>{paymentErrors.screenshot}</p>
                      )}
                    </div>
                  </div>
                )}



                <button
                  id="checkout-payment-next"
                  onClick={handlePaymentNext}
                  className="btn-lime"
                  style={{ width: '100%', padding: '15px', marginTop: '28px', justifyContent: 'center', borderRadius: 'var(--radius-md)', fontSize: '1rem', fontWeight: 800 }}
                >
                  <Lock size={16} /> Place Order — ₹{finalTotal.toFixed(2)}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', justifyContent: 'center' }}>
                  <ShieldCheck size={14} style={{ color: '#10b981' }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Secured by 256-bit SSL encryption</span>
                </div>
              </div>
            )}

            {/* ── STEP 3: Confirmation ── */}
            {step === 'confirmation' && (
              <div style={{ textAlign: 'center' }}>
                {/* Success Card */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid #bbf7d0',
                  padding: '48px 32px',
                  boxShadow: '0 8px 32px rgba(16, 185, 129, 0.08)',
                  marginBottom: '24px',
                }}>
                  {/* Animated Tick */}
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px auto',
                    boxShadow: '0 0 0 12px rgba(16,185,129,0.08)',
                  }}>
                    <Check size={40} style={{ color: '#10b981' }} />
                  </div>

                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🙏</div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-dark)' }}>
                    Blessings on Your Order!
                  </h2>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginTop: '8px', maxWidth: '420px', margin: '8px auto 0' }}>
                    Your sacred order has been placed. Your items will be packed with care and delivered with temple blessings.
                  </p>
                </div>

                {/* Order Details Card */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-light)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)',
                  marginBottom: '24px',
                  textAlign: 'left',
                }}>
                  {/* Header */}
                  <div style={{
                    padding: '20px 24px',
                    background: 'linear-gradient(135deg, var(--primary-forest) 0%, #4a2010 100%)',
                    color: '#ffffff',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Package size={18} />
                      <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Order Confirmation</span>
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.85 }}>
                      {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Order Meta */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {[
                        { label: 'Order ID', value: orderId },
                        { label: 'Payment', value: paymentMethod === 'upi' ? 'UPI' : 'UPI' },
                        { label: 'Delivery To', value: `${city}, ${state}` },
                        { label: 'Estimated Delivery', value: '3–5 Business Days' },
                      ].map(item => (
                        <div key={item.label} style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: '#f9fafb', border: '1px solid var(--border-light)' }}>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
                          <p style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '2px' }}>{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Items */}
                    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Items</p>
                      {cart.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: idx < cart.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                          <div style={{
                            width: '44px', height: '44px', borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--primary-lime-light)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.4rem', flexShrink: 0,
                            overflow: 'hidden'
                          }}>
                            {isImageUrl(item.product.image) ? (
                              <img src={getDisplayImageUrl(item.product.image)} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              item.product.image || '📿'
                            )}
                          </div>
                          <div style={{ flexGrow: 1 }}>
                            <p style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-dark)' }}>{item.product.name}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Qty: {item.quantity}</p>
                          </div>
                          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
                            ₹{(item.product.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Price Breakdown */}
                    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                        <span style={{ fontWeight: 700 }}>₹{subtotal.toFixed(2)}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#10b981' }}>
                          <span>Discount ({discountPercent}%)</span>
                          <span style={{ fontWeight: 700 }}>−₹{discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Shipping</span>
                        <span style={{ fontWeight: 700 }}>{shippingCost === 0 ? 'FREE' : `₹${shippingCost.toFixed(2)}`}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Sales Tax / GST</span>
                        <span style={{ fontWeight: 700 }}>₹{tax.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', padding: '14px 0 0', borderTop: '2px solid var(--border-light)' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-dark)' }}>Total Charged</span>
                        <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--primary-forest)' }}>₹{finalTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Badges */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '28px' }}>
                  {[
                    { icon: <Truck size={20} style={{ color: 'var(--primary-lime)' }} />, text: 'Sacred Express Shipping' },
                    { icon: <ShieldCheck size={20} style={{ color: '#10b981' }} />, text: '100% Authentic Products' },
                    { icon: <Star size={20} style={{ color: '#f59e0b' }} />, text: 'Temple-Grade Quality' },
                  ].map(b => (
                    <div key={b.text} style={{
                      padding: '16px 12px', borderRadius: 'var(--radius-md)',
                      backgroundColor: '#ffffff', border: '1px solid var(--border-light)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                      textAlign: 'center',
                    }}>
                      {b.icon}
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dark)' }}>{b.text}</span>
                    </div>
                  ))}
                </div>

                <button
                  id="checkout-continue-shopping"
                  onClick={handleBackToShop}
                  className="btn-lime"
                  style={{ padding: '15px 48px', borderRadius: 'var(--radius-md)', fontSize: '1rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Sparkles size={18} /> Continue Shopping
                </button>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════
              RIGHT COLUMN: Order Summary Sidebar
          ══════════════════════════════════════ */}
          {step !== 'confirmation' && (
            <div style={{ position: 'sticky', top: '100px' }}>
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
              }}>
                {/* Summary Header */}
                <div style={{
                  padding: '18px 20px',
                  background: 'linear-gradient(135deg, var(--primary-forest) 0%, #4a2010 100%)',
                  color: '#ffffff',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <Package size={16} />
                  <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Order Summary ({cart.reduce((t, i) => t + i.quantity, 0)} items)</span>
                </div>

                {/* Items List */}
                <div style={{ maxHeight: '240px', overflowY: 'auto', borderBottom: '1px solid var(--border-light)' }}>
                  {cart.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '14px 20px',
                      borderBottom: idx < cart.length - 1 ? '1px solid var(--border-light)' : 'none',
                    }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--primary-lime-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.3rem', flexShrink: 0,
                        overflow: 'hidden'
                      }}>
                        {isImageUrl(item.product.image) ? (
                          <img src={getDisplayImageUrl(item.product.image)} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          item.product.image || '📿'
                        )}
                      </div>
                      <div style={{ flexGrow: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product.name}</p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>× {item.quantity}</p>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary-forest)', flexShrink: 0 }}>
                        ₹{(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      id="checkout-coupon"
                      style={{ ...inputStyle, flex: 1, padding: '10px 12px', fontSize: '0.82rem' }}
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                      onFocus={e => (e.target.style.borderColor = 'var(--primary-lime)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border-light)')}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="btn-lime"
                      disabled={isValidatingCoupon}
                      style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', whiteSpace: 'nowrap', opacity: isValidatingCoupon ? 0.7 : 1 }}
                    >
                      {isValidatingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponMessage.text && (
                    <p style={{ fontSize: '0.72rem', marginTop: '6px', fontWeight: 700, color: couponMessage.type === 'success' ? '#10b981' : '#ef4444' }}>
                      {couponMessage.text}
                    </p>
                  )}
                </div>

                {/* Price Breakdown */}
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                    <span style={{ fontWeight: 700 }}>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#10b981' }}>
                      <span>Discount ({discountPercent}%)</span>
                      <span style={{ fontWeight: 700 }}>−₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Shipping</span>
                    <span style={{ fontWeight: 700, color: shippingCost === 0 ? '#10b981' : 'var(--text-dark)' }}>
                      {shippingCost === 0 ? 'FREE' : `₹${shippingCost.toFixed(2)}`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Sales Tax / GST</span>
                    <span style={{ fontWeight: 700 }}>₹{tax.toFixed(2)}</span>
                  </div>

                  <div style={{ borderTop: '2px solid var(--border-light)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-dark)' }}>Total</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary-forest)' }}>₹{finalTotal.toFixed(2)}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <ShieldCheck size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Secure SSL Encrypted Checkout</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
