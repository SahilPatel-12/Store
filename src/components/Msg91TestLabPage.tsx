import React, { useState, useEffect } from 'react';

interface Msg91TestLabPageProps {
  onNavigateToHome: () => void;
  onNavigateToShop: () => void;
}

interface ConfigStatus {
  configured: boolean;
  detectedProduct: string;
  authKeyPresent: boolean;
  smsFlowIdPresent: boolean;
  otpTemplateIdPresent: boolean;
  widgetIdPresent: boolean;
  whatsappTemplatePresent: boolean;
  whatsappIntegratedNumberPresent: boolean;
  verificationMode: string;
}

const styles = {
  container: {
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '32px 24px',
    borderRadius: '16px',
    border: '1px solid #1e293b',
    margin: '40px auto',
    maxWidth: '960px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.4)'
  },
  header: {
    borderBottom: '1px solid #334155',
    paddingBottom: '24px',
    marginBottom: '32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '16px'
  },
  title: {
    fontSize: '26px',
    fontWeight: '800',
    color: '#ffffff',
    margin: '0 0 6px 0',
    letterSpacing: '-0.5px'
  },
  subtitle: {
    fontSize: '14px',
    color: '#94a3b8',
    margin: 0
  },
  badge: {
    display: 'inline-block',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    color: '#fbbf24',
    border: '1px solid rgba(245, 158, 11, 0.2)',
    padding: '3px 10px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    marginBottom: '10px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    marginBottom: '24px'
  },
  card: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 20px 0',
    borderBottom: '1px solid #334155',
    paddingBottom: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  label: {
    display: 'block',
    fontSize: '12px',
    color: '#94a3b8',
    marginBottom: '6px',
    fontWeight: '500'
  },
  value: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f1f5f9'
  },
  row: {
    marginBottom: '16px'
  },
  button: {
    backgroundColor: '#6366f1',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 18px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    boxSizing: 'border-box' as const
  },
  buttonSecondary: {
    backgroundColor: '#334155',
    color: '#f1f5f9',
    border: '1px solid #475569',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  buttonConfirm: {
    backgroundColor: '#059669',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  buttonReject: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  input: {
    backgroundColor: '#0f172a',
    border: '1px solid #475569',
    color: '#ffffff',
    borderRadius: '8px',
    padding: '12px 14px',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box' as const,
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  select: {
    backgroundColor: '#0f172a',
    border: '1px solid #475569',
    color: '#ffffff',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box' as const,
    outline: 'none'
  },
  console: {
    backgroundColor: '#090d16',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    padding: '18px',
    fontFamily: 'Consolas, Monaco, "Andale Mono", monospace',
    fontSize: '12px',
    marginTop: '24px'
  },
  consoleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #1e293b',
    paddingBottom: '10px',
    marginBottom: '12px',
    color: '#94a3b8',
    fontWeight: '600'
  },
  consoleContent: {
    maxHeight: '160px',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    color: '#a1a1aa',
    textAlign: 'left' as const
  }
};

export default function Msg91TestLabPage({ onNavigateToHome, onNavigateToShop }: Msg91TestLabPageProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [config, setConfig] = useState<ConfigStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [countryCode, setCountryCode] = useState<string>('91');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');

  // Execution states
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [sendResult, setSendResult] = useState<'ACCEPTED' | 'FAILED' | 'NOT TESTED'>('NOT TESTED');
  const [deliveryChannel, setDeliveryChannel] = useState<'SMS' | 'WHATSAPP' | 'NOT RECEIVED' | 'AWAITING CONFIRMATION' | 'NOT TESTED'>('NOT TESTED');
  const [verificationState, setVerificationState] = useState<'VERIFIED LOCALLY' | 'FAILED' | 'EXPIRED' | 'ATTEMPT LIMIT REACHED' | 'NOT TESTED'>('NOT TESTED');
  const [statusLog, setStatusLog] = useState<string[]>([]);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [transactionIdMasked, setTransactionIdMasked] = useState<string>('None');

  // Check admin session and load status on mount
  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/api/admin/session');
        const data = await response.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          checkConfigStatus();
        } else {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      } catch (e) {
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    })();
  }, []);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setStatusLog(prev => [`[${time}] ${msg}`, ...prev]);
  };

  const checkConfigStatus = async () => {
    try {
      addLog('Verifying admin privileges and fetching MSG91 status...');
      const res = await fetch('/api/test-msg91/status', {
        credentials: 'include'
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        addLog('Error: 401 Unauthorized admin session.');
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to load status. Status: ${res.status}`);
      }

      const data: ConfigStatus = await res.json();
      setConfig(data);
      setIsAuthenticated(true);
      addLog(`Status loaded. Product: ${data.detectedProduct.toUpperCase()}. Configured: ${data.configured}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initialize Test Lab.');
      addLog(`Error loading configuration status: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;

    setIsSending(true);
    setErrorDetail(null);
    setSendResult('NOT TESTED');
    setVerificationState('NOT TESTED');
    setDeliveryChannel('AWAITING CONFIRMATION');
    setAttemptsRemaining(null);
    setTransactionIdMasked('None');

    const fullPhone = phoneNumber.replace(/[^\d]/g, '');
    const maskedPhone = fullPhone.length > 4 ? `${fullPhone.substring(0, 2)}******${fullPhone.slice(-4)}` : fullPhone;
    addLog(`Initiating MSG91 Flow OTP dispatch request for phone: +${countryCode} ${maskedPhone}`);
    addLog('Preparing MSG91 SMS template request.');
    addLog('Request contract: template_id + recipients[] + mobiles + VAR1.');

    try {
      const res = await fetch('/api/test-msg91/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          phone: `${countryCode}${phoneNumber}`
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setSendResult('FAILED');
        setDeliveryChannel('NOT TESTED');
        setTransactionIdMasked('None');
        setErrorDetail(data.error || 'Failed to send OTP.');
        addLog(`✘ MSG91 Flow send rejected: ${data.error || 'Unknown error'}`);
        return;
      }

      setSendResult('ACCEPTED');
      setTransactionIdMasked(data.transactionIdMasked || '******');
      addLog('✔ MSG91 gateway request accepted.');
    } catch (err: any) {
      setSendResult('FAILED');
      setDeliveryChannel('NOT TESTED');
      setTransactionIdMasked('None');
      setErrorDetail(err.message || 'Fetch failed.');
      addLog(`✘ Connection error dispatching Flow request: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || !phoneNumber) return;

    setIsVerifying(true);
    setErrorDetail(null);

    addLog(`Submitting verification code validation: ${otpCode}`);

    try {
      const res = await fetch('/api/test-msg91/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          phone: `${countryCode}${phoneNumber}`,
          otp: otpCode
        })
      });

      const data = await res.json();

      if (!res.ok) {
        addLog(`✘ Verification failed: ${data.error || 'Incorrect OTP'}`);
        setErrorDetail(data.error || 'Invalid OTP.');

        if (data.error?.toLowerCase().includes('attempt') || data.attemptsRemaining === 0) {
          setVerificationState('ATTEMPT LIMIT REACHED');
        } else {
          setVerificationState('FAILED');
        }

        if (data.attemptsRemaining !== undefined) {
          setAttemptsRemaining(data.attemptsRemaining);
          addLog(`Attempts remaining: ${data.attemptsRemaining}`);
        }
        return;
      }

      setVerificationState('VERIFIED LOCALLY');
      addLog('✔ Verification successful: OTP MATCH VERIFIED LOCALLY');
    } catch (err: any) {
      setVerificationState('FAILED');
      setErrorDetail(err.message || 'Verification request failed.');
      addLog(`✘ Verification error: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualChannel = (channel: 'SMS' | 'WHATSAPP' | 'NOT RECEIVED') => {
    setDeliveryChannel(channel);
    addLog(`User manual feedback: OTP physically ${channel === 'NOT RECEIVED' ? 'not received' : `received via ${channel}`}`);
  };

  const handleClearTest = () => {
    setPhoneNumber('');
    setOtpCode('');
    setSendResult('NOT TESTED');
    setDeliveryChannel('NOT TESTED');
    setVerificationState('NOT TESTED');
    setErrorDetail(null);
    setAttemptsRemaining(null);
    setTransactionIdMasked('None');
    addLog('Test lab state cleared.');
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '80vh', backgroundColor: '#0B0F19', color: '#white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#94a3b8', fontSize: '18px' }}>Initializing MSG91 OTP Test Lab...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <div style={{ minHeight: '70vh', backgroundColor: '#0B0F19', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: '440px', width: '100%', backgroundColor: '#1e293b', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', padding: '32px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#f87171', margin: '0 0 12px 0' }}>Access Denied</h2>
          <p style={{ color: '#94a3b8', margin: '0 0 24px 0', fontSize: '14px', lineHeight: '1.6' }}>
            This temporary route is strictly restricted to authenticated administrators. Please log in as an admin to access the test lab.
          </p>
          <button
            onClick={onNavigateToShop}
            style={{ ...styles.button, backgroundColor: '#334155', border: '1px solid #475569' }}
          >
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <span style={styles.badge}>Developer Tools</span>
          <h1 style={styles.title}>MSG91 OTP Test Lab</h1>
          <p style={styles.subtitle}>Temporary channel discovery and OTP delivery validation</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onNavigateToHome} style={styles.buttonSecondary}>
            Home
          </button>
          <button onClick={onNavigateToShop} style={styles.buttonSecondary}>
            Store
          </button>
        </div>
      </header>

      {errorMessage && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '16px', borderRadius: '10px', marginBottom: '24px', fontSize: '14px' }}>
          {errorMessage}
        </div>
      )}

      <div style={styles.grid}>
        {/* Left Column: Metadata & Config */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#3b82f6', borderRadius: '50%' }}></span>
              Lab Configuration
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
              <div>
                <span style={styles.label}>PRODUCT</span>
                <span style={styles.value}>SMS FLOW / TEMPLATE API</span>
              </div>
              <div>
                <span style={styles.label}>DELIVERY CHANNEL</span>
                <span style={styles.value}>SMS</span>
              </div>
              <div>
                <span style={styles.label}>OTP VARIABLE</span>
                <span style={{ ...styles.value, color: '#a855f7' }}>var1</span>
              </div>
              <div>
                <span style={styles.label}>OTP GENERATION</span>
                <span style={styles.value}>LOCAL SERVER</span>
              </div>
              <div>
                <span style={styles.label}>OTP VERIFICATION</span>
                <span style={{ ...styles.value, fontSize: '11px', color: '#60a5fa', backgroundColor: 'rgba(96,165,250,0.05)', padding: '4px 6px', border: '1px solid rgba(96,165,250,0.1)', borderRadius: '4px', display: 'inline-block' }}>
                  LOCAL SERVER HASH
                </span>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#a855f7', borderRadius: '50%' }}></span>
              Environment Details
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Host Domain:</span>
                <span style={{ fontWeight: '600' }}>{window.location.hostname}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Test Mode:</span>
                <span style={{ color: '#34d399', fontWeight: '600' }}>Isolate Sandbox</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Domain Whitelist:</span>
                <span style={{ color: '#64748b' }}>Not required</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Interactive Lab Board */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* CARD 1: MSG91 SMS FLOW TEST */}
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
                  MSG91 SMS FLOW TEST
                </h2>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  Product: SMS | Template Variable: var1
                </div>
              </div>
              <button onClick={handleClearTest} style={styles.buttonSecondary}>
                Clear Test
              </button>
            </div>

            {/* Step 1: Input Phone & Send */}
            <div style={{ marginBottom: '24px', borderBottom: '1px solid #334155', paddingBottom: '24px', textAlign: 'left' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
                1. Dispatch Request
              </h3>
              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
                <div style={{ flex: '1 1 120px' }}>
                  <label style={styles.label}>Country Code</label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    disabled={isSending}
                    style={styles.select}
                  >
                    <option value="91">+91 (India)</option>
                    <option value="1">+1 (US/Canada)</option>
                    <option value="44">+44 (UK)</option>
                    <option value="971">+971 (UAE)</option>
                  </select>
                </div>
                <div style={{ flex: '2 1 200px' }}>
                  <label style={styles.label}>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="Enter mobile number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d]/g, ''))}
                    disabled={isSending}
                    required
                    style={styles.input}
                  />
                </div>
                <div style={{ flex: '1 1 180px' }}>
                  <button
                    type="submit"
                    disabled={isSending || !phoneNumber || !config?.configured}
                    style={{
                      ...styles.button,
                      backgroundColor: isSending || !phoneNumber || !config?.configured ? '#1e293b' : '#6366f1',
                      color: isSending || !phoneNumber || !config?.configured ? '#64748b' : '#ffffff',
                      border: isSending || !phoneNumber || !config?.configured ? '1px solid #334155' : 'none'
                    }}
                  >
                    {isSending ? 'Sending...' : 'Send MSG91 SMS OTP'}
                  </button>
                </div>
              </form>
              {errorDetail && sendResult === 'FAILED' && (
                <div style={{ marginTop: '14px', padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#f87171', fontSize: '13px' }}>
                  <strong>Error Details:</strong> {errorDetail}
                </div>
              )}
            </div>

            {/* Step 2: SMS Delivery Confirmation */}
            {sendResult === 'ACCEPTED' && (
              <div style={{ marginBottom: '24px', borderBottom: '1px solid #334155', paddingBottom: '24px', textAlign: 'left' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  2. SMS Delivery Confirmation
                </h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                  MSG91 accepted the SMS request. Check your SMS inbox.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <button
                    onClick={() => handleManualChannel('SMS')}
                    style={deliveryChannel === 'SMS' ? styles.buttonConfirm : styles.buttonSecondary}
                  >
                    💬 I Received SMS OTP
                  </button>
                  <button
                    onClick={() => handleManualChannel('NOT RECEIVED')}
                    style={deliveryChannel === 'NOT RECEIVED' ? styles.buttonReject : styles.buttonSecondary}
                  >
                    ❌ I Did Not Receive SMS OTP
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Enter OTP & Verify */}
            {sendResult === 'ACCEPTED' && deliveryChannel !== 'NOT RECEIVED' && deliveryChannel !== 'NOT TESTED' && (
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
                  3. Enter OTP & Verify
                </h3>
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
                  <div style={{ flex: '2 1 200px' }}>
                    <label style={styles.label}>Enter 6-Digit OTP Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^\d]/g, ''))}
                      disabled={isVerifying || verificationState === 'VERIFIED LOCALLY' || verificationState === 'ATTEMPT LIMIT REACHED'}
                      required
                      style={{ ...styles.input, textAlign: 'center', fontSize: '18px', fontWeight: '700', letterSpacing: '4px' }}
                    />
                  </div>
                  <div style={{ flex: '1 1 180px' }}>
                    <button
                      type="submit"
                      disabled={isVerifying || !otpCode || verificationState === 'VERIFIED LOCALLY' || verificationState === 'ATTEMPT LIMIT REACHED'}
                      style={{
                        ...styles.button,
                        backgroundColor: isVerifying || verificationState === 'VERIFIED LOCALLY' || verificationState === 'ATTEMPT LIMIT REACHED' ? '#1e293b' : '#059669'
                      }}
                    >
                      {isVerifying ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                </form>

                {attemptsRemaining !== null && attemptsRemaining > 0 && (
                  <p style={{ fontSize: '13px', color: '#f59e0b', marginTop: '10px', margin: 0 }}>
                    ⚠️ Mismatch code. Attempts remaining: {attemptsRemaining}
                  </p>
                )}

                {errorDetail && sendResult === 'ACCEPTED' && (
                  <div style={{ marginTop: '14px', padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#f87171', fontSize: '13px' }}>
                    <strong>Verification Error:</strong> {errorDetail}
                  </div>
                )}
              </div>
            )}

            {/* Status Summary Output */}
            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #334155', textAlign: 'left' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
                Lab Test Results
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '10px', border: '1px solid #1e293b' }}>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block', fontWeight: '600', marginBottom: '4px' }}>GATEWAY STATUS</span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: sendResult === 'ACCEPTED' ? '#34d399' : sendResult === 'FAILED' ? '#f87171' : '#64748b' }}>
                    {sendResult}
                  </span>
                </div>
                <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '10px', border: '1px solid #1e293b' }}>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block', fontWeight: '600', marginBottom: '4px' }}>PHYSICAL DELIVERY</span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: deliveryChannel === 'SMS' ? '#34d399' : deliveryChannel === 'NOT RECEIVED' ? '#f87171' : '#64748b' }}>
                    {deliveryChannel === 'SMS' ? 'CONFIRMED' : deliveryChannel === 'NOT RECEIVED' ? 'NOT CONFIRMED' : 'NOT TESTED'}
                  </span>
                </div>
                <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '10px', border: '1px solid #1e293b' }}>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block', fontWeight: '600', marginBottom: '4px' }}>TRANSACTION ID</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#e2e8f0', fontFamily: 'monospace', display: 'block' }}>
                    {transactionIdMasked}
                  </span>
                  {sendResult === 'ACCEPTED' && (
                    <span style={{ display: 'block', fontSize: '10px', color: '#64748b', marginTop: '4px', fontWeight: 'bold' }}>
                      CHECK MSG91 DELIVERY REPORT
                    </span>
                  )}
                </div>
              </div>

              {verificationState === 'VERIFIED LOCALLY' && (
                <div style={{ marginTop: '20px', padding: '16px', backgroundColor: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.25)', borderRadius: '12px', color: '#34d399' }}>
                  <strong style={{ fontSize: '14px' }}>✔ OTP MATCH VERIFIED LOCALLY</strong>
                  <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '13px', lineHeight: '1.5' }}>
                    The OTP delivered through the configured MSG91 SMS template matches the OTP securely generated by our backend.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* CARD 2: MSG91 WHATSAPP TEST */}
          <div style={styles.card}>
            <div style={{ marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px', textAlign: 'left' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
                MSG91 WHATSAPP TEST
              </h2>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                Product: WhatsApp
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
              <div style={{ padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '8px', color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>⚠️</span>
                <div>
                  <strong style={{ fontSize: '13px', display: 'block' }}>STATUS: NOT CONFIGURED</strong>
                  <span style={{ fontSize: '12px', color: '#cbd5e1' }}>WhatsApp template configurations are missing in msg91_settings.</span>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '8px' }}>Missing Configuration Categories:</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px', lineHeight: '1.4' }}>
                  <li><strong>Integrated WhatsApp Number:</strong> MISSING (Meta-verified number associated with your MSG91 project)</li>
                  <li><strong>Approved WhatsApp Template:</strong> MISSING (Outbound template registered with Meta)</li>
                  <li><strong>WhatsApp Authentication/OTP Template:</strong> MISSING (Template mapped with a <code>##OTP##</code> token placeholder)</li>
                  <li><strong>Template Language:</strong> MISSING (Default locale fallback, e.g. <code>en</code>)</li>
                  <li><strong>Template Variables:</strong> MISSING (Component variable mapping)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Logs console */}
          <div style={styles.console}>
            <div style={styles.consoleHeader}>
              <span>Lab Trace Console</span>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%' }}></span>
            </div>
            <div style={styles.consoleContent}>
              {statusLog.length === 0 ? (
                <p style={{ color: '#4b5563', fontStyle: 'italic', margin: 0 }}>Console is empty. Awaiting inputs...</p>
              ) : (
                statusLog.map((log, index) => (
                  <div key={index} style={{ wordBreak: 'break-all', lineHeight: '1.4' }}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
