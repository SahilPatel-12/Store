import React from 'react';
import {
  ArrowLeft,
  Check,
  CreditCard,
  Smartphone,
  Banknote,
  Building2,
  MapPin,
  ShieldCheck,
  Truck,
  Package,
  ChevronRight,
  Sparkles,
  Lock,
  Star,
  Plus,
} from 'lucide-react';
import type { CartItem } from '../types';
import type { OrderDetails } from './OrderSuccessPage';
import { isImageUrl, getDisplayImageUrl } from '../lib/imageHelper';
import { supabase } from '../lib/supabase';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

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
}

type Step = 'address' | 'payment' | 'confirmation';
type PaymentMethod = 'upi' | 'card' | 'cod' | 'netbanking';

const VALID_COUPONS: Record<string, number> = {
  DEVOTION10: 10,
  TEMPLE20: 20,
};

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  cart,
  onBackToCart,
  onBackToShop,
  onOrderComplete,
  onOrderSuccess,
  loggedInUser,
}) => {
  const [step, setStep] = React.useState<Step>('address');
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('upi');

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
  const [upiId, setUpiId] = React.useState('');
  const [cardNumber, setCardNumber] = React.useState('');
  const [cardName, setCardName] = React.useState('');
  const [cardExpiry, setCardExpiry] = React.useState('');
  const [cardCvv, setCardCvv] = React.useState('');
  const [bankSelected, setBankSelected] = React.useState('');
  const [paymentErrors, setPaymentErrors] = React.useState<Record<string, string>>({});

  // Coupon
  const [couponCode, setCouponCode] = React.useState('');
  const [discountPercent, setDiscountPercent] = React.useState(0);
  const [couponMessage, setCouponMessage] = React.useState({ text: '', type: '' });

  // Order ID generated once for confirmation
  const [orderId] = React.useState(`MANTRA-${Math.floor(100000 + Math.random() * 900000)}`);

  const [razorpayConfig, setRazorpayConfig] = React.useState<{ keyId: string } | null>(null);

  React.useEffect(() => {
    async function loadRazorpayConfig() {
      try {
        const { data } = await supabase
          .from('website_settings')
          .select('value')
          .eq('key', 'razorpay_settings')
          .single();
        if (data && data.value) {
          setRazorpayConfig({ keyId: data.value.keyId });
        }
      } catch (err) {
        console.error('Error loading Razorpay configuration:', err);
      }
    }
    loadRazorpayConfig();
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
  const shippingCost = subtotal > 50 || subtotal === 0 ? 0 : 4.99;
  const tax = (subtotal - discountAmount) * 0.08;
  const finalTotal = subtotal - discountAmount + shippingCost + tax;

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (VALID_COUPONS[code]) {
      setDiscountPercent(VALID_COUPONS[code]);
      setCouponMessage({ text: `✓ Coupon applied! ${VALID_COUPONS[code]}% off`, type: 'success' });
    } else {
      setDiscountPercent(0);
      setCouponMessage({ text: 'Invalid coupon code. Try DEVOTION10 or TEMPLE20.', type: 'error' });
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

  const validatePayment = () => {
    const errs: Record<string, string> = {};
    if (paymentMethod === 'upi') {
      if (!upiId.trim() || !upiId.includes('@')) errs.upiId = 'Valid UPI ID required (e.g. name@upi)';
    } else if (paymentMethod === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 16) errs.cardNumber = '16-digit card number required';
      if (!cardName.trim()) errs.cardName = 'Card holder name required';
      if (!cardExpiry.trim() || !/^\d{2}\/\d{2}$/.test(cardExpiry)) errs.cardExpiry = 'Expiry as MM/YY required';
      if (cardCvv.length < 3) errs.cardCvv = 'CVV required';
    } else if (paymentMethod === 'netbanking') {
      if (!bankSelected) errs.bankSelected = 'Please select a bank';
    }
    setPaymentErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddressNext = () => {
    if (validateAddress()) setStep('payment');
  };

  const completeOrder = (paymentLabel: string, razorpayPaymentId?: string) => {
    setStep('confirmation');
    onOrderComplete();
    const subtotalVal = cart.reduce((t, i) => t + i.product.price * i.quantity, 0);
    const discountAmt = subtotalVal * (discountPercent / 100);
    const shippingVal = subtotalVal > 500 || subtotalVal === 0 ? 0 : 49;
    const taxVal = (subtotalVal - discountAmt) * 0.08;

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
    });
  };

  const handlePaymentNext = async () => {
    if (!validatePayment()) return;

    const needsRazorpay = paymentMethod !== 'cod' && razorpayConfig && razorpayConfig.keyId;

    if (needsRazorpay) {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert('Failed to load Razorpay payment gateway. Please try again or choose another payment method.');
        return;
      }

      const options = {
        key: razorpayConfig.keyId,
        amount: Math.round(finalTotal * 100), // in paise
        currency: 'INR',
        name: 'Mantra Puja Store',
        description: 'Order #' + orderId,
        prefill: {
          name: fullName,
          email: email,
          contact: phone,
        },
        theme: {
          color: '#d97706',
        },
        handler: function (response: any) {
          const paymentId = response.razorpay_payment_id;
          const paymentLabel =
            paymentMethod === 'upi' ? `Razorpay UPI (${paymentId})` :
            paymentMethod === 'card' ? `Razorpay Card (${paymentId})` :
            `Razorpay Net Banking (${paymentId})`;

          completeOrder(paymentLabel, paymentId);
        },
        modal: {
          ondismiss: function () {
            alert('Payment cancelled. Please try again to complete your booking.');
          }
        }
      };

      const rzpay = new (window as any).Razorpay(options);
      rzpay.open();
    } else {
      const paymentLabel =
        paymentMethod === 'upi' ? `UPI (${upiId})` :
        paymentMethod === 'card' ? 'Credit/Debit Card' :
        paymentMethod === 'cod' ? 'Cash on Delivery' :
        `Net Banking — ${bankSelected}`;
      completeOrder(paymentLabel);
    }
  };

  const formatCard = (val: string) =>
    val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const stepIndex = step === 'address' ? 0 : step === 'payment' ? 1 : 2;

  const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'];

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
          onClick={step === 'address' ? onBackToCart : () => setStep(step === 'payment' ? 'address' : 'payment')}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                  Select Payment Method
                </h2>

                {/* Payment Method Tabs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '28px' }}>
                  {[
                    { id: 'upi' as PaymentMethod, icon: <Smartphone size={20} />, label: 'UPI' },
                    { id: 'card' as PaymentMethod, icon: <CreditCard size={20} />, label: 'Card' },
                    { id: 'cod' as PaymentMethod, icon: <Banknote size={20} />, label: 'COD' },
                    { id: 'netbanking' as PaymentMethod, icon: <Building2 size={20} />, label: 'Net Banking' },
                  ].map(m => (
                    <button
                      key={m.id}
                      id={`checkout-pay-${m.id}`}
                      onClick={() => { setPaymentMethod(m.id); setPaymentErrors({}); }}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                        padding: '14px 8px', borderRadius: 'var(--radius-md)',
                        border: `2px solid ${paymentMethod === m.id ? 'var(--primary-lime)' : 'var(--border-light)'}`,
                        backgroundColor: paymentMethod === m.id ? 'var(--primary-lime-light)' : '#fafafa',
                        color: paymentMethod === m.id ? 'var(--primary-lime)' : 'var(--text-muted)',
                        fontWeight: 700, fontSize: '0.75rem',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                      }}
                    >
                      {m.icon}
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* UPI Form */}
                {paymentMethod === 'upi' && (
                  <div>
                    <div style={{
                      padding: '16px', borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--primary-lime-light)',
                      border: '1px solid #fed7aa',
                      marginBottom: '20px',
                      display: 'flex', alignItems: 'center', gap: '12px'
                    }}>
                      <Smartphone size={24} style={{ color: 'var(--primary-lime)', flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-dark)' }}>Instant UPI Payment</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Pay instantly via Google Pay, PhonePe, Paytm, or any UPI app</p>
                      </div>
                    </div>
                    <label style={labelStyle}>Your UPI ID *</label>
                    <input
                      id="checkout-upi-id"
                      style={{ ...inputStyle, borderColor: paymentErrors.upiId ? '#ef4444' : 'var(--border-light)' }}
                      placeholder="name@upi or 9876543210@paytm"
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      onFocus={e => (e.target.style.borderColor = 'var(--primary-lime)')}
                      onBlur={e => (e.target.style.borderColor = paymentErrors.upiId ? '#ef4444' : 'var(--border-light)')}
                    />
                    {paymentErrors.upiId && <p style={errorStyle}>{paymentErrors.upiId}</p>}

                    {/* UPI App Icons */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                      {['🔷 GPay', '📱 PhonePe', '💙 Paytm', '🔴 BHIM'].map(app => (
                        <span key={app} style={{
                          padding: '6px 12px', borderRadius: 'var(--radius-full)',
                          backgroundColor: '#f3f4f6', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)'
                        }}>{app}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Card Form */}
                {paymentMethod === 'card' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Card Number *</label>
                      <input
                        id="checkout-card-number"
                        style={{ ...inputStyle, borderColor: paymentErrors.cardNumber ? '#ef4444' : 'var(--border-light)', letterSpacing: '2px' }}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        value={cardNumber}
                        onChange={e => setCardNumber(formatCard(e.target.value))}
                        onFocus={e => (e.target.style.borderColor = 'var(--primary-lime)')}
                        onBlur={e => (e.target.style.borderColor = paymentErrors.cardNumber ? '#ef4444' : 'var(--border-light)')}
                      />
                      {paymentErrors.cardNumber && <p style={errorStyle}>{paymentErrors.cardNumber}</p>}
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Name on Card *</label>
                      <input
                        id="checkout-card-name"
                        style={{ ...inputStyle, borderColor: paymentErrors.cardName ? '#ef4444' : 'var(--border-light)' }}
                        placeholder="e.g. RAHUL SHARMA"
                        value={cardName}
                        onChange={e => setCardName(e.target.value.toUpperCase())}
                        onFocus={e => (e.target.style.borderColor = 'var(--primary-lime)')}
                        onBlur={e => (e.target.style.borderColor = paymentErrors.cardName ? '#ef4444' : 'var(--border-light)')}
                      />
                      {paymentErrors.cardName && <p style={errorStyle}>{paymentErrors.cardName}</p>}
                    </div>
                    <div>
                      <label style={labelStyle}>Expiry Date *</label>
                      <input
                        id="checkout-card-expiry"
                        style={{ ...inputStyle, borderColor: paymentErrors.cardExpiry ? '#ef4444' : 'var(--border-light)' }}
                        placeholder="MM/YY"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                        onFocus={e => (e.target.style.borderColor = 'var(--primary-lime)')}
                        onBlur={e => (e.target.style.borderColor = paymentErrors.cardExpiry ? '#ef4444' : 'var(--border-light)')}
                      />
                      {paymentErrors.cardExpiry && <p style={errorStyle}>{paymentErrors.cardExpiry}</p>}
                    </div>
                    <div>
                      <label style={labelStyle}>CVV *</label>
                      <input
                        id="checkout-card-cvv"
                        type="password"
                        style={{ ...inputStyle, borderColor: paymentErrors.cardCvv ? '#ef4444' : 'var(--border-light)' }}
                        placeholder="•••"
                        maxLength={4}
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        onFocus={e => (e.target.style.borderColor = 'var(--primary-lime)')}
                        onBlur={e => (e.target.style.borderColor = paymentErrors.cardCvv ? '#ef4444' : 'var(--border-light)')}
                      />
                      {paymentErrors.cardCvv && <p style={errorStyle}>{paymentErrors.cardCvv}</p>}
                    </div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: 'var(--radius-md)', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                      <ShieldCheck size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: 600 }}>Your card data is 256-bit SSL encrypted and never stored on our servers.</span>
                    </div>
                  </div>
                )}

                {/* COD */}
                {paymentMethod === 'cod' && (
                  <div style={{
                    padding: '24px',
                    borderRadius: 'var(--radius-md)',
                    border: '2px dashed var(--border-light)',
                    textAlign: 'center',
                    backgroundColor: '#fffbeb',
                  }}>
                    <span style={{ fontSize: '3rem' }}>💵</span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '12px' }}>Pay on Delivery</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px', maxWidth: '320px', margin: '8px auto 0' }}>
                      Keep exact cash ready at the time of delivery. Our delivery partner will hand-deliver your sacred items.
                    </p>
                    <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {['No extra charges', 'Trusted delivery partners', 'Inspect before paying'].map(f => (
                        <span key={f} style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.72rem', fontWeight: 700 }}>✓ {f}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Net Banking */}
                {paymentMethod === 'netbanking' && (
                  <div>
                    <label style={labelStyle}>Select Your Bank *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {BANKS.map(bank => (
                        <button
                          key={bank}
                          onClick={() => setBankSelected(bank)}
                          style={{
                            padding: '12px 14px',
                            borderRadius: 'var(--radius-md)',
                            border: `2px solid ${bankSelected === bank ? 'var(--primary-lime)' : 'var(--border-light)'}`,
                            backgroundColor: bankSelected === bank ? 'var(--primary-lime-light)' : '#fafafa',
                            color: bankSelected === bank ? 'var(--primary-lime)' : 'var(--text-dark)',
                            fontSize: '0.82rem', fontWeight: 700, textAlign: 'left',
                            cursor: 'pointer', transition: 'all 0.15s ease',
                          }}
                        >
                          🏦 {bank}
                        </button>
                      ))}
                    </div>
                    {paymentErrors.bankSelected && <p style={errorStyle}>{paymentErrors.bankSelected}</p>}
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
                        { label: 'Payment', value: paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'card' ? 'Credit/Debit Card' : paymentMethod === 'cod' ? 'Cash on Delivery' : `Net Banking (${bankSelected})` },
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
                        <span style={{ color: 'var(--text-muted)' }}>Tax (8%)</span>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
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
                  onClick={onBackToShop}
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
                      style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                    >
                      Apply
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
                    <span style={{ color: 'var(--text-muted)' }}>Tax (8%)</span>
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
