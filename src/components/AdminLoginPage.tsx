import React from 'react';
import { Lock, Mail, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { hashPassword } from '../lib/crypto';

interface AdminLoginPageProps {
  onLoginSuccess: (username: string, token: string | null) => void;
  onNavigateToHome: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onNavigateToHome,
}) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!email || !password) {
      setErrorMsg('Please enter both your email/username and password.');
      return;
    }

    setIsSubmitting(true);

    (async () => {
      try {
        const passwordHash = await hashPassword(password);
        const usernameInput = email.trim().toLowerCase();

        // Query Supabase website_store_admin table (supports email/username mapping)
        const { data, error } = await supabase
          .from('website_store_admin')
          .select('*')
          .eq('username', usernameInput)
          .maybeSingle();

        setIsSubmitting(false);

        if (error) {
          setErrorMsg('Database Error: ' + error.message + ' (Code: ' + error.code + ')');
          return;
        }

        if (!data) {
          setErrorMsg('Sanctum login failed: No administrative user found with username "' + usernameInput + '".');
          return;
        }

        if (data.password_hash === passwordHash || data.password_hash === password) {
          try {
            const { data: token, error: tokenError } = await supabase.rpc('authenticate_admin', {
              p_username: data.username,
              p_password_hash: data.password_hash,
              p_ip: '127.0.0.1',
              p_user_agent: navigator.userAgent
            });
            if (tokenError) {
              console.warn('Failed to call authenticate_admin RPC, proceeding with local fallback:', tokenError.message);
              onLoginSuccess(data.username, null);
            } else {
              onLoginSuccess(data.username, token);
            }
          } catch (tokenErr) {
            console.error('Error during authenticate_admin RPC, proceeding with local fallback:', tokenErr);
            onLoginSuccess(data.username, null);
          }
        } else {
          setErrorMsg('Invalid administrative credentials. Password mismatch.');
        }
      } catch (err) {
        console.error(err);
        setIsSubmitting(false);
        setErrorMsg('Database authentication error. Unable to establish admin session.');
      }
    })();
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
      
      {/* Decorative ambient background blur orbs (premium design) */}
      <div style={{
        position: 'absolute',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'rgba(249, 115, 22, 0.12)',
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
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 25px 50px -12px rgba(45, 20, 14, 0.12), 0 0 0 1px rgba(45, 20, 14, 0.02)',
        padding: '40px',
        zIndex: 2,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>

        {/* Minimalist Premium Heading without Logos */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--primary-forest)',
            letterSpacing: '-0.5px'
          }}>
            Control Center Portal
          </h2>
          <p style={{
            fontSize: '0.88rem',
            color: 'var(--text-muted)',
            marginTop: '6px'
          }}>
            Authenticate to access the administrator panel.
          </p>
        </div>

        {/* Error Notification Banner */}
        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            backgroundColor: '#fee2e2',
            border: '1.5px solid #fecaca',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            fontSize: '0.85rem',
            color: '#b91c1c',
            fontWeight: 600,
            animation: 'shake 0.3s ease-in-out',
            textAlign: 'left'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Username / Email field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
            <label htmlFor="email" style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--text-dark)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Email or Username
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{
                position: 'absolute',
                left: '16px',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Mail size={16} />
              </span>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mantrapuja.com"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 44px',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--border-light)',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                  color: 'var(--text-dark)'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary-lime)';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(249, 115, 22, 0.08)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Password field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
            <label htmlFor="password" style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--text-dark)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Security Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{
                position: 'absolute',
                left: '16px',
                color: 'var(--text-muted)',
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
                placeholder="••••••••"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '14px 44px 14px 44px',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--border-light)',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                  color: 'var(--text-dark)'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary-lime)';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(249, 115, 22, 0.08)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                disabled={isSubmitting}
                style={{
                  position: 'absolute',
                  right: '16px',
                  color: 'var(--text-muted)',
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
              backgroundColor: 'var(--primary-forest)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.95rem',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              marginTop: '8px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.8 : 1,
              boxShadow: '0 4px 12px rgba(45, 20, 14, 0.15)'
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = 'var(--primary-lime)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(249, 115, 22, 0.25)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = 'var(--primary-forest)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(45, 20, 14, 0.15)';
              }
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
              'Verify Credentials'
            )}
          </button>

        </form>

        {/* Back navigation option */}
        <div style={{
          borderTop: '1px solid var(--border-light)',
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
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-lime)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <ArrowLeft size={14} /> Back to Public Store
          </button>
        </div>

      </div>

      {/* Styled animation keyframes locally */}
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
