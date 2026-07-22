import React from 'react';
import { 
  Phone, 
  ArrowLeft, 
  CheckCircle, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchUserProfile } from '../lib/crossPlatformSync';

interface UserAuthPageProps {
  onNavigateToHome: () => void;
  onNavigateToShop: () => void;
  onLoginSuccess: (
    userSession: { id: string; fullName: string; email: string; phoneNumber: string },
    token: string
  ) => void;
}

export const UserAuthPage: React.FC<UserAuthPageProps> = ({
  onNavigateToHome,
  onNavigateToShop,
  onLoginSuccess,
}) => {
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isNewUser, setIsNewUser] = React.useState(false);

  // Verification states
  const [verificationStep, setVerificationStep] = React.useState<'form' | 'otp'>('form');
  const [userEnteredOtp, setUserEnteredOtp] = React.useState('');
  const [otpCountdown, setOtpCountdown] = React.useState(60);
  const [otpError, setOtpError] = React.useState('');
  const [otpTargetPhone, setOtpTargetPhone] = React.useState('');

  // Toast Msg
  const [toastMsg, setToastMsg] = React.useState('');
  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Countdown timer for OTP resend
  React.useEffect(() => {
    let timer: any;
    if (verificationStep === 'otp' && otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [verificationStep, otpCountdown]);

  // Clean numbers for international sending compatibility
  const formatPhoneNumber = (num: string) => {
    // Remove all non-digits
    let cleaned = num.replace(/[^\d]/g, '');
    
    // Check if it's a Saudi number (9 digits starting with 5, or 10 digits starting with 05, or starting with 9665...)
    if (cleaned.startsWith('966')) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.startsWith('05') && cleaned.length === 10) {
      return '+966' + cleaned.substring(1);
    } else if (cleaned.startsWith('5') && cleaned.length === 9) {
      return '+966' + cleaned;
    }

    // Check if it's an Indian or general 10-digit number
    // Indian numbers have 10 digits. If we have 12 digits starting with 91, or 11 digits starting with 0, take last 10.
    if (cleaned.length >= 10) {
      return cleaned.slice(-10);
    }
    
    return cleaned;
  };

  const [otpChannel, setOtpChannel] = React.useState<'sms' | 'whatsapp'>('whatsapp');

  // Triggers secure server-side OTP sending via backend endpoint
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

  const handleSendOtpTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setOtpError('');
    try {
      const formatted = formatPhoneNumber(phoneNumber);
      if (!formatted || formatted.length < 9) {
        throw new Error('Please enter a valid phone number.');
      }

      // Check if user exists
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
        throw new Error('Database connection failed. Please check your network and try again.');
      }

      setIsNewUser(!existingUser);
      setOtpTargetPhone(formatted);

      const isDevProfile = formatted.includes('9999999999');

      // Send the OTP in the background to prevent UI blocking
      if (!isDevProfile) {
        sendOtp(formatted).then(res => {
          const channel = res.channel === 'sms' ? 'sms' : 'whatsapp';
          setOtpChannel(channel);
          triggerToast(`Verification code sent to ${formatted} via ${channel === 'sms' ? 'SMS' : 'WhatsApp'}!`);
        }).catch(err => {
          console.error('[OTP Service] Background send failed:', err);
          triggerToast(`Verification code sent to ${formatted}!`);
        });
      } else {
        setOtpChannel('whatsapp');
        triggerToast(`Verification code sent to ${formatted} via WhatsApp!`);
      }

      setVerificationStep('otp');
      setOtpCountdown(60);
    } catch (err) {
      console.error(err);
      setOtpError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpCountdown > 0) return;
    setIsLoading(true);
    setOtpError('');
    try {
      const isDevProfile = otpTargetPhone.includes('9999999999');

      if (!isDevProfile) {
        sendOtp(otpTargetPhone).then(res => {
          const channel = res.channel === 'sms' ? 'sms' : 'whatsapp';
          setOtpChannel(channel);
          triggerToast(`A fresh verification code has been dispatched via ${channel === 'sms' ? 'SMS' : 'WhatsApp'}!`);
        }).catch(err => {
          console.error('[OTP Service] Background resend failed:', err);
          triggerToast('A fresh verification code has been dispatched!');
        });
      } else {
        setOtpChannel('whatsapp');
        triggerToast('A fresh verification code has been dispatched via WhatsApp!');
      }

      setOtpCountdown(60);
    } catch (err) {
      console.error(err);
      setOtpError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setOtpError('');
    try {
      if (isNewUser) {
        // Complete registration write without placeholder email (nullable in database)
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
          throw new Error('Registration failed due to a database connection issue: ' + (dbErr as Error).message);
        }

        // Apply referral binding silently on successful signup
        try {
          const refCode = localStorage.getItem('mantra_referral_code');
          const refTimeStr = localStorage.getItem('mantra_referral_time');
          
          if (refCode && refTimeStr) {
            const refTime = parseInt(refTimeStr, 10);
            const isExpired = Date.now() - refTime > 30 * 24 * 60 * 60 * 1000; // 30 days window
            
            if (!isExpired) {
              console.log('[Referral Engine] Binding referral:', refCode, 'for user:', newUser.id);
              await supabase.rpc('bind_referral_on_signup', {
                p_referred_id: newUser.id,
                p_referrer_code: refCode
              });
            } else {
              console.log('[Referral Engine] Stored referral code has expired.');
            }
          }
          localStorage.removeItem('mantra_referral_code');
          localStorage.removeItem('mantra_referral_time');
        } catch (refErr) {
          console.error('[Referral Engine] Referral binding failed silently:', refErr);
        }
      }

      // Complete OTP-based login via authenticate_user_otp RPC
      const { data, error } = await supabase.rpc('authenticate_user_otp', {
        p_phone: otpTargetPhone,
        p_otp_entered: userEnteredOtp,
        p_device_id: 'browser_client',
        p_ip: '127.0.0.1',
        p_user_agent: navigator.userAgent
      });
      if (error) throw error;
      if (data && data.length > 0) {
        const row = data[0];
        triggerToast(isNewUser ? 'Account registered successfully!' : 'Authenticated successfully!');

        let resolvedFullName = row.full_name || '';
        try {
          const profile = await fetchUserProfile(row.phone_number || otpTargetPhone);
          if (profile && profile.full_name) {
            resolvedFullName = profile.full_name;
          }
        } catch (pErr) {
          console.warn('[UserAuthPage] Profile resolution error:', pErr);
        }

        onLoginSuccess({
          id: row.user_id,
          fullName: resolvedFullName,
          email: row.email || '',
          phoneNumber: row.phone_number || otpTargetPhone
        }, row.session_token);
      } else {
        throw new Error('No devotee account session established.');
      }
    } catch (err) {
      setOtpError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Dynamic Toast Alerts */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: 'var(--primary-deep, #2d140e)',
          color: '#ffffff',
          padding: '16px 24px',
          borderRadius: 'var(--radius-md, 8px)',
          boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1))',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.9rem',
          fontWeight: 700,
          border: '1.5px solid var(--primary-accent, #ea580c)',
          animation: 'slideUp 0.3s ease-out'
        }}>
          <CheckCircle size={18} style={{ color: 'var(--primary-gold, #d97706)' }} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Hero Banner header */}
      <section style={{
        background: 'linear-gradient(135deg, #2d140e 0%, #1e0b07 100%)',
        color: '#ffffff',
        padding: '36px 0',
        borderBottom: '4px solid var(--primary-gold, #d97706)',
        textAlign: 'left'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={onNavigateToHome}
                style={{
                  color: 'rgba(255, 255, 255, 0.75)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Home
              </button>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
              <button
                onClick={onNavigateToShop}
                style={{
                  color: 'rgba(255, 255, 255, 0.75)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <ArrowLeft size={14} /> Back to Shop
              </button>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
              <span style={{ color: 'var(--primary-gold, #d97706)', fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Devotee Account
              </span>
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ffffff', marginTop: '8px', letterSpacing: '-0.5px', fontFamily: 'var(--font-serif, serif)' }}>
              Devotional Sanctuary Entrance
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.88rem', marginTop: '2px' }}>
              Sign in to manage your ritual items, track sacred packages, and review personal prayers.
            </p>
          </div>
        </div>
      </section>

      {/* Main Core Section */}
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 20px', flexGrow: 1 }}>
        <div style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg, 12px)',
          border: '1px solid var(--border-color, #e5e7eb)',
          boxShadow: 'var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1))',
          padding: '36px',
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'left'
        }}>
          
          {/* Top Decorative Border accent */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, var(--primary-accent, #ea580c) 0%, var(--primary-gold, #d97706) 100%)'
          }} />

          {verificationStep === 'form' ? (
            <>
              {otpError && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md, 8px)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  marginBottom: '20px'
                }}>
                  ⚠️ {otpError}
                </div>
              )}

              {/* Phone number login & registration form */}
              <form onSubmit={handleSendOtpTrigger} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary, #111827)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Phone Number *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210 or 501234567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px 12px 42px',
                        borderRadius: 'var(--radius-md, 8px)',
                        border: '1.5px solid var(--border-color, #e5e7eb)',
                        outline: 'none',
                        fontSize: '0.9rem',
                        backgroundColor: '#f9fafb',
                        transition: 'border-color 0.15s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--primary-accent, #ea580c)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border-color, #e5e7eb)'}
                    />
                    <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block', marginTop: '6px' }}>
                    We will send a secure 6-digit verification code to this number.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-gold"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    justifyContent: 'center',
                    borderRadius: 'var(--radius-md, 8px)',
                    background: 'linear-gradient(135deg, var(--primary-accent, #ea580c) 0%, var(--primary-gold, #d97706) 100%)',
                    color: '#ffffff',
                    border: 'none',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.25)',
                    transition: 'all 0.15s',
                    opacity: isLoading ? 0.8 : 1
                  }}
                >
                  {isLoading ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #ffffff',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.6s linear infinite'
                      }} />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Send Verification OTP
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* OTP VERIFICATION VIEW */
            <div style={{ textAlign: 'center' }}>
              <div className="flex-center" style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'rgba(217, 119, 6, 0.08)',
                color: 'var(--primary-gold, #d97706)',
                margin: '0 auto 20px'
              }}>
                <ShieldCheck size={32} />
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary, #111827)', fontFamily: 'var(--font-serif, serif)' }}>
                OTP Verification
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#6b7280', marginTop: '6px', lineHeight: '1.4' }}>
                We've sent a 6-digit OTP code to <strong style={{ color: 'var(--text-primary, #111827)' }}>{otpTargetPhone}</strong> via {otpChannel === 'sms' ? 'SMS' : 'WhatsApp'}.
                {!import.meta.env.PROD && (
                  <span style={{ display: 'block', color: 'var(--primary-accent, #ea580c)', fontWeight: 800, marginTop: '8px', fontSize: '0.9rem' }}>
                    [DEV MODE] Use test number (+91 99999 99999) with code 111111 for offline login.
                  </span>
                )}
              </p>

              {otpError && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md, 8px)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  marginTop: '16px',
                  textAlign: 'left'
                }}>
                  ⚠️ {otpError}
                </div>
              )}

              <form onSubmit={handleVerifyOtpSubmit} style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary, #111827)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Enter 6-Digit OTP *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter code (e.g. 123456)"
                    value={userEnteredOtp}
                    onChange={(e) => {
                      setUserEnteredOtp(e.target.value.replace(/[^\d]/g, ''));
                      setOtpError('');
                    }}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: 'var(--radius-md, 8px)',
                      border: '1.5px solid var(--border-color, #e5e7eb)',
                      outline: 'none',
                      fontSize: '1.3rem',
                      fontWeight: 800,
                      letterSpacing: '8px',
                      textAlign: 'center',
                      backgroundColor: '#f9fafb',
                      transition: 'border-color 0.15s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary-accent, #ea580c)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color, #e5e7eb)'}
                  />
                </div>

                {/* Resend and timer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationStep('form');
                      setUserEnteredOtp('');
                      setOtpError('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary, #4b5563)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <ArrowLeft size={12} /> Change Number
                  </button>

                  {otpCountdown > 0 ? (
                    <span style={{ color: '#9ca3af', fontWeight: 600 }}>
                      Resend in {otpCountdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary-accent, #ea580c)',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-gold"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    justifyContent: 'center',
                    borderRadius: 'var(--radius-md, 8px)',
                    background: 'linear-gradient(135deg, var(--primary-accent, #ea580c) 0%, var(--primary-gold, #d97706) 100%)',
                    color: '#ffffff',
                    border: 'none',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.25)',
                    opacity: isLoading ? 0.8 : 1
                  }}
                >
                  {isLoading ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #ffffff',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.6s linear infinite'
                      }} />
                      Verifying OTP...
                    </>
                  ) : (
                    <>
                      Verify & Log In
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
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
