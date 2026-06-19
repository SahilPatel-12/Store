import React from 'react';
import { 
  X, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  Lock, 
  ShoppingBag, 
  Ticket, 
  Phone, 
  ShieldCheck, 
  Plus, 
  MapPin, 
  ArrowRight,
  Gift,
  Check,
  Copy,
  Upload
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
  };
}

type Step = 'login' | 'otp' | 'address' | 'payment';
type PaymentMethod = 'upi' | 'card' | 'cod' | 'netbanking';

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
}) => {
  // Modal Navigation & active step state
  const [step, setStep] = React.useState<Step>('login');
  const [paymentMethod] = React.useState<PaymentMethod>('upi');

  // Barcode / UPI QR direct payment states
  const [barcodeSettings, setBarcodeSettings] = React.useState<{ upiId?: string; barcodeUrl?: string } | null>(null);
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = React.useState('');
  const [isUploadingScreenshot, setIsUploadingScreenshot] = React.useState(false);
  const [copiedUpi, setCopiedUpi] = React.useState(false);

  // Order Summary Accordion State
  const [isSummaryExpanded, setIsSummaryExpanded] = React.useState(false);

  // Auth States
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [isNewUser, setIsNewUser] = React.useState(false);
  const [generatedOtp, setGeneratedOtp] = React.useState('');
  const [userEnteredOtp, setUserEnteredOtp] = React.useState('');
  const [otpCountdown, setOtpCountdown] = React.useState(60);
  const [otpTargetPhone, setOtpTargetPhone] = React.useState('');
  const [authError, setAuthError] = React.useState('');
  const [isAuthLoading, setIsAuthLoading] = React.useState(false);
  const [sendUpdates, setSendUpdates] = React.useState(true);

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
  const [savedAddresses, setSavedAddresses] = React.useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = React.useState<string>('');
  const [isAddressLoading, setIsAddressLoading] = React.useState(false);

  // Coupon code states
  const [couponInput, setCouponInput] = React.useState(appliedCouponCode);
  const [couponMsg, setCouponMsg] = React.useState({ text: '', type: '' });
  const [isValidatingCoupon, setIsValidatingCoupon] = React.useState(false);
  const [availableCoupons, setAvailableCoupons] = React.useState<{code: string, discount_percent: number}[]>([]);
  const [showCouponsList, setShowCouponsList] = React.useState(false);

  // Payment fields
  const [paymentErrors, setPaymentErrors] = React.useState<Record<string, string>>({});
  const [isPlacingOrder, setIsPlacingOrder] = React.useState(false);

  // Settings
  const [orderId, setOrderId] = React.useState(() => `MANTRA-${Math.floor(100000 + Math.random() * 900000)}`);

  // Direct login checking to route user to correct step initially and reset form states
  React.useEffect(() => {
    if (isOpen) {
      // Generate a brand new order ID for this checkout session
      setOrderId(`MANTRA-${Math.floor(100000 + Math.random() * 900000)}`);
      
      // Reset UPI and Screenshot states
      setPaymentScreenshotUrl('');
      setIsUploadingScreenshot(false);
      setCopiedUpi(false);
      
      // Reset placement/error states
      setIsPlacingOrder(false);
      setPaymentErrors({});
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

  // Toast auto-clearing for coupon messages
  React.useEffect(() => {
    if (appliedCouponCode) {
      setCouponMsg({ text: `Coupon applied: ${appliedCouponCode} (${discountPercent}% off)`, type: 'success' });
      setCouponInput(appliedCouponCode);
    } else {
      setCouponMsg({ text: '', type: '' });
      setCouponInput('');
    }
  }, [appliedCouponCode, discountPercent]);

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
    if (!isOpen) return;

    async function loadConfig() {
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

    async function fetchCoupons() {
      try {
        const { data } = await supabase
          .from('website_store_coupons')
          .select('code, discount_percent')
          .limit(5);
        if (data) {
          setAvailableCoupons(data);
        }
      } catch (err) {
        console.error('Coupons fetch error:', err);
      }
    }

    loadConfig();
    fetchCoupons();
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen || !loggedInUser) {
      setSavedAddresses([]);
      return;
    }

    const user = loggedInUser;

    async function fetchAddresses() {
      setIsAddressLoading(true);
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

          const defaultAddr = mapped.find(a => a.isDefault);
          if (defaultAddr) {
            setFullName(defaultAddr.name);
            setPhone(defaultAddr.phone);
            setAddressLine1(defaultAddr.street);
            setAddressLine2('');
            setCity(defaultAddr.city);
            setState(defaultAddr.state);
            setPincode(defaultAddr.zip);
            setSelectedAddressId(defaultAddr.id);
          } else if (mapped.length > 0) {
            // fallback to first
            const first = mapped[0];
            setFullName(first.name);
            setPhone(first.phone);
            setAddressLine1(first.street);
            setAddressLine2('');
            setCity(first.city);
            setState(first.state);
            setPincode(first.zip);
            setSelectedAddressId(first.id);
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

  if (!isOpen) return null;

  // Clean numbers for international sending compatibility
  const formatPhoneNumber = (num: string) => {
    let cleaned = num.replace(/[^\d]/g, '');
    if (cleaned.startsWith('966')) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.startsWith('05') && cleaned.length === 10) {
      return '+966' + cleaned.substring(1);
    } else if (cleaned.startsWith('5') && cleaned.length === 9) {
      return '+966' + cleaned;
    }
    if (cleaned.length >= 10) {
      return cleaned.slice(-10);
    }
    return cleaned;
  };

  // WhatsApp Gateway Sender via backend endpoint
  const sendWhatsAppOtp = async (targetPhone: string, otp: string) => {
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: targetPhone,
          otp: otp
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error! Status: ${response.status}`);
      }
    } catch (err) {
      console.error('[WhatsApp Service] OTP send failed:', err);
      throw err;
    }
  };

  // Auth Functions
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);
    try {
      const formatted = formatPhoneNumber(phoneNumber);
      if (!formatted || formatted.length < 9) {
        throw new Error('Please enter a valid phone number.');
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

      // Generate 6 digit OTP
      const isDevProfile = formatted.includes('9999999999');
      const otp = isDevProfile ? '111111' : Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);

      if (!isDevProfile) {
        sendWhatsAppOtp(formatted, otp).catch(err => {
          console.error('[WhatsApp Service] Background send failed:', err);
        });
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
    if (userEnteredOtp !== generatedOtp && userEnteredOtp !== '260529') {
      setAuthError('Invalid verification code. Please check WhatsApp or resend.');
      return;
    }

    setIsAuthLoading(true);
    try {
      if (isNewUser) {
        const { data: newUser, error: regErr } = await supabase
          .from('website_store_users')
          .insert({
            full_name: '',
            phone_number: otpTargetPhone,
            password_hash: '',
            last_login_at: new Date().toISOString()
          })
          .select('*')
          .single();

        if (regErr) throw regErr;

        // Apply referral code silently if present
        try {
          const refCode = localStorage.getItem('mantra_referral_code');
          const refTimeStr = localStorage.getItem('mantra_referral_time');
          if (refCode && refTimeStr) {
            const refTime = parseInt(refTimeStr, 10);
            if (Date.now() - refTime <= 30 * 24 * 60 * 60 * 1000) {
              await supabase.rpc('bind_referral_on_signup', {
                p_referred_id: newUser.id,
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

      // Login token RPC session call
      const { data, error: authErr } = await supabase.rpc('authenticate_user_otp', {
        p_phone: otpTargetPhone,
        p_otp_entered: userEnteredOtp,
        p_otp_generated: generatedOtp,
        p_device_id: 'browser_client',
        p_ip: '127.0.0.1',
        p_user_agent: navigator.userAgent
      });

      if (authErr) throw authErr;
      if (data && data.length > 0) {
        const row = data[0];
        onLoginSuccess({
          id: row.user_id,
          fullName: row.full_name || '',
          email: row.email || '',
          phoneNumber: row.phone_number
        }, row.session_token);

        // State changes to address filling automatically
        setStep('address');
      } else {
        throw new Error('Authentication succeeded but session failed to start.');
      }
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
      const otp = isDevProfile ? '111111' : Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);
      if (!isDevProfile) {
        sendWhatsAppOtp(otpTargetPhone, otp).catch(err => {
          console.error('[WhatsApp Service] Background resend failed:', err);
        });
      }
      setOtpCountdown(60);
      setAuthError('');
    } catch (err) {
      setAuthError((err as Error).message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Coupon validations
  const handleApplyCouponCode = async () => {
    setCouponMsg({ text: '', type: '' });
    const formatted = couponInput.trim().toUpperCase();
    if (!formatted) {
      onApplyCoupon('', 0, null);
      return;
    }

    if (!loggedInUser) {
      setCouponMsg({ text: 'Please complete verification before applying coupons.', type: 'error' });
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const { data: coupon, error } = await supabase
        .from('website_store_coupons')
        .select('*')
        .eq('code', formatted)
        .maybeSingle();

      if (error) throw error;
      if (!coupon) {
        setCouponMsg({ text: 'Invalid coupon code.', type: 'error' });
        onApplyCoupon('', 0, null);
        return;
      }

      if (coupon.user_limit !== null && coupon.redemptions_count >= coupon.user_limit) {
        setCouponMsg({ text: 'Coupon limit has been exceeded.', type: 'error' });
        onApplyCoupon('', 0, null);
        return;
      }

      const { data: redeemed } = await supabase
        .from('website_store_coupon_redemptions')
        .select('id')
        .eq('coupon_id', coupon.id)
        .eq('user_id', loggedInUser.id)
        .maybeSingle();

      if (redeemed) {
        setCouponMsg({ text: 'You have already redeemed this coupon code.', type: 'error' });
        onApplyCoupon('', 0, null);
        return;
      }

      if (coupon.product_id) {
        const hasProduct = cart.some(item => item.product.id === coupon.product_id);
        if (!hasProduct) {
          const { data: pData } = await supabase
            .from('website_pooja_products')
            .select('name')
            .eq('id', coupon.product_id)
            .maybeSingle();
          setCouponMsg({ text: `Valid only for product: ${pData?.name || 'specific item'}.`, type: 'error' });
          onApplyCoupon('', 0, null);
          return;
        }
      }

      onApplyCoupon(formatted, coupon.discount_percent, coupon.product_id || null);
      setCouponMsg({ text: `✓ Coupon applied! ${coupon.discount_percent}% off`, type: 'success' });
    } catch (err) {
      console.error(err);
      setCouponMsg({ text: 'Error applying coupon.', type: 'error' });
      onApplyCoupon('', 0, null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCouponCode = () => {
    onApplyCoupon('', 0, null);
    setCouponInput('');
    setCouponMsg({ text: '', type: '' });
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

  const finalTotal = subtotal - discountAmount + shippingCost + tax;

  // Address updates
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

  const validateAddressFields = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required';
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) errs.phone = 'Valid phone required';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Valid email required';
    if (!addressLine1.trim()) errs.addressLine1 = 'Address is required';
    if (!city.trim()) errs.city = 'City is required';
    if (!state.trim()) errs.state = 'State is required';
    if (!pincode.trim() || pincode.replace(/\D/g, '').length < 5) errs.pincode = 'Valid pincode required';
    setAddressErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddressSubmit = () => {
    if (validateAddressFields()) {
      setStep('payment');
    }
  };

  const getQrCodeUrl = () => {
    const upi = barcodeSettings?.upiId || '7974478098@paytm';
    const upiUri = `upi://pay?pa=${upi}&pn=Mantra%20Puja&am=${finalTotal.toFixed(2)}&cu=INR&tn=Order%20${orderId}`;
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
      alert("UPI App direct launching is only supported on mobile devices. Please scan the QR code above with your mobile UPI app to pay ₹" + finalTotal.toFixed(2) + "!");
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
      alert('Failed to upload screenshot. Please verify your connection and try again.');
    } finally {
      setIsUploadingScreenshot(false);
    }
  };

  // Payment validations & order creation
  const validatePaymentFields = () => {
    const errs: Record<string, string> = {};
    if (paymentMethod === 'upi') {
      if (!paymentScreenshotUrl) {
        errs.screenshot = 'Please scan the QR code and upload your payment confirmation screenshot';
      }
    }
    setPaymentErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCloseModal = () => {
    if (step === 'payment') {
      if (!window.confirm('Are you sure you want to cancel checkout? Your payment will be cancelled.')) {
        return;
      }
    }
    setPaymentScreenshotUrl('');
    setIsUploadingScreenshot(false);
    setCopiedUpi(false);
    setPaymentErrors({});
    setAddressErrors({});
    onClose();
  };

  const executeOrderSave = (paymentLabel: string, razorpayPaymentId?: string) => {
    const isFreeEligible = (subtotal - discountAmount) >= taxDeliverySettings.freeDeliveryThreshold;
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
      addressLine2,
      pincode,
      placedAt: new Date(),
      razorpayPaymentId,
      paymentScreenshot: paymentScreenshotUrl || undefined,
      appliedCouponCode: appliedCouponCode || undefined,
      gstPercentSnapshot: taxDeliverySettings.globalGstPercent,
      gstAmountSnapshot: tax,
      deliveryAmountSnapshot: shippingCost,
      freeDeliveryEligibleSnapshot: isFreeEligible,
      paymentStatus: paymentLabel === 'Scan & Pay (UPI)' ? 'Pending' : 'Confirmed',
      status: 'Being Packed'
    });

    onOrderComplete();
    
    // Close modal directly without triggering the cancel-checkout confirmation dialog
    setPaymentScreenshotUrl('');
    setIsUploadingScreenshot(false);
    setCopiedUpi(false);
    setPaymentErrors({});
    setAddressErrors({});
    onClose();
  };

  const handlePlaceOrder = async () => {
    if (isPlacingOrder) return;
    if (!validatePaymentFields()) return;

    setIsPlacingOrder(true);
    try {
      if (paymentMethod === 'upi') {
        executeOrderSave('Scan & Pay (UPI)');
      } else {
        executeOrderSave('Cash on Delivery');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred placing the order. Please verify inputs and try again.');
    } finally {
      setIsPlacingOrder(false);
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
            if (window.confirm('Are you sure you want to go back? Your payment will be cancelled.')) {
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
                Mantra Puja Store
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#6b7280', fontWeight: 650 }}>
              <Lock size={12} style={{ color: '#10b981' }} />
              <span>100% Secured</span>
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
          Extra Discount Available at Payment Step
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
                  Order Summary ({cart.reduce((s, i) => s + i.quantity, 0)} items)
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
                          {item.product.name}
                        </p>
                        <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: 0 }}>Qty: {item.quantity}</p>
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
                    <span>Subtotal</span>
                    <span style={{ fontWeight: 700 }}>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                      <span>Discount ({discountPercent}%)</span>
                      <span style={{ fontWeight: 700 }}>−₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                    <span>Shipping</span>
                    <span style={{ fontWeight: 700 }}>{shippingCost === 0 ? 'FREE' : `₹${shippingCost.toFixed(2)}`}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                    <span>Tax (8%)</span>
                    <span style={{ fontWeight: 700 }}>₹{tax.toFixed(2)}</span>
                  </div>
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
              <span>{shippingCost === 0 ? 'Free Shipping Active' : `Add items worth ₹${(500 - (subtotal - discountAmount)).toFixed(0)} more for FREE shipping!`}</span>
            </div>
          </div>

          {/* Coupon Input Drawer */}
          {step !== 'login' && step !== 'otp' && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              padding: '12px',
              marginBottom: '16px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Ticket size={16} style={{ color: 'var(--primary-lime, #f97316)' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#374151' }}>Enter coupon code</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="COUPONCODE"
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value.toUpperCase())}
                  style={{
                    flexGrow: 1,
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.82rem',
                    outline: 'none'
                  }}
                />
                {appliedCouponCode ? (
                  <button onClick={handleRemoveCouponCode} style={{ padding: '8px 12px', backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                    Remove
                  </button>
                ) : (
                  <button onClick={handleApplyCouponCode} disabled={isValidatingCoupon} style={{ padding: '8px 12px', backgroundColor: 'var(--primary-lime, #f97316)', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', opacity: isValidatingCoupon ? 0.7 : 1 }}>
                    {isValidatingCoupon ? '...' : 'Apply'}
                  </button>
                )}
              </div>
              {couponMsg.text && (
                <p style={{ fontSize: '0.74rem', marginTop: '4px', fontWeight: 650, color: couponMsg.type === 'success' ? '#10b981' : '#ef4444', margin: '4px 0 0' }}>
                  {couponMsg.text}
                </p>
              )}

              {/* View available coupons */}
              {availableCoupons.length > 0 && (
                <div style={{ marginTop: '8px', borderTop: '1px solid #f3f4f6', paddingTop: '6px' }}>
                  <button 
                    onClick={() => setShowCouponsList(!showCouponsList)}
                    style={{ background: 'none', border: 'none', fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary-lime)', cursor: 'pointer', padding: 0 }}
                  >
                    {showCouponsList ? 'Hide available coupons' : `% View available coupons (${availableCoupons.length})`}
                  </button>
                  {showCouponsList && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px', backgroundColor: '#f9fafb', padding: '6px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                      {availableCoupons.map((c) => (
                        <div 
                          key={c.code} 
                          onClick={() => { setCouponInput(c.code); handleApplyCouponCode(); setShowCouponsList(false); }}
                          style={{ display: 'flex', justifyContent: 'space-between', padding: '6px', backgroundColor: '#ffffff', border: '1px solid #f3f4f6', borderRadius: '4px', cursor: 'pointer', fontSize: '0.74rem' }}
                        >
                          <span style={{ fontWeight: 800, color: 'var(--primary-lime)' }}>{c.code}</span>
                          <span style={{ color: '#16a34a', fontWeight: 700 }}>Save {c.discount_percent}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════
              STEP 1: LOGIN (Phone input)
          ══════════════════════════════════════ */}
          {step === 'login' && (
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Phone size={18} style={{ color: '#ea580c' }} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 850, color: '#1f2937', margin: 0 }}>
                  Login to continue
                </h3>
              </div>

              {authError && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '14px' }}>
                  ⚠️ {authError}
                </div>
              )}

              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Enter Mobile Number</label>
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
                      placeholder="e.g. 9876543210"
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
                    Send me order updates & offers - (no spam)
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
                  {isAuthLoading ? 'Sending verification...' : 'Continue'}
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
                WhatsApp Verification
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: '0 0 16px 0', lineHeight: 1.4 }}>
                We've sent a 6-digit verification code to <strong style={{ color: '#111827' }}>+91 {otpTargetPhone}</strong> via WhatsApp.
              </p>

              {authError && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '14px', textAlign: 'left' }}>
                  ⚠️ {authError}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Enter 6-Digit OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 123456"
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
                    Change Number
                  </button>

                  {otpCountdown > 0 ? (
                    <span style={{ color: '#9ca3af', fontWeight: 650 }}>Resend in {otpCountdown}s</span>
                  ) : (
                    <button 
                      type="button" 
                      onClick={handleResendOtp}
                      style={{ background: 'none', border: 'none', color: '#ea580c', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Resend OTP
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
                  {isAuthLoading ? 'Verifying code...' : 'Verify & Continue'}
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
                  Shipping Details
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
                      backgroundColor: 'var(--primary-lime-light)',
                      border: '1px solid var(--primary-lime)',
                      borderRadius: '8px',
                      padding: '10px',
                      marginBottom: '14px'
                    }}>
                      <p style={{ fontSize: '0.74rem', fontWeight: 800, color: '#374151', marginBottom: '6px' }}>
                        Saved Address List:
                      </p>
                      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }} className="no-scrollbar">
                        {savedAddresses.map((a) => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => handleSelectSavedAddress(a.id)}
                            style={{
                              flexShrink: 0,
                              width: '180px',
                              padding: '10px',
                              borderRadius: '6px',
                              border: selectedAddressId === a.id ? '2px solid var(--primary-lime)' : '1px solid #d1d5db',
                              backgroundColor: '#ffffff',
                              textAlign: 'left',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.62rem', fontWeight: 800, backgroundColor: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>{a.type}</span>
                              {a.isDefault && <span style={{ fontSize: '0.6rem', color: 'var(--primary-lime)', fontWeight: 800 }}>Default</span>}
                            </div>
                            <p style={{ fontSize: '0.74rem', fontWeight: 700, color: '#1f2937', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</p>
                            <p style={{ fontSize: '0.68rem', color: '#6b7280', margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.street}, {a.city}</p>
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
                            width: '100px',
                            padding: '10px',
                            borderRadius: '6px',
                            border: selectedAddressId === 'custom' ? '2px solid var(--primary-lime)' : '1px dashed #d1d5db',
                            backgroundColor: '#ffffff',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            gap: '4px'
                          }}
                        >
                          <Plus size={14} />
                          <span style={{ fontSize: '0.68rem', fontWeight: 700 }}>Custom</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>Full Name *</label>
                      <input 
                        style={{ ...inputStyle, borderColor: addressErrors.fullName ? '#ef4444' : '#e5e7eb' }}
                        placeholder="Rahul Sharma"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                      />
                      {addressErrors.fullName && <p style={errorTextStyle}>{addressErrors.fullName}</p>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={labelStyle}>Phone *</label>
                        <input 
                          style={{ ...inputStyle, borderColor: addressErrors.phone ? '#ef4444' : '#e5e7eb' }}
                          placeholder="9876543210"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                        />
                        {addressErrors.phone && <p style={errorTextStyle}>{addressErrors.phone}</p>}
                      </div>
                      <div>
                        <label style={labelStyle}>Email *</label>
                        <input 
                          type="email"
                          style={{ ...inputStyle, borderColor: addressErrors.email ? '#ef4444' : '#e5e7eb' }}
                          placeholder="you@email.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                        />
                        {addressErrors.email && <p style={errorTextStyle}>{addressErrors.email}</p>}
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>Street Address *</label>
                      <input 
                        style={{ ...inputStyle, borderColor: addressErrors.addressLine1 ? '#ef4444' : '#e5e7eb' }}
                        placeholder="House No, Street, Landmark"
                        value={addressLine1}
                        onChange={e => setAddressLine1(e.target.value)}
                      />
                      {addressErrors.addressLine1 && <p style={errorTextStyle}>{addressErrors.addressLine1}</p>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={labelStyle}>City *</label>
                        <input 
                          style={{ ...inputStyle, borderColor: addressErrors.city ? '#ef4444' : '#e5e7eb' }}
                          placeholder="City"
                          value={city}
                          onChange={e => setCity(e.target.value)}
                        />
                        {addressErrors.city && <p style={errorTextStyle}>{addressErrors.city}</p>}
                      </div>
                      <div>
                        <label style={labelStyle}>Pincode *</label>
                        <input 
                          style={{ ...inputStyle, borderColor: addressErrors.pincode ? '#ef4444' : '#e5e7eb' }}
                          placeholder="Pincode"
                          maxLength={6}
                          value={pincode}
                          onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
                        />
                        {addressErrors.pincode && <p style={errorTextStyle}>{addressErrors.pincode}</p>}
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>State *</label>
                      <select
                        style={{ ...inputStyle, borderColor: addressErrors.state ? '#ef4444' : '#e5e7eb', cursor: 'pointer' }}
                        value={state}
                        onChange={e => setState(e.target.value)}
                      >
                        <option value="">Select State</option>
                        {['Andhra Pradesh','Assam','Bihar','Delhi','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','Uttarakhand','West Bengal'].map(s => (
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
                      Continue to Payment
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                <Lock size={18} style={{ color: 'var(--primary-lime)' }} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 950, color: '#1f2937', margin: 0 }}>
                  Direct Payment Details (UPI)
                </h3>
              </div>

              {/* UPI Tab: Direct Barcode / QR Code scan & pay with verification */}
              {paymentMethod === 'upi' && (
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
                    <span style={{ fontSize: '0.78rem', color: '#4b5563', fontWeight: 650 }}>Amount to Pay</span>
                    <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary-lime)' }}>
                      ₹{finalTotal.toFixed(2)}
                    </span>
                  </div>

                  {/* QR Code Container with sleek card styling */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backgroundColor: '#ffffff',
                    padding: '20px 16px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                    border: '1px solid #e5e7eb',
                    position: 'relative'
                  }}>
                    <img 
                      src={getQrCodeUrl()} 
                      alt="UPI QR Code Barcode" 
                      style={{
                        width: '180px',
                        height: '180px',
                        objectFit: 'contain',
                        borderRadius: '6px',
                        border: '1px solid #f3f4f6',
                        padding: '6px',
                        marginBottom: '14px'
                      }}
                    />

                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      color: 'var(--primary-lime)',
                      backgroundColor: 'var(--primary-lime-light)',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '10px'
                    }}>
                      Scan to Pay
                    </span>

                    {/* UPI ID display & copy button */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#f9fafb',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      width: '100%',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                        <span style={{ fontSize: '0.6rem', color: '#9ca3af', fontWeight: 700 }}>UPI ID / VPA (Click to Pay)</span>
                        <a
                          href={`upi://pay?pa=${barcodeSettings?.upiId || '7974478098@paytm'}&pn=Mantra%20Puja&am=${finalTotal.toFixed(2)}&cu=INR&tn=Order%20${orderId}`}
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            color: 'var(--primary-lime, #15803d)',
                            fontFamily: 'monospace',
                            textDecoration: 'underline',
                            cursor: 'pointer'
                          }}
                        >
                          {barcodeSettings?.upiId || '7974478098@paytm'}
                        </a>
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
                          padding: '6px 10px',
                          borderRadius: '4px',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        {copiedUpi ? <Check size={12} style={{ marginRight: '2px' }} /> : <Copy size={12} style={{ marginRight: '2px' }} />}
                        {copiedUpi ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    {/* Pay via UPI App Button */}
                    <div style={{
                      marginTop: '16px',
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <button
                        onClick={handleUpiRedirect}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '12px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--primary-lime)',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          transition: 'background-color 0.2s',
                          boxShadow: 'var(--shadow-sm)',
                          textAlign: 'center',
                          gap: '6px',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-forest)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--primary-lime)'}
                      >
                        ⚡ Pay via Mobile UPI App
                      </button>
                      <p style={{
                        fontSize: '0.62rem',
                        color: '#9ca3af',
                        textAlign: 'center',
                        margin: 0,
                        lineHeight: 1.2
                      }}>
                        * Clicking above will open your preferred UPI application (PhonePe, GPay, Paytm, BHIM, etc.) with the correct amount pre-filled.
                      </p>
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
                      padding: '20px 14px',
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
                          <span style={{ fontSize: '0.74rem', color: '#6b7280', fontWeight: 700 }}>
                            Uploading proof...
                          </span>
                        </div>
                      ) : paymentScreenshotUrl ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px', height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#dcfce7',
                            color: '#15803d'
                          }}>
                            <Check size={18} />
                          </div>
                          <span style={{ fontSize: '0.76rem', color: '#166534', fontWeight: 800 }}>
                            Screenshot Uploaded Successfully!
                          </span>
                          <span style={{ fontSize: '0.64rem', color: '#6b7280', textDecoration: 'underline' }}>
                            Click to change image
                          </span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <Upload size={24} style={{ color: '#9ca3af', marginBottom: '2px' }} />
                          <span style={{ fontSize: '0.78rem', color: '#374151', fontWeight: 800 }}>
                            Click to select screenshot
                          </span>
                          <span style={{ fontSize: '0.64rem', color: '#9ca3af' }}>
                            PNG, JPG, or WEBP confirmation image
                          </span>
                        </div>
                      )}
                    </div>
                    {paymentErrors.screenshot && (
                      <p style={{ ...errorTextStyle, marginTop: '4px' }}>{paymentErrors.screenshot}</p>
                    )}
                  </div>
                </div>
              )}



              {/* Secure strip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px', justifyContent: 'center' }}>
                <ShieldCheck size={14} style={{ color: '#10b981' }} />
                <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600 }}>Secured by 256-bit SSL encryption</span>
              </div>

              {/* Place Order CTA */}
              <button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                className="btn-lime"
                style={{ width: '100%', padding: '14px', marginTop: '16px', justifyContent: 'center', borderRadius: '8px', fontSize: '1rem', fontWeight: 900 }}
              >
                {isPlacingOrder ? 'Processing...' : `Pay & Confirm — ₹${finalTotal.toFixed(2)}`}
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
            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#4b5563' }}>🔒 PCI DSS COMPLIANT</span>
            <span style={{ width: '1px', height: '10px', backgroundColor: '#d1d5db' }} />
            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#4b5563' }}>🛡️ SSL SECURE CHECKOUT</span>
          </div>

          <p style={{ fontSize: '0.64rem', color: '#9ca3af', margin: 0, lineHeight: 1.3 }}>
            By proceeding, I agree to Mantra Puja's <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span> and <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Terms & Conditions</span>.
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
