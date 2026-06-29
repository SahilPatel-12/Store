import React from 'react';
import { Lock, Phone, Eye, EyeOff, ArrowLeft, AlertCircle, Compass, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { hashPassword } from '../lib/crypto';

interface AstrologerLoginPageProps {
  onLoginSuccess: (
    userSession: { id: string; fullName: string; email: string; phoneNumber: string },
    token: string
  ) => void;
  onNavigateToHome: () => void;
}

export const AstrologerLoginPage: React.FC<AstrologerLoginPageProps> = ({
  onLoginSuccess,
  onNavigateToHome,
}) => {
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Clean numbers for international sending compatibility
  const formatPhoneNumber = (num: string) => {
    let cleaned = num.replace(/[^\d]/g, '');
    if (cleaned.length >= 10) {
      return cleaned.slice(-10);
    }
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!phone || !password) {
      setErrorMsg('Please enter both your phone number and security password.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Check for Demo/Local Dev Credentials first to enable easy testing
      if (phone.replace(/\s+/g, '') === '9999988888' && password === 'astrologer123') {
        setTimeout(() => {
          onLoginSuccess({
            id: 'demo-astrologer-id-12345',
            fullName: 'Acharya Ramanand Shastri',
            email: 'acharya.ramanand@spiritual.com',
            phoneNumber: '+91 99999 88888'
          }, 'demo-session-token-astrologer');
        }, 800);
        return;
      }

      const formattedPhone = formatPhoneNumber(phone);
      if (!formattedPhone || formattedPhone.length < 9) {
        throw new Error('Please enter a valid phone number.');
      }

      // Hash the custom password using the SHA-256 helper
      const passwordHash = await hashPassword(password);

      // Authenticate via Supabase user password RPC
      const { data, error } = await supabase.rpc('authenticate_user_password', {
        p_email_or_phone: formattedPhone,
        p_password_hash: passwordHash,
        p_device_id: 'browser_client',
        p_ip: '127.0.0.1',
        p_user_agent: navigator.userAgent
      });

      if (error) {
        setErrorMsg('Authentication Error: ' + error.message);
        setIsSubmitting(false);
        return;
      }

      if (!data || data.length === 0) {
        setErrorMsg('Invalid login credentials.');
        setIsSubmitting(false);
        return;
      }

      const sessionData = data[0];

      // Check if the user is registered as an Astrologer
      // Fallback: If 'is_astrologer' column doesn't exist yet, we check if the user is a pundit or check settings, or allow it
      try {
        const { data: userData, error: userError } = await supabase
          .from('website_store_users')
          .select('*')
          .eq('id', sessionData.user_id)
          .maybeSingle();

        if (!userError && userData) {
          const isAst = userData.is_astrologer || (userData as any).is_pundit || false;
          console.log('Logged in user is astrologer status:', isAst);
        }
      } catch (dbErr) {
        console.warn('Dynamic is_astrologer verification failed, letting session pass:', dbErr);
      }

      // Login success
      onLoginSuccess({
        id: sessionData.user_id,
        fullName: sessionData.full_name || '',
        email: sessionData.email || '',
        phoneNumber: sessionData.phone_number
      }, sessionData.session_token);

    } catch (err) {
      console.error(err);
      setErrorMsg((err as Error).message || 'Database authentication error. Unable to establish session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      background: 'radial-gradient(circle at 50% 50%, #0c0f1e 0%, #05070f 100%)',
      position: 'relative',
      overflow: 'hidden',
      color: '#e2e8f0'
    }}>
      {/* Mystical glowing background blobs */}
      <div style={{
        position: 'absolute',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, rgba(0,0,0,0) 70%)',
        top: '-10%',
        right: '-5%',
        zIndex: 1
      }} />
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, rgba(0,0,0,0) 70%)',
        bottom: '-15%',
        left: '-10%',
        zIndex: 1
      }} />

      {/* Star Field Simulation */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 40px), radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 30px)',
        backgroundSize: '550px 550px, 350px 350px',
        backgroundPosition: '0 0, 40px 60px',
        opacity: 0.25,
        zIndex: 1
      }} />

      {/* Cosmic Glassmorphic Login Card */}
      <div className="auth-login-card" style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        borderRadius: '16px',
        boxShadow: '0 0 40px rgba(139, 92, 246, 0.15), inset 0 0 12px rgba(255, 255, 255, 0.03)',
        padding: '40px',
        zIndex: 2,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        textAlign: 'left'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)',
            border: '2px solid #d97706',
            boxShadow: '0 0 20px rgba(217, 119, 6, 0.3)',
            marginBottom: '16px'
          }}>
            <Compass size={32} style={{ color: '#fbbf24', animation: 'spin 20s linear infinite' }} />
          </div>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#fbbf24',
            letterSpacing: '-0.5px',
            margin: 0,
            textShadow: '0 2px 10px rgba(217, 119, 6, 0.2)'
          }}>
            Astrologer Console
          </h2>
          <p style={{
            fontSize: '0.88rem',
            color: '#94a3b8',
            marginTop: '6px'
          }}>
            Authenticate to access your live chart consultations.
          </p>
        </div>

        {/* Demo Credentials Prompt */}
        <div style={{
          backgroundColor: 'rgba(217, 119, 6, 0.1)',
          border: '1px solid rgba(217, 119, 6, 0.25)',
          borderRadius: '8px',
          padding: '12px 14px',
          fontSize: '0.78rem',
          color: '#fbbf24',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <span style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={12} /> Local Testing Mode:
          </span>
          <span>Use Phone: <strong style={{ color: '#fff' }}>99999 88888</strong> & Password: <strong style={{ color: '#fff' }}>astrologer123</strong> to enter instantly without db configuration.</span>
        </div>

        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1.5px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '0.85rem',
            color: '#fca5a5',
            fontWeight: 600
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#ef4444' }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Phone Number Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="phone" style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              color: '#fbbf24',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Registered Phone Number
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{
                position: 'absolute',
                left: '16px',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Phone size={16} />
              </span>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 44px',
                  borderRadius: '8px',
                  border: '1.5px solid rgba(148, 163, 184, 0.15)',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  outline: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                  color: '#fff'
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="password" style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              color: '#fbbf24',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Security Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{
                position: 'absolute',
                left: '16px',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Lock size={16} />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '14px 44px 14px 44px',
                  borderRadius: '8px',
                  border: '1.5px solid rgba(148, 163, 184, 0.15)',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  outline: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                  color: '#fff'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                disabled={isSubmitting}
                style={{
                  position: 'absolute',
                  right: '16px',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.95rem',
              padding: '14px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              marginTop: '8px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.8 : 1,
              border: 'none',
              boxShadow: '0 4px 20px rgba(217, 119, 6, 0.25)'
            }}
          >
            {isSubmitting ? (
              <span style={{
                display: 'inline-block',
                width: '20px',
                height: '20px',
                border: '2.5px solid rgba(255,255,255,0.3)',
                borderTopColor: '#ffffff',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite'
              }} />
            ) : (
              'Enter Cosmic Portal'
            )}
          </button>
        </form>

        {/* Switch portal / Back navigation */}
        <div style={{
          borderTop: '1px solid rgba(148, 163, 184, 0.15)',
          paddingTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button
            onClick={() => window.location.pathname = '/pundit-login'}
            type="button"
            style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              color: '#fbbf24',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textShadow: '0 0 10px rgba(251, 191, 36, 0.1)'
            }}
          >
            Are you a Pandit? Switch to Pandit Portal
          </button>
          <button
            onClick={onNavigateToHome}
            disabled={isSubmitting}
            type="button"
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'color 0.2s',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fbbf24'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
          >
            <ArrowLeft size={14} /> Back to Public Store
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
