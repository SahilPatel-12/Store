import React from 'react';
import { 
  X, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  Lock, 
  ShoppingBag, 
  Phone, 
  ShieldCheck, 
  Plus, 
  MapPin, 
  ArrowRight,
  Gift,
  CreditCard,
  Truck
} from 'lucide-react';
import type { CartItem, Product } from '../types';
import type { OrderDetails } from './OrderSuccessPage';
import { isImageUrl, getDisplayImageUrl } from '../lib/imageHelper';
import { supabase } from '../lib/supabase';
import { fetchUserProfile, handleWebsiteCheckout } from '../lib/crossPlatformSync';
import { useRazorpayCheckout } from '../hooks/useRazorpayCheckout';
import { useLanguage } from '../lib/i18n';
import { useTranslation } from 'react-i18next';
import { normalizePhoneNumber } from '../lib/phoneHelper';

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

interface SeamlessCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  loggedInUser?: { id: string; fullName: string; email: string; phoneNumber: string } | null;
  onLoginSuccess: (
    userSession: { id: string; fullName: string; email: string; phoneNumber: string },
    token: string
  ) => void;
  appliedCouponCode: string;
  onApplyCoupon: (code: string, percent: number, productId: string | null) => void;
  discountPercent: number;
  onOrderSuccess: (details: OrderDetails) => void;
  onOrderComplete: () => void;
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

type Step = 'login' | 'otp' | 'address' | 'payment';

export const SeamlessCheckoutModal: React.FC<SeamlessCheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  loggedInUser,
  onLoginSuccess,
  appliedCouponCode,
  onApplyCoupon,
  discountPercent,
  onOrderSuccess,
  onOrderComplete,
  taxDeliverySettings,
  paymentActivation,
  products = [],
}) => {
  // Modal Navigation & active step state
  const [step, setStep] = React.useState<Step>('login');
  const { language } = useLanguage();
  const { t } = useTranslation('seamlessCheckout');
  const [isReady, setIsReady] = React.useState(false);
  void onApplyCoupon;

  React.useEffect(() => {
    if (isOpen) {
      import('../lib/i18next').then(({ loadNamespaces }) => {
        loadNamespaces(language, ['seamlessCheckout']).then(() => setIsReady(true));
      });
    } else {
      setIsReady(false);
    }
  }, [language, isOpen]);

  // Payment states
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = React.useState('');
  const [selectedPaymentOption, setSelectedPaymentOption] = React.useState<'razorpay' | 'cod'>('razorpay');

  React.useEffect(() => {
    setSelectedPaymentOption('razorpay');
  }, [paymentActivation]);

  // Order Summary Accordion State
  const [isSummaryExpanded, setIsSummaryExpanded] = React.useState(false);

  // Auth States
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [isNewUser, setIsNewUser] = React.useState(false);
  const [userEnteredOtp, setUserEnteredOtp] = React.useState('');
  const [otpCountdown, setOtpCountdown] = React.useState(60);
  const [otpTargetPhone, setOtpTargetPhone] = React.useState('');
  const [otpChannel, setOtpChannel] = React.useState<'sms' | 'whatsapp'>('whatsapp');
  const [authError, setAuthError] = React.useState('');
  const [isAuthLoading, setIsAuthLoading] = React.useState(false);
  const [sendUpdates, setSendUpdates] = React.useState(true);

  // Address fields
  const [fullName, setFullName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [addressLine1, setAddressLine1] = React.useState('');
  const [addressLine2, setAddressLine2] = React.useState('');
  const [flatHouseBuilding, setFlatHouseBuilding] = React.useState('');
  const [alternativePhone, setAlternativePhone] = React.useState('');
  const [landmark, setLandmark] = React.useState('');
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
  const [savedAddresses, setSavedAddresses] = React.useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = React.useState<string>('');
  const [isAddressLoading, setIsAddressLoading] = React.useState(false);




  // Payment fields
  const [isPlacingOrder, setIsPlacingOrder] = React.useState(false);

  // Settings
  const [orderId, setOrderId] = React.useState(() => `MANTRA-${Math.floor(100000 + Math.random() * 900000)}`);

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
    flatHouseBuilding,
    landmark,
    alternativePhone,
    selectedAddressId: selectedAddressId !== 'custom' ? selectedAddressId : undefined,
    city,
    state,
    pincode,
    taxDeliverySettings,
    onOrderSuccess,
    onOrderComplete,
    setIsPlacingOrder,
    onPaymentSuccess: onClose,
    onPaymentCancel: () => {
      setOrderId(`MANTRA-${Math.floor(100000 + Math.random() * 900000)}`);
    }
  });

  // Direct login checking to route user to correct step initially and reset form states
  React.useEffect(() => {
    if (isOpen) {
      // Generate a brand new order ID for this checkout session
      setOrderId(`MANTRA-${Math.floor(100000 + Math.random() * 900000)}`);
      
      // Reset Screenshot state
      setPaymentScreenshotUrl('');
      
      // Reset placement/error states
      setIsPlacingOrder(false);
      setAddressErrors({});
      setAuthError('');

      // Route user to appropriate step
      if (loggedInUser) {
        setStep('address');
      } else {
        setStep('login');
      }
    }
  }, [isOpen, loggedInUser]);



  // OTP Countdown countdown timer
  React.useEffect(() => {
    let timer: any;
    if (step === 'otp' && otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, otpCountdown]);

  // Fetch configs and addresses on mount/auth change


  React.useEffect(() => {
    if (!isOpen || !loggedInUser) {
      setSavedAddresses([]);
      return;
    }

    const user = loggedInUser;

    async function fetchAddresses() {
      setIsAddressLoading(true);
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
          const applyAddressToForm = (targetAddr: Address) => {
            let flatVal = '';
            let streetVal = targetAddr.street || '';
            let landmarkVal = '';
            let altPhoneVal = '';

            if (streetVal && streetVal.includes('__STRUCTURED_ADDR__:')) {
              try {
                const idx = streetVal.indexOf('__STRUCTURED_ADDR__:');
                const parsed = JSON.parse(streetVal.substring(idx + 20));
                flatVal = parsed.flat || '';
                streetVal = parsed.street || parsed.addressLine1 || '';
                landmarkVal = parsed.landmark || '';
                altPhoneVal = parsed.altPhone || '';
              } catch (e) {
                streetVal = streetVal.replace(/__STRUCTURED_ADDR__:\s*\{[^}]*\}/g, '').trim();
              }
            }

            setFullName(targetAddr.name);
            setPhone(targetAddr.phone);
            setFlatHouseBuilding(flatVal);
            setAddressLine1(streetVal);
            setLandmark(landmarkVal);
            setAlternativePhone(altPhoneVal);
            setAddressLine2('');
            setCity(targetAddr.city);
            setState(targetAddr.state);
            setPincode(targetAddr.zip);
            setSelectedAddressId(targetAddr.id);
          };

          setSavedAddresses(mapped);
          const defaultAddr = mapped.find(a => a.isDefault) || (mapped.length > 0 ? mapped[0] : null);
          if (defaultAddr) {
            applyAddressToForm(defaultAddr);
          }
        }
      } catch (err) {
        console.error('Fetch addresses error:', err);
      } finally {
        setIsAddressLoading(false);
      }
    }

    // Prefill fields
    setFullName(user.fullName || '');
    setEmail(user.email || '');
    setPhone(user.phoneNumber || '');

    fetchAddresses();
  }, [isOpen, loggedInUser]);

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

  React.useEffect(() => {
    console.log('[OTP] Active channel state updated:', otpChannel);
  }, [otpChannel]);

  if (!isOpen) return null;

  if (!isReady) {
    return (
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          zIndex: 1100,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '16px'
        }}
      >
        <div style={{ padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '24px', height: '24px', border: '3px solid #ea580c', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#374151' }}>
            {language === 'hi' ? 'विवरण लोड हो रहा है...' : 'Loading details...'}
          </span>
        </div>
      </div>
    );
  }

  // Gateway Sender via backend endpoint
  const sendOtp = async (targetPhone: string) => {
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: targetPhone
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error! Status: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error('[OTP Service] OTP send failed:', err);
      throw err;
    }
  };

  // Auth Functions
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);
    try {
      const formatted = normalizePhoneNumber(phoneNumber);
      if (!formatted) {
        throw new Error(t('login.error.invalidPhone'));
      }

      // Check if user exists
      const { data: existingUser, error: checkErr } = await supabase
        .from('website_store_users')
        .select('*')
        .eq('phone_number', formatted)
        .maybeSingle();

      if (checkErr) throw checkErr;

      setIsNewUser(!existingUser);
      setOtpTargetPhone(formatted);

      const isDevProfile = formatted.includes('9999999999');

      if (!isDevProfile) {
        sendOtp(formatted).then(res => {
          setOtpChannel(res.channel === 'sms' ? 'sms' : 'whatsapp');
        }).catch(err => {
          console.error('[OTP Service] Background send failed:', err);
        });
      } else {
        setOtpChannel('whatsapp');
      }

      setStep('otp');
      setOtpCountdown(60);
    } catch (err) {
      console.error(err);
      setAuthError((err as Error).message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);
    try {
      // Login token serverless session call
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: otpTargetPhone,
          otp: userEnteredOtp,
          device_id: 'browser_client'
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error! Status: ${response.status}`);
      }

      const row = await response.json();

      // Apply referral code silently if present and user is new
      if (isNewUser) {
        try {
          const refCode = localStorage.getItem('mantra_referral_code');
          const refTimeStr = localStorage.getItem('mantra_referral_time');
          if (refCode && refTimeStr) {
            const refTime = parseInt(refTimeStr, 10);
            if (Date.now() - refTime <= 30 * 24 * 60 * 60 * 1000) {
              await supabase.rpc('bind_referral_on_signup', {
                p_referred_id: row.user_id,
                p_referrer_code: refCode
              });
            }
          }
          localStorage.removeItem('mantra_referral_code');
          localStorage.removeItem('mantra_referral_time');
        } catch (refErr) {
          console.error('Silent referral link error:', refErr);
        }
      }

      let resolvedFullName = row.full_name || '';
      try {
        const profile = await fetchUserProfile(row.phone_number || otpTargetPhone);
        if (profile && profile.full_name) {
          resolvedFullName = profile.full_name;
        }
      } catch (pErr) {
        console.warn('[SeamlessCheckoutModal] Profile resolution error:', pErr);
      }

      onLoginSuccess({
        id: row.user_id,
        fullName: resolvedFullName,
        email: row.email || '',
        phoneNumber: row.phone_number || otpTargetPhone
      }, row.session_token);

      // State changes to address filling automatically
      setStep('address');
    } catch (err) {
      console.error(err);
      setAuthError((err as Error).message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpCountdown > 0) return;
    setAuthError('');
    setIsAuthLoading(true);
    try {
      const isDevProfile = otpTargetPhone.includes('9999999999');
      if (!isDevProfile) {
        sendOtp(otpTargetPhone).then(res => {
          setOtpChannel(res.channel === 'sms' ? 'sms' : 'whatsapp');
        }).catch(err => {
          console.error('[OTP Service] Background resend failed:', err);
        });
      } else {
        setOtpChannel('whatsapp');
      }
      setOtpCountdown(60);
      setAuthError('');
    } catch (err) {
      setAuthError((err as Error).message);
    } finally {
      setIsAuthLoading(false);
    }
  };



  // Dynamic calculations
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

  const baseTotal = subtotal - discountAmount + shippingCost + tax;
  const totalQty = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const activeCodFee = selectedPaymentOption === 'cod' ? (taxDeliverySettings.codFee || 50) * totalQty : 0;
  const finalTotal = baseTotal + activeCodFee;

  // Address updates
  const handleSelectSavedAddress = (id: string) => {
    setSelectedAddressId(id);
    const addr = savedAddresses.find(a => a.id === id);
    if (addr) {
      setFullName(addr.name);
      setPhone(addr.phone);
      
      if (addr.street && addr.street.includes('__STRUCTURED_ADDR__:')) {
        try {
          const idx = addr.street.indexOf('__STRUCTURED_ADDR__:');
          const parsed = JSON.parse(addr.street.substring(idx + 20));
          setFlatHouseBuilding(parsed.flat || '');
          setAddressLine1(parsed.street || parsed.addressLine1 || '');
          setLandmark(parsed.landmark || '');
          setAlternativePhone(parsed.altPhone || '');
        } catch (e) {
          const cleaned = addr.street.replace(/__STRUCTURED_ADDR__:\s*\{[^}]*\}/g, '').trim();
          setFlatHouseBuilding('');
          setAddressLine1(cleaned.startsWith('__STRUCTURED_ADDR__:') ? '' : cleaned);
          setLandmark('');
          setAlternativePhone('');
        }
      } else {
        setFlatHouseBuilding('');
        setAddressLine1(addr.street || '');
        setLandmark('');
        setAlternativePhone('');
      }

      setAddressLine2('');
      setCity(addr.city);
      setState(addr.state);
      setPincode(addr.zip);
    }
  };

  const validateAddressFields = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = t('address.validation.fullName');
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) errs.phone = t('address.validation.phone');
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = t('address.validation.email');
    if (!flatHouseBuilding.trim()) errs.flatHouseBuilding = language === 'hi' ? 'फ्लैट, हाउस नंबर, बिल्डिंग का नाम/नंबर आवश्यक है' : 'Flat, House, Building name/number is required';
    if (!addressLine1.trim()) errs.addressLine1 = t('address.validation.addressLine1');
    if (!city.trim()) errs.city = t('address.validation.city');
    if (!state.trim()) errs.state = t('address.validation.state');
    if (!pincode.trim() || pincode.replace(/\D/g, '').length < 5) errs.pincode = t('address.validation.pincode');
    setAddressErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddressSubmit = () => {
    if (validateAddressFields()) {
      setStep('payment');
    }
  };

  const handleCloseModal = () => {
    if (step === 'payment') {
      if (!window.confirm(t('payment.cancelConfirm'))) {
        return;
      }
    }
    setPaymentScreenshotUrl('');
    setAddressErrors({});
    onClose();
  };

  const executeOrderSave = (paymentLabel: string, razorpayPaymentId?: string) => {
    const isFreeEligible = (subtotal - discountAmount) >= taxDeliverySettings.freeDeliveryThreshold;
    const initialPaymentStatus = (paymentLabel === 'Scan & Pay (UPI)' || paymentLabel === 'COD' || paymentLabel === 'Cash on Delivery') ? 'Pending' : 'Confirmed';
    // Sync order to shared public.orders / public.order_items linking to mobile app_users ID
    handleWebsiteCheckout({
      phone: phone || loggedInUser?.phoneNumber || (loggedInUser as any)?.phone_number || (loggedInUser as any)?.phone || '',
      orderType: 'product',
      totalAmount: finalTotal,
      subtotal: subtotal,
      discount: discountAmount,
      tax: tax,
      shippingCost: shippingCost,
      paymentStatus: initialPaymentStatus === 'Confirmed' ? 'completed' : 'pending',
      orderStatus: 'Confirmed',
      items: cart.map(item => ({
        id: item.product.id,
        productId: item.product.id,
        item_type: 'product',
        quantity: item.quantity,
        price: item.product.price
      }))
    }, loggedInUser).catch(err => {
      console.warn('[SeamlessCheckoutModal] handleWebsiteCheckout error:', err);
    });

    onOrderSuccess({
      orderId,
      items: cart,
      subtotal,
      discount: discountAmount,
      discountPercent,
      shipping: shippingCost,
      tax,
      total: finalTotal,
      paymentMethod: paymentLabel,
      deliveryCity: city,
      deliveryState: state,
      fullName,
      email,
      phoneNumber: phone,
      addressLine1,
      addressLine2: `__STRUCTURED_ADDR__:${JSON.stringify({
        flat: flatHouseBuilding,
        landmark: landmark,
        altPhone: alternativePhone,
        addressLine2: addressLine2
      })}`,
      pincode,
      placedAt: new Date(),
      selectedAddressId: selectedAddressId !== 'custom' ? selectedAddressId : undefined,
      razorpayPaymentId,
      paymentScreenshot: paymentScreenshotUrl || undefined,
      appliedCouponCode: appliedCouponCode || undefined,
      gstPercentSnapshot: taxDeliverySettings.globalGstPercent,
      gstAmountSnapshot: tax,
      deliveryAmountSnapshot: shippingCost,
      codFee: paymentLabel === 'COD' || paymentLabel === 'Cash on Delivery' ? (taxDeliverySettings.codFee || 50) * totalQty : 0,
      freeDeliveryEligibleSnapshot: isFreeEligible,
      paymentStatus: initialPaymentStatus,
      status: 'Being Packed'
    });

    onOrderComplete();
    
    // Close modal directly without triggering the cancel-checkout confirmation dialog
    setPaymentScreenshotUrl('');
    setAddressErrors({});
    onClose();
  };

  const handlePlaceOrder = async () => {
    if (isPlacingOrder) return;
    if (selectedPaymentOption === 'razorpay') {
      await handleRazorpayPayment(orderId);
    } else {
      setIsPlacingOrder(true);
      try {
        executeOrderSave('COD');
      } catch (err) {
        console.error(err);
        alert(t('payment.errorPlaceOrder', { defaultValue: 'Failed to place COD order. Please try again.' }));
      } finally {
        setIsPlacingOrder(false);
      }
    }
  };

  // Render navigation helper
  const renderBackButton = () => {
    if (step === 'otp') {
      return (
        <button 
          onClick={() => { setStep('login'); setAuthError(''); }} 
          style={{ padding: '8px', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center' }}
        >
          <ChevronLeft size={20} />
        </button>
      );
    }
    if (step === 'address' && !loggedInUser) {
      return (
        <button 
          onClick={() => setStep('login')} 
          style={{ padding: '8px', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center' }}
        >
          <ChevronLeft size={20} />
        </button>
      );
    }
    if (step === 'payment') {
      return (
        <button 
          onClick={() => {
            if (window.confirm(t('payment.cancelConfirm'))) {
              setStep('address');
            }
          }} 
          style={{ padding: '8px', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center' }}
        >
          <ChevronLeft size={20} />
        </button>
      );
    }
    return null;
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1.5px solid #e5e7eb',
    fontSize: '0.9rem',
    outline: 'none',
    backgroundColor: '#ffffff',
    transition: 'border-color 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.78rem',
    fontWeight: 800,
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px',
    display: 'block'
  };

  const errorTextStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: '#ef4444',
    marginTop: '4px',
    fontWeight: 600,
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(8px)',
        zIndex: 1100,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '16px'
      }}
      onClick={handleCloseModal}
    >
      <div 
        className="seamless-checkout-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          maxHeight: '92vh',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Top Header Bar */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {renderBackButton()}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.4rem' }}>🕉️</span>
              <span style={{ fontWeight: 900, fontSize: '0.95rem', color: '#1f2937', letterSpacing: '-0.3px' }}>
                {t('header.title')}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#6b7280', fontWeight: 650 }}>
              <Lock size={12} style={{ color: '#10b981' }} />
              <span>{t('header.secured')}</span>
            </div>
            
            <button 
              onClick={handleCloseModal} 
              style={{
                padding: '6px',
                borderRadius: '50%',
                backgroundColor: '#f3f4f6',
                color: '#4b5563',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Promo Bar */}
        <div style={{
          backgroundColor: '#000000',
          color: '#ffffff',
          fontSize: '0.75rem',
          fontWeight: 800,
          padding: '8px 16px',
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {t('promo.extraDiscount')}
        </div>

        {/* Scrollable Container Body */}
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '16px' }} className="no-scrollbar">
          
          {/* Order Summary Accordion Card */}
          <div style={{
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            backgroundColor: '#fafafa',
            padding: '12px',
            marginBottom: '16px'
          }}>
            <div 
              onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={18} style={{ color: '#4b5563' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#374151' }}>
                  {t('summary.header', { count: cart.reduce((s, i) => s + i.quantity, 0) })}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {discountAmount > 0 && (
                  <span style={{ textDecoration: 'line-through', fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600 }}>
                    ₹{subtotal.toFixed(2)}
                  </span>
                )}
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--primary-forest)' }}>
                  ₹{finalTotal.toFixed(2)}
                </span>
                {isSummaryExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {/* Accordion Expansion */}
            {isSummaryExpanded && (
              <div style={{
                marginTop: '12px',
                borderTop: '1px solid #e5e7eb',
                paddingTop: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {/* List items */}
                <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {cart.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '4px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '6px',
                        backgroundColor: '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}>
                        {isImageUrl(item.product.image) ? (
                          <img src={getDisplayImageUrl(item.product.image)} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '1.2rem' }}>{item.product.image || '📿'}</span>
                        )}
                      </div>
                      <div style={{ flexGrow: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                           {products.find(p => p.id === item.product.id)?.name || item.product.name}
                        </p>
                        <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: 0 }}>{language === 'hi' ? 'मात्रा' : 'Qty'}: {item.quantity}</p>
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary-forest)', flexShrink: 0 }}>
                        ₹{(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Subtotals breakdown */}
                <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                    <span>{t('summary.subtotal')}</span>
                    <span style={{ fontWeight: 700 }}>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                      <span>{t('summary.discount', { percent: discountPercent })}</span>
                      <span style={{ fontWeight: 700 }}>−₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                    <span>{t('summary.shipping')}</span>
                    <span style={{ fontWeight: 700 }}>{shippingCost === 0 ? t('summary.free') : `₹${shippingCost.toFixed(2)}`}</span>
                  </div>
                  {tax > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                      <span>{t('summary.tax')}</span>
                      <span style={{ fontWeight: 700 }}>₹{tax.toFixed(2)}</span>
                    </div>
                  )}
                  {activeCodFee > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c2410c', fontWeight: 750 }}>
                      <span>COD Handling Charge</span>
                      <span>+₹{activeCodFee.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Gift/Shipping Tag info line */}
            <div style={{
              marginTop: '10px',
              backgroundColor: '#e6f4ea',
              color: '#137333',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '0.72rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Gift size={12} style={{ color: '#10b981' }} />
              <span>{shippingCost === 0 ? t('summary.freeShippingActive') : t('summary.freeShippingThreshold', { amount: (500 - (subtotal - discountAmount)).toFixed(0) })}</span>
            </div>
          </div>



          {/* ══════════════════════════════════════
              STEP 1: LOGIN (Phone input)
          ══════════════════════════════════════ */}
          {step === 'login' && (
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Phone size={18} style={{ color: '#ea580c' }} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 850, color: '#1f2937', margin: 0 }}>
                  {t('login.title')}
                </h3>
              </div>

              {authError && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '14px' }}>
                  ⚠️ {authError}
                </div>
              )}

              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>{t('login.enterMobile')}</label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1.5px solid #d1d5db',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    padding: '12px 14px',
                  }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#374151', marginRight: '8px' }}>+91</span>
                    <div style={{ width: '1.5px', height: '18px', backgroundColor: '#cbd5e1', marginRight: '10px' }} />
                    <input 
                      type="tel"
                      required
                      placeholder={t('login.phonePlaceholder')}
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value.replace(/[^\d]/g, ''))}
                      style={{
                        flexGrow: 1,
                        border: 'none',
                        outline: 'none',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        backgroundColor: 'transparent',
                        padding: 0
                      }}
                    />
                  </div>
                </div>

                {/* updates check box */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', userSelect: 'none', marginTop: '4px' }}>
                  <input 
                    type="checkbox" 
                    checked={sendUpdates}
                    onChange={e => setSendUpdates(e.target.checked)}
                    style={{ marginTop: '2px', accentColor: '#ea580c' }}
                  />
                  <span style={{ fontSize: '0.74rem', color: '#4b5563', fontWeight: 600, lineHeight: 1.3 }}>
                    {t('login.updates')}
                  </span>
                </label>

                {/* submit */}
                <button
                  type="submit"
                  disabled={isAuthLoading || phoneNumber.length < 9}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '8px',
                    background: phoneNumber.length >= 9 ? 'linear-gradient(135deg, #ea580c 0%, #d97706 100%)' : '#cbd5e1',
                    color: '#ffffff',
                    fontWeight: 800,
                    border: 'none',
                    cursor: phoneNumber.length >= 9 && !isAuthLoading ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '0.92rem',
                    transition: 'all 0.15s'
                  }}
                >
                  {isAuthLoading ? t('login.sending') : t('login.continue')}
                  {!isAuthLoading && <ArrowRight size={16} />}
                </button>
              </form>
            </div>
          )}

          {/* ══════════════════════════════════════
              STEP 2: OTP VERIFICATION
          ══════════════════════════════════════ */}
          {step === 'otp' && (
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 850, color: '#1f2937', margin: '0 auto 6px auto' }}>
                {t('otp.title')}
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: '0 0 16px 0', lineHeight: 1.4 }}>
                {t('otp.info', { phone: otpTargetPhone })}
                {import.meta.env.DEV && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                  <span style={{ display: 'block', color: '#4338ca', fontWeight: 700, marginTop: '6px', fontSize: '0.78rem', backgroundColor: '#e0e7ff', padding: '6px 10px', borderRadius: '6px' }}>
                    ⚡ Local Dev Mode: Use OTP code set in <code>.env.local</code> (e.g. 777777)
                  </span>
                )}
              </p>

              {authError && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '14px', textAlign: 'left' }}>
                  ⚠️ {authError}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>{t('otp.enterOtp')}</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder={t('otp.otpPlaceholder')}
                    value={userEnteredOtp}
                    onChange={e => setUserEnteredOtp(e.target.value.replace(/[^\d]/g, ''))}
                    style={{
                      ...inputStyle,
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      letterSpacing: '6px',
                      textAlign: 'center',
                      backgroundColor: '#f9fafb'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <button 
                    type="button" 
                    onClick={() => { setStep('login'); setAuthError(''); }}
                    style={{ background: 'none', border: 'none', color: '#4b5563', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {t('otp.changeNumber')}
                  </button>

                  {otpCountdown > 0 ? (
                    <span style={{ color: '#9ca3af', fontWeight: 650 }}>{t('otp.resendCountdown', { seconds: otpCountdown })}</span>
                  ) : (
                    <button 
                      type="button" 
                      onClick={handleResendOtp}
                      style={{ background: 'none', border: 'none', color: '#ea580c', fontWeight: 800, cursor: 'pointer' }}
                    >
                      {t('otp.resendBtn')}
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading || userEnteredOtp.length < 6}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '8px',
                    background: userEnteredOtp.length === 6 ? 'linear-gradient(135deg, #ea580c 0%, #d97706 100%)' : '#cbd5e1',
                    color: '#ffffff',
                    fontWeight: 800,
                    border: 'none',
                    cursor: userEnteredOtp.length === 6 && !isAuthLoading ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.92rem'
                  }}
                >
                  {isAuthLoading ? t('otp.verifying') : t('otp.verify')}
                </button>
              </form>
            </div>
          )}

          {/* ══════════════════════════════════════
              STEP 3: SHIPPING ADDRESS
          ══════════════════════════════════════ */}
          {step === 'address' && (
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                <MapPin size={18} style={{ color: 'var(--primary-lime)' }} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 950, color: '#1f2937', margin: 0 }}>
                  {t('address.title')}
                </h3>
              </div>

              {isAddressLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                  <div style={{ width: '24px', height: '24px', border: '3px solid #ea580c', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                </div>
              ) : (
                <>
                  {savedAddresses.length > 0 && (
                    <div style={{
                      backgroundColor: '#fff7ed',
                      border: '1px solid #ffedd5',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          📍 {t('address.savedList')}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#9a3412', fontWeight: 700 }}>
                          ({savedAddresses.length})
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }} className="no-scrollbar">
                        {savedAddresses.map((a) => {
                          let displayStreet = a.street || '';
                          let displayFlat = '';

                          if (displayStreet.includes('__STRUCTURED_ADDR__:')) {
                            try {
                              const idx = displayStreet.indexOf('__STRUCTURED_ADDR__:');
                              const parsed = JSON.parse(displayStreet.substring(idx + 20));
                              displayFlat = parsed.flat || '';
                              displayStreet = parsed.street || parsed.addressLine1 || '';
                            } catch (e) {
                              displayStreet = displayStreet.replace(/__STRUCTURED_ADDR__:\s*\{[^}]*\}/g, '').trim();
                            }
                          }

                          const addressPreview = [displayFlat, displayStreet, a.city].filter(Boolean).join(', ');
                          const isSelected = selectedAddressId === a.id;

                          return (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => handleSelectSavedAddress(a.id)}
                              style={{
                                flexShrink: 0,
                                width: '155px',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                border: isSelected ? '2px solid #ea580c' : '1px solid #fed7aa',
                                backgroundColor: isSelected ? '#ffffff' : '#fffcf8',
                                boxShadow: isSelected ? '0 2px 6px rgba(234, 88, 12, 0.12)' : 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                                <span style={{
                                  fontSize: '0.6rem',
                                  fontWeight: 800,
                                  color: isSelected ? '#c2410c' : '#6b7280',
                                  backgroundColor: isSelected ? '#ffedd5' : '#f3f4f6',
                                  padding: '1px 5px',
                                  borderRadius: '4px'
                                }}>
                                  {a.type || 'Home'}
                                </span>
                                {a.isDefault && <span style={{ fontSize: '0.6rem', color: '#16a34a', fontWeight: 800 }}>{t('address.default')}</span>}
                              </div>
                              <p style={{ fontSize: '0.76rem', fontWeight: 800, color: '#1f2937', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</p>
                              <p style={{ fontSize: '0.68rem', color: '#6b7280', margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{addressPreview}</p>
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAddressId('custom');
                            setFullName('');
                            setPhone('');
                            setFlatHouseBuilding('');
                            setAddressLine1('');
                            setLandmark('');
                            setAlternativePhone('');
                            setAddressLine2('');
                            setCity('');
                            setState('');
                            setPincode('');
                          }}
                          style={{
                            flexShrink: 0,
                            width: '90px',
                            padding: '8px',
                            borderRadius: '8px',
                            border: selectedAddressId === 'custom' ? '2px solid #ea580c' : '1px dashed #fdba74',
                            backgroundColor: selectedAddressId === 'custom' ? '#ffffff' : '#fffcf8',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            gap: '2px'
                          }}
                        >
                          <Plus size={13} style={{ color: selectedAddressId === 'custom' ? '#ea580c' : '#c2410c' }} />
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: selectedAddressId === 'custom' ? '#ea580c' : '#c2410c' }}>{t('address.custom')}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>{t('address.form.fullName')}</label>
                      <input 
                        style={{ ...inputStyle, borderColor: addressErrors.fullName ? '#ef4444' : '#e5e7eb' }}
                        placeholder={t('address.form.fullNamePlaceholder')}
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                      />
                      {addressErrors.fullName && <p style={errorTextStyle}>{addressErrors.fullName}</p>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={labelStyle}>{t('address.form.phone')}</label>
                        <input 
                          style={{ ...inputStyle, borderColor: addressErrors.phone ? '#ef4444' : '#e5e7eb' }}
                          placeholder={t('address.form.phonePlaceholder')}
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                        />
                        {addressErrors.phone && <p style={errorTextStyle}>{addressErrors.phone}</p>}
                      </div>
                      <div>
                        <label style={labelStyle}>{t('address.form.email')}</label>
                        <input 
                          type="email"
                          style={{ ...inputStyle, borderColor: addressErrors.email ? '#ef4444' : '#e5e7eb' }}
                          placeholder={t('address.form.emailPlaceholder')}
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                        />
                        {addressErrors.email && <p style={errorTextStyle}>{addressErrors.email}</p>}
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>{language === 'hi' ? 'फ्लैट, हाउस नंबर, बिल्डिंग का नाम/नंबर *' : 'Flat, House, Building, Name or Number *'}</label>
                      <input 
                        style={{ ...inputStyle, borderColor: addressErrors.flatHouseBuilding ? '#ef4444' : '#e5e7eb' }}
                        placeholder={language === 'hi' ? 'उदा. फ्लैट 402, शांति अपार्टमेंट' : 'e.g. Flat 402, Shanti Apartments'}
                        value={flatHouseBuilding}
                        onChange={e => setFlatHouseBuilding(e.target.value)}
                      />
                      {addressErrors.flatHouseBuilding && <p style={errorTextStyle}>{addressErrors.flatHouseBuilding}</p>}
                    </div>

                    <div>
                      <label style={labelStyle}>{t('address.form.addr1')}</label>
                      <input 
                        style={{ ...inputStyle, borderColor: addressErrors.addressLine1 ? '#ef4444' : '#e5e7eb' }}
                        placeholder={t('address.form.addr1Placeholder')}
                        value={addressLine1}
                        onChange={e => setAddressLine1(e.target.value)}
                      />
                      {addressErrors.addressLine1 && <p style={errorTextStyle}>{addressErrors.addressLine1}</p>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={labelStyle}>{language === 'hi' ? 'लैंडमार्क (वैकल्पिक)' : 'Landmark (Optional)'}</label>
                        <input 
                          style={inputStyle}
                          placeholder={language === 'hi' ? 'उदा. शिव मंदिर के पास' : 'e.g. Near Shiv Temple'}
                          value={landmark}
                          onChange={e => setLandmark(e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>{language === 'hi' ? 'वैकल्पिक फ़ोन (वैकल्पिक)' : 'Alternative Phone (Optional)'}</label>
                        <input 
                          style={inputStyle}
                          placeholder={language === 'hi' ? 'वैकल्पिक फ़ोन' : 'Alternative Phone'}
                          value={alternativePhone}
                          onChange={e => setAlternativePhone(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={labelStyle}>{t('address.form.city')}</label>
                        <input 
                          style={{ ...inputStyle, borderColor: addressErrors.city ? '#ef4444' : '#e5e7eb' }}
                          placeholder={t('address.form.cityPlaceholder')}
                          value={city}
                          onChange={e => setCity(e.target.value)}
                        />
                        {addressErrors.city && <p style={errorTextStyle}>{addressErrors.city}</p>}
                      </div>
                      <div>
                        <label style={labelStyle}>{t('address.form.pincode')}</label>
                        <input 
                          style={{ ...inputStyle, borderColor: addressErrors.pincode ? '#ef4444' : '#e5e7eb' }}
                          placeholder={t('address.form.pincodePlaceholder')}
                          maxLength={6}
                          value={pincode}
                          onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
                        />
                        {addressErrors.pincode && <p style={errorTextStyle}>{addressErrors.pincode}</p>}
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>{t('address.form.state')}</label>
                      <select
                        style={{ ...inputStyle, borderColor: addressErrors.state ? '#ef4444' : '#e5e7eb', cursor: 'pointer' }}
                        value={state}
                        onChange={e => setState(e.target.value)}
                      >
                        <option value="">{t('address.form.stateSelect')}</option>
                         {['Andaman and Nicobar Islands','Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chandigarh','Chhattisgarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jammu and Kashmir','Jharkhand','Karnataka','Kerala','Ladakh','Lakshadweep','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Puducherry','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {addressErrors.state && <p style={errorTextStyle}>{addressErrors.state}</p>}
                    </div>

                    <button
                      onClick={handleAddressSubmit}
                      className="btn-lime"
                      style={{ width: '100%', padding: '14px', marginTop: '10px', justifyContent: 'center', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 800 }}
                    >
                      {t('address.continue')}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════
              STEP 4: PAYMENT OPTIONS
          ══════════════════════════════════════ */}
          {step === 'payment' && (
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                <Lock size={18} style={{ color: 'var(--primary-lime)' }} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 950, color: '#1f2937', margin: 0 }}>
                  {selectedPaymentOption === 'razorpay'
                    ? t('payment.titleOnline', { defaultValue: 'Secure Online Payment' })
                    : (selectedPaymentOption === 'cod'
                      ? 'Cash on Delivery (COD)'
                      : t('payment.titleUpi', { defaultValue: 'Manual UPI Payment' }))}
                </h3>
              </div>

              {/* Payment Method Selector Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const oldOption = selectedPaymentOption;
                    setSelectedPaymentOption('razorpay');
                    if (oldOption !== 'razorpay') {
                      setOrderId(`MANTRA-${Math.floor(100000 + Math.random() * 900000)}`);
                    }
                  }}
                  style={{
                    padding: '12px 10px',
                    borderRadius: '8px',
                    border: selectedPaymentOption === 'razorpay' ? '2px solid #ea580c' : '1px solid #d1d5db',
                    backgroundColor: selectedPaymentOption === 'razorpay' ? '#fff7ed' : '#ffffff',
                    color: selectedPaymentOption === 'razorpay' ? '#9a3412' : '#374151',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <CreditCard size={18} style={{ color: selectedPaymentOption === 'razorpay' ? '#ea580c' : '#6b7280' }} />
                  <span>Online Payment</span>
                  <span style={{ fontSize: '0.64rem', color: '#6b7280', fontWeight: 600 }}>Razorpay (UPI, Cards)</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const oldOption = selectedPaymentOption;
                    setSelectedPaymentOption('cod');
                    if (oldOption === 'razorpay') {
                      const sessionToken = localStorage.getItem('session_token') || '';
                      const previousOrderId = orderId;
                      // Regenerate orderId to avoid idempotency matching of Razorpay pending attempt
                      setOrderId(`MANTRA-${Math.floor(100000 + Math.random() * 900000)}`);
                      try {
                        await fetch('/api/orders/cancel', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ orderId: previousOrderId, sessionToken })
                        });
                      } catch (err) {
                        console.warn('Failed to cancel previous Razorpay order attempt:', err);
                      }
                    }
                  }}
                  style={{
                    padding: '12px 10px',
                    borderRadius: '8px',
                    border: selectedPaymentOption === 'cod' ? '2px solid #ea580c' : '1px solid #d1d5db',
                    backgroundColor: selectedPaymentOption === 'cod' ? '#fff7ed' : '#ffffff',
                    color: selectedPaymentOption === 'cod' ? '#9a3412' : '#374151',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Truck size={18} style={{ color: selectedPaymentOption === 'cod' ? '#ea580c' : '#6b7280' }} />
                  <span>Cash on Delivery</span>
                  <span style={{ fontSize: '0.64rem', color: '#6b7280', fontWeight: 600 }}>Pay cash upon delivery</span>
                </button>
              </div>

              {/* Conditional Payment Flow */}
              {selectedPaymentOption === 'razorpay' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Amount to be Paid Badge */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--primary-lime-light)',
                    border: '1px solid var(--primary-lime)',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '0.78rem', color: '#4b5563', fontWeight: 650 }}>{t('payment.amountToPay')}</span>
                    <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary-lime)' }}>
                      ₹{finalTotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Razorpay Banner Info */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '20px 14px',
                    borderRadius: '12px',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#ecfdf5',
                      color: '#059669'
                    }}>
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#111827', margin: '0 0 2px 0' }}>{t('payment.razorpay.title')}</h4>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, lineHeight: 1.4 }}>
                        {t('payment.razorpay.description')}
                      </p>
                    </div>
                  </div>
                </div>
              ) : selectedPaymentOption === 'cod' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Amount to be Paid Badge */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#fff7ed',
                    border: '1px solid #fed7aa',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '0.78rem', color: '#4b5563', fontWeight: 650 }}>{t('payment.amountToPay')}</span>
                    <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ea580c' }}>
                      ₹{finalTotal.toFixed(2)}
                    </span>
                    {activeCodFee > 0 && (
                      <span style={{ fontSize: '0.72rem', color: '#c2410c', fontWeight: 800, marginTop: '2px' }}>
                        (Includes ₹{activeCodFee.toFixed(2)} Cash on Delivery charge)
                      </span>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '20px 14px',
                    borderRadius: '12px',
                    backgroundColor: '#fafafa',
                    border: '1px solid #e5e7eb',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: '#fff7ed',
                      color: '#ea580c'
                    }}>
                      <Truck size={24} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#111827', margin: '0 0 4px 0' }}>Cash on Delivery (COD)</h4>
                      <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: 0, lineHeight: 1.45 }}>
                        Pay <strong>₹{finalTotal.toFixed(2)}</strong> in cash when your sacred package is delivered to your address.{activeCodFee > 0 ? ` Includes an extra ₹${activeCodFee.toFixed(2)} COD handling charge.` : ''} Payment status will be confirmed upon delivery.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Amount to be Paid Badge */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--primary-lime-light)',
                    border: '1px solid var(--primary-lime)',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '0.78rem', color: '#4b5563', fontWeight: 650 }}>{t('payment.amountToPay')}</span>
                    <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary-lime)' }}>
                      ₹{finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Secure strip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px', justifyContent: 'center' }}>
                <ShieldCheck size={14} style={{ color: '#10b981' }} />
                <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600 }}>{t('payment.sslSecure')}</span>
              </div>

              {/* Place Order CTA */}
              <button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                className="btn-lime"
                style={{ width: '100%', padding: '14px', marginTop: '16px', justifyContent: 'center', borderRadius: '8px', fontSize: '1rem', fontWeight: 900 }}
              >
                {isPlacingOrder
                  ? t('payment.processing')
                  : (selectedPaymentOption === 'razorpay'
                    ? t('payment.placeOrderOnline', { amount: finalTotal.toFixed(2) })
                    : (selectedPaymentOption === 'cod'
                      ? `Place Order via COD — ₹${finalTotal.toFixed(2)}`
                      : t('payment.placeOrderUpi', { amount: finalTotal.toFixed(2) })))}
              </button>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer powered-by badges */}
        <div style={{
          backgroundColor: '#f9fafb',
          borderTop: '1px solid #e5e7eb',
          padding: '12px 16px',
          textAlign: 'center'
        }}>
          {/* Secure checkout trust badges */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', flexWrap: 'wrap', opacity: 0.8, marginBottom: '6px' }}>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#4b5563' }}>{t('footer.pci')}</span>
            <span style={{ width: '1px', height: '10px', backgroundColor: '#d1d5db' }} />
            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#4b5563' }}>{t('footer.ssl')}</span>
          </div>

          <p style={{ fontSize: '0.64rem', color: '#9ca3af', margin: 0, lineHeight: 1.3 }}>
            {t('footer.agreement')}
          </p>
        </div>

      </div>

      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
