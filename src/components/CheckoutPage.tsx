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
import type { CartItem, Product } from '../types';
import type { OrderDetails } from './OrderSuccessPage';
import { isImageUrl, getDisplayImageUrl } from '../lib/imageHelper';
import { supabase } from '../lib/supabase';
import { handleWebsiteCheckout } from '../lib/crossPlatformSync';
import { uploadToR2 } from '../lib/cloudflare/r2';
import { useRazorpayCheckout } from '../hooks/useRazorpayCheckout';
import { useLanguage } from '../lib/i18n';
import { useTranslation } from 'react-i18next';


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
  onOrderSuccess: (details: OrderDetails) => Promise<void> | void;
  loggedInUser?: { id: string; fullName: string; email: string; phoneNumber: string } | null;
  appliedCouponCode: string;
  onApplyCoupon: (code: string, percent: number, productId: string | null) => void;
  discountPercent: number;
  taxDeliverySettings: {
    globalGstPercent: number;
    globalDeliveryCharge: number;
    freeDeliveryThreshold: number;
    codFee?: number;
  };
  paymentActivation?: {
    activePaymentProvider: 'manual_upi' | 'razorpay';
    razorpayMode: 'test' | 'live';
    legacyManualUpiEnabled: boolean;
  };
  products?: Product[];
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
  paymentActivation,
  products = [],
}) => {
  const [step, setStep] = React.useState<Step>('address');
  const [paymentMethod] = React.useState<PaymentMethod>('upi');
  const { language } = useLanguage();
  const { t } = useTranslation('checkout');
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    import('../lib/i18next').then(({ loadNamespaces }) => {
      loadNamespaces(language, ['checkout']).then(() => setIsReady(true));
    });
  }, [language]);

  // Barcode / UPI QR direct payment states
  const [barcodeSettings, setBarcodeSettings] = React.useState<{ upiId?: string; barcodeUrl?: string } | null>(null);
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = React.useState('');
  const [isUploadingScreenshot, setIsUploadingScreenshot] = React.useState(false);
  const [copiedUpi, setCopiedUpi] = React.useState(false);
  const [selectedPaymentOption, setSelectedPaymentOption] = React.useState<'razorpay' | 'manual_upi'>('razorpay');

  React.useEffect(() => {
    setSelectedPaymentOption('razorpay');
  }, [paymentActivation]);

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

  React.useEffect(() => {
    const formattedPincode = pincode.replace(/\D/g, '');
    if (formattedPincode.length === 6) {
      const fetchCityState = async () => {
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${formattedPincode}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice[0]) {
              const first = data[0].PostOffice[0];
              const resolvedCity = first.District || first.Division || first.Name;
              let resolvedState = first.State;

              if (resolvedState === 'National Capital Territory of Delhi') {
                resolvedState = 'Delhi';
              }

              if (resolvedCity) {
                setCity(resolvedCity.trim());
              }
              if (resolvedState) {
                setState(resolvedState.trim());
              }
            }
          }
        } catch (err) {
          console.error('Failed to auto-fetch city/state from pincode:', err);
        }
      };
      fetchCityState();
    }
  }, [pincode]);

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = React.useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = React.useState<string>('');

  // Payment fields
  const [paymentErrors, setPaymentErrors] = React.useState<Record<string, string>>({});
  const [isPlacingOrder, setIsPlacingOrder] = React.useState(false);

  // Coupon
  const [couponCode, setCouponCode] = React.useState(appliedCouponCode);
  const [couponMessage, setCouponMessage] = React.useState({ text: '', type: '' });
  const [isValidatingCoupon, setIsValidatingCoupon] = React.useState(false);

  // Razorpay integration hook
  const { handleRazorpayPayment } = useRazorpayCheckout({
    cart,
    discountPercent,
    appliedCouponCode,
    fullName,
    phone,
    email,
    addressLine1,
    addressLine2,
    city,
    state,
    pincode,
    taxDeliverySettings,
    onOrderSuccess,
    onOrderComplete,
    setIsPlacingOrder,
    setStep,
    onPaymentCancel: () => {
      setOrderId(`MANTRA-${Math.floor(100000 + Math.random() * 900000)}`);
    }
  });


  React.useEffect(() => {
    if (appliedCouponCode && isReady) {
      setCouponMessage({ text: t('summary.coupon.success', { percent: discountPercent }), type: 'success' });
      setCouponCode(appliedCouponCode);
    } else {
      setCouponMessage({ text: '', type: '' });
      setCouponCode('');
    }
  }, [appliedCouponCode, discountPercent, isReady, t]);

  // Order ID generated once for confirmation
  const [orderId, setOrderId] = React.useState(() => `MANTRA-${Math.floor(100000 + Math.random() * 900000)}`);

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
          const token = localStorage.getItem('session_token') || '';
          const response = await fetch(`/api/customer/addresses?sessionToken=${token}`);
          if (!response.ok) throw new Error('Failed to fetch addresses');
          const data = await response.json();
          
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

  const activeCodFee = ((paymentMethod as string) === 'cod' || (paymentMethod as string) === 'COD' || (paymentMethod as string) === 'Cash on Delivery') ? (taxDeliverySettings.codFee || 0) : 0;
  const finalTotal = subtotal - discountAmount + shippingCost + tax + activeCodFee;

  const handleApplyCoupon = async () => {
    const formattedCode = couponCode.trim().toUpperCase();
    setCouponMessage({ text: '', type: '' });

    if (!formattedCode) {
      onApplyCoupon('', 0, null);
      return;
    }

    if (!loggedInUser) {
      setCouponMessage({ text: t('summary.coupon.error.login'), type: 'error' });
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
        setCouponMessage({ text: t('summary.coupon.error.invalid'), type: 'error' });
        onApplyCoupon('', 0, null);
        return;
      }

      // 2. Validate usage limit
      if (coupon.user_limit !== null && coupon.redemptions_count >= coupon.user_limit) {
        setCouponMessage({ text: t('summary.coupon.error.limit'), type: 'error' });
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
        setCouponMessage({ text: t('summary.coupon.error.used'), type: 'error' });
        onApplyCoupon('', 0, null);
        return;
      }

      // 4. Validate product constraint
      if (coupon.product_id) {
        const hasProduct = cart.some(item => item.product.id === coupon.product_id);
        if (!hasProduct) {
          const { data: productData } = await supabase
            .from('localized_website_pooja_products')
            .select('name')
            .eq('id', coupon.product_id)
            .eq('locale', language)
            .maybeSingle();
          
          const productName = productData?.name || t('summary.coupon.error.defaultProduct');
          setCouponMessage({ text: t('summary.coupon.error.product', { productName }), type: 'error' });
          onApplyCoupon('', 0, null);
          return;
        }
      }

      // 5. Apply coupon
      onApplyCoupon(formattedCode, coupon.discount_percent, coupon.product_id || null);
      setCouponMessage({ text: t('summary.coupon.success', { percent: coupon.discount_percent }), type: 'success' });

    } catch (err) {
      console.error('Error applying coupon:', err);
      setCouponMessage({ text: t('summary.coupon.error.generic'), type: 'error' });
      onApplyCoupon('', 0, null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const validateAddress = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = t('address.validation.fullName');
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) errs.phone = t('address.validation.phone');
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = t('address.validation.email');
    if (!addressLine1.trim()) errs.addressLine1 = t('address.validation.addressLine1');
    if (!city.trim()) errs.city = t('address.validation.city');
    if (!state.trim()) errs.state = t('address.validation.state');
    if (!pincode.trim() || pincode.replace(/\D/g, '').length < 5) errs.pincode = t('address.validation.pincode');
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

  const handleUpiRedirect = () => {
    const upi = barcodeSettings?.upiId || '7974478098@paytm';
    const uri = `upi://pay?pa=${upi}&pn=Mantra%20Puja&am=${finalTotal.toFixed(2)}&cu=INR&tn=Order%20${orderId}`;

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = uri;
    } else {
      alert(t('payment.upi.mobileAlert', { amount: finalTotal.toFixed(2) }));
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
      alert(t('payment.upi.uploadError'));
    } finally {
      setIsUploadingScreenshot(false);
    }
  };

  const validatePayment = () => {
    const errs: Record<string, string> = {};
    if (paymentMethod === 'upi') {
      if (!paymentScreenshotUrl) {
        errs.screenshot = t('payment.upi.validationError');
      }
    }
    setPaymentErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddressNext = () => {
    if (validateAddress()) setStep('payment');
  };

  const completeOrder = async (paymentLabel: string, razorpayPaymentId?: string) => {
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
    const isCodSelected = (paymentLabel as string) === 'COD' || (paymentLabel as string) === 'Cash on Delivery' || (paymentLabel as string) === 'cod';
    const activeCodFee = isCodSelected ? (taxDeliverySettings.codFee || 0) : 0;
    const finalCalculatedTotal = subtotalVal - discountAmt + shippingVal + taxVal + activeCodFee;
    const isConfirmedPayment = paymentLabel !== 'Scan & Pay (UPI)' && !isCodSelected;

    // Sync order to shared public.orders / public.order_items linking to mobile app_users ID
    handleWebsiteCheckout({
      phone: phone || loggedInUser?.phoneNumber || (loggedInUser as any)?.phone_number || (loggedInUser as any)?.phone || '',
      orderType: 'product',
      totalAmount: finalCalculatedTotal,
      subtotal: subtotalVal,
      discount: discountAmt,
      tax: taxVal,
      shippingCost: shippingVal,
      paymentStatus: isConfirmedPayment ? 'completed' : 'pending',
      orderStatus: 'Confirmed',
      items: cart.map(item => ({
        id: item.product.id,
        productId: item.product.id,
        item_type: 'product',
        quantity: item.quantity,
        price: item.product.price
      }))
    }, loggedInUser).catch(err => {
      console.warn('[CheckoutPage] handleWebsiteCheckout error:', err);
    });

    await onOrderSuccess({
      orderId,
      items: cart,
      subtotal: subtotalVal,
      discount: discountAmt,
      discountPercent,
      shipping: shippingVal,
      tax: taxVal,
      total: finalCalculatedTotal,
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
      codFee: activeCodFee,
      paymentStatus: isCodSelected ? 'Pending' : (paymentLabel === 'Scan & Pay (UPI)' ? 'Pending' : 'Confirmed'),
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
    if (isPlacingOrder) return;
    if (selectedPaymentOption === 'razorpay') {
      await handleRazorpayPayment(orderId);
    } else {
      if (!validatePayment()) return;
      setIsPlacingOrder(true);
      try {
        await completeOrder('Scan & Pay (UPI)');
      } catch (err) {
        console.error(err);
        setIsPlacingOrder(false);
      }
    }
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

  if (!isReady) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--text-muted)' }}>
        <p>{language === 'hi' ? 'विवरण लोड हो रहा है...' : 'Loading details...'}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa', paddingBottom: '80px' }}>

      {/* ── Back nav ── */}
      {step !== 'confirmation' && (
        <div className="container" style={{ paddingTop: '24px', paddingBottom: '8px' }}>
          <button
            onClick={() => {
              if (step === 'address') {
                handleBackToCart();
              } else if (step === 'payment') {
                if (window.confirm(t('payment.cancelConfirm'))) {
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
            {step === 'address' ? t('backNav.cart') : t('backNav.address')}
          </button>
        </div>
      )}

      <div className="container">

        {/* ── Page Title ── */}
        <h1 style={{
          fontSize: '2rem', fontWeight: 900, color: 'var(--text-dark)',
          marginBottom: '28px', textAlign: 'left'
        }}>
          {t('title')}
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
            {[t('steps.address'), t('steps.payment'), t('steps.confirmation')].map((label, idx) => (
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
                  {t('address.title')}
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
                      {t('address.saved')}
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
                            {addr.isDefault && <span style={{ fontSize: '0.65rem', color: 'var(--primary-lime)', fontWeight: 800 }}>{t('address.default')}</span>}
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
                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{t('address.custom')}</span>
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="form-grid-2col">
                  {/* Full Name */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>{t('address.form.fullName')}</label>
                    <input
                      id="checkout-fullname"
                      style={{ ...inputStyle, borderColor: addressErrors.fullName ? '#ef4444' : 'var(--border-light)' }}
                      placeholder={t('address.form.fullNamePlaceholder')}
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      onFocus={e => (e.target.style.borderColor = 'var(--primary-lime)')}
                      onBlur={e => (e.target.style.borderColor = addressErrors.fullName ? '#ef4444' : 'var(--border-light)')}
                    />
                    {addressErrors.fullName && <p style={errorStyle}>{addressErrors.fullName}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label style={labelStyle}>{t('address.form.phone')}</label>
                    <input
                      id="checkout-phone"
                      style={{ ...inputStyle, borderColor: addressErrors.phone ? '#ef4444' : 'var(--border-light)' }}
                      placeholder={t('address.form.phonePlaceholder')}
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      onFocus={e => (e.target.style.borderColor = 'var(--primary-lime)')}
                      onBlur={e => (e.target.style.borderColor = addressErrors.phone ? '#ef4444' : 'var(--border-light)')}
                    />
                    {addressErrors.phone && <p style={errorStyle}>{addressErrors.phone}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label style={labelStyle}>{t('address.form.email')}</label>
                    <input
                      id="checkout-email"
                      type="email"
                      style={{ ...inputStyle, borderColor: addressErrors.email ? '#ef4444' : 'var(--border-light)' }}
                      placeholder={t('address.form.emailPlaceholder')}
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onFocus={e => (e.target.style.borderColor = 'var(--primary-lime)')}
                      onBlur={e => (e.target.style.borderColor = addressErrors.email ? '#ef4444' : 'var(--border-light)')}
                    />
                    {addressErrors.email && <p style={errorStyle}>{addressErrors.email}</p>}
                  </div>

                  {/* Address Line 1 */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>{t('address.form.addr1')}</label>
                    <input
                      id="checkout-addr1"
                      style={{ ...inputStyle, borderColor: addressErrors.addressLine1 ? '#ef4444' : 'var(--border-light)' }}
                      placeholder={t('address.form.addr1Placeholder')}
                      value={addressLine1}
                      onChange={e => setAddressLine1(e.target.value)}
                      onFocus={e => (e.target.style.borderColor = 'var(--primary-lime)')}
                      onBlur={e => (e.target.style.borderColor = addressErrors.addressLine1 ? '#ef4444' : 'var(--border-light)')}
                    />
                    {addressErrors.addressLine1 && <p style={errorStyle}>{addressErrors.addressLine1}</p>}
                  </div>

                  {/* Address Line 2 */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>{t('address.form.addr2')} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{t('address.form.addr2Optional')}</span></label>
                    <input
                      id="checkout-addr2"
                      style={inputStyle}
                      placeholder={t('address.form.addr2Placeholder')}
                      value={addressLine2}
                      onChange={e => setAddressLine2(e.target.value)}
                      onFocus={e => (e.target.style.borderColor = 'var(--primary-lime)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border-light)')}
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label style={labelStyle}>{t('address.form.city')}</label>
                    <input
                      id="checkout-city"
                      style={{ ...inputStyle, borderColor: addressErrors.city ? '#ef4444' : 'var(--border-light)' }}
                      placeholder={t('address.form.cityPlaceholder')}
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      onFocus={e => (e.target.style.borderColor = 'var(--primary-lime)')}
                      onBlur={e => (e.target.style.borderColor = addressErrors.city ? '#ef4444' : 'var(--border-light)')}
                    />
                    {addressErrors.city && <p style={errorStyle}>{addressErrors.city}</p>}
                  </div>

                  {/* State */}
                  <div>
                    <label style={labelStyle}>{t('address.form.state')}</label>
                    <select
                      id="checkout-state"
                      style={{ ...inputStyle, borderColor: addressErrors.state ? '#ef4444' : 'var(--border-light)', cursor: 'pointer' }}
                      value={state}
                      onChange={e => setState(e.target.value)}
                      onFocus={e => (e.target.style.borderColor = 'var(--primary-lime)')}
                      onBlur={e => (e.target.style.borderColor = addressErrors.state ? '#ef4444' : 'var(--border-light)')}
                    >
                      <option value="">{t('address.form.stateSelect')}</option>
                      {['Andaman and Nicobar Islands','Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chandigarh','Chhattisgarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jammu and Kashmir','Jharkhand','Karnataka','Kerala','Ladakh','Lakshadweep','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Puducherry','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {addressErrors.state && <p style={errorStyle}>{addressErrors.state}</p>}
                  </div>

                  {/* Pincode */}
                  <div>
                    <label style={labelStyle}>{t('address.form.pincode')}</label>
                    <input
                      id="checkout-pincode"
                      style={{ ...inputStyle, borderColor: addressErrors.pincode ? '#ef4444' : 'var(--border-light)' }}
                      placeholder={t('address.form.pincodePlaceholder')}
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
                  {t('address.continue')} <ChevronRight size={18} />
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
                  {selectedPaymentOption === 'razorpay' ? t('payment.titleOnline') : t('payment.titleUpi')}
                </h2>



                {/* Conditional Payment Flow */}
                {paymentMethod === 'upi' && (
                  selectedPaymentOption === 'razorpay' ? (
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
                        <span style={{ fontSize: '0.8rem', color: '#4b5563', fontWeight: 650 }}>{t('payment.amountToPay')}</span>
                        <span style={{ fontSize: '1.7rem', fontWeight: 900, color: 'var(--primary-lime)' }}>
                          ₹{finalTotal.toFixed(2)}
                        </span>
                      </div>

                      {/* Razorpay Banner Info */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '24px 16px',
                        borderRadius: '12px',
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          backgroundColor: '#ecfdf5',
                          color: '#059669'
                        }}>
                          <ShieldCheck size={28} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111827', margin: '0 0 4px 0' }}>{t('payment.razorpay.title')}</h3>
                          <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0, lineHeight: 1.4 }}>
                            {t('payment.razorpay.description')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
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
                        <span style={{ fontSize: '0.8rem', color: '#4b5563', fontWeight: 650 }}>{t('payment.amountToPay')}</span>
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
                          alt={t('payment.upi.scanToPay')} 
                          style={{
                            width: '180px',
                            height: '180px',
                            objectFit: 'contain',
                            marginBottom: '16px'
                          }}
                        />
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: 600 }}>UPI ID: {barcodeSettings?.upiId || '7974478098@paytm'}</span>
                          
                          <button
                            onClick={handleCopyUpi}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 16px',
                              borderRadius: '20px',
                              border: '1.5px solid var(--primary-lime)',
                              backgroundColor: copiedUpi ? 'var(--primary-lime-light)' : '#ffffff',
                              color: 'var(--primary-lime)',
                              fontSize: '0.8rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <Copy size={14} />
                            {copiedUpi ? t('payment.upi.copied') : t('payment.upi.copy')}
                          </button>
                        </div>

                        {/* Informative Help Text inside QR container */}
                        <div style={{
                          marginTop: '20px',
                          padding: '12px 14px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '8px',
                          border: '1px solid #f3f4f6',
                          width: '100%'
                        }}>
                          <p style={{
                            fontSize: '0.72rem',
                            color: '#6b7280',
                            textAlign: 'center',
                            margin: 0,
                            lineHeight: 1.2
                          }}>
                            {t('payment.upi.instructions')}
                          </p>
                        </div>
                      </div>

                      {/* Clickable Mobile Link Helper */}
                      <div style={{ textAlign: 'center' }}>
                        <button 
                          onClick={handleUpiRedirect}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.85rem',
                            color: 'var(--primary-lime)',
                            fontWeight: 800,
                            border: '1.5px solid var(--primary-lime)',
                            padding: '10px 18px',
                            borderRadius: '8px',
                            backgroundColor: 'var(--primary-lime-light)',
                            cursor: 'pointer'
                          }}
                        >
                          {t('payment.upi.openApp')}
                        </button>
                        <p style={{
                          fontSize: '0.7rem',
                          color: '#9ca3af',
                          marginTop: '8px',
                          textAlign: 'center',
                          margin: 0,
                          lineHeight: 1.2
                        }}>
                          {t('payment.upi.openAppHelp')}
                        </p>
                      </div>

                      {/* Screenshot Uploader Area */}
                      <div>
                        <label style={{ ...labelStyle, marginBottom: '6px', display: 'block' }}>
                          {t('payment.upi.uploadLabel')}
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
                                {t('payment.upi.uploading')}
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
                                {t('payment.upi.uploaded')}
                              </span>
                              <span style={{ fontSize: '0.68rem', color: '#6b7280', textDecoration: 'underline' }}>
                                {t('payment.upi.changeImage')}
                              </span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                              <Upload size={26} style={{ color: '#9ca3af', marginBottom: '2px' }} />
                              <span style={{ fontSize: '0.82rem', color: '#374151', fontWeight: 800 }}>
                                {t('payment.upi.selectScreenshot')}
                              </span>
                              <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>
                                {t('payment.upi.formats')}
                              </span>
                            </div>
                          )}
                        </div>
                        {paymentErrors.screenshot && (
                          <p style={{ ...errorStyle, marginTop: '6px' }}>{paymentErrors.screenshot}</p>
                        )}
                      </div>
                    </div>
                  )
                )}

                <button
                  id="checkout-payment-next"
                  onClick={handlePaymentNext}
                  disabled={isPlacingOrder}
                  className="btn-lime"
                  style={{ width: '100%', padding: '15px', marginTop: '28px', justifyContent: 'center', borderRadius: 'var(--radius-md)', fontSize: '1rem', fontWeight: 800 }}
                >
                  <Lock size={16} /> {isPlacingOrder ? t('payment.processing') : (selectedPaymentOption === 'razorpay' ? t('payment.placeOrderOnline', { amount: finalTotal.toFixed(2) }) : t('payment.placeOrderUpi', { amount: finalTotal.toFixed(2) }))}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', justifyContent: 'center' }}>
                  <ShieldCheck size={14} style={{ color: '#10b981' }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('payment.secureShield')}</span>
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
                    {t('confirmation.cardTitle')}
                  </h2>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginTop: '8px', maxWidth: '420px', margin: '8px auto 0' }}>
                    {t('confirmation.cardDescription')}
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
                      <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{t('confirmation.confirmTitle')}</span>
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.85 }}>
                      {new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Order Meta */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {[
                        { label: language === 'hi' ? 'ऑर्डर आईडी' : 'Order ID', value: orderId },
                        { label: t('steps.payment'), value: paymentMethod === 'upi' ? 'UPI' : 'UPI' },
                        { label: t('confirmation.confirmDeliveryTo'), value: `${city}, ${state}` },
                        { label: t('confirmation.confirmDeliveryEst'), value: t('confirmation.confirmDeliveryEstValue') },
                      ].map(item => (
                        <div key={item.label} style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: '#f9fafb', border: '1px solid var(--border-light)' }}>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
                          <p style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '2px' }}>{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Items */}
                    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('confirmation.orderItems')}</p>
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
                            <p style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-dark)' }}>{products.find(p => p.id === item.product.id)?.name || item.product.name}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('confirmation.qty', { count: item.quantity })}</p>
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
                        <span style={{ color: 'var(--text-muted)' }}>{t('confirmation.subtotal')}</span>
                        <span style={{ fontWeight: 700 }}>₹{subtotal.toFixed(2)}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#10b981' }}>
                          <span>{t('confirmation.discount', { percent: discountPercent })}</span>
                          <span style={{ fontWeight: 700 }}>−₹{discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{t('confirmation.shipping')}</span>
                        <span style={{ fontWeight: 700 }}>{shippingCost === 0 ? t('confirmation.free') : `₹${shippingCost.toFixed(2)}`}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', padding: '14px 0 0', borderTop: '2px solid var(--border-light)' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-dark)' }}>{t('confirmation.total')}</span>
                        <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--primary-forest)' }}>₹{finalTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Badges */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '28px' }}>
                  {[
                    { icon: <Truck size={20} style={{ color: 'var(--primary-lime)' }} />, text: t('confirmation.sacredExpress') },
                    { icon: <ShieldCheck size={20} style={{ color: '#10b981' }} />, text: t('confirmation.authentic') },
                    { icon: <Star size={20} style={{ color: '#f59e0b' }} />, text: t('confirmation.templeGrade') },
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
                  <Sparkles size={18} /> {t('confirmation.continueShopping')}
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
                  <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{t('summary.header', { count: cart.reduce((t, i) => t + i.quantity, 0) })}</span>
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
                         <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{products.find(p => p.id === item.product.id)?.name || item.product.name}</p>
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
                      placeholder={t('summary.coupon.placeholder')}
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
                      {isValidatingCoupon ? '...' : t('summary.coupon.apply')}
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
                    <span style={{ color: 'var(--text-muted)' }}>{t('summary.subtotal')}</span>
                    <span style={{ fontWeight: 700 }}>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#10b981' }}>
                      <span>{t('summary.discount', { percent: discountPercent })}</span>
                      <span style={{ fontWeight: 700 }}>−₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{t('summary.shipping')}</span>
                    <span style={{ fontWeight: 700, color: shippingCost === 0 ? '#10b981' : 'var(--text-dark)' }}>
                      {shippingCost === 0 ? t('summary.free') : `₹${shippingCost.toFixed(2)}`}
                    </span>
                  </div>

                  <div style={{ borderTop: '2px solid var(--border-light)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-dark)' }}>{t('summary.total')}</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary-forest)' }}>₹{finalTotal.toFixed(2)}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <ShieldCheck size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('summary.secure')}</span>
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
