import React from 'react';
import { Lock, Phone, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { hashPassword } from '../lib/crypto';

interface PunditLoginPageProps {
  onLoginSuccess: (
    userSession: { id: string; fullName: string; email: string; phoneNumber: string },
    token: string
  ) => void;
  onNavigateToHome: () => void;
}

export const PunditLoginPage: React.FC<PunditLoginPageProps> = ({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!phone || !password) {
      setErrorMsg('Please enter both your phone number and security password.');
      return;
    }

    setIsSubmitting(true);
    try {
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

      // Check if the user is registered as a Pundit
      const { data: userData, error: userError } = await supabase
        .from('website_store_users')
        .select('is_pundit')
        .eq('id', sessionData.user_id)
        .maybeSingle();

      if (userError) {
        setErrorMsg('Database verification error: ' + userError.message);
        setIsSubmitting(false);
        return;
      }

      if (!userData || !userData.is_pundit) {
        setErrorMsg('Access Denied: This portal is reserved for registered pandits.');
        setIsSubmitting(false);
        return;
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
      setErrorMsg((err as Error).message || 'Database authentication error. Unable to establish pandit session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '90vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      background: 'radial-gradient(circle at 10% 20%, rgba(253, 244, 245, 1) 0%, rgba(255, 237, 213, 0.4) 90.1%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Premium background blurs */}
      <div style={{
        position: 'absolute',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'rgba(234, 88, 12, 0.08)',
        filter: 'blur(80px)',
        top: '-10%',
        right: '-5%',
        zIndex: 1
      }} />
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'rgba(45, 20, 14, 0.05)',
        filter: 'blur(100px)',
        bottom: '-15%',
        left: '-10%',
        zIndex: 1
      }} />

      {/* Glassmorphic Login Container */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        borderRadius: 'var(--radius-lg, 12px)',
        boxShadow: '0 25px 50px -12px rgba(45, 20, 14, 0.12), 0 0 0 1px rgba(45, 20, 14, 0.02)',
        padding: '40px',
        zIndex: 2,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        textAlign: 'left'
      }}>

        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '2.5rem' }}>🕉️</span>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--primary-forest, #2d140e)',
            letterSpacing: '-0.5px',
            marginTop: '8px'
          }}>
            Pandit Control Portal
          </h2>
          <p style={{
            fontSize: '0.88rem',
            color: 'var(--text-muted, #6b7280)',
            marginTop: '6px'
          }}>
            Authenticate to access your affiliate links & bookings.
          </p>
        </div>

        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            backgroundColor: '#fee2e2',
            border: '1.5px solid #fecaca',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '12px 16px',
            fontSize: '0.85rem',
            color: '#b91c1c',
            fontWeight: 600,
            animation: 'shake 0.3s ease-in-out'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Phone Number Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="phone" style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--text-dark, #1f2937)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              WhatsApp Phone Number
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{
                position: 'absolute',
                left: '16px',
                color: 'var(--text-muted, #9ca3af)',
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
                placeholder="e.g. +91 98765 43210"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 44px',
                  borderRadius: 'var(--radius-md, 8px)',
                  border: '1.5px solid var(--border-light, #e5e7eb)',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                  color: 'var(--text-dark, #1f2937)'
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="password" style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--text-dark, #1f2937)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Portal Security Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{
                position: 'absolute',
                left: '16px',
                color: 'var(--text-muted, #9ca3af)',
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
                  borderRadius: 'var(--radius-md, 8px)',
                  border: '1.5px solid var(--border-light, #e5e7eb)',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                  color: 'var(--text-dark, #1f2937)'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                disabled={isSubmitting}
                style={{
                  position: 'absolute',
                  right: '16px',
                  color: 'var(--text-muted, #9ca3af)',
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
              backgroundColor: 'var(--primary-forest, #2d140e)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.95rem',
              padding: '14px',
              borderRadius: 'var(--radius-md, 8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              marginTop: '8px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.8 : 1,
              border: 'none',
              boxShadow: '0 4px 12px rgba(45, 20, 14, 0.15)'
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
              'Enter Pandit Portal'
            )}
          </button>

        </form>

        {/* Back navigation */}
        <div style={{
          borderTop: '1px solid var(--border-light, #e5e7eb)',
          paddingTop: '20px',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <button
            onClick={onNavigateToHome}
            disabled={isSubmitting}
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-muted, #6b7280)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'color 0.2s',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={14} /> Back to Public Store
          </button>
        </div>

      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
      `}</style>

    </div>
  );
};
