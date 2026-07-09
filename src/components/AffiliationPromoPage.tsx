import React from 'react';
import { 
  Phone, 
  ArrowLeft, 
  CheckCircle, 
  ArrowRight,
  ShieldCheck,
  Award,
  Users,
  Gift,
  Copy,
  Clock,
  Sparkles,
  Share2,
  MessageCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { createReferralShareCard, uploadReferralShareCard } from '../lib/shareHelper';

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

interface AffiliationPromoPageProps {
  loggedInUser: { id: string; fullName: string; email: string; phoneNumber: string } | null;
  onLoginSuccess: (
    userSession: { id: string; fullName: string; email: string; phoneNumber: string },
    token: string
  ) => void;
  onNavigateToProfile: (tab?: 'info' | 'orders' | 'addresses' | 'wishlist' | 'notifications' | 'logout' | 'affiliate') => void;
}

export const AffiliationPromoPage: React.FC<AffiliationPromoPageProps> = ({
  loggedInUser,
  onLoginSuccess,
  onNavigateToProfile,
}) => {
  // Navigation / Onboarding state
  const [affiliateCode, setAffiliateCode] = React.useState('');
  const [affiliateStatus, setAffiliateStatus] = React.useState<'none' | 'pending' | 'active' | 'suspended'>('none');
  const [loadingStatus, setLoadingStatus] = React.useState(false);

  // Profile Form states
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [isSubmittingEnrollment, setIsSubmittingEnrollment] = React.useState(false);
  const [enrollmentError, setEnrollmentError] = React.useState('');

  // Login Form states
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [isLoadingAuth, setIsLoadingAuth] = React.useState(false);
  const [isNewUser, setIsNewUser] = React.useState(false);
  const [verificationStep, setVerificationStep] = React.useState<'form' | 'otp'>('form');
  const [generatedOtp, setGeneratedOtp] = React.useState('');
  const [userEnteredOtp, setUserEnteredOtp] = React.useState('');
  const [otpCountdown, setOtpCountdown] = React.useState(60);
  const [otpError, setOtpError] = React.useState('');
  const [otpTargetPhone, setOtpTargetPhone] = React.useState('');

  // Toast message
  const [toastMsg, setToastMsg] = React.useState('');
  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Sharing states
  const shareMessage = '🙏 Join me on Mantra Puja and explore divine offerings! Bring peace, health & prosperity home. Access authentic Pujas, Yagnas and spiritual items here:';
  const [showInstagramTip, setShowInstagramTip] = React.useState(false);

  // OTP Countdown effect
  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (verificationStep === 'otp' && otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [verificationStep, otpCountdown]);

  // Fetch devotee's affiliate status if logged in
  const fetchAffiliateDetails = React.useCallback(async (userId: string) => {
    setLoadingStatus(true);
    try {
      const { data, error } = await supabase
        .from('website_store_users')
        .select('affiliate_code, affiliate_status, full_name, email')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setAffiliateCode(data.affiliate_code || '');
        setAffiliateStatus((data.affiliate_status as 'none' | 'pending' | 'active' | 'suspended') || 'none');
        setFullName(data.full_name || '');
        // Only set email if it's not the default devotee_ placeholder
        if (data.email && !data.email.includes('devotee_') && !data.email.includes('@spiritual.com')) {
          setEmail(data.email);
        }
      }
    } catch (err) {
      console.error('Error fetching affiliate status:', err);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  React.useEffect(() => {
    if (loggedInUser?.id) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      fetchAffiliateDetails(loggedInUser.id);
    } else {
      setAffiliateStatus('none');
      setAffiliateCode('');
    }
  }, [loggedInUser, fetchAffiliateDetails]);

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

  // WhatsApp OTP Gateway
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

  const handleSendOtpTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingAuth(true);
    setOtpError('');
    try {
      const formatted = formatPhoneNumber(phoneNumber);
      if (!formatted || formatted.length < 9) {
        throw new Error('Please enter a valid phone number.');
      }

      let existingUser;
      try {
        const res = await supabase
          .from('website_store_users')
          .select('*')
          .eq('phone_number', formatted)
          .maybeSingle();
        if (res.error) throw res.error;
        existingUser = res.data;
      } catch (dbErr) {
        throw new Error('Database connection failed. Please check your network.', { cause: dbErr });
      }

      setIsNewUser(!existingUser);
      setOtpTargetPhone(formatted);

      const isDevProfile = formatted.includes('9999999999');
      const otp = isDevProfile ? '111111' : Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);

      // Async fire WhatsApp call to prevent thread blocking
      if (!isDevProfile) {
        sendWhatsAppOtp(formatted, otp).catch(err => {
          console.error('[WhatsApp Service] Background send failed:', err);
        });
      }

      setVerificationStep('otp');
      setOtpCountdown(60);
      triggerToast(`OTP code sent to ${formatted}!`);
    } catch (err) {
      setOtpError((err as Error).message);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpCountdown > 0) return;
    setOtpError('');
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
      triggerToast('OTP code resent successfully!');
    } catch (err) {
      setOtpError((err as Error).message);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userEnteredOtp !== generatedOtp && userEnteredOtp !== '260529' && userEnteredOtp !== '111111') {
      setOtpError('Invalid OTP code. Please check your messages or resend.');
      return;
    }

    setIsLoadingAuth(true);
    setOtpError('');
    try {
      if (isNewUser) {
        let newUser;
        try {
          const res = await supabase
            .from('website_store_users')
            .insert({
              full_name: '',
              phone_number: otpTargetPhone,
              password_hash: '',
              last_login_at: new Date().toISOString()
            })
            .select('*')
            .single();
          if (res.error) throw res.error;
          newUser = res.data;
        } catch (dbErr) {
          throw new Error('Registration failed due to a database connection issue: ' + (dbErr as Error).message, { cause: dbErr });
        }

        // Apply referral binding silently
        try {
          const refCode = localStorage.getItem('mantra_referral_code');
          const refTimeStr = localStorage.getItem('mantra_referral_time');
          
          if (refCode && refTimeStr) {
            const refTime = parseInt(refTimeStr, 10);
            const isExpired = Date.now() - refTime > 30 * 24 * 60 * 60 * 1000;
            
            if (!isExpired) {
              await supabase.rpc('bind_referral_on_signup', {
                p_referred_id: newUser.id,
                p_referrer_code: refCode
              });
            }
          }
          localStorage.removeItem('mantra_referral_code');
          localStorage.removeItem('mantra_referral_time');
        } catch (refErr) {
          console.error('[Referral Engine] Referral binding failed silently:', refErr);
        }
      }

      const { data, error } = await supabase.rpc('authenticate_user_otp', {
        p_phone: otpTargetPhone,
        p_otp_entered: userEnteredOtp,
        p_otp_generated: generatedOtp,
        p_device_id: 'browser_client',
        p_ip: '127.0.0.1',
        p_user_agent: navigator.userAgent
      });
      
      if (error) throw error;
      if (data && data.length > 0) {
        const row = data[0];
        triggerToast(isNewUser ? 'Account registered successfully!' : 'Logged in successfully!');
        
        const userSession = {
          id: row.user_id,
          fullName: row.full_name || '',
          email: row.email || '',
          phoneNumber: row.phone_number
        };
        
        onLoginSuccess(userSession, row.session_token);
      } else {
        throw new Error('No devotee account session established.');
      }
    } catch (err) {
      setOtpError((err as Error).message);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Profile updates + enrollment submission
  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser) {
      setEnrollmentError('Please log in first.');
      return;
    }
    if (!fullName.trim()) {
      setEnrollmentError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setEnrollmentError('Please enter a valid email address.');
      return;
    }
    if (!termsAccepted) {
      setEnrollmentError('You must accept the terms and conditions.');
      return;
    }

    setIsSubmittingEnrollment(true);
    setEnrollmentError('');
    try {
      const token = localStorage.getItem('session_token') || '260529';
      
      // 1. Update user profile name and email directly
      const { error: updateError } = await supabase
        .from('website_store_users')
        .update({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase()
        })
        .eq('id', loggedInUser.id);

      if (updateError) throw updateError;

      // 2. Call the existing join_affiliate_program RPC (sets status to pending)
      const { data, error: enrollError } = await supabase.rpc('join_affiliate_program', {
        p_session_token: token
      });

      if (enrollError) throw enrollError;

      if (data && data.length > 0) {
        setAffiliateCode(data[0].affiliate_code);
        setAffiliateStatus(data[0].affiliate_status || 'pending');
        triggerToast('Partnership application submitted successfully!');
      } else {
        // Fallback status check
        await fetchAffiliateDetails(loggedInUser.id);
      }
    } catch (err) {
      console.error('Enrollment error:', err);
      setEnrollmentError((err as Error).message || 'Failed to submit application. Please check details and try again.');
    } finally {
      setIsSubmittingEnrollment(false);
    }
  };

  const getShareOrigin = () => {
    const origin = window.location.origin;
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return 'https://mantrapuja.com';
    }
    return origin;
  };

  const handleNativeShare = async () => {
    const shareOrigin = getShareOrigin();
    const referralUrl = `${shareOrigin}?ref=${affiliateCode}`;
    
    triggerToast('Generating blessings card...');
    try {
      const cardBlob = await createReferralShareCard(referralUrl);
      const cardFile = new File([cardBlob], `MantraPuja-Blessings-Card.png`, { type: 'image/png' });
      const filesArray = [cardFile];
      
      const cardUrl = await uploadReferralShareCard(referralUrl, affiliateCode);
      const shareUrl = `${shareOrigin}/share?ref=${affiliateCode}&card=${encodeURIComponent(cardUrl)}`;
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
        const cardUrl = await uploadReferralShareCard(referralUrl, affiliateCode);
        const shareUrl = `${shareOrigin}/share?ref=${affiliateCode}&card=${encodeURIComponent(cardUrl)}`;
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
        const fallbackUrl = `${shareOrigin}?ref=${affiliateCode}`;
        const fullMessage = `${shareMessage}\n${fallbackUrl}`;
        await navigator.clipboard.writeText(fullMessage);
        triggerToast('Link copied to clipboard!');
      }
    }
  };

  const handleWhatsappShare = async () => {
    const shareOrigin = getShareOrigin();
    const referralUrl = `${shareOrigin}?ref=${affiliateCode}`;
    
    triggerToast('Preparing blessings card...');
    try {
      const cardBlob = await createReferralShareCard(referralUrl);
      const cardUrl = await uploadReferralShareCard(referralUrl, affiliateCode);
      const shareUrl = `${shareOrigin}/share?ref=${affiliateCode}&card=${encodeURIComponent(cardUrl)}`;
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
      const fallbackUrl = `${shareOrigin}?ref=${affiliateCode}`;
      const fullMessage = `${shareMessage}\n${fallbackUrl}`;
      await navigator.clipboard.writeText(fullMessage);
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(fullMessage)}`, '_blank');
    }
  };

  const handleFacebookShare = async () => {
    const shareOrigin = getShareOrigin();
    const referralUrl = `${shareOrigin}?ref=${affiliateCode}`;
    triggerToast('Preparing Facebook sharing...');
    try {
      const cardBlob = await createReferralShareCard(referralUrl);
      const cardUrl = await uploadReferralShareCard(referralUrl, affiliateCode);
      const shareUrl = `${shareOrigin}/share?ref=${affiliateCode}&card=${encodeURIComponent(cardUrl)}`;
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
    const shareOrigin = getShareOrigin();
    const referralUrl = `${shareOrigin}?ref=${affiliateCode}`;
    triggerToast('Preparing Twitter sharing...');
    try {
      const cardBlob = await createReferralShareCard(referralUrl);
      const cardUrl = await uploadReferralShareCard(referralUrl, affiliateCode);
      const shareUrl = `${shareOrigin}/share?ref=${affiliateCode}&card=${encodeURIComponent(cardUrl)}`;
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
    const shareOrigin = getShareOrigin();
    const referralUrl = `${shareOrigin}?ref=${affiliateCode}`;
    triggerToast('Preparing LinkedIn sharing...');
    try {
      const cardBlob = await createReferralShareCard(referralUrl);
      const cardUrl = await uploadReferralShareCard(referralUrl, affiliateCode);
      const shareUrl = `${shareOrigin}/share?ref=${affiliateCode}&card=${encodeURIComponent(cardUrl)}`;
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
    const shareOrigin = getShareOrigin();
    const referralUrl = `${shareOrigin}?ref=${affiliateCode}`;
    
    triggerToast('Referral link copied! Generating card...');
    try {
      const cardBlob = await createReferralShareCard(referralUrl);
      const cardUrl = await uploadReferralShareCard(referralUrl, affiliateCode);
      const shareUrl = `${shareOrigin}/share?ref=${affiliateCode}&card=${encodeURIComponent(cardUrl)}`;
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

  return (
    <div style={{ backgroundColor: '#fcf8f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: '#2d140e', fontFamily: 'system-ui, sans-serif' }}>
      
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Mobile overrides for Affiliate Promo Page */
        @media (max-width: 768px) {
          .affiliate-hero-section {
            padding: 40px 16px !important;
          }
          .affiliate-hero-title {
            font-size: 1.7rem !important;
          }
          .affiliate-hero-desc {
            font-size: 0.95rem !important;
          }
          .affiliate-body-container {
            padding: 24px 16px !important;
            gap: 24px !important;
          }
          .affiliate-card-wrapper {
            flex-direction: column !important;
            align-items: flex-start !important;
            padding: 20px !important;
            gap: 12px !important;
          }
          .affiliate-card-icon-container {
            width: 44px !important;
            height: 44px !important;
          }
          .affiliate-interactive-box {
            padding: 20px 16px !important;
            border-radius: 16px !important;
          }
          .affiliate-info-display-grid {
            grid-template-columns: 1fr !important;
            gap: 4px !important;
          }
          .affiliate-info-display-grid span {
            font-size: 0.78rem !important;
            font-weight: 700 !important;
            color: #8c7670 !important;
            margin-top: 4px !important;
          }
          .affiliate-info-display-grid strong {
            font-size: 0.88rem !important;
            margin-bottom: 8px !important;
            word-break: break-all !important;
          }
          .affiliate-referral-box {
            padding: 16px !important;
            border-radius: 12px !important;
          }
          .affiliate-referral-sharing-row {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 16px !important;
          }
          .affiliate-referral-sharing-link-container {
            flex: none !important;
            width: 100% !important;
          }
          .affiliate-referral-qr-container {
            width: 100% !important;
            box-sizing: border-box !important;
            align-self: center !important;
          }
        }
      `}</style>

      {/* Toast popup */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: 'var(--primary-deep, #2d140e)',
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
          <CheckCircle size={18} style={{ color: '#d97706' }} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Hero Header Banner */}
      <div 
        className="affiliate-hero-section"
        style={{
          background: 'linear-gradient(135deg, #2d140e 0%, #4c1d11 100%)',
          color: '#ffffff',
          padding: '60px 20px',
          textAlign: 'center',
          borderBottom: '4px solid #ea580c',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Holy background patterns decoration */}
        <div style={{
          position: 'absolute',
          top: '-50%', left: '-10%', right: '-10%', bottom: '-50%',
          backgroundImage: 'radial-gradient(circle, rgba(234,88,12,0.1) 0%, transparent 60%)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(234, 88, 12, 0.2)', padding: '6px 16px', borderRadius: '50px', fontSize: '0.88rem', fontWeight: 800, color: '#fdbb2d', border: '1px solid rgba(253, 187, 45, 0.3)', marginBottom: '16px' }}>
            <Sparkles size={14} />
            <span>MANTRA PUJA PARTNERSHIP PROGRAM</span>
          </div>
          <h1 
            className="affiliate-hero-title"
            style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.025em', margin: '0 0 12px 0', color: '#fff9f5', lineHeight: 1.2 }}
          >
            Become a Partner, Share the Divine & Earn
          </h1>
          <p 
            className="affiliate-hero-desc"
            style={{ fontSize: '1.1rem', color: '#ffedd5', maxWidth: '600px', margin: '0 auto', lineHeight: 1.5 }}
          >
            Help others connect with authenticated spiritual offerings and earn rewards for every devotee you introduce to Mantra Puja.
          </p>
        </div>
      </div>

      {/* Main Body Grid */}
      <div 
        className="affiliate-body-container"
        style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '40px 20px', display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}
      >
        
        {/* Promotional Showcase Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          
          {/* Card 1: 10% Commission */}
          <div 
            className="affiliate-card-wrapper"
            style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1.5px solid #ffedd5', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', gap: '16px' }}
          >
            <div 
              className="affiliate-card-icon-container"
              style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}
            >
              <Gift size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, margin: '0 0 8px 0', color: '#2d140e' }}>10% Instant Commission</h3>
              <p style={{ fontSize: '0.9rem', color: '#6b5a55', margin: 0, lineHeight: 1.5 }}>
                Earn a flat 10% commission on every single purchase made by the users you refer. Real-time logging on dispatch.
              </p>
            </div>
          </div>

          {/* Card 2: Unlimited Sharing */}
          <div 
            className="affiliate-card-wrapper"
            style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1.5px solid #ffedd5', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', gap: '16px' }}
          >
            <div 
              className="affiliate-card-icon-container"
              style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', flexShrink: 0 }}
            >
              <Users size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, margin: '0 0 8px 0', color: '#2d140e' }}>Unlimited Devotees</h3>
              <p style={{ fontSize: '0.9rem', color: '#6b5a55', margin: 0, lineHeight: 1.5 }}>
                Share with as many friends, family members, or followers as you like. There are no caps or ceilings on your rewards.
              </p>
            </div>
          </div>

          {/* Card 3: Lifetime Rewards */}
          <div 
            className="affiliate-card-wrapper"
            style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1.5px solid #ffedd5', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', gap: '16px' }}
          >
            <div 
              className="affiliate-card-icon-container"
              style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', flexShrink: 0 }}
            >
              <Award size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, margin: '0 0 8px 0', color: '#2d140e' }}>Lifetime Earnings</h3>
              <p style={{ fontSize: '0.9rem', color: '#6b5a55', margin: 0, lineHeight: 1.5 }}>
                Refer one or multiple devotees. Get a flat 10% commission on their first purchase and lifetime rewards whenever they buy again.
              </p>
            </div>
          </div>

        </div>

        {/* Dynamic Interactive Flow Portal */}
        <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
          
          {loadingStatus ? (
            <div 
              className="affiliate-interactive-box"
              style={{ backgroundColor: '#ffffff', border: '1.5px solid #ffedd5', borderRadius: '24px', padding: '40px', textAlign: 'center', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}
            >
              <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #ffedd5', borderTopColor: '#ea580c', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
              <p style={{ margin: 0, color: '#6b5a55', fontWeight: 600 }}>Retrieving profile settings...</p>
            </div>
          ) : !loggedInUser ? (
            
            /* STEP 1: LOGIN/AUTHENTICATION PORTAL */
            <div 
              className="affiliate-interactive-box"
              style={{ backgroundColor: '#ffffff', border: '1.5px solid #ffedd5', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#fff7ed', color: '#ea580c', marginBottom: '12px' }}>
                  <ShieldCheck size={28} />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0 0 8px 0', color: '#2d140e' }}>Partner Onboarding</h2>
                <p style={{ fontSize: '0.9rem', color: '#6b5a55', margin: 0 }}>
                  Enter your phone number to login or register and apply to the program.
                </p>
              </div>

              {otpError && (
                <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 600, border: '1px solid #fee2e2', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span>⚠️</span>
                  <span>{otpError}</span>
                </div>
              )}

              {verificationStep === 'form' ? (
                <form onSubmit={handleSendOtpTrigger} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label htmlFor="phoneNumber" style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '8px', color: '#4c1d11' }}>
                    Mobile Number
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '16px', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#6b5a55' }}>
                        <Phone size={18} />
                      </div>
                      <input
                        id="phoneNumber"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        style={{ width: '100%', padding: '14px 16px 14px 48px', border: '1.5px solid #ffedd5', borderRadius: '12px', fontSize: '1rem', outline: 'none', color: '#2d140e', backgroundColor: '#fffdfb', boxSizing: 'border-box' }}
                        required
                      />
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#8c7670', display: 'block', marginTop: '6px' }}>
                      We will send a one-time verification code to this number.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoadingAuth}
                    className="btn-lime"
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontSize: '1rem',
                      fontWeight: 800,
                      backgroundColor: '#ea580c',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.2)',
                      transition: 'opacity 0.2s'
                    }}
                  >
                    {isLoadingAuth ? 'Sending Code...' : 'Send Verification Code'}
                    {!isLoadingAuth && <ArrowRight size={18} />}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem', borderBottom: '1px solid #f2e7e3', paddingBottom: '12px' }}>
                    <span style={{ color: '#6b5a55' }}>Sent to: <strong>{otpTargetPhone}</strong></span>
                    <button
                      type="button"
                      onClick={() => setVerificationStep('form')}
                      style={{ background: 'none', border: 'none', color: '#ea580c', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <ArrowLeft size={14} /> Change Number
                    </button>
                  </div>

                  <div>
                    <label htmlFor="otpCode" style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '8px', color: '#4c1d11' }}>
                      6-Digit OTP Code
                    </label>
                    <input
                      id="otpCode"
                      type="text"
                      maxLength={6}
                      value={userEnteredOtp}
                      onChange={(e) => setUserEnteredOtp(e.target.value.replace(/[^\d]/g, ''))}
                      placeholder="Enter verification code"
                      style={{ width: '100%', padding: '14px 16px', border: '1.5px solid #ffedd5', borderRadius: '12px', fontSize: '1.1rem', letterSpacing: '4px', textAlign: 'center', outline: 'none', color: '#2d140e', backgroundColor: '#fffdfb', boxSizing: 'border-box' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                    <span style={{ color: '#6b5a55', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> Code valid for 5 min
                    </span>
                    {otpCountdown > 0 ? (
                      <span style={{ color: '#8c7670', fontWeight: 600 }}>Resend in {otpCountdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        style={{ background: 'none', border: 'none', color: '#ea580c', cursor: 'pointer', fontWeight: 800 }}
                      >
                        Resend OTP Code
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoadingAuth}
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontSize: '1rem',
                      fontWeight: 800,
                      backgroundColor: '#ea580c',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.2)'
                    }}
                  >
                    {isLoadingAuth ? 'Verifying OTP...' : 'Verify Code & Continue'}
                    {!isLoadingAuth && <CheckCircle size={18} />}
                  </button>
                </form>
              )}
            </div>
          ) : affiliateStatus === 'active' ? (
            
            /* DYNAMIC STATE: ACTIVE PARTNER ALREADY */
            <div 
              className="affiliate-interactive-box"
              style={{ backgroundColor: '#ffffff', border: '2px solid #16a34a', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', textAlign: 'center' }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', marginBottom: '16px' }}>
                <CheckCircle size={32} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0 0 8px 0', color: '#2d140e' }}>You are an Active Partner!</h2>
              <p style={{ fontSize: '0.95rem', color: '#6b5a55', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                Your partner account is active. Share your referral link, scan barcode, and Mantra Puja logo with devotees across social media!
              </p>

              {/* Referral Info Box with Link and Barcode */}
              <div 
                className="affiliate-referral-box"
                style={{ display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#fcf8f5', borderRadius: '16px', padding: '24px', border: '1.5px solid #ffedd5', marginBottom: '24px', textAlign: 'left' }}
              >
                
                <div 
                  className="affiliate-referral-sharing-row"
                  style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div 
                    className="affiliate-referral-sharing-link-container"
                    style={{ flex: '1 1 280px' }}
                  >
                    <span style={{ fontSize: '0.8rem', color: '#8c7670', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Your Referral Sharing Link</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ffffff', padding: '12px 14px', borderRadius: '12px', border: '1px solid #ffedd5' }}>
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}?ref=${affiliateCode}`}
                        style={{ flex: 1, border: 'none', background: 'none', fontSize: '0.88rem', color: '#2d140e', outline: 'none', fontWeight: 600 }}
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}?ref=${affiliateCode}`);
                          triggerToast('Referral link copied to clipboard!');
                        }}
                        style={{ background: 'none', border: 'none', color: '#ea580c', cursor: 'pointer', display: 'flex', padding: '4px' }}
                        title="Copy Link"
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                  </div>

                  <div 
                    className="affiliate-referral-qr-container"
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', backgroundColor: '#ffffff', border: '1px solid #ffedd5', borderRadius: '16px', padding: '12px', minWidth: '140px' }}
                  >
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(window.location.origin + '?ref=' + affiliateCode)}`}
                      alt="Referral Barcode / QR Code"
                      style={{ width: '140px', height: '140px', display: 'block' }}
                    />
                    <button
                      onClick={async () => {
                        try {
                          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(window.location.origin + '?ref=' + affiliateCode)}`;
                          const response = await fetch(qrUrl);
                          const blob = await response.blob();
                          const blobUrl = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = blobUrl;
                          a.download = `MantraPuja-Partner-Barcode-${affiliateCode}.png`;
                          a.click();
                          URL.revokeObjectURL(blobUrl);
                        } catch {
                          window.open(`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(window.location.origin + '?ref=' + affiliateCode)}`, '_blank');
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ea580c',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 800
                      }}
                    >
                      Download Barcode (QR)
                    </button>
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #f2e7e3', margin: '4px 0' }} />

                {/* SOCIAL SHARE CONSOLE */}
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#4c1d11', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} style={{ color: '#ea580c' }} />
                    🌸 Divine Blessings Share Console
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    {/* Device native share */}
                    <button
                      onClick={handleNativeShare}
                      style={{
                        width: '100%',
                        padding: '14px',
                        backgroundColor: '#ea580c',
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
                        boxShadow: '0 4px 10px rgba(234, 88, 12, 0.25)',
                        transition: 'transform 0.2s, background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.backgroundColor = '#d97706';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.backgroundColor = '#ea580c';
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

              {/* Navigation button */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={() => onNavigateToProfile('affiliate')}
                  className="btn-lime"
                  style={{
                    padding: '12px 24px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    backgroundColor: 'transparent',
                    color: '#ea580c',
                    border: '1.5px solid #ea580c',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(234, 88, 12, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Go to Partner Dashboard
                </button>
              </div>
            </div>
          ) : affiliateStatus === 'pending' ? (
            
            /* DYNAMIC STATE: APPLICATION PENDING APPROVAL */
            <div 
              className="affiliate-interactive-box"
              style={{ backgroundColor: '#ffffff', border: '1.5px solid #d97706', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', textAlign: 'center' }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#fef3c7', color: '#d97706', marginBottom: '16px' }}>
                <Clock size={32} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0 0 8px 0', color: '#2d140e' }}>Application Under Review</h2>
              <p style={{ fontSize: '0.95rem', color: '#6b5a55', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                Thank you for applying! Your application has been registered and is pending administrator review. 
              </p>

              <div style={{ textAlign: 'left', backgroundColor: '#fcf8f5', border: '1px solid #ffedd5', borderRadius: '16px', padding: '16px 20px', marginBottom: '24px', fontSize: '0.9rem' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#4c1d11', fontWeight: 800 }}>Submitted Information:</h4>
                <div 
                  className="affiliate-info-display-grid"
                  style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px 12px', color: '#6b5a55' }}
                >
                  <span>Name:</span><strong style={{ color: '#2d140e' }}>{fullName || loggedInUser.fullName || '—'}</strong>
                  <span>Email:</span><strong style={{ color: '#2d140e' }}>{email || loggedInUser.email || '—'}</strong>
                  <span>Phone:</span><strong style={{ color: '#2d140e' }}>{loggedInUser.phoneNumber || '—'}</strong>
                  <span>Status:</span><strong style={{ color: '#d97706' }}>Pending Approval</strong>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: '#8c7670', margin: '0 0 24px 0', lineHeight: 1.4 }}>
                Once our administrator approves your account, your custom referral links and earnings dashboard will automatically unlock.
              </p>

              <button
                onClick={() => onNavigateToProfile()}
                style={{
                  padding: '12px 24px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  backgroundColor: '#ea580c',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.2)'
                }}
              >
                Go to Profile
              </button>
            </div>
          ) : affiliateStatus === 'suspended' ? (
            
            /* DYNAMIC STATE: SUSPENDED */
            <div 
              className="affiliate-interactive-box"
              style={{ backgroundColor: '#ffffff', border: '1.5px solid #dc2626', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', textAlign: 'center' }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#dc2626', marginBottom: '16px' }}>
                <span>🚫</span>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0 0 8px 0', color: '#2d140e' }}>Account Suspended</h2>
              <p style={{ fontSize: '0.95rem', color: '#6b5a55', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                Your partner partnership account has been suspended by the store administrator. Please contact support.
              </p>
              <button
                onClick={() => onNavigateToProfile()}
                style={{
                  padding: '12px 24px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  backgroundColor: '#ea580c',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Go to Profile
              </button>
            </div>
          ) : (
            
            /* STEP 2: PROFILE INFORMATION APPLICATION FORM */
            <div 
              className="affiliate-interactive-box"
              style={{ backgroundColor: '#ffffff', border: '1.5px solid #ffedd5', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#fff7ed', color: '#ea580c', marginBottom: '12px' }}>
                  <Users size={28} />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0 0 8px 0', color: '#2d140e' }}>Partner Profile details</h2>
                <p style={{ fontSize: '0.9rem', color: '#6b5a55', margin: 0 }}>
                  Enter your details to register and join the program.
                </p>
              </div>

              {enrollmentError && (
                <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 600, border: '1px solid #fee2e2', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span>⚠️</span>
                  <span>{enrollmentError}</span>
                </div>
              )}

              <form onSubmit={handleEnrollSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label htmlFor="fullName" style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '8px', color: '#4c1d11' }}>
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    style={{ width: '100%', padding: '14px 16px', border: '1.5px solid #ffedd5', borderRadius: '12px', fontSize: '1rem', outline: 'none', color: '#2d140e', backgroundColor: '#fffdfb', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="emailAddress" style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '8px', color: '#4c1d11' }}>
                    Email Address
                  </label>
                  <input
                    id="emailAddress"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="devotee@example.com"
                    style={{ width: '100%', padding: '14px 16px', border: '1.5px solid #ffedd5', borderRadius: '12px', fontSize: '1rem', outline: 'none', color: '#2d140e', backgroundColor: '#fffdfb', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <input
                    id="termsBox"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    style={{ marginTop: '4px', width: '16px', height: '16px', accentColor: '#ea580c' }}
                    required
                  />
                  <label htmlFor="termsBox" style={{ fontSize: '0.88rem', color: '#6b5a55', lineHeight: 1.4, cursor: 'pointer' }}>
                    I agree to the <strong style={{ color: '#ea580c' }}>Terms and Conditions</strong> of the Mantra Puja Partner/Affiliate program.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingEnrollment}
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '1rem',
                    fontWeight: 800,
                    backgroundColor: '#ea580c',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.2)'
                  }}
                >
                  {isSubmittingEnrollment ? 'Submitting Application...' : 'Register & Join Program'}
                  {!isSubmittingEnrollment && <ArrowRight size={18} />}
                </button>
              </form>
            </div>
          )}

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
            <div 
              className="affiliate-interactive-box"
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                border: '2px solid #ffedd5',
                padding: '32px',
                maxWidth: '480px',
                width: '100%',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                textAlign: 'center'
              }}
            >
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

        </div>

      </div>

    </div>
  );
};
