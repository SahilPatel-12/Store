import React from 'react';
import {
  User,
  MapPin,
  Package,
  Heart,
  Bell,
  LogOut,
  Edit2,
  Plus,
  Trash2,
  Check,
  ShoppingBag,
  Save,
  CheckCircle,
  Truck,
  Sparkles,
  Copy,
  Wallet,
  RefreshCw,
  Share2,
  MessageCircle,
  Upload,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import type { Product, LocalOrder } from '../types';
import { isImageUrl, getDisplayImageUrl } from '../lib/imageHelper';
import { supabase } from '../lib/supabase';
import { createReferralShareCard, uploadReferralShareCard } from '../lib/shareHelper';
import { uploadToR2 } from '../lib/cloudflare/r2';

const FacebookIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const TwitterIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const LinkedinIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const InstagramIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);



interface UserProfilePageProps {
  orders: LocalOrder[];
  setOrders?: React.Dispatch<React.SetStateAction<LocalOrder[]>>;
  wishlist: Record<string, boolean>;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onNavigateToShop: () => void;
  onNavigateToHome: () => void;
  onNavigateToOrders: () => void;
  products?: Product[];
  loggedInUser?: { id: string; fullName: string; email: string; phoneNumber: string } | null;
  onLogout?: () => void;
  initialTab?: 'info' | 'orders' | 'addresses' | 'wishlist' | 'notifications' | 'logout' | 'affiliate';
  onProfileUpdate?: (updatedUser: { id: string; fullName: string; email: string; phoneNumber: string }) => void;
}

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

export const UserProfilePage: React.FC<UserProfilePageProps> = ({
  orders,
  setOrders,
  wishlist,
  onToggleWishlist,
  onAddToCart,
  onNavigateToShop,
  onNavigateToHome,
  onNavigateToOrders,
  products: productsProp,
  loggedInUser,
  onLogout,
  initialTab,
  onProfileUpdate,
}) => {
  const [activeTab, setActiveTab] = React.useState<
    'info' | 'orders' | 'addresses' | 'wishlist' | 'notifications' | 'logout' | 'affiliate'
  >(initialTab || 'info');

  const [isMobile, setIsMobile] = React.useState(typeof window !== 'undefined' ? window.innerWidth <= 900 : false);
  const [mobileShowMenu, setMobileShowMenu] = React.useState(!initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      setMobileShowMenu(false);
    }
  }, [initialTab]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      const mobile = window.innerWidth <= 900;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileShowMenu(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Affiliate State
  const [affiliateProfile, setAffiliateProfile] = React.useState<{
    affiliate_code: string;
    affiliate_status: string;
    joined_at: string;
    total_earned: number;
    pending_earnings: number;
    approved_earnings: number;
    available_balance: number;
  } | null>(null);
  const [, setAffiliateLoading] = React.useState(false);
  const [enrollmentStep, setEnrollmentStep] = React.useState<'none' | 'terms' | 'success'>('none');
  const [termsChecked, setTermsChecked] = React.useState(false);
  const [joiningProgram, setJoiningProgram] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);

  const [referralTree, setReferralTree] = React.useState<{
    user_id: string;
    full_name: string;
    referred_by: string;
    level: number;
    joined_at: string;
  }[]>([]);
  const [treeLoading, setTreeLoading] = React.useState(false);

  // Additional user-facing affiliate states
  const [commissions, setCommissions] = React.useState<any[]>([]);
  const [isLoadingCommissions, setIsLoadingCommissions] = React.useState(false);
  const [payoutHistory, setPayoutHistory] = React.useState<any[]>([]);
  const [isLoadingPayoutHistory, setIsLoadingPayoutHistory] = React.useState(false);
  const [isSubmittingPayout, setIsSubmittingPayout] = React.useState(false);
  const [payoutMethod, setPayoutMethod] = React.useState<'upi' | 'bank'>('upi');

  // Payment Verification States for Profile Orders History
  const [localScreenshots, setLocalScreenshots] = React.useState<Record<string, string>>({});
  const [barcodeSettings, setBarcodeSettings] = React.useState<{ upiId?: string; barcodeUrl?: string } | null>(null);
  const [uploadingOrderId, setUploadingOrderId] = React.useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = React.useState<Record<string, string>>({});
  const [copiedUpiOrderId, setCopiedUpiOrderId] = React.useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = React.useState<Record<string, File>>({});

  React.useEffect(() => {
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
    loadConfig();
  }, []);

  const handleOrderScreenshotUpload = async (orderId: string, file: File) => {
    if (!file) return;
    setUploadingOrderId(orderId);
    setUploadErrors(prev => ({ ...prev, [orderId]: '' }));
    try {
      const url = await uploadToR2(file, 'orders/proofs');
      
      const { error } = await supabase
        .from('website_store_orders')
        .update({ 
          payment_screenshot: url,
          payment_status: 'Pending'
        })
        .eq('order_id', orderId);
      
      if (error) throw error;
      
      setLocalScreenshots(prev => ({ ...prev, [orderId]: url }));
      if (setOrders) {
        setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, paymentScreenshot: url, paymentStatus: 'Pending' } : o));
      }

      // Clear selected file
      setSelectedFiles(prev => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    } catch (err) {
      console.error('Failed to upload proof of payment:', err);
      setUploadErrors(prev => ({ ...prev, [orderId]: 'Failed to upload screenshot. Please verify connection and try again.' }));
    } finally {
      setUploadingOrderId(null);
    }
  };

  const handleCopyOrderUpi = (orderId: string, upi: string) => {
    try {
      navigator.clipboard.writeText(upi);
      setCopiedUpiOrderId(orderId);
      setTimeout(() => setCopiedUpiOrderId(null), 2000);
    } catch (err) {
      console.error('Failed to copy UPI ID:', err);
    }
  };

  const handleUpiRedirect = (orderId: string, amount: number) => {
    const upi = barcodeSettings?.upiId || '7974478098@paytm';
    const uri = `upi://pay?pa=${upi}&pn=Mantra%20Puja&am=${amount.toFixed(2)}&cu=INR&tn=Order%20${orderId}`;

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = uri;
    } else {
      alert("UPI App direct launching is only supported on mobile devices. Please scan the QR code to pay ₹" + amount.toFixed(2) + "!");
    }
  };

  const [upiId, setUpiId] = React.useState('');
  const [upiHolderName, setUpiHolderName] = React.useState('');
  const [bankHolderName, setBankHolderName] = React.useState('');
  const [bankAccountNumber, setBankAccountNumber] = React.useState('');
  const [bankIfsc, setBankIfsc] = React.useState('');
  const [bankName, setBankName] = React.useState('');
  const [referralSearch, setReferralSearch] = React.useState('');

  // Sharing & Toast states
  const shareMessage = '🙏 Join me on Mantra Puja and explore divine offerings! Bring peace, health & prosperity home. Access authentic Pujas, Yagnas and spiritual items here:';
  const [showInstagramTip, setShowInstagramTip] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState('');
  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };
  const [devoteeSubTab, setDevoteeSubTab] = React.useState<'network' | 'earnings' | 'payout'>('network');
  const [minWithdrawalLimit, setMinWithdrawalLimit] = React.useState<number>(1000);
  const [activeLevels, setActiveLevels] = React.useState<number[]>([1, 2, 3]);

  const fetchAffiliateProfile = React.useCallback(async () => {
    if (!loggedInUser) return;
    const token = localStorage.getItem('session_token') || '260529';
    setAffiliateLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_affiliate_profile', {
        p_session_token: token
      });
      if (error) {
        console.warn('Failed to retrieve affiliate profile:', error.message);
      }
      if (data && data.length > 0 && data[0].affiliate_code) {
        setAffiliateProfile(data[0]);
      } else {
        setAffiliateProfile(null);
      }
    } catch (err) {
      console.error('Error in fetchAffiliateProfile:', err);
    } finally {
      setAffiliateLoading(false);
    }
  }, [loggedInUser]);

  const fetchAffiliateSettings = React.useCallback(async () => {
    try {
      // Fetch minimum withdrawal limit
      const { data: settingsData } = await supabase
        .from('affiliate_settings')
        .select('value')
        .eq('key', 'payout_rules')
        .single();
      
      if (settingsData && settingsData.value) {
        const rules = settingsData.value as Record<string, any>;
        if (rules.min_withdrawal_amount !== undefined) {
          setMinWithdrawalLimit(parseFloat(rules.min_withdrawal_amount));
        }
      }

      // Fetch active levels
      const { data: levelsData } = await supabase
        .from('affiliate_levels')
        .select('level_number')
        .eq('enabled', true)
        .order('level_number', { ascending: true });
      
      if (levelsData) {
        setActiveLevels(levelsData.map(l => l.level_number));
      }
    } catch (err) {
      console.error('Error fetching affiliate settings:', err);
    }
  }, []);

  const fetchReferralTree = React.useCallback(async () => {
    if (!loggedInUser) return;
    const token = localStorage.getItem('session_token') || '260529';
    setTreeLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_referral_tree_by_session', {
        p_session_token: token,
        p_max_depth: 5
      });
      if (error) {
        console.warn('Failed to retrieve referral tree:', error.message);
      }
      if (data) {
        setReferralTree(data);
      }
    } catch (err) {
      console.error('Error in fetchReferralTree:', err);
    } finally {
      setTreeLoading(false);
    }
  }, [loggedInUser]);

  const getShareOrigin = () => {
    const origin = window.location.origin;
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return 'https://mantrapuja.com';
    }
    return origin;
  };

  const handleNativeShare = async () => {
    if (!affiliateProfile?.affiliate_code) return;
    const code = affiliateProfile.affiliate_code;
    const shareOrigin = getShareOrigin();
    const referralUrl = `${shareOrigin}?ref=${code}`;
    
    triggerToast('Generating blessings card...');
    try {
      const cardBlob = await createReferralShareCard(referralUrl);
      const cardFile = new File([cardBlob], `MantraPuja-Blessings-Card.png`, { type: 'image/png' });
      const filesArray = [cardFile];
      
      const cardUrl = await uploadReferralShareCard(referralUrl, code);
      const shareUrl = `${shareOrigin}/share?ref=${code}&card=${encodeURIComponent(cardUrl)}`;
      const fullMessage = `${shareMessage}\n${shareUrl}`;
      
      if (navigator.canShare && navigator.canShare({ files: filesArray })) {
        await navigator.share({
          title: 'Mantra Puja Referral',
          text: fullMessage,
          url: shareUrl,
          files: filesArray
        });
        triggerToast('Blessings shared successfully!');
      } else if (navigator.share) {
        await navigator.share({
          title: 'Mantra Puja Referral',
          text: fullMessage,
          url: shareUrl
        });
        triggerToast('Shared link & message successfully!');
      } else {
        throw new Error('Native share not supported.');
      }
    } catch (err) {
      console.error('Web Share API error:', err);
      try {
        const cardBlob = await createReferralShareCard(referralUrl);
        const cardUrl = await uploadReferralShareCard(referralUrl, code);
        const shareUrl = `${shareOrigin}/share?ref=${code}&card=${encodeURIComponent(cardUrl)}`;
        const fullMessage = `${shareMessage}\n${shareUrl}`;
        
        try {
          const item = new ClipboardItem({ 'image/png': cardBlob });
          await navigator.clipboard.write([item]);
          triggerToast('Blessings card image copied to clipboard! Paste it to share.');
        } catch {
          await navigator.clipboard.writeText(fullMessage);
          triggerToast('Message & link copied to clipboard!');
        }
      } catch (innerErr) {
        const fallbackUrl = `${shareOrigin}?ref=${code}`;
        const fullMessage = `${shareMessage}\n${fallbackUrl}`;
        await navigator.clipboard.writeText(fullMessage);
        triggerToast('Link copied to clipboard!');
      }
    }
  };

  const handleWhatsappShare = async () => {
    if (!affiliateProfile?.affiliate_code) return;
    const code = affiliateProfile.affiliate_code;
    const shareOrigin = getShareOrigin();
    const referralUrl = `${shareOrigin}?ref=${code}`;
    
    triggerToast('Preparing blessings card...');
    try {
      const cardBlob = await createReferralShareCard(referralUrl);
      const cardUrl = await uploadReferralShareCard(referralUrl, code);
      const shareUrl = `${shareOrigin}/share?ref=${code}&card=${encodeURIComponent(cardUrl)}`;
      const fullMessage = `${shareMessage}\n${shareUrl}`;
      
      try {
        const item = new ClipboardItem({ 'image/png': cardBlob });
        await navigator.clipboard.write([item]);
        triggerToast('Blessings image copied! Open WhatsApp & Paste.');
      } catch {
        await navigator.clipboard.writeText(fullMessage);
        triggerToast('Referral link copied!');
      }
      
      setTimeout(() => {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(fullMessage)}`, '_blank');
      }, 1200);
    } catch (err) {
      console.error('Failed to generate referral card image:', err);
      const fallbackUrl = `${shareOrigin}?ref=${code}`;
      const fullMessage = `${shareMessage}\n${fallbackUrl}`;
      await navigator.clipboard.writeText(fullMessage);
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(fullMessage)}`, '_blank');
    }
  };

  const handleFacebookShare = async () => {
    if (!affiliateProfile?.affiliate_code) return;
    const code = affiliateProfile.affiliate_code;
    const shareOrigin = getShareOrigin();
    const referralUrl = `${shareOrigin}?ref=${code}`;
    
    triggerToast('Preparing Facebook sharing...');
    try {
      const cardBlob = await createReferralShareCard(referralUrl);
      const cardUrl = await uploadReferralShareCard(referralUrl, code);
      const shareUrl = `${shareOrigin}/share?ref=${code}&card=${encodeURIComponent(cardUrl)}`;
      const fullMessage = `${shareMessage}\n${shareUrl}`;
      
      try {
        const item = new ClipboardItem({ 'image/png': cardBlob });
        await navigator.clipboard.write([item]);
        triggerToast('Blessings image copied! Open Facebook & Paste.');
      } catch {
        await navigator.clipboard.writeText(fullMessage);
      }
      
      setTimeout(() => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
      }, 1200);
    } catch (err) {
      console.error(err);
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`, '_blank');
    }
  };

  const handleTwitterShare = async () => {
    if (!affiliateProfile?.affiliate_code) return;
    const code = affiliateProfile.affiliate_code;
    const shareOrigin = getShareOrigin();
    const referralUrl = `${shareOrigin}?ref=${code}`;
    
    triggerToast('Preparing Twitter sharing...');
    try {
      const cardBlob = await createReferralShareCard(referralUrl);
      const cardUrl = await uploadReferralShareCard(referralUrl, code);
      const shareUrl = `${shareOrigin}/share?ref=${code}&card=${encodeURIComponent(cardUrl)}`;
      const fullMessage = `${shareMessage}\n${shareUrl}`;
      
      try {
        const item = new ClipboardItem({ 'image/png': cardBlob });
        await navigator.clipboard.write([item]);
        triggerToast('Blessings image copied! Open Twitter & Paste.');
      } catch {
        await navigator.clipboard.writeText(fullMessage);
      }
      
      setTimeout(() => {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(fullMessage)}`, '_blank');
      }, 1200);
    } catch (err) {
      console.error(err);
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(referralUrl)}`, '_blank');
    }
  };

  const handleLinkedinShare = async () => {
    if (!affiliateProfile?.affiliate_code) return;
    const code = affiliateProfile.affiliate_code;
    const shareOrigin = getShareOrigin();
    const referralUrl = `${shareOrigin}?ref=${code}`;
    
    triggerToast('Preparing LinkedIn sharing...');
    try {
      const cardBlob = await createReferralShareCard(referralUrl);
      const cardUrl = await uploadReferralShareCard(referralUrl, code);
      const shareUrl = `${shareOrigin}/share?ref=${code}&card=${encodeURIComponent(cardUrl)}`;
      const fullMessage = `${shareMessage}\n${shareUrl}`;
      
      try {
        const item = new ClipboardItem({ 'image/png': cardBlob });
        await navigator.clipboard.write([item]);
        triggerToast('Blessings image copied! Open LinkedIn & Paste.');
      } catch {
        await navigator.clipboard.writeText(fullMessage);
      }
      
      setTimeout(() => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
      }, 1200);
    } catch (err) {
      console.error(err);
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`, '_blank');
    }
  };

  const handleInstagramShare = async () => {
    if (!affiliateProfile?.affiliate_code) return;
    const code = affiliateProfile.affiliate_code;
    const shareOrigin = getShareOrigin();
    const referralUrl = `${shareOrigin}?ref=${code}`;
    
    triggerToast('Referral link copied! Generating card...');
    try {
      const cardBlob = await createReferralShareCard(referralUrl);
      const cardUrl = await uploadReferralShareCard(referralUrl, code);
      const shareUrl = `${shareOrigin}/share?ref=${code}&card=${encodeURIComponent(cardUrl)}`;
      const fullMessage = `${shareMessage}\n${shareUrl}`;
      
      try {
        const item = new ClipboardItem({ 'image/png': cardBlob });
        await navigator.clipboard.write([item]);
        triggerToast('Blessings image copied! Story tutorial opening...');
      } catch {
        await navigator.clipboard.writeText(fullMessage);
      }
    } catch (e) {
      console.error('Error sharing blessings card:', e);
      await navigator.clipboard.writeText(referralUrl);
    }
    setShowInstagramTip(true);
  };

  const fetchCommissionsHistory = React.useCallback(async () => {
    if (!loggedInUser) return;
    const token = localStorage.getItem('session_token') || '260529';
    setIsLoadingCommissions(true);
    try {
      const { data, error } = await supabase.rpc('get_commissions_history_by_session', {
        p_session_token: token
      });
      if (error) {
        console.warn('Failed to retrieve commissions history:', error.message);
      }
      if (data) {
        setCommissions(data);
      }
    } catch (err) {
      console.error('Error in fetchCommissionsHistory:', err);
    } finally {
      setIsLoadingCommissions(false);
    }
  }, [loggedInUser]);

  const fetchPayoutHistory = React.useCallback(async () => {
    if (!loggedInUser) return;
    const token = localStorage.getItem('session_token') || '260529';
    setIsLoadingPayoutHistory(true);
    try {
      const { data, error } = await supabase.rpc('get_withdrawal_history_by_session', {
        p_session_token: token
      });
      if (error) {
        console.warn('Failed to retrieve payout history:', error.message);
      }
      if (data) {
        setPayoutHistory(data);
      }
    } catch (err) {
      console.error('Error in fetchPayoutHistory:', err);
    } finally {
      setIsLoadingPayoutHistory(false);
    }
  }, [loggedInUser]);

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser || !affiliateProfile) return;
    
    const token = localStorage.getItem('session_token') || '260529';

    if (affiliateProfile.affiliate_status === 'suspended') {
      alert('Your affiliate account has been suspended. Please contact support for assistance.');
      return;
    }
    
    if (affiliateProfile.available_balance < minWithdrawalLimit) {
      alert(`Your available balance is below the minimum withdrawal threshold of ₹${minWithdrawalLimit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`);
      return;
    }

    let details: Record<string, string> = {};
    if (payoutMethod === 'upi') {
      if (!upiId.trim() || !upiId.includes('@')) {
        alert('Please enter a valid UPI ID (e.g. name@upi).');
        return;
      }
      if (!upiHolderName.trim()) {
        alert('Please enter account holder name.');
        return;
      }
      details = {
        upi_id: upiId.trim(),
        account_holder_name: upiHolderName.trim()
      };
    } else {
      if (!bankHolderName.trim() || !bankAccountNumber.trim() || !bankIfsc.trim() || !bankName.trim()) {
        alert('Please fill out all bank transfer fields.');
        return;
      }
      if (bankAccountNumber.trim().length < 9 || bankAccountNumber.trim().length > 18) {
        alert('Bank account number should be between 9 and 18 digits.');
        return;
      }
      if (bankIfsc.trim().length !== 11) {
        alert('IFSC Code must be exactly 11 characters.');
        return;
      }
      details = {
        account_name: bankHolderName.trim(),
        account_number: bankAccountNumber.trim(),
        ifsc_code: bankIfsc.trim().toUpperCase(),
        bank_name: bankName.trim()
      };
    }

    const confirmMsg = `Are you sure you want to request a payout of ₹${affiliateProfile.available_balance.toFixed(2)}? This amount will be locked until processing is complete.`;
    if (!confirm(confirmMsg)) return;

    setIsSubmittingPayout(true);
    try {
      const { data, error } = await supabase.rpc('create_withdrawal_request', {
        p_session_token: token,
        p_amount: affiliateProfile.available_balance,
        p_method: payoutMethod,
        p_details: details
      });
      if (error) throw error;
      if (data) {
        alert('Payout request submitted successfully! Funds have been reserved for admin review.');
        setUpiId('');
        setUpiHolderName('');
        setBankHolderName('');
        setBankAccountNumber('');
        setBankIfsc('');
        setBankName('');
        
        await fetchAffiliateProfile();
        await fetchPayoutHistory();
      }
    } catch (err) {
      console.error('Failed to submit payout request:', err);
      alert('Error: ' + (err as Error).message);
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'affiliate') {
      fetchAffiliateProfile();
      fetchReferralTree();
      fetchCommissionsHistory();
      fetchPayoutHistory();
      fetchAffiliateSettings();
    }
  }, [loggedInUser, activeTab, fetchAffiliateProfile, fetchReferralTree, fetchCommissionsHistory, fetchPayoutHistory, fetchAffiliateSettings]);

  const filteredReferralTree = React.useMemo(() => {
    return referralTree.filter(n => activeLevels.includes(n.level));
  }, [referralTree, activeLevels]);



  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const lowerQuery = query.toLowerCase();
    const index = text.toLowerCase().indexOf(lowerQuery);
    if (index === -1) return text;

    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);

    return (
      <span>
        {before}
        <mark style={{ backgroundColor: '#fef08a', color: '#854d0e', padding: '1px 2px', borderRadius: '2px' }}>{match}</mark>
        {after}
      </span>
    );
  };


  const handleJoinAffiliate = async () => {
    if (!loggedInUser) {
      alert('Please log in to participate in the program.');
      return;
    }
    const token = localStorage.getItem('session_token') || '260529';
    setJoiningProgram(true);
    try {
      const { data, error } = await supabase.rpc('join_affiliate_program', {
        p_session_token: token
      });
      if (error) throw error;
      if (data && data.length > 0) {
        const profile = data[0];
        setAffiliateProfile({
          affiliate_code: profile.affiliate_code,
          affiliate_status: profile.affiliate_status,
          joined_at: profile.affiliate_joined_at,
          total_earned: 0.00,
          pending_earnings: 0.00,
          approved_earnings: 0.00,
          available_balance: 0.00
        });
        setEnrollmentStep('success');
      }
    } catch (err) {
      console.error('Failed to register devotee as affiliate:', err);
      alert('Failed to register: ' + (err as Error).message);
    } finally {
      setJoiningProgram(false);
    }
  };

  // User Profile State
  const [userProfile, setUserProfile] = React.useState({
    name: 'Sahil Patel',
    email: 'sahil.patel@devotion.com',
    phone: '+91 98765 43210',
    spiritualGoal: 'Peace & Daily Rituals',
    avatarAura: 'Golden Radiance',
  });

  React.useEffect(() => {
    if (loggedInUser) {
      const isPlaceholder = loggedInUser.email && loggedInUser.email.startsWith('devotee_') && loggedInUser.email.endsWith('@spiritual.com');
      const savedGoal = localStorage.getItem(`spiritual_goal_${loggedInUser.id}`);
      setUserProfile(prev => ({
        ...prev,
        name: loggedInUser.fullName || '',
        email: isPlaceholder ? '' : (loggedInUser.email || ''),
        phone: loggedInUser.phoneNumber,
        spiritualGoal: savedGoal || prev.spiritualGoal
      }));
      setNewAddress(prev => ({
        ...prev,
        name: loggedInUser.fullName || ''
      }));
      fetchAddresses();
    } else {
      setAddresses([]);
    }
  }, [loggedInUser]);
  const [profileSuccessMessage, setProfileSuccessMessage] = React.useState('');

  // Saved Addresses State
  const [addresses, setAddresses] = React.useState<Address[]>([]);

  const fetchAddresses = React.useCallback(async () => {
    if (!loggedInUser) return;
    try {
      const { data, error } = await supabase
        .from('website_store_addresses')
        .select('*')
        .eq('user_id', loggedInUser.id)
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
        setAddresses(mapped);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  }, [loggedInUser]);

  const [showAddAddressForm, setShowAddAddressForm] = React.useState(false);
  const [addressSuccessMessage, setAddressSuccessMessage] = React.useState('');
  const [newAddress, setNewAddress] = React.useState({
    type: 'Home',
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
  });

  // Notifications State
  const [notificationSettings, setNotificationSettings] = React.useState({
    emailSpiritual: true,
    emailOrders: true,
    whatsappUpdates: true,
    smsAlerts: false,
    dailyIntention: true,
  });
  const [notifSuccessMessage, setNotifSuccessMessage] = React.useState('');

  // Wishlist synchronized items
  const wishlistedProducts = (productsProp || []).filter((p) => wishlist[p.id]);

  // Map orders from prop
  const allOrders = React.useMemo(() => {
    return orders.map((o) => ({
      id: o.orderId,
      date: new Date(o.placedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      total: o.total,
      paymentMethod: o.paymentMethod,
      status: o.status,
      paymentStatus: o.paymentStatus || 'Pending',
      paymentDeclineCount: o.paymentDeclineCount || 0,
      paymentScreenshot: localScreenshots[o.orderId] || o.paymentScreenshot,
      items: o.items.map((i) => ({
        name: i.product.name,
        qty: i.quantity,
        price: i.product.price,
        image: i.product.image,
      })),
    }));
  }, [orders, localScreenshots]);

  // Feedback Messages auto-clear
  React.useEffect(() => {
    if (profileSuccessMessage) {
      const timer = setTimeout(() => setProfileSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [profileSuccessMessage]);

  React.useEffect(() => {
    if (addressSuccessMessage) {
      const timer = setTimeout(() => setAddressSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [addressSuccessMessage]);

  React.useEffect(() => {
    if (notifSuccessMessage) {
      const timer = setTimeout(() => setNotifSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [notifSuccessMessage]);

  // Profile Edit Save
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser) return;
    setIsSavingProfile(true);
    try {
      const trimmedEmail = userProfile.email ? userProfile.email.trim() : '';
      const emailToSave = trimmedEmail !== '' ? trimmedEmail : null;

      const { error } = await supabase
        .from('website_store_users')
        .update({
          full_name: userProfile.name,
          email: emailToSave,
          phone_number: userProfile.phone
        })
        .eq('id', loggedInUser.id);

      if (error) throw error;

      // Save spiritual goal to localStorage
      localStorage.setItem(`spiritual_goal_${loggedInUser.id}`, userProfile.spiritualGoal);

      if (onProfileUpdate) {
        onProfileUpdate({
          id: loggedInUser.id,
          fullName: userProfile.name,
          email: emailToSave || '',
          phoneNumber: userProfile.phone
        });
      }

      setProfileSuccessMessage('Spiritual Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Error updating profile: ' + (err as Error).message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleResetProfile = () => {
    if (loggedInUser) {
      const isPlaceholder = loggedInUser.email && loggedInUser.email.startsWith('devotee_') && loggedInUser.email.endsWith('@spiritual.com');
      const savedGoal = localStorage.getItem(`spiritual_goal_${loggedInUser.id}`);
      setUserProfile({
        name: loggedInUser.fullName || '',
        email: isPlaceholder ? '' : (loggedInUser.email || ''),
        phone: loggedInUser.phoneNumber,
        spiritualGoal: savedGoal || 'Peace & Daily Rituals',
        avatarAura: 'Golden Radiance'
      });
    }
  };

  // Add Address Save
  const handleAddAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser) {
      alert('Please log in to save addresses.');
      return;
    }
    if (
      !newAddress.phone ||
      !newAddress.street ||
      !newAddress.city ||
      !newAddress.state ||
      !newAddress.zip
    ) {
      alert('Please fill out all address details.');
      return;
    }

    const isDefault = addresses.length === 0;
    const addressData = {
      user_id: loggedInUser.id,
      type: newAddress.type || 'Other Address',
      name: newAddress.name || loggedInUser.fullName || 'Devotee',
      phone: newAddress.phone,
      street: newAddress.street,
      city: newAddress.city,
      state: newAddress.state,
      zip: newAddress.zip,
      is_default: isDefault,
    };

    try {
      const { data, error } = await supabase
        .from('website_store_addresses')
        .insert(addressData)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const added: Address = {
          id: data.id,
          type: data.type,
          name: data.name,
          phone: data.phone,
          street: data.street,
          city: data.city,
          state: data.state,
          zip: data.zip,
          isDefault: data.is_default,
        };
        setAddresses([...addresses, added]);
      }
      
      setShowAddAddressForm(false);
      setNewAddress({
        type: 'Home',
        name: loggedInUser.fullName || '',
        phone: '',
        street: '',
        city: '',
        state: '',
        zip: '',
      });
      setAddressSuccessMessage('New address saved to dashboard.');
    } catch (err) {
      console.error('Failed to save address:', err);
      alert('Error saving address. Please try again.');
    }
  };

  // Delete Address
  const handleDeleteAddress = async (id: string) => {
    if (!loggedInUser) return;
    try {
      const { error } = await supabase
        .from('website_store_addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const deletedAddr = addresses.find((a) => a.id === id);
      const nextAddresses = addresses.filter((a) => a.id !== id);
      
      // If we deleted the default, set first remaining as default
      if (deletedAddr?.isDefault && nextAddresses.length > 0) {
        const newDefault = nextAddresses[0];
        const { error: updateError } = await supabase
          .from('website_store_addresses')
          .update({ is_default: true })
          .eq('id', newDefault.id);

        if (updateError) throw updateError;
        newDefault.isDefault = true;
      }
      
      setAddresses(nextAddresses);
      setAddressSuccessMessage('Address removed successfully.');
    } catch (err) {
      console.error('Failed to delete address:', err);
      alert('Error deleting address. Please try again.');
    }
  };

  // Set Default Address
  const handleSetDefaultAddress = async (id: string) => {
    if (!loggedInUser) return;
    try {
      // First, set all other addresses to is_default = false for this user
      const { error: clearError } = await supabase
        .from('website_store_addresses')
        .update({ is_default: false })
        .eq('user_id', loggedInUser.id);

      if (clearError) throw clearError;

      // Second, set the selected address to is_default = true
      const { error: setError } = await supabase
        .from('website_store_addresses')
        .update({ is_default: true })
        .eq('id', id);

      if (setError) throw setError;

      setAddresses(
        addresses.map((a) => ({
          ...a,
          isDefault: a.id === id,
        }))
      );
      setAddressSuccessMessage('Primary delivery address updated.');
    } catch (err) {
      console.error('Failed to set default address:', err);
      alert('Error updating default address. Please try again.');
    }
  };

  // Notification Preference Save
  const handleSaveNotifications = () => {
    setNotifSuccessMessage('Devotional communication channels updated!');
  };

  // Secure Logout simulation
  const [logoutConfirmed, setLogoutConfirmed] = React.useState(false);
  const handleLogoutAction = () => {
    setLogoutConfirmed(true);
    setTimeout(() => {
      if (onLogout) {
        onLogout();
      } else {
        onNavigateToHome();
      }
    }, 1500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return { bg: '#dcfce7', text: '#15803d' };
      case 'Shipped':
        return { bg: '#dbeafe', text: '#1d4ed8' };
      default:
        return { bg: 'var(--primary-lime-light)', text: 'var(--primary-lime)' };
    }
  };

  const getCategoryGradient = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'rudraksha':
      case 'tulsi mala':
      case 'crystal mala':
        return 'linear-gradient(135deg, #f5f3ff 0%, #ddd6fe 100%)';
      case 'shiva nataraja':
      case 'shiva murti':
      case 'ganesh murti':
      case 'hanuman murti':
      case 'lakshmi murti':
        return 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
      default:
        return 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)';
    }
  };

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '80vh', paddingBottom: '80px' }}>
      
      {/* 1. Header Banner */}
      <section style={{
        background: 'linear-gradient(135deg, var(--primary-forest) 0%, #4c1f13 100%)',
        color: '#ffffff',
        padding: '60px 0 40px 0',
        borderBottom: '4px solid var(--primary-lime)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Spiritual background circles */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)',
          zIndex: 1
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          
          {/* Avatar Area with golden aura */}
          <div style={{
            position: 'relative',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #fde047 0%, var(--primary-lime) 100%)',
            boxShadow: '0 0 25px rgba(249, 115, 22, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            border: '3px solid #ffffff'
          }}>
            <span style={{ fontSize: '3rem' }}>🧘‍♂️</span>
            <div style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              backgroundColor: '#eab308',
              color: '#ffffff',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
              border: '2px solid #ffffff'
            }} title="Spiritual Devotee Rank">
              <Sparkles size={14} />
            </div>
          </div>

          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px' }}>
            Namaste, {userProfile.name}
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.95rem', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span>{userProfile.email}</span>
            <span>•</span>
            <span style={{ color: '#fed7aa', fontWeight: 700 }}>{userProfile.spiritualGoal}</span>
          </p>
        </div>
      </section>

      {/* 2. Main Dashboard Layout Container */}
      <div className="container" style={{ marginTop: '40px' }}>
        {isMobile && mobileShowMenu ? (
          /* Mobile Menu Index View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 8px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px', textAlign: 'left' }}>
              Account Settings
            </h2>
            
            {[
              { tab: 'info', label: 'Edit Profile', desc: 'Update contact info and puja goals', icon: <User size={20} color="var(--primary-lime)" />, badge: null },
              { tab: 'orders', label: 'My Devotional Orders', desc: 'Track historical and active orders', icon: <Package size={20} color="#3b82f6" />, badge: allOrders.length > 0 ? allOrders.length : null },
              { tab: 'addresses', label: 'Saved Delivery Addresses', desc: 'Manage shipping destinations', icon: <MapPin size={20} color="#10b981" />, badge: null },
              { tab: 'wishlist', label: 'Sacred Wishlist', desc: 'Items saved for auspicious days', icon: <Heart size={20} color="#ec4899" />, badge: wishlistedProducts.length > 0 ? wishlistedProducts.length : null },
              { tab: 'notifications', label: 'Notification Settings', desc: 'Manage email and blessing alerts', icon: <Bell size={20} color="#f59e0b" />, badge: null },
              { tab: 'affiliate', label: 'Affiliate Partnership', desc: 'Earn commissions and check dashboard', icon: <Sparkles size={20} color="#8b5cf6" />, badge: affiliateProfile && affiliateProfile.affiliate_status === 'active' ? 'Active' : null },
            ].map((item) => (
              <button
                key={item.tab}
                onClick={() => {
                  setActiveTab(item.tab as any);
                  setMobileShowMenu(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-light)',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  width: '100%',
                  outline: 'none'
                }}
                className="profile-mobile-menu-item"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--primary-lime-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>{item.label}</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{item.desc}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {item.badge !== null && (
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      backgroundColor: item.tab === 'affiliate' ? '#fff7ed' : 'var(--primary-lime-light)',
                      color: item.tab === 'affiliate' ? '#c2410c' : 'var(--primary-lime)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      border: item.tab === 'affiliate' ? '1.5px solid #ffedd5' : '1px solid var(--border-light)'
                    }}>
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
              </button>
            ))}

            <div style={{ height: '1px', backgroundColor: 'var(--border-light)', margin: '12px 0' }} />

            {/* Logout button */}
            <button
              onClick={() => {
                setActiveTab('logout');
                setMobileShowMenu(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid #fee2e2',
                backgroundColor: '#fffbfa',
                textAlign: 'left',
                cursor: 'pointer',
                width: '100%',
                outline: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <LogOut size={20} color="#dc2626" />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#dc2626', margin: 0 }}>Secure Logout</h4>
                  <p style={{ fontSize: '0.78rem', color: '#f87171', margin: '2px 0 0 0' }}>Sign out of your active session</p>
                </div>
              </div>
              <ChevronRight size={16} color="#f87171" />
            </button>
          </div>
        ) : (
          /* Normal Dashboard Layout */
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '260px 1fr',
            gap: isMobile ? '20px' : '40px',
            alignItems: 'start'
          }} className="hero-grid-split">
            
            {/* Dashboard Left Sidebar Tabs (desktop only) */}
            {!isMobile && (
              <aside style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)',
                padding: '16px',
                boxShadow: 'var(--shadow-sm)'
              }} className="profile-sidebar-wrapper">
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`profile-nav-btn ${activeTab === 'info' ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      width: '100%',
                      textAlign: 'left',
                      fontSize: '0.9rem',
                      fontWeight: activeTab === 'info' ? 700 : 500,
                      backgroundColor: activeTab === 'info' ? 'var(--primary-lime-light)' : 'transparent',
                      color: activeTab === 'info' ? 'var(--primary-lime)' : 'var(--text-dark)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <User size={18} />
                    <span>Edit Profile</span>
                  </button>

                  <button
                    onClick={onNavigateToOrders}
                    className={`profile-nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      width: '100%',
                      textAlign: 'left',
                      fontSize: '0.9rem',
                      fontWeight: activeTab === 'orders' ? 700 : 500,
                      backgroundColor: activeTab === 'orders' ? 'var(--primary-lime-light)' : 'transparent',
                      color: activeTab === 'orders' ? 'var(--primary-lime)' : 'var(--text-dark)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <Package size={18} />
                    <span>My Devotional Orders</span>
                    {allOrders.length > 0 && (
                      <span style={{
                        marginLeft: 'auto',
                        backgroundColor: activeTab === 'orders' ? 'var(--primary-lime)' : 'var(--border-light)',
                        color: activeTab === 'orders' ? 'var(--text-dark)' : 'var(--text-muted)',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)'
                      }}>
                        {allOrders.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('addresses')}
                    className={`profile-nav-btn ${activeTab === 'addresses' ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      width: '100%',
                      textAlign: 'left',
                      fontSize: '0.9rem',
                      fontWeight: activeTab === 'addresses' ? 700 : 500,
                      backgroundColor: activeTab === 'addresses' ? 'var(--primary-lime-light)' : 'transparent',
                      color: activeTab === 'addresses' ? 'var(--primary-lime)' : 'var(--text-dark)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <MapPin size={18} />
                    <span>Saved Delivery Addresses</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('wishlist')}
                    className={`profile-nav-btn ${activeTab === 'wishlist' ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      width: '100%',
                      textAlign: 'left',
                      fontSize: '0.9rem',
                      fontWeight: activeTab === 'wishlist' ? 700 : 500,
                      backgroundColor: activeTab === 'wishlist' ? 'var(--primary-lime-light)' : 'transparent',
                      color: activeTab === 'wishlist' ? 'var(--primary-lime)' : 'var(--text-dark)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <Heart size={18} />
                    <span>Sacred Wishlist</span>
                    {wishlistedProducts.length > 0 && (
                      <span style={{
                        marginLeft: 'auto',
                        backgroundColor: 'var(--primary-lime)',
                        color: 'var(--text-dark)',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)'
                      }}>
                        {wishlistedProducts.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`profile-nav-btn ${activeTab === 'notifications' ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      width: '100%',
                      textAlign: 'left',
                      fontSize: '0.9rem',
                      fontWeight: activeTab === 'notifications' ? 700 : 500,
                      backgroundColor: activeTab === 'notifications' ? 'var(--primary-lime-light)' : 'transparent',
                      color: activeTab === 'notifications' ? 'var(--primary-lime)' : 'var(--text-dark)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <Bell size={18} />
                    <span>Notification Settings</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('affiliate')}
                    className={`profile-nav-btn ${activeTab === 'affiliate' ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      width: '100%',
                      textAlign: 'left',
                      fontSize: '0.9rem',
                      fontWeight: activeTab === 'affiliate' ? 700 : 500,
                      backgroundColor: activeTab === 'affiliate' ? 'var(--primary-lime-light)' : 'transparent',
                      color: activeTab === 'affiliate' ? 'var(--primary-lime)' : 'var(--text-dark)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <Sparkles size={18} />
                    <span>Affiliate Partnership</span>
                    {affiliateProfile && affiliateProfile.affiliate_status === 'active' && (
                      <span style={{
                        marginLeft: 'auto',
                        backgroundColor: '#fef3c7',
                        color: '#d97706',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-full)',
                        border: '1.5px solid #fde68a'
                      }}>
                        Active
                      </span>
                    )}
                  </button>

                  <div className="profile-sidebar-nav-divider" style={{ height: '1px', backgroundColor: 'var(--border-light)', margin: '12px 0' }} />

                  <button
                    onClick={() => setActiveTab('logout')}
                    className={`profile-nav-btn logout-btn ${activeTab === 'logout' ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      width: '100%',
                      textAlign: 'left',
                      fontSize: '0.9rem',
                      fontWeight: activeTab === 'logout' ? 700 : 500,
                      backgroundColor: activeTab === 'logout' ? '#fef2f2' : 'transparent',
                      color: activeTab === 'logout' ? '#dc2626' : 'var(--text-muted)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <LogOut size={18} />
                    <span>Secure Logout</span>
                  </button>

                </nav>
              </aside>
            )}

            {/* Dashboard Content Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', overflow: 'hidden' }}>
              {isMobile && (
                <button
                  onClick={() => setMobileShowMenu(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-light)',
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--text-dark)',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    alignSelf: 'flex-start',
                    transition: 'all 0.15s ease',
                    marginBottom: '8px'
                  }}
                  className="btn-back-menu"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Menu</span>
                </button>
              )}

              {/* Dashboard Right Main Content Panel */}
              <main className="profile-content-panel" style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)',
                padding: isMobile ? '20px' : '32px',
                boxShadow: 'var(--shadow-sm)',
                minHeight: '480px',
                textAlign: 'left',
                overflow: 'hidden',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                
                {/* Carousel Inner Container */}
                <div
                  className="profile-carousel-inner"
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'nowrap',
                    transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
                    transform: `translateX(-${(() => {
                      const tabTabs = ['info', 'orders', 'addresses', 'wishlist', 'notifications', 'affiliate', 'logout'];
                      const activeIndex = tabTabs.indexOf(activeTab);
                      return activeIndex !== -1 ? activeIndex : 0;
                    })() * 100}%)`,
                    width: '100%',
                    alignItems: 'flex-start'
                  }}
                >
              
              {/* ==============================================
                  TAB: USER INFORMATION (EDIT PROFILE)
                  ============================================== */}
              <div className={`profile-carousel-slide ${activeTab === 'info' ? 'active' : ''}`} style={{ width: '100%', flexShrink: 0 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)' }}>Spiritual Account Profile</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>Update your contact information and spiritual puja intentions.</p>
                  </div>
                </div>

                {profileSuccessMessage && (
                  <div style={{
                    backgroundColor: '#dcfce7',
                    border: '1px solid #bbf7d0',
                    color: '#15803d',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '20px',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <CheckCircle size={16} />
                    <span>{profileSuccessMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="form-grid-2col">
                      
                      {/* Name Input */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '6px' }}>Full Name</label>
                        <input
                          type="text"
                          value={userProfile.name}
                          onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-light)',
                            outline: 'none',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            backgroundColor: '#ffffff',
                            color: 'var(--text-dark)'
                          }}
                        />
                      </div>

                      {/* Email Input */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '6px' }}>Email Address</label>
                        <input
                          type="email"
                          value={userProfile.email}
                          onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-light)',
                            outline: 'none',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            backgroundColor: '#ffffff',
                            color: 'var(--text-dark)'
                          }}
                        />
                      </div>

                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="form-grid-2col">
                      
                      {/* Phone Input */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '6px' }}>Phone Number</label>
                        <input
                          type="text"
                          value={userProfile.phone}
                          onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-light)',
                            outline: 'none',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            backgroundColor: '#ffffff',
                            color: 'var(--text-dark)'
                          }}
                        />
                      </div>

                      {/* Spiritual Goal Selector */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '6px' }}>Puja Intention / Spiritual Goal</label>
                        <select
                          value={userProfile.spiritualGoal}
                          onChange={(e) => setUserProfile({ ...userProfile, spiritualGoal: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-light)',
                            outline: 'none',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            backgroundColor: '#ffffff',
                            color: 'var(--text-dark)',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="Peace & Daily Rituals">Peace & Daily Rituals</option>
                          <option value="Meditation & Focus">Meditation & Focus</option>
                          <option value="Vastu & Home Prosperity">Vastu & Home Prosperity</option>
                          <option value="Wisdom & Chanting">Wisdom & Chanting</option>
                          <option value="Spiritual Gift Giver">Spiritual Gift Giver</option>
                        </select>
                      </div>

                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="btn-lime"
                        style={{ padding: '12px 24px', fontSize: '0.88rem', borderRadius: 'var(--radius-md)', display: 'inline-flex', alignItems: 'center', gap: '8px', opacity: isSavingProfile ? 0.7 : 1, cursor: isSavingProfile ? 'not-allowed' : 'pointer' }}
                      >
                        <Save size={16} />
                        <span>{isSavingProfile ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                      <button
                        type="button"
                        disabled={isSavingProfile}
                        onClick={handleResetProfile}
                        className="btn-outline"
                        style={{ padding: '12px 24px', fontSize: '0.88rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', cursor: isSavingProfile ? 'not-allowed' : 'pointer' }}
                      >
                        Reset
                      </button>
                    </div>

                  </div>
                </form>

                {/* Account Details Box */}
                <div className="profile-membership-box" style={{
                  marginTop: '32px',
                  padding: '20px',
                  backgroundColor: 'var(--primary-lime-light)',
                  border: '1px solid #ffedd5',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div style={{
                    backgroundColor: 'var(--primary-lime)',
                    borderRadius: '50%',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-dark)'
                  }}>
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>Sadhaka Elite Membership</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      You have unlocked complimentary Gangajal blessing and temple priority dispatch with every checkout!
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* ==============================================
                TAB: ORDERS (MOCK + RECENT LIVE ORDERS)
                ============================================== */}
            <div className={`profile-carousel-slide ${activeTab === 'orders' ? 'active' : ''}`} style={{ width: '100%', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '4px' }}>My Devotional Orders</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>Trace the shipment progress and history of your ordered sacred items.</p>

                {allOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
                    <span style={{ fontSize: '3rem' }}>🛍️</span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '16px' }}>No orders placed yet</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '20px' }}>
                      Embark on your spiritual journey today and explore our catalog of certified energetic products.
                    </p>
                    <button onClick={onNavigateToShop} className="btn-lime" style={{ fontSize: '0.85rem', padding: '10px 24px' }}>
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {allOrders.map((order) => {
                      const isPendingUpi = order.paymentMethod === 'Scan & Pay (UPI)' && order.paymentStatus !== 'Confirmed' && order.status !== 'Cancelled';
                      const badge = getStatusColor(order.status);
                      return (
                        <div
                          key={order.id}
                          style={{
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-lg)',
                            overflow: 'hidden',
                            backgroundColor: '#ffffff',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          {/* Order Card Header */}
                          <div style={{
                            backgroundColor: '#fafafa',
                            padding: '16px 24px',
                            borderBottom: '1px solid var(--border-light)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '12px'
                          }}>
                            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                              <div>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Order ID</span>
                                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-dark)' }}>#{order.id}</div>
                              </div>
                              <div>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Date Placed</span>
                                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-dark)' }}>{order.date}</div>
                              </div>
                              <div>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total Price</span>
                                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--primary-forest)' }}>₹{order.total.toFixed(2)}</div>
                              </div>
                              <div>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Payment</span>
                                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-dark)' }}>{order.paymentMethod}</div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                backgroundColor: badge.bg,
                                color: badge.text,
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                padding: '4px 12px',
                                borderRadius: 'var(--radius-full)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: badge.text }} />
                                {order.status}
                              </span>
                              {isPendingUpi && (
                                <span style={{
                                  backgroundColor: '#fff7ed',
                                  color: '#c2410c',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  padding: '4px 12px',
                                  borderRadius: 'var(--radius-full)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  border: '1.5px solid #ffedd5'
                                }}>
                                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#c2410c' }} />
                                  Payment Pending
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Order Products List */}
                          <div style={{ padding: '20px 24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              {order.items.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                      width: '40px',
                                      height: '40px',
                                      borderRadius: 'var(--radius-sm)',
                                      backgroundColor: '#f3f4f6',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '1.4rem'
                                    }}>
                                      {item.image && isImageUrl(item.image) ? (
                                        <img 
                                          src={getDisplayImageUrl(item.image)} 
                                          alt={item.name} 
                                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} 
                                        />
                                      ) : (
                                        item.image
                                      )}
                                    </div>
                                    <div>
                                      <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-dark)' }}>{item.name}</h4>
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quantity: {item.qty}</span>
                                    </div>
                                  </div>
                                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                                    ₹{(item.price * item.qty).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Shipment Status timeline tracker if order is not delivered */}
                            {order.status !== 'Delivered' && (
                              <div style={{
                                marginTop: '24px',
                                paddingTop: '20px',
                                borderTop: '1px solid var(--border-light)'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                  <Truck size={16} style={{ color: 'var(--primary-lime)' }} />
                                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-dark)' }}>Live Tracking Progress</span>
                                </div>

                                <div className="tracking-progress-timeline" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', position: 'relative' }}>
                                  {/* Progress bar line */}
                                  <div className="tracking-progress-line" style={{
                                    position: 'absolute',
                                    top: '7px',
                                    left: '12.5%',
                                    right: '12.5%',
                                    height: '2px',
                                    backgroundColor: 'var(--border-light)',
                                    zIndex: 1
                                  }} />
                                  
                                  {/* Confirmed */}
                                  <div style={{ textAlign: 'center', position: 'relative', zIndex: 5 }}>
                                    <div style={{
                                      width: '16px',
                                      height: '16px',
                                      borderRadius: '50%',
                                      backgroundColor: 'var(--primary-lime)',
                                      border: '3px solid #ffffff',
                                      boxShadow: '0 0 0 1px var(--primary-lime)',
                                      margin: '0 auto 6px auto'
                                    }} />
                                    <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dark)' }}>Ordered</span>
                                  </div>

                                  {/* Packed */}
                                  <div style={{ textAlign: 'center', position: 'relative', zIndex: 5 }}>
                                    <div style={{
                                      width: '16px',
                                      height: '16px',
                                      borderRadius: '50%',
                                      backgroundColor: order.status === 'Being Packed' ? 'var(--primary-lime)' : 'var(--border-light)',
                                      border: '3px solid #ffffff',
                                      boxShadow: order.status === 'Being Packed' ? '0 0 0 1px var(--primary-lime)' : 'none',
                                      margin: '0 auto 6px auto'
                                    }} />
                                    <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: order.status === 'Being Packed' ? 800 : 500, color: order.status === 'Being Packed' ? 'var(--primary-lime)' : 'var(--text-muted)' }}>Packed</span>
                                  </div>

                                  {/* Shipped */}
                                  <div style={{ textAlign: 'center', position: 'relative', zIndex: 5 }}>
                                    <div style={{
                                      width: '16px',
                                      height: '16px',
                                      borderRadius: '50%',
                                      backgroundColor: 'var(--border-light)',
                                      border: '3px solid #ffffff',
                                      margin: '0 auto 6px auto'
                                    }} />
                                    <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-muted)' }}>In Transit</span>
                                  </div>

                                  {/* Delivered */}
                                  <div style={{ textAlign: 'center', position: 'relative', zIndex: 5 }}>
                                    <div style={{
                                      width: '16px',
                                      height: '16px',
                                      borderRadius: '50%',
                                      backgroundColor: 'var(--border-light)',
                                      border: '3px solid #ffffff',
                                      margin: '0 auto 6px auto'
                                    }} />
                                    <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-muted)' }}>Delivered</span>
                                  </div>

                                </div>
                              </div>
                            )}

                            {/* UPI QR Payment and Screenshot Upload Panel */}
                            {isPendingUpi && (
                              <div style={{
                                marginTop: '24px',
                                paddingTop: '20px',
                                borderTop: '1px solid var(--border-light)'
                              }}>
                                <div style={{
                                  backgroundColor: '#fffbeb',
                                  border: '1.5px solid #fef3c7',
                                  borderRadius: 'var(--radius-lg)',
                                  padding: '20px'
                                }}>
                                  <h5 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#92400e', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Sparkles size={16} style={{ color: '#d97706' }} /> Complete Direct UPI Payment
                                  </h5>
                                  <p style={{ fontSize: '0.8rem', color: '#78350f', marginBottom: '16px', lineHeight: 1.4 }}>
                                    Please scan the QR code to complete your payment of <strong>₹{order.total.toFixed(2)}</strong>. After making the payment, upload your transaction confirmation screenshot below.
                                  </p>

                                  {order.paymentStatus === 'Declined' && (
                                    <div style={{
                                      backgroundColor: '#fee2e2',
                                      border: '1.5px solid #fca5a5',
                                      borderRadius: 'var(--radius-md)',
                                      padding: '12px',
                                      marginBottom: '16px',
                                      color: '#991b1b',
                                      fontSize: '0.78rem',
                                      fontWeight: 700
                                    }}>
                                      ⚠️ Your payment was not done properly. Please check your transaction details and re-upload a valid payment screenshot. (Decline Attempt {order.paymentDeclineCount || 0} of 3)
                                    </div>
                                  )}

                                  <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1.1fr 1.9fr',
                                    gap: '20px',
                                    alignItems: 'start'
                                  }} className="hero-grid-split">
                                    {/* QR Code Column */}
                                    <div style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      textAlign: 'center',
                                      padding: '12px',
                                      backgroundColor: '#ffffff',
                                      border: '1.5px solid #f3f4f6',
                                      borderRadius: 'var(--radius-md)',
                                    }}>
                                      {barcodeSettings?.barcodeUrl ? (
                                        <img
                                          src={barcodeSettings.barcodeUrl}
                                          alt="UPI QR Code"
                                          style={{ width: '130px', height: '130px', objectFit: 'contain', marginBottom: '8px' }}
                                        />
                                      ) : (
                                        <img
                                          src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                                            `upi://pay?pa=${barcodeSettings?.upiId || '7974478098@paytm'}&pn=Mantra%20Puja&am=${order.total.toFixed(
                                              2
                                            )}&cu=INR&tn=Order%20${order.id}`
                                          )}`}
                                          alt="UPI QR Code"
                                          style={{ width: '130px', height: '130px', objectFit: 'contain', marginBottom: '8px' }}
                                        />
                                      )}
                                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                                        Scan to Pay ₹{order.total.toFixed(2)}
                                      </span>

                                      <div style={{
                                        marginTop: '10px',
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        backgroundColor: '#fafafa',
                                        padding: '6px 10px',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid #e5e7eb',
                                      }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                          <span style={{ fontSize: '0.55rem', color: '#9ca3af', fontWeight: 700 }}>UPI ID / VPA (Click to Pay)</span>
                                          <a
                                            href={`upi://pay?pa=${barcodeSettings?.upiId || '7974478098@paytm'}&pn=Mantra%20Puja&am=${order.total.toFixed(2)}&cu=INR&tn=Order%20${order.id}`}
                                            style={{
                                              fontSize: '0.68rem',
                                              fontWeight: 800,
                                              color: 'var(--primary-lime, #15803d)',
                                              fontFamily: 'monospace',
                                              textDecoration: 'underline',
                                              cursor: 'pointer',
                                              wordBreak: 'break-all'
                                            }}
                                          >
                                            {barcodeSettings?.upiId || '7974478098@paytm'}
                                          </a>
                                        </div>
                                        <button
                                          onClick={() => handleCopyOrderUpi(order.id, barcodeSettings?.upiId || '7974478098@paytm')}
                                          style={{
                                            padding: '4px 6px',
                                            fontSize: '0.65rem',
                                            fontWeight: 700,
                                            backgroundColor: copiedUpiOrderId === order.id ? '#dcfce7' : '#ffffff',
                                            color: copiedUpiOrderId === order.id ? '#15803d' : 'var(--text-dark)',
                                            border: '1px solid #d1d5db',
                                            borderRadius: 'var(--radius-sm)',
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '2px',
                                            flexShrink: 0
                                          }}
                                        >
                                          {copiedUpiOrderId === order.id ? <Check size={8} /> : <Copy size={8} />}
                                          {copiedUpiOrderId === order.id ? 'Copied' : 'Copy'}
                                        </button>
                                      </div>

                                      <button
                                        onClick={() => handleUpiRedirect(order.id, order.total)}
                                        style={{
                                          marginTop: '10px',
                                          width: '100%',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          padding: '8px 12px',
                                          borderRadius: '6px',
                                          backgroundColor: 'var(--primary-lime)',
                                          color: '#ffffff',
                                          border: 'none',
                                          fontSize: '0.78rem',
                                          fontWeight: 800,
                                          cursor: 'pointer',
                                          transition: 'background-color 0.2s',
                                          boxShadow: 'var(--shadow-sm)'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-forest)'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--primary-lime)'}
                                      >
                                        ⚡ Pay via UPI App
                                      </button>
                                    </div>

                                    {/* Upload Screen Column */}
                                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                                      {uploadingOrderId === order.id ? (
                                        <div style={{
                                          display: 'flex',
                                          flexDirection: 'column',
                                          alignItems: 'center',
                                          textAlign: 'center',
                                          padding: '24px 16px',
                                          border: '2px dashed var(--primary-lime)',
                                          borderRadius: 'var(--radius-md)',
                                          backgroundColor: '#ffffff',
                                          minHeight: '160px',
                                          justifyContent: 'center'
                                        }}>
                                          <div style={{
                                            width: '20px',
                                            height: '20px',
                                            border: '2px solid #e5e7eb',
                                            borderTopColor: 'var(--primary-lime)',
                                            borderRadius: '50%',
                                            margin: '0 auto 8px auto',
                                            animation: 'spin-anim 1s linear infinite',
                                          }} />
                                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dark)' }}>Uploading to Temple server...</span>
                                        </div>
                                      ) : selectedFiles[order.id] ? (
                                        <div style={{
                                          display: 'flex',
                                          flexDirection: 'column',
                                          alignItems: 'center',
                                          textAlign: 'center',
                                          padding: '16px',
                                          backgroundColor: '#fffbeb',
                                          border: '1.5px dashed var(--primary-lime)',
                                          borderRadius: 'var(--radius-md)',
                                        }}>
                                          <img
                                            src={URL.createObjectURL(selectedFiles[order.id])}
                                            alt="Selected Preview"
                                            style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '4px', marginBottom: '8px', border: '1px solid var(--border-light)' }}
                                          />
                                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dark)', wordBreak: 'break-all' }}>
                                            Selected: {selectedFiles[order.id].name}
                                          </span>
                                          <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '12px' }}>
                                            <button
                                              onClick={() => handleOrderScreenshotUpload(order.id, selectedFiles[order.id])}
                                              className="btn-lime"
                                              style={{
                                                flex: 1,
                                                padding: '8px 12px',
                                                fontSize: '0.75rem',
                                                fontWeight: 800,
                                                borderRadius: 'var(--radius-sm)',
                                                justifyContent: 'center',
                                                cursor: 'pointer'
                                              }}
                                            >
                                              Submit
                                            </button>
                                            <button
                                              onClick={() => {
                                                setSelectedFiles(prev => {
                                                  const next = { ...prev };
                                                  delete next[order.id];
                                                  return next;
                                                });
                                              }}
                                              style={{
                                                padding: '8px 12px',
                                                backgroundColor: '#ffffff',
                                                border: '1px solid var(--border-light)',
                                                color: 'var(--text-dark)',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                borderRadius: 'var(--radius-sm)',
                                                cursor: 'pointer'
                                              }}
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      ) : order.paymentScreenshot ? (
                                        <div style={{
                                          display: 'flex',
                                          flexDirection: 'column',
                                          alignItems: 'center',
                                          textAlign: 'center',
                                          padding: '16px',
                                          backgroundColor: '#f0fdf4',
                                          border: '1.5px dashed #bbf7d0',
                                          borderRadius: 'var(--radius-md)',
                                        }}>
                                          <img
                                            src={order.paymentScreenshot}
                                            alt="Payment Screenshot"
                                            style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px', border: '1px solid #bbf7d0' }}
                                          />
                                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <CheckCircle size={14} style={{ color: '#15803d' }} /> Receipt Uploaded
                                          </span>
                                          <p style={{ fontSize: '0.7rem', color: '#166534', marginTop: '2px', marginBottom: '10px' }}>
                                            Awaiting confirmation from our admin team.
                                          </p>
                                          <label
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '4px',
                                              padding: '5px 12px',
                                              backgroundColor: '#ffffff',
                                              border: '1px solid #bbf7d0',
                                              borderRadius: 'var(--radius-sm)',
                                              color: '#15803d',
                                              fontSize: '0.72rem',
                                              fontWeight: 700,
                                              cursor: 'pointer',
                                            }}
                                          >
                                            <Upload size={10} />
                                            Re-upload proof
                                            <input
                                              type="file"
                                              accept="image/*"
                                              onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                  setSelectedFiles(prev => ({ ...prev, [order.id]: file }));
                                                }
                                              }}
                                              style={{ display: 'none' }}
                                            />
                                          </label>
                                        </div>
                                      ) : (
                                        <label
                                          style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '24px 16px',
                                            border: '2px dashed #d1d5db',
                                            borderRadius: 'var(--radius-md)',
                                            cursor: 'pointer',
                                            backgroundColor: '#ffffff',
                                            transition: 'border-color 0.2s',
                                            minHeight: '160px'
                                          }}
                                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary-lime)')}
                                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
                                        >
                                          <Upload size={20} style={{ color: 'var(--text-muted)', marginBottom: '6px' }} />
                                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                                            Upload Payment Screenshot
                                          </span>
                                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            JPG, PNG files
                                          </span>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                setSelectedFiles(prev => ({ ...prev, [order.id]: file }));
                                              }
                                            }}
                                            style={{ display: 'none' }}
                                          />
                                        </label>
                                      )}

                                      {uploadErrors[order.id] && (
                                        <p style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 600, marginTop: '6px', textAlign: 'center' }}>
                                          {uploadErrors[order.id]}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            </div>

            {/* ==============================================
                TAB: SAVED ADDRESSES (MANAGE ADDRESSES)
                ============================================== */}
            <div className={`profile-carousel-slide ${activeTab === 'addresses' ? 'active' : ''}`} style={{ width: '100%', flexShrink: 0 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)' }}>Saved Delivery Addresses</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>Manage addresses to make your sacred checkout flows faster.</p>
                  </div>
                  {!showAddAddressForm && (
                    <button
                      onClick={() => setShowAddAddressForm(true)}
                      className="btn-lime"
                      style={{ padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', borderRadius: 'var(--radius-md)' }}
                    >
                      <Plus size={16} />
                      <span>Add New</span>
                    </button>
                  )}
                </div>

                {addressSuccessMessage && (
                  <div style={{
                    backgroundColor: '#dcfce7',
                    border: '1px solid #bbf7d0',
                    color: '#15803d',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '20px',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <CheckCircle size={16} />
                    <span>{addressSuccessMessage}</span>
                  </div>
                )}

                {/* Inline form to Add Address */}
                {showAddAddressForm && (
                  <div style={{
                    border: '2px solid var(--primary-lime)',
                    backgroundColor: 'var(--primary-lime-light)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '24px',
                    marginBottom: '32px',
                  }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '16px' }}>Add Sacred Delivery Address</h3>
                    <form onSubmit={handleAddAddressSubmit}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }} className="form-grid-3col">
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '4px' }}>Receiver's Full Name</label>
                            <input
                              type="text"
                              required
                              placeholder="Devotee Name"
                              value={newAddress.name}
                              onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', fontWeight: 600, outline: 'none' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '4px' }}>Address Label</label>
                            <input
                              type="text"
                              placeholder="e.g. Home, Office, Temple"
                              value={newAddress.type}
                              onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value })}
                              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', fontWeight: 600, outline: 'none' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '4px' }}>Contact Phone</label>
                            <input
                              type="text"
                              required
                              placeholder="Phone Number"
                              value={newAddress.phone}
                              onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', fontWeight: 600, outline: 'none' }}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '4px' }}>Full Street Address</label>
                          <input
                            type="text"
                            required
                            placeholder="House / Apartment No, Street name, Landmark"
                            value={newAddress.street}
                            onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', fontWeight: 600, outline: 'none' }}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }} className="form-grid-3col">
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '4px' }}>City</label>
                            <input
                              type="text"
                              required
                              placeholder="City"
                              value={newAddress.city}
                              onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', fontWeight: 600, outline: 'none' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '4px' }}>State</label>
                            <input
                              type="text"
                              required
                              placeholder="State"
                              value={newAddress.state}
                              onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', fontWeight: 600, outline: 'none' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '4px' }}>ZIP Code</label>
                            <input
                              type="text"
                              required
                              placeholder="ZIP code"
                              value={newAddress.zip}
                              onChange={(e) => setNewAddress({ ...newAddress, zip: e.target.value })}
                              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', fontWeight: 600, outline: 'none' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                          <button
                            type="submit"
                            className="btn-lime"
                            style={{ padding: '10px 20px', fontSize: '0.82rem', borderRadius: 'var(--radius-md)' }}
                          >
                            Save Address
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddAddressForm(false)}
                            className="btn-outline"
                            style={{ padding: '10px 20px', fontSize: '0.82rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
                          >
                            Cancel
                          </button>
                        </div>

                      </div>
                    </form>
                  </div>
                )}

                {/* Saved Addresses List Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="hero-grid-split">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      style={{
                        border: addr.isDefault ? '2px solid var(--primary-lime)' : '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '20px',
                        backgroundColor: addr.isDefault ? 'var(--primary-lime-light)' : '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '180px',
                        boxShadow: 'var(--shadow-sm)',
                        position: 'relative'
                      }}
                    >
                      <div>
                        {/* Address Label Line */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            color: addr.isDefault ? 'var(--primary-lime)' : 'var(--text-dark)',
                            backgroundColor: addr.isDefault ? '#ffedd5' : '#f3f4f6',
                            padding: '3px 10px',
                            borderRadius: 'var(--radius-full)'
                          }}>
                            {addr.type}
                          </span>
                          {addr.isDefault && (
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary-lime)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                              <Check size={12} /> Primary Delivery
                            </span>
                          )}
                        </div>

                        {/* Name & Phone */}
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)' }}>{addr.name}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Phone: {addr.phone}</p>
                        
                        {/* Street Address */}
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-dark)', lineHeight: 1.4, marginTop: '8px' }}>
                          {addr.street}, {addr.city}, {addr.state} - {addr.zip}
                        </p>
                      </div>

                      {/* Address Actions Toolbar */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '20px',
                        paddingTop: '12px',
                        borderTop: '1px solid rgba(0,0,0,0.06)'
                      }}>
                        {!addr.isDefault ? (
                          <button
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            style={{ fontSize: '0.78rem', color: 'var(--primary-lime)', fontWeight: 700 }}
                          >
                            Set as Primary
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Default Address</span>
                        )}

                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          style={{
                            color: '#ef4444',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.78rem',
                            fontWeight: 700
                          }}
                          title="Remove address"
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>

              </div>
            </div>

            {/* ==============================================
                TAB: WISHLIST (WISHLIST SYNC)
                ============================================== */}
            <div className={`profile-carousel-slide ${activeTab === 'wishlist' ? 'active' : ''}`} style={{ width: '100%', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '4px' }}>My Sacred Wishlist</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>Items saved for special poojas, auspicious days, or gifting. Synced in real-time.</p>

                {wishlistedProducts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
                    <span style={{ fontSize: '3rem' }}>❤️</span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '16px' }}>Your Wishlist is empty</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '20px' }}>
                      Tap the heart icon on any product in the shop to add it to your wishlist.
                    </p>
                    <button onClick={onNavigateToShop} className="btn-lime" style={{ fontSize: '0.85rem', padding: '10px 24px' }}>
                      Explore Products
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="hero-grid-split">
                    {wishlistedProducts.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-lg)',
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          backgroundColor: '#ffffff',
                          boxShadow: 'var(--shadow-sm)',
                          position: 'relative'
                        }}
                      >
                        {/* Remove from wishlist top-right x */}
                        <button
                          onClick={() => onToggleWishlist(p.id)}
                          style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            color: '#ef4444',
                            backgroundColor: '#fef2f2',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px'
                          }}
                          className="flex-center"
                          title="Remove from Wishlist"
                        >
                          <Trash2 size={12} />
                        </button>

                        <div style={{
                          width: '70px',
                          height: '70px',
                          borderRadius: 'var(--radius-md)',
                          background: getCategoryGradient(p.category),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {p.image && isImageUrl(p.image) ? (
                            <img 
                              src={getDisplayImageUrl(p.image)} 
                              alt={p.name} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} 
                            />
                          ) : (
                            <span style={{ fontSize: '2.2rem' }}>{p.image}</span>
                          )}
                        </div>

                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--primary-lime)', fontWeight: 800, textTransform: 'uppercase' }}>
                            {p.spiritualType}
                          </span>
                          <h4 style={{
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            color: 'var(--text-dark)',
                            margin: '2px 0',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {p.name}
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary-forest)' }}>₹{p.price}</span>
                            
                            <button
                              onClick={() => {
                                onAddToCart(p, 1);
                                alert(`${p.name} added to cart from Wishlist!`);
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: 'var(--primary-lime)'
                              }}
                            >
                              <ShoppingBag size={12} /> Add to Cart
                            </button>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>

            {/* ==============================================
                TAB: NOTIFICATION SETTINGS
                ============================================== */}
            <div className={`profile-carousel-slide ${activeTab === 'notifications' ? 'active' : ''}`} style={{ width: '100%', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '4px' }}>Communication Channels</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>Choose how you wish to receive order reports, daily blessings, and spiritual reminders.</p>

                {notifSuccessMessage && (
                  <div style={{
                    backgroundColor: '#dcfce7',
                    border: '1px solid #bbf7d0',
                    color: '#15803d',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '20px',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <CheckCircle size={16} />
                    <span>{notifSuccessMessage}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Whatsapp Updates Toggle */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)'
                  }}>
                    <div style={{ flexGrow: 1, paddingRight: '16px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>WhatsApp Dispatch Alerts</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Receive real-time tracking links, invoice downloads, and pooja blessing photos directly on WhatsApp.
                      </p>
                    </div>
                    <label style={{ display: 'inline-flex', cursor: 'pointer', position: 'relative' }}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.whatsappUpdates}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, whatsappUpdates: e.target.checked })}
                        style={{ display: 'none' }}
                      />
                      <div style={{
                        width: '46px',
                        height: '24px',
                        backgroundColor: notificationSettings.whatsappUpdates ? 'var(--primary-lime)' : '#e5e7eb',
                        borderRadius: 'var(--radius-full)',
                        padding: '2px',
                        transition: 'background-color 0.2s ease'
                      }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          backgroundColor: '#ffffff',
                          borderRadius: '50%',
                          transform: notificationSettings.whatsappUpdates ? 'translateX(22px)' : 'translateX(0)',
                          transition: 'transform 0.2s ease',
                          boxShadow: 'var(--shadow-sm)'
                        }} />
                      </div>
                    </label>
                  </div>

                  {/* Email newsletters Toggle */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)'
                  }}>
                    <div style={{ flexGrow: 1, paddingRight: '16px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>Sacred Intention & Festival Newsletters</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Curated monthly suggestions from Vedic experts on upcoming astrological transits, festival poojas, and rituals.
                      </p>
                    </div>
                    <label style={{ display: 'inline-flex', cursor: 'pointer', position: 'relative' }}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailSpiritual}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, emailSpiritual: e.target.checked })}
                        style={{ display: 'none' }}
                      />
                      <div style={{
                        width: '46px',
                        height: '24px',
                        backgroundColor: notificationSettings.emailSpiritual ? 'var(--primary-lime)' : '#e5e7eb',
                        borderRadius: 'var(--radius-full)',
                        padding: '2px',
                        transition: 'background-color 0.2s ease'
                      }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          backgroundColor: '#ffffff',
                          borderRadius: '50%',
                          transform: notificationSettings.emailSpiritual ? 'translateX(22px)' : 'translateX(0)',
                          transition: 'transform 0.2s ease',
                          boxShadow: 'var(--shadow-sm)'
                        }} />
                      </div>
                    </label>
                  </div>

                  {/* Email Order confirmation Toggle */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)'
                  }}>
                    <div style={{ flexGrow: 1, paddingRight: '16px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>Transactional Email Receipts</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Receive digital receipts and secure payment invoice PDFs instantly upon checkout.
                      </p>
                    </div>
                    <label style={{ display: 'inline-flex', cursor: 'pointer', position: 'relative' }}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailOrders}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, emailOrders: e.target.checked })}
                        style={{ display: 'none' }}
                      />
                      <div style={{
                        width: '46px',
                        height: '24px',
                        backgroundColor: notificationSettings.emailOrders ? 'var(--primary-lime)' : '#e5e7eb',
                        borderRadius: 'var(--radius-full)',
                        padding: '2px',
                        transition: 'background-color 0.2s ease'
                      }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          backgroundColor: '#ffffff',
                          borderRadius: '50%',
                          transform: notificationSettings.emailOrders ? 'translateX(22px)' : 'translateX(0)',
                          transition: 'transform 0.2s ease',
                          boxShadow: 'var(--shadow-sm)'
                        }} />
                      </div>
                    </label>
                  </div>

                  {/* Daily Intention reminder Toggle */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)'
                  }}>
                    <div style={{ flexGrow: 1, paddingRight: '16px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>Daily Mantra & Chanting Reminder</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Begin every morning with an encouraging spiritual quote or ritual recommendation based on current lunar phase (Tithi).
                      </p>
                    </div>
                    <label style={{ display: 'inline-flex', cursor: 'pointer', position: 'relative' }}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.dailyIntention}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, dailyIntention: e.target.checked })}
                        style={{ display: 'none' }}
                      />
                      <div style={{
                        width: '46px',
                        height: '24px',
                        backgroundColor: notificationSettings.dailyIntention ? 'var(--primary-lime)' : '#e5e7eb',
                        borderRadius: 'var(--radius-full)',
                        padding: '2px',
                        transition: 'background-color 0.2s ease'
                      }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          backgroundColor: '#ffffff',
                          borderRadius: '50%',
                          transform: notificationSettings.dailyIntention ? 'translateX(22px)' : 'translateX(0)',
                          transition: 'transform 0.2s ease',
                          boxShadow: 'var(--shadow-sm)'
                        }} />
                      </div>
                    </label>
                  </div>

                </div>

                <div style={{ marginTop: '28px' }}>
                  <button onClick={handleSaveNotifications} className="btn-lime" style={{ padding: '12px 28px', fontSize: '0.88rem' }}>
                    Save Preferences
                  </button>
                </div>

              </div>
            </div>

            {/* ==============================================
                TAB: AFFILIATE PARTNERSHIP
                ============================================== */}
            <div className={`profile-carousel-slide ${activeTab === 'affiliate' ? 'active' : ''}`} style={{ width: '100%', flexShrink: 0 }}>
              <div>
                {(!affiliateProfile || affiliateProfile.affiliate_status === 'inactive') ? (
                  <div>
                    {enrollmentStep === 'none' && (
                      <div style={{
                        padding: '40px',
                        backgroundColor: '#ffffff',
                        border: '1.5px solid var(--border-light)',
                        borderRadius: 'var(--radius-lg)',
                        textAlign: 'center',
                        boxShadow: 'var(--shadow-sm)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: 0, left: 0, right: 0,
                          height: '4px',
                          background: 'linear-gradient(90deg, var(--primary-forest) 0%, var(--primary-lime) 100%)'
                        }} />
                        <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '20px' }}>🕉️</span>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-dark)' }}>Join Mantra Puja Affiliate Program</h2>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '8px', maxWidth: '480px', margin: '8px auto 24px auto', lineHeight: 1.5 }}>
                          Become a devotee partner, share the divine blessings of certified Vedic pujas, and earn commission for every referred devotee.
                        </p>
                        
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '20px',
                          maxWidth: '440px',
                          margin: '0 auto 32px auto',
                          textAlign: 'left'
                        }} className="hero-grid-split">
                          <div style={{ padding: '16px', backgroundColor: 'var(--primary-lime-light)', borderRadius: 'var(--radius-md)', border: '1px solid #fde68a' }}>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary-lime)' }}>Direct Referrals</h4>
                            <p style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-dark)', margin: '4px 0' }}>10%</p>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>On referred devotee checkouts</span>
                          </div>
                          <div style={{ padding: '16px', backgroundColor: 'var(--primary-lime-light)', borderRadius: 'var(--radius-md)', border: '1px solid #fde68a' }}>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#b45309' }}>Lifetime Rewards</h4>
                            <p style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-dark)', margin: '4px 0' }}>Unlimited</p>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Whenever they buy again</span>
                          </div>
                        </div>

                        <button
                          onClick={() => setEnrollmentStep('terms')}
                          className="btn-lime"
                          style={{ padding: '12px 32px', fontSize: '0.9rem', fontWeight: 700 }}
                        >
                          Become an Affiliate
                        </button>
                      </div>
                    )}

                    {enrollmentStep === 'terms' && (
                      <div style={{
                        padding: '32px',
                        backgroundColor: '#ffffff',
                        border: '1.5px solid var(--border-light)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--shadow-md)'
                      }}>
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '16px' }}>Devotee Partnership Guidelines & Terms</h2>
                        
                        <div style={{
                          maxHeight: '280px',
                          overflowY: 'auto',
                          border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-md)',
                          padding: '16px 20px',
                          backgroundColor: '#f9fafb',
                          fontSize: '0.85rem',
                          color: 'var(--text-muted)',
                          lineHeight: 1.6,
                          marginBottom: '24px'
                        }}>
                          <h4 style={{ color: 'var(--text-dark)', fontWeight: 800, marginBottom: '6px' }}>1. Referral Commissions</h4>
                          <p style={{ marginBottom: '16px' }}>
                            You will receive a 10.00% commission on purchases made by users referred through your personal referral link. Share with one or multiple people and receive lifetime commissions whenever your referred devotees make a purchase.
                          </p>

                          <h4 style={{ color: 'var(--text-dark)', fontWeight: 800, marginBottom: '6px' }}>2. Holding Period and Security Lock</h4>
                          <p style={{ marginBottom: '16px' }}>
                            All earned commissions are initially placed in a pending state. Commissions are approved and released for withdrawal after a 7-day post-delivery cooling/holding period to protect against order returns and fraud.
                          </p>

                          <h4 style={{ color: 'var(--text-dark)', fontWeight: 800, marginBottom: '6px' }}>3. Minimum Withdrawal Threshold</h4>
                          <p style={{ marginBottom: '16px' }}>
                            Withdrawal requests can be submitted once your approved available balance is ₹1,000 or greater. Payments are processed within 3-5 business days upon administrative verification.
                          </p>

                          <h4 style={{ color: 'var(--text-dark)', fontWeight: 800, marginBottom: '6px' }}>4. Self-Referral and Integrity Rules</h4>
                          <p>
                            Purchasing items through your own referral link is strictly prohibited. Any suspicious, collusive, or fraudulent activity will result in immediate termination of affiliate status and the forfeiture of all unpaid earnings.
                          </p>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', marginBottom: '24px' }}>
                          <input
                            type="checkbox"
                            checked={termsChecked}
                            onChange={(e) => setTermsChecked(e.target.checked)}
                            style={{ marginTop: '3px' }}
                          />
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)', userSelect: 'none' }}>
                            I agree to the devotee program guidelines, commission tiers, and withdrawal conditions.
                          </span>
                        </label>

                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button
                            onClick={handleJoinAffiliate}
                            disabled={!termsChecked || joiningProgram}
                            className="btn-lime"
                            style={{
                              padding: '12px 28px',
                              fontSize: '0.88rem',
                              fontWeight: 700,
                              opacity: (!termsChecked || joiningProgram) ? 0.6 : 1,
                              cursor: (!termsChecked || joiningProgram) ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            {joiningProgram ? (
                              <>
                                <span style={{
                                  display: 'inline-block',
                                  width: '14px',
                                  height: '14px',
                                  border: '2px solid rgba(255,255,255,0.3)',
                                  borderTopColor: '#ffffff',
                                  borderRadius: '50%',
                                  animation: 'spin 0.6s linear infinite'
                                }} />
                                <span>Activating...</span>
                              </>
                            ) : (
                              <span>Accept & Join Program</span>
                            )}
                          </button>
                          
                          <button
                            onClick={() => setEnrollmentStep('none')}
                            disabled={joiningProgram}
                            className="btn-outline"
                            style={{ padding: '12px 24px', fontSize: '0.88rem', border: '1px solid var(--border-light)' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {enrollmentStep === 'success' && affiliateProfile && (
                      <div style={{
                        padding: '40px',
                        backgroundColor: '#ffffff',
                        border: '1.5px solid var(--border-light)',
                        borderRadius: 'var(--radius-lg)',
                        textAlign: 'center',
                        boxShadow: 'var(--shadow-lg)'
                      }}>
                        <div style={{
                          width: '72px',
                          height: '72px',
                          borderRadius: '50%',
                          backgroundColor: '#dcfce7',
                          color: '#166534',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 20px auto',
                          fontSize: '2.5rem'
                        }}>
                          ✓
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-dark)' }}>Devoted Partnership Activated!</h2>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '8px', marginBottom: '28px' }}>
                          Your affiliate code has been generated. You can now start sharing your unique links to track commissions.
                        </p>

                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '16px',
                          maxWidth: '460px',
                          margin: '0 auto 32px auto',
                          textAlign: 'left'
                        }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Your Referral Code</span>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              backgroundColor: '#f9fafb',
                              border: '1.5px solid var(--border-light)',
                              borderRadius: 'var(--radius-md)',
                              padding: '12px 16px',
                              fontSize: '1.1rem',
                              fontWeight: 800,
                              color: 'var(--primary-forest)'
                            }}>
                              <code>{affiliateProfile.affiliate_code}</code>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(affiliateProfile.affiliate_code);
                                  setCopiedLink(true);
                                  setTimeout(() => setCopiedLink(false), 2000);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--primary-lime)',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Copy size={14} />
                                <span>Copy Code</span>
                              </button>
                            </div>
                          </div>

                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Default Sharing Link</span>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              backgroundColor: '#f9fafb',
                              border: '1.5px solid var(--border-light)',
                              borderRadius: 'var(--radius-md)',
                              padding: '12px 16px',
                              fontSize: '0.88rem',
                              fontWeight: 600,
                              color: 'var(--text-dark)'
                            }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '16px' }}>
                                {window.location.origin + '?ref=' + affiliateProfile.affiliate_code}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(window.location.origin + '?ref=' + affiliateProfile.affiliate_code);
                                  setCopiedLink(true);
                                  setTimeout(() => setCopiedLink(false), 2000);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--primary-lime)',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  flexShrink: 0
                                }}
                              >
                                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setEnrollmentStep('none')}
                          className="btn-lime"
                          style={{ padding: '12px 28px', fontSize: '0.88rem', fontWeight: 700 }}
                        >
                          Go To Affiliate Dashboard
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                      <div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)' }}>Affiliate Devotee Dashboard</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Track your referral links and commission earnings.
                        </p>
                      </div>
                      
                      {(() => {
                        const status = affiliateProfile.affiliate_status;
                        let bg = '#fee2e2';
                        let text = '#991b1b';
                        let border = '#fecaca';
                        if (status === 'active') {
                          bg = '#dcfce7';
                          text = '#15803d';
                          border = '#bbf7d0';
                        } else if (status === 'pending') {
                          bg = '#fff7ed';
                          text = '#c2410c';
                          border = '#ffedd5';
                        }
                        return (
                          <span style={{
                            padding: '4px 14px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            backgroundColor: bg,
                            color: text,
                            border: `1px solid ${border}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: text }} />
                            Status: {status.toUpperCase()}
                          </span>
                        );
                      })()}
                    </div>

                    {affiliateProfile.affiliate_status === 'pending' ? (
                      /* Application Pending Approval Banner */
                      <div style={{
                        backgroundColor: '#fffbeb',
                        border: '1.5px solid #fef3c7',
                        borderRadius: 'var(--radius-lg)',
                        padding: '40px 24px',
                        textAlign: 'center',
                        boxShadow: 'var(--shadow-sm)',
                        margin: '24px 0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px'
                      }}>
                        <span style={{ fontSize: '3.5rem', display: 'block' }}>⏳</span>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#b45309', margin: 0 }}>
                          Application Pending Approval
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: '#6b5a55', margin: 0, maxWidth: '480px', lineHeight: 1.6 }}>
                          Your application to the Mantra Puja Devotee Partner Program is currently under review by our temple administrators. 
                          Once approved, your unique sharing link, barcode scanner, and commission console will be unlocked here. Thank you for your patience!
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Suspension Banner */}
                    {affiliateProfile.affiliate_status === 'suspended' && (
                      <div style={{
                        backgroundColor: '#fef2f2',
                        border: '1.5px solid #fecaca',
                        color: '#991b1b',
                        padding: '16px 20px',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: '28px',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        lineHeight: 1.5,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px'
                      }}>
                        <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                        <div>
                          <p style={{ fontWeight: 800 }}>Affiliate Partnership Suspended</p>
                          <p style={{ fontSize: '0.8rem', color: '#b91c1c', marginTop: '2px', fontWeight: 500 }}>
                            Your affiliate account has been suspended. Please contact support for assistance.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Earnings Stats Cards */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '16px',
                      marginBottom: '32px'
                    }} className="hero-grid-split">
                      
                      <div style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Earned</span>
                        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-dark)', marginTop: '4px' }}>₹{affiliateProfile.total_earned.toFixed(2)}</div>
                      </div>

                      <div style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available Balance</span>
                        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--primary-forest)', marginTop: '4px' }}>₹{affiliateProfile.available_balance.toFixed(2)}</div>
                      </div>

                      <div style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Earnings</span>
                        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#f59e0b', marginTop: '4px' }}>₹{affiliateProfile.pending_earnings.toFixed(2)}</div>
                      </div>

                      <div style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Referrals</span>
                        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--primary-lime)', marginTop: '4px' }}>
                          {filteredReferralTree.filter(n => n.level === 1).length} Devotees
                        </div>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          Devotees referred by you
                        </span>
                      </div>

                    </div>

                    {/* Share Info Box */}
                    {affiliateProfile.affiliate_status !== 'suspended' && (
                      <div style={{
                        backgroundColor: 'rgba(254, 243, 199, 0.4)',
                        border: '1.5px solid #ffedd5',
                        borderRadius: 'var(--radius-lg)',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        marginBottom: '30px'
                      }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Wallet size={18} style={{ color: 'var(--primary-lime)' }} />
                          Your Devotional Share Info
                        </h3>

                        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ flex: '1 1 300px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                              Referral Sharing Link
                            </label>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              backgroundColor: '#ffffff',
                              border: '1px solid var(--border-light)',
                              borderRadius: 'var(--radius-md)',
                              padding: '10px 14px',
                              fontSize: '0.85rem'
                            }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '12px', fontWeight: 600 }}>
                                {window.location.origin + '?ref=' + affiliateProfile.affiliate_code}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(window.location.origin + '?ref=' + affiliateProfile.affiliate_code);
                                  triggerToast('Referral link copied to clipboard!');
                                }}
                                style={{ background: 'none', border: 'none', color: 'var(--primary-lime)', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                                title="Copy Link"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Referral Barcode / QR Code */}
                          <div style={{ flex: '0 0 160px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', textAlign: 'center' }}>Referral QR Code</span>
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(window.location.origin + '?ref=' + affiliateProfile.affiliate_code)}`}
                              alt="Referral QR Code"
                              style={{ width: '120px', height: '120px', display: 'block' }}
                            />
                            <button
                              onClick={async () => {
                                try {
                                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '?ref=' + affiliateProfile.affiliate_code)}`;
                                  const response = await fetch(qrUrl);
                                  const blob = await response.blob();
                                  const blobUrl = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = blobUrl;
                                  a.download = `MantraPuja-Referral-QR-${affiliateProfile.affiliate_code}.png`;
                                  a.click();
                                  URL.revokeObjectURL(blobUrl);
                                } catch {
                                  window.open(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(window.location.origin + '?ref=' + affiliateProfile.affiliate_code)}`, '_blank');
                                }
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary-lime)',
                                cursor: 'pointer',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              Download QR
                            </button>
                          </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '4px 0' }} />

                        {/* SOCIAL SHARE CONSOLE */}
                        <div>
                          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Sparkles size={16} style={{ color: 'var(--primary-lime)' }} />
                            🌸 Divine Blessings Share Console
                          </h3>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            
                            {/* Device native share */}
                            <button
                              onClick={handleNativeShare}
                              style={{
                                width: '100%',
                                padding: '14px',
                                backgroundColor: 'var(--primary-lime)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '0.92rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 10px rgba(22, 163, 74, 0.25)',
                                transition: 'transform 0.2s, background-color 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.backgroundColor = 'var(--primary-forest)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.backgroundColor = 'var(--primary-lime)';
                              }}
                            >
                              <Share2 size={18} />
                              Share This
                            </button>

                            {/* Channel items */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                              gap: '8px',
                              marginTop: '4px'
                            }}>
                              
                              <button
                                onClick={handleWhatsappShare}
                                style={{
                                  padding: '10px 8px',
                                  backgroundColor: '#16a34a',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '10px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  transition: 'transform 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                              >
                                <MessageCircle size={14} />
                                WhatsApp
                              </button>

                              <button
                                onClick={handleFacebookShare}
                                style={{
                                  padding: '10px 8px',
                                  backgroundColor: '#1877f2',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '10px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  transition: 'transform 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                              >
                                <FacebookIcon size={14} />
                                Facebook
                              </button>

                              <button
                                onClick={handleTwitterShare}
                                style={{
                                  padding: '10px 8px',
                                  backgroundColor: '#000000',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '10px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  transition: 'transform 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                              >
                                <TwitterIcon size={14} />
                                Twitter
                              </button>

                              <button
                                onClick={handleLinkedinShare}
                                style={{
                                  padding: '10px 8px',
                                  backgroundColor: '#0077b5',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '10px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  transition: 'transform 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                              >
                                <LinkedinIcon size={14} />
                                LinkedIn
                              </button>

                              <button
                                onClick={handleInstagramShare}
                                style={{
                                  padding: '10px 8px',
                                  backgroundColor: '#e1306c',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '10px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  transition: 'transform 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                              >
                                <InstagramIcon size={14} />
                                Instagram
                              </button>

                            </div>

                          </div>
                        </div>

                      </div>
                    )}

                    {/* Dashboard Sub-tabs */}
                    <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setDevoteeSubTab('network')}
                        style={{
                          background: devoteeSubTab === 'network' ? 'var(--primary-lime-light)' : 'transparent',
                          border: devoteeSubTab === 'network' ? '1px solid var(--primary-lime)' : '1px solid transparent',
                          color: devoteeSubTab === 'network' ? 'var(--primary-lime)' : 'var(--text-muted)',
                          padding: '8px 16px',
                          borderRadius: 'var(--radius-md)',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        🌿 Referred Devotees
                      </button>
                      <button
                        onClick={() => setDevoteeSubTab('earnings')}
                        style={{
                          background: devoteeSubTab === 'earnings' ? 'var(--primary-lime-light)' : 'transparent',
                          border: devoteeSubTab === 'earnings' ? '1px solid var(--primary-lime)' : '1px solid transparent',
                          color: devoteeSubTab === 'earnings' ? 'var(--primary-lime)' : 'var(--text-muted)',
                          padding: '8px 16px',
                          borderRadius: 'var(--radius-md)',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        📊 Earnings Ledger
                      </button>
                      <button
                        onClick={() => setDevoteeSubTab('payout')}
                        style={{
                          background: devoteeSubTab === 'payout' ? 'var(--primary-lime-light)' : 'transparent',
                          border: devoteeSubTab === 'payout' ? '1px solid var(--primary-lime)' : '1px solid transparent',
                          color: devoteeSubTab === 'payout' ? 'var(--primary-lime)' : 'var(--text-muted)',
                          padding: '8px 16px',
                          borderRadius: 'var(--radius-md)',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        💰 Cashout & History
                      </button>
                    </div>

                    {/* SUBTAB: NETWORK */}
                    {devoteeSubTab === 'network' && (
                      <div style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '24px',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        textAlign: 'left'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                          <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>🌿</span>
                            Searchable Referrals List
                            <button
                              onClick={() => {
                                fetchReferralTree();
                                fetchAffiliateProfile();
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                padding: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                transition: 'color 0.2s',
                              }}
                              title="Refresh Referrals Data"
                            >
                              <RefreshCw size={14} className={treeLoading ? 'spin' : ''} />
                            </button>
                          </h3>
                          <input
                            type="text"
                            placeholder="Search devotee name..."
                            value={referralSearch}
                            onChange={(e) => setReferralSearch(e.target.value)}
                            style={{
                              border: '1px solid var(--border-light)',
                              padding: '6px 12px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.8rem',
                              width: '200px',
                              outline: 'none'
                            }}
                          />
                        </div>
                        
                        {treeLoading ? (
                          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                            Loading referrals...
                          </div>
                        ) : filteredReferralTree.filter(n => n.level === 1).length === 0 ? (
                          <div style={{
                            padding: '24px',
                            textAlign: 'center',
                            backgroundColor: '#f9fafb',
                            border: '1px dashed var(--border-light)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.88rem',
                            color: 'var(--text-muted)',
                            lineHeight: 1.5
                          }}>
                            You do not have any devotee referrals yet.<br />
                            Share your link to start earning rewards!
                          </div>
                        ) : (
                          <div style={{
                            backgroundColor: '#f9fafb',
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-md)',
                            padding: '16px 20px',
                            maxHeight: '400px',
                            overflowY: 'auto'
                          }}>
                            {filteredReferralTree.filter(n => n.level === 1).map(node => {
                              const displayName = node.full_name && node.full_name.trim() !== '' ? node.full_name : node.user_id;
                              return (
                                <div key={node.user_id} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '12px 16px',
                                  borderBottom: '1px solid var(--border-light)',
                                  backgroundColor: '#ffffff',
                                  borderRadius: 'var(--radius-md)',
                                  marginBottom: '8px',
                                  boxShadow: 'var(--shadow-sm)'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '1.5rem' }}>👤</span>
                                    <div>
                                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
                                        {highlightText(displayName, referralSearch)}
                                      </h4>
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        Joined: {new Date(node.joined_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                  <span style={{ fontSize: '0.78rem', fontWeight: 700, backgroundColor: 'var(--primary-lime-light)', color: 'var(--primary-lime)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                                    Referred Devotee
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUBTAB: EARNINGS LEDGER */}
                    {devoteeSubTab === 'earnings' && (
                      <div style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '24px',
                        boxShadow: 'var(--shadow-sm)',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px'
                      }}>
                        <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                          📊 Commissions Ledger
                        </h3>

                        {/* Commissions Table */}
                        {isLoadingCommissions ? (
                          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
                            Loading commissions ledger...
                          </div>
                        ) : commissions.length === 0 ? (
                          <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#f9fafb', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                            No commissions transactions have been recorded.
                          </div>
                        ) : (
                          <div style={{ overflowX: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                              <thead>
                                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid var(--border-light)' }}>
                                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Buyer Devotee</th>
                                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Order ID</th>
                                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Order Total</th>
                                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Rate (%)</th>
                                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Earnings</th>
                                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Status</th>
                                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Date Placed</th>
                                </tr>
                              </thead>
                              <tbody>
                                {commissions.map((comm) => (
                                  <tr key={comm.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                    <td style={{ padding: '10px 14px', fontWeight: 'bold' }}>{comm.buyer_name || 'Anonymous Devotee'}</td>
                                    <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>#{comm.order_id}</td>
                                    <td style={{ padding: '10px 14px' }}>₹{parseFloat(comm.order_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    <td style={{ padding: '10px 14px' }}>{comm.commission_percent}%</td>
                                    <td style={{ padding: '10px 14px', fontWeight: 800, color: comm.status === 'cancelled' ? '#991b1b' : 'var(--primary-lime)' }}>
                                      {comm.status === 'cancelled' ? '-' : ''}₹{parseFloat(comm.commission_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ padding: '10px 14px' }}>
                                      <span style={{
                                        padding: '2px 8px',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: '0.68rem',
                                        fontWeight: 800,
                                        backgroundColor:
                                          comm.status === 'approved' ? '#dcfce7' :
                                          comm.status === 'cancelled' ? '#fee2e2' :
                                          comm.status === 'delivered_pending_hold' ? '#dbeafe' : '#fef3c7',
                                        color:
                                          comm.status === 'approved' ? '#15803d' :
                                          comm.status === 'cancelled' ? '#991b1b' :
                                          comm.status === 'delivered_pending_hold' ? '#1d4ed8' : '#b45309',
                                        border: '1px solid ' + (
                                          comm.status === 'approved' ? '#bbf7d0' :
                                          comm.status === 'cancelled' ? '#fecaca' :
                                          comm.status === 'delivered_pending_hold' ? '#bfdbfe' : '#fde68a'
                                        )
                                      }}>
                                        {comm.status === 'delivered_pending_hold' ? 'HOLD WINDOW' : comm.status.toUpperCase()}
                                      </span>
                                    </td>
                                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                                      {new Date(comm.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUBTAB: PAYOUT REQUESTS & HISTORY */}
                    {devoteeSubTab === 'payout' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '30px' }} className="hero-grid-split">
                        
                        {/* Payout History queue list */}
                        <div style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-lg)',
                          padding: '24px',
                          boxShadow: 'var(--shadow-sm)',
                          textAlign: 'left',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '16px'
                        }}>
                          <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                            💰 Cashout History Log
                          </h3>

                          {isLoadingPayoutHistory ? (
                            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
                              Loading payout log...
                            </div>
                          ) : payoutHistory.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#f9fafb', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                              No payout withdrawal requests found.
                            </div>
                          ) : (
                            <div style={{ overflowX: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                                <thead>
                                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid var(--border-light)' }}>
                                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Date Requested</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Method</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Requested Amount</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Status</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Reference Details</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {payoutHistory.map((h) => (
                                    <tr key={h.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                                        {new Date(h.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      </td>
                                      <td style={{ padding: '10px 14px', fontWeight: 700, textTransform: 'uppercase' }}>{h.payment_method}</td>
                                      <td style={{ padding: '10px 14px', fontWeight: 800 }}>₹{parseFloat(h.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                      <td style={{ padding: '10px 14px' }}>
                                        <span style={{
                                          padding: '2px 8px',
                                          borderRadius: 'var(--radius-full)',
                                          fontSize: '0.68rem',
                                          fontWeight: 800,
                                          backgroundColor:
                                            h.status === 'paid' ? '#dcfce7' :
                                            h.status === 'approved' ? '#dbeafe' :
                                            h.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                                          color:
                                            h.status === 'paid' ? '#15803d' :
                                            h.status === 'approved' ? '#1d4ed8' :
                                            h.status === 'rejected' ? '#991b1b' : '#b45309',
                                          border: '1px solid ' + (
                                            h.status === 'paid' ? '#bbf7d0' :
                                            h.status === 'approved' ? '#bfdbfe' :
                                            h.status === 'rejected' ? '#fecaca' : '#fde68a'
                                          )
                                        }}>
                                          {h.status.toUpperCase()}
                                        </span>
                                        {h.status === 'rejected' && h.admin_notes && (
                                          <p style={{ margin: '3px 0 0 0', fontSize: '0.68rem', color: '#b91c1c' }}>Reason: {h.admin_notes}</p>
                                        )}
                                      </td>
                                      <td style={{ padding: '10px 14px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                        {h.status === 'paid' && h.txn_id ? (
                                          <span style={{ color: '#16a34a', fontWeight: 700, fontFamily: 'monospace' }}>Txn Ref: {h.txn_id}</span>
                                        ) : h.payment_method === 'upi' ? (
                                          <span>UPI: {h.payment_details?.upi_id}</span>
                                        ) : (
                                          <span>Bank: {h.payment_details?.bank_name} - *{h.payment_details?.account_number?.slice(-4)}</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* Payout Request Panel Form */}
                        <div style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-lg)',
                          padding: '24px',
                          boxShadow: 'var(--shadow-sm)',
                          textAlign: 'left',
                          height: 'fit-content'
                        }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-dark)', marginBottom: '16px' }}>
                            Request Balance Payout
                          </h3>

                          {affiliateProfile.affiliate_status === 'suspended' ? (
                            <div style={{
                              padding: '16px',
                              backgroundColor: '#fee2e2',
                              border: '1px solid #fca5a5',
                              borderRadius: 'var(--radius-md)',
                              color: '#991b1b',
                              fontSize: '0.82rem',
                              lineHeight: 1.5
                            }}>
                              <strong>Payouts Blocked:</strong> Your affiliate account has been suspended. Please contact support for assistance.
                            </div>
                          ) : affiliateProfile.available_balance < minWithdrawalLimit ? (
                            <div style={{
                              padding: '16px',
                              backgroundColor: '#fffbeb',
                              border: '1px solid #fde68a',
                              borderRadius: 'var(--radius-md)',
                              color: '#b45309',
                              fontSize: '0.8rem',
                              lineHeight: 1.5
                            }}>
                              <strong>Payout Threshold Lock:</strong> Your available balance must be ₹{minWithdrawalLimit.toLocaleString('en-IN', { minimumFractionDigits: 2 })} or higher to request payout.<br />
                              Current balance available: <strong>₹{affiliateProfile.available_balance.toFixed(2)}</strong>.
                            </div>
                          ) : (
                            <form onSubmit={handleRequestPayout} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              <div style={{ padding: '12px', backgroundColor: 'var(--primary-lime-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-lime)' }}>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Amount to withdraw</span>
                                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-dark)' }}>
                                  ₹{affiliateProfile.available_balance.toFixed(2)}
                                </span>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Payment Channel</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <button
                                    type="button"
                                    onClick={() => setPayoutMethod('upi')}
                                    style={{
                                      flex: 1,
                                      padding: '8px',
                                      borderRadius: 'var(--radius-sm)',
                                      fontSize: '0.8rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      border: payoutMethod === 'upi' ? '1.5px solid var(--primary-lime)' : '1px solid var(--border-light)',
                                      background: payoutMethod === 'upi' ? 'var(--primary-lime-light)' : '#ffffff',
                                      color: payoutMethod === 'upi' ? 'var(--primary-lime)' : 'var(--text-muted)'
                                    }}
                                  >
                                    UPI Transfer
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPayoutMethod('bank')}
                                    style={{
                                      flex: 1,
                                      padding: '8px',
                                      borderRadius: 'var(--radius-sm)',
                                      fontSize: '0.8rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      border: payoutMethod === 'bank' ? '1.5px solid var(--primary-lime)' : '1px solid var(--border-light)',
                                      background: payoutMethod === 'bank' ? 'var(--primary-lime-light)' : '#ffffff',
                                      color: payoutMethod === 'bank' ? 'var(--primary-lime)' : 'var(--text-muted)'
                                    }}
                                  >
                                    Bank Transfer
                                  </button>
                                </div>
                              </div>

                              {payoutMethod === 'upi' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>UPI Address ID</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. name@upi or phone@paytm"
                                      required
                                      value={upiId}
                                      onChange={(e) => setUpiId(e.target.value)}
                                      style={{ border: '1px solid var(--border-light)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', outline: 'none' }}
                                    />
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Account Holder Name</label>
                                    <input
                                      type="text"
                                      placeholder="As registered in bank account"
                                      required
                                      value={upiHolderName}
                                      onChange={(e) => setUpiHolderName(e.target.value)}
                                      style={{ border: '1px solid var(--border-light)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', outline: 'none' }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>Account Holder Name</label>
                                    <input
                                      type="text"
                                      placeholder="Full Name"
                                      required
                                      value={bankHolderName}
                                      onChange={(e) => setBankHolderName(e.target.value)}
                                      style={{ border: '1px solid var(--border-light)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', outline: 'none' }}
                                    />
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>Account Number</label>
                                    <input
                                      type="text"
                                      placeholder="9 to 18 digits"
                                      required
                                      value={bankAccountNumber}
                                      onChange={(e) => setBankAccountNumber(e.target.value)}
                                      style={{ border: '1px solid var(--border-light)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', outline: 'none' }}
                                    />
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>Bank IFSC Code</label>
                                    <input
                                      type="text"
                                      maxLength={11}
                                      placeholder="11-digit alphanumeric"
                                      required
                                      value={bankIfsc}
                                      onChange={(e) => setBankIfsc(e.target.value)}
                                      style={{ border: '1px solid var(--border-light)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', outline: 'none' }}
                                    />
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>Bank Name</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. State Bank of India, HDFC"
                                      required
                                      value={bankName}
                                      onChange={(e) => setBankName(e.target.value)}
                                      style={{ border: '1px solid var(--border-light)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', outline: 'none' }}
                                    />
                                  </div>
                                </div>
                              )}

                              <button
                                type="submit"
                                disabled={isSubmittingPayout}
                                style={{
                                  backgroundColor: 'var(--primary-lime)',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '11px',
                                  borderRadius: 'var(--radius-sm)',
                                  fontWeight: 700,
                                  fontSize: '0.82rem',
                                  cursor: 'pointer',
                                  marginTop: '8px'
                                }}
                              >
                                {isSubmittingPayout ? 'Submitting request...' : 'Request Balance Payout'}
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    )}

                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ==============================================
                TAB: LOGOUT (SECURE LOGOUT SESSION CLEAR)
                ============================================== */}
            <div className={`profile-carousel-slide ${activeTab === 'logout' ? 'active' : ''}`} style={{ width: '100%', flexShrink: 0 }}>
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <span style={{ fontSize: '4rem', display: 'block', marginBottom: '20px' }}>🧘‍♀️</span>
                
                {logoutConfirmed ? (
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)' }}>Safely logging out...</h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      May peace and divine blessings be with you always. Returning home.
                    </p>
                  </div>
                ) : (
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)' }}>Confirm Secure Logout</h2>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '6px', maxWidth: '440px', margin: '6px auto 32px auto', lineHeight: 1.5 }}>
                      Are you sure you want to log out of your spiritual dashboard? Your saved addresses, pooja orders, and synchronized wishlist will remain safely stored.
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                      <button
                        onClick={handleLogoutAction}
                        style={{
                          backgroundColor: '#dc2626',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          padding: '12px 28px',
                          borderRadius: 'var(--radius-md)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <LogOut size={16} />
                        <span>Confirm Logout</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('info')}
                        className="btn-outline"
                        style={{
                          padding: '12px 28px',
                          fontSize: '0.9rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-light)'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>

            </div> {/* End profile-carousel-inner */}

          </main>

          </div> {/* Closes content area wrapper div */}
        </div>
      )}
    </div> {/* Closes .container */}

        {showInstagramTip && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(45, 20, 14, 0.6)',
            backdropFilter: 'blur(8px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              border: '2px solid #ffedd5',
              padding: '32px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              textAlign: 'center'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0 0 16px 0', color: '#2d140e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <InstagramIcon size={24} color="#e1306c" />
                Share on Instagram Stories
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#6b5a55', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                Instagram does not support direct links or file transfers from web browsers. We have automatically uploaded your unified **Blessings Card** image to Cloudflare CDN and copied the share message containing your referral link and card preview link to your clipboard.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#fcf8f5', borderRadius: '16px', padding: '16px', border: '1px solid #ffedd5', marginBottom: '24px', fontSize: '0.85rem', color: '#4c1d11', textAlign: 'left' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ fontWeight: 800, color: '#ea580c' }}>1.</span>
                  <span>Open your Instagram App and swipe right to create a new **Story**.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ fontWeight: 800, color: '#ea580c' }}>2.</span>
                  <span>Use the **Link Sticker** to add your copied referral link.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ fontWeight: 800, color: '#ea580c' }}>3.</span>
                  <span>Paste the full spiritual message and dynamic barcode link directly on your story and publish!</span>
                </div>
              </div>
              <button
                onClick={() => setShowInstagramTip(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#ea580c',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.2)'
                }}
              >
                Got It, Open Instagram
              </button>
            </div>
          </div>
        )}

        {/* Toast popup */}
        {toastMsg && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#2d140e',
            color: '#ffffff',
            padding: '16px 24px',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.9rem',
            fontWeight: 700,
            border: '1.5px solid #ea580c',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <CheckCircle size={18} style={{ color: '#ea580c' }} />
            <span>{toastMsg}</span>
          </div>
        )}

      </div>
  );
};
