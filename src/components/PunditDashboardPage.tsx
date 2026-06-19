import React from 'react';
import { 
  User, 
  Copy, 
  Check, 
  Search, 
  Wallet, 
  Calendar, 
  Clock, 
  LogOut, 
  TrendingUp,
  Award,
  Video,
  DollarSign
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';

interface PunditDashboardPageProps {
  loggedInUser: { id: string; fullName: string; email: string; phoneNumber: string };
  onLogout: () => void;
  products: Product[];
}

export const PunditDashboardPage: React.FC<PunditDashboardPageProps> = ({
  loggedInUser,
  onLogout,
  products
}) => {
  const [activeTab, setActiveTab] = React.useState<'affiliation' | 'booking'>('affiliation');
  const [affiliateProfile, setAffiliateProfile] = React.useState<any>(null);
  const [loadingProfile, setLoadingProfile] = React.useState(true);
  
  // Lists
  const [referrals, setReferrals] = React.useState<any[]>([]);
  const [commissions, setCommissions] = React.useState<any[]>([]);
  const [payouts, setPayouts] = React.useState<any[]>([]);
  const [loadingLists, setLoadingLists] = React.useState(false);

  // Sharing States
  const [copiedLink, setCopiedLink] = React.useState<string | null>(null);
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [productSearch, setProductSearch] = React.useState('');

  // Payout Request Form States
  const [withdrawalAmount, setWithdrawalAmount] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('UPI');
  const [upiId, setUpiId] = React.useState('');
  const [bankName, setBankName] = React.useState('');
  const [accountNumber, setAccountNumber] = React.useState('');
  const [ifscCode, setIfscCode] = React.useState('');
  const [holderName, setHolderName] = React.useState('');
  const [payoutMessage, setPayoutMessage] = React.useState('');
  const [isRequestingPayout, setIsRequestingPayout] = React.useState(false);

  const token = localStorage.getItem('session_token') || '';

  const getProductSlug = (p: Product): string => {
    if ('slug' in p && (p as any).slug) {
      return (p as any).slug;
    }
    return p.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[-\s]+/g, '-');
  };

  const fetchAffiliateProfile = React.useCallback(async () => {
    if (!token) return;
    setLoadingProfile(true);
    try {
      const { data, error } = await supabase.rpc('get_affiliate_profile', {
        p_session_token: token
      });
      if (error) throw error;
      if (data && data.length > 0) {
        setAffiliateProfile(data[0]);
      }
    } catch (err) {
      console.error('Error fetching affiliate profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  }, [token]);

  const fetchDashboardLists = React.useCallback(async () => {
    if (!token) return;
    setLoadingLists(true);
    try {
      // 1. Fetch Referral Tree
      const { data: treeData, error: treeError } = await supabase.rpc('get_referral_tree_by_session', {
        p_session_token: token,
        p_max_depth: 5
      });
      if (!treeError && treeData) setReferrals(treeData);

      // 2. Fetch Commissions
      const { data: commsData, error: commsError } = await supabase.rpc('get_commissions_history_by_session', {
        p_session_token: token
      });
      if (!commsError && commsData) setCommissions(commsData);

      // 3. Fetch Withdrawal History
      const { data: withdrawalsData, error: withdrawalsError } = await supabase.rpc('get_withdrawal_history_by_session', {
        p_session_token: token
      });
      if (!withdrawalsError && withdrawalsData) setPayouts(withdrawalsData);

    } catch (err) {
      console.error('Error fetching dashboard listings:', err);
    } finally {
      setLoadingLists(false);
    }
  }, [token]);

  React.useEffect(() => {
    fetchAffiliateProfile();
    fetchDashboardLists();
  }, [fetchAffiliateProfile, fetchDashboardLists]);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutMessage('');
    
    if (!affiliateProfile) return;

    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      setPayoutMessage('❌ Please enter a valid withdrawal amount.');
      return;
    }

    if (amount > affiliateProfile.available_balance) {
      setPayoutMessage('❌ Withdrawal amount exceeds your available balance.');
      return;
    }

    if (amount < 1000) {
      setPayoutMessage('❌ Minimum withdrawal threshold is ₹1,000.');
      return;
    }

    let paymentDetailsJson: any = {};
    if (paymentMethod === 'UPI') {
      if (!upiId.trim()) {
        setPayoutMessage('❌ Please enter your UPI ID.');
        return;
      }
      paymentDetailsJson = { upi_id: upiId.trim() };
    } else {
      if (!bankName.trim() || !accountNumber.trim() || !ifscCode.trim() || !holderName.trim()) {
        setPayoutMessage('❌ Please fill out all bank account fields.');
        return;
      }
      paymentDetailsJson = {
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        ifsc_code: ifscCode.trim(),
        holder_name: holderName.trim()
      };
    }

    setIsRequestingPayout(true);
    try {
      const { error } = await supabase.rpc('request_withdrawal_by_session', {
        p_session_token: token,
        p_amount: amount,
        p_payment_method: paymentMethod,
        p_payment_details: paymentDetailsJson
      });

      if (error) {
        setPayoutMessage('❌ Error: ' + error.message);
      } else {
        setPayoutMessage('✅ Payout request submitted successfully! Your funds are pending review.');
        setWithdrawalAmount('');
        setUpiId('');
        setBankName('');
        setAccountNumber('');
        setIfscCode('');
        setHolderName('');
        // Refresh stats & list
        fetchAffiliateProfile();
        fetchDashboardLists();
      }
    } catch (err) {
      setPayoutMessage('❌ Exception: ' + (err as Error).message);
    } finally {
      setIsRequestingPayout(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div style={{
      backgroundColor: '#f5f5f7',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      
      {/* Top Professional Portal Header */}
      <header style={{
        background: 'linear-gradient(135deg, #1e0b07 0%, #2d140e 100%)',
        color: '#ffffff',
        borderBottom: '4px solid var(--primary-lime, #84cc16)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2rem' }}>🕉️</span>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, letterSpacing: '-0.3px', color: '#ffffff' }}>
                Mantra Puja Pundit Portal
              </h1>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.7)', margin: '2px 0 0 0' }}>
                Auspicious Dashboard for Shastri: <strong>{loggedInUser.fullName}</strong> ({loggedInUser.phoneNumber})
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={onLogout}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#fca5a5',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
              }}
            >
              <LogOut size={14} /> Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Core Layout */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
        
        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '12px',
          borderBottom: '2px solid #e5e7eb',
          paddingBottom: '16px',
          marginBottom: '32px'
        }}>
          <button
            onClick={() => setActiveTab('affiliation')}
            style={{
              background: activeTab === 'affiliation' ? '#ffffff' : 'transparent',
              border: activeTab === 'affiliation' ? '1.5px solid var(--primary-lime, #84cc16)' : '1px solid transparent',
              color: activeTab === 'affiliation' ? 'var(--primary-lime, #84cc16)' : '#6b7280',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: activeTab === 'affiliation' ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <Wallet size={16} /> Affiliation & Sharing Links
          </button>
          <button
            onClick={() => setActiveTab('booking')}
            style={{
              background: activeTab === 'booking' ? '#ffffff' : 'transparent',
              border: activeTab === 'booking' ? '1.5px solid var(--primary-lime, #84cc16)' : '1px solid transparent',
              color: activeTab === 'booking' ? 'var(--primary-lime, #84cc16)' : '#6b7280',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: activeTab === 'booking' ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <Calendar size={16} /> Pundit Puja Bookings
          </button>
        </div>

        {/* Tab Content: Affiliation Program */}
        {activeTab === 'affiliation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {loadingProfile ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: '#84cc16', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>Loading Shastri Wallet profile...</p>
              </div>
            ) : affiliateProfile ? (
              <>
                {/* Balance & Stats Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '20px'
                }}>
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>Total Commission Earned</span>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#1f2937', marginTop: '8px' }}>₹{affiliateProfile.total_earned.toFixed(2)}</div>
                  </div>
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>Available for Withdrawal</span>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#16a34a', marginTop: '8px' }}>₹{affiliateProfile.available_balance.toFixed(2)}</div>
                  </div>
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>Holding Pending Verification</span>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#d97706', marginTop: '8px' }}>₹{affiliateProfile.pending_earnings.toFixed(2)}</div>
                  </div>
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>Devotee Signups</span>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#2563eb', marginTop: '8px' }}>{referrals.filter(n => n.level === 1).length} referred</div>
                  </div>
                </div>

                {/* Sharing Details Card */}
                <div style={{
                  backgroundColor: 'rgba(253, 224, 71, 0.1)',
                  border: '1.5px solid #fef08a',
                  borderRadius: '12px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <Award size={18} style={{ color: '#84cc16' }} />
                    Default Pundit Referral sharing
                  </h3>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '24px'
                  }}>
                    {/* Sharing Code */}
                    <div style={{ flex: '1 1 300px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                        Your Shastri Affiliate Code
                      </span>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        color: '#1e3a8a'
                      }}>
                        <code>{affiliateProfile.affiliate_code}</code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(affiliateProfile.affiliate_code);
                            setCopiedCode(true);
                            setTimeout(() => setCopiedCode(false), 2000);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#84cc16',
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Generic URL sharing */}
                    <div style={{ flex: '2 1 400px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                        General Store Referral Link
                      </span>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        color: '#1e293b'
                      }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '16px' }}>
                          {window.location.origin + '?ref=' + affiliateProfile.affiliate_code}
                        </span>
                        <button
                          onClick={() => handleCopyText(window.location.origin + '?ref=' + affiliateProfile.affiliate_code, 'main-link')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#84cc16',
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            flexShrink: 0
                          }}
                        >
                          {copiedLink === 'main-link' ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copiedLink === 'main-link' ? 'Copied' : 'Copy Link'}</span>
                        </button>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div style={{
                      flex: '0 0 140px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '10px'
                    }}>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(window.location.origin + '?ref=' + affiliateProfile.affiliate_code)}`}
                        alt="QR Code"
                        style={{ width: '100px', height: '100px' }}
                      />
                      <button
                        onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(window.location.origin + '?ref=' + affiliateProfile.affiliate_code)}`, '_blank')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#84cc16',
                          cursor: 'pointer',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          textTransform: 'uppercase'
                        }}
                      >
                        Open Large QR
                      </button>
                    </div>
                  </div>
                </div>

                {/* Specific Product Links Generator */}
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                    marginBottom: '20px'
                  }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1f2937', margin: 0 }}>
                        Specific Puja & Item Link Generator
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px', margin: 0 }}>
                        Generate and copy direct booking/checkout links for specific spiritual items to share with devotees.
                      </p>
                    </div>

                    <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                      <input
                        type="text"
                        placeholder="Search pujas or products..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 36px',
                          borderRadius: '8px',
                          border: '1.5px solid #cbd5e1',
                          outline: 'none',
                          fontSize: '0.85rem'
                        }}
                      />
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    </div>
                  </div>

                  <div style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0 }}>
                          <th style={{ padding: '12px 16px', fontWeight: 700 }}>Item Name</th>
                          <th style={{ padding: '12px 16px', fontWeight: 700 }}>Category</th>
                          <th style={{ padding: '12px 16px', fontWeight: 700 }}>Price</th>
                          <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Copy Sharing link</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                              No pujas or items matched your search query.
                            </td>
                          </tr>
                        ) : (
                          filteredProducts.map((p) => {
                            const productUrl = `${window.location.origin}/product/${getProductSlug(p)}?ref=${affiliateProfile.affiliate_code}`;
                            return (
                              <tr key={p.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1e293b' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '1.1rem' }}>
                                      {p.image && p.image.length < 5 ? p.image : '🔮'}
                                    </span>
                                    <span>{p.name}</span>
                                  </div>
                                </td>
                                <td style={{ padding: '12px 16px', color: '#475569' }}>{p.category}</td>
                                <td style={{ padding: '12px 16px', fontWeight: 800, color: '#15803d' }}>₹{p.price}</td>
                                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                  <button
                                    onClick={() => handleCopyText(productUrl, p.id)}
                                    style={{
                                      backgroundColor: copiedLink === p.id ? '#dcfce7' : '#f1f5f9',
                                      border: '1px solid ' + (copiedLink === p.id ? '#bbf7d0' : '#cbd5e1'),
                                      color: copiedLink === p.id ? '#15803d' : '#334155',
                                      padding: '6px 12px',
                                      borderRadius: '6px',
                                      fontWeight: 700,
                                      fontSize: '0.75rem',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      transition: 'all 0.15s'
                                    }}
                                  >
                                    {copiedLink === p.id ? <Check size={12} /> : <Copy size={12} />}
                                    <span>{copiedLink === p.id ? 'Copied' : 'Copy link'}</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Two-Column split for Payout & Referral tables */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
                  gap: '24px'
                }}>
                  
                  {/* Left Column: Payout / Withdrawal Center */}
                  <div style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                  }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <DollarSign size={18} style={{ color: '#84cc16' }} />
                      Submit Shastri Payout Request
                    </h3>

                    {payoutMessage && (
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        backgroundColor: payoutMessage.startsWith('✅') ? '#dcfce7' : '#fee2e2',
                        border: '1px solid ' + (payoutMessage.startsWith('✅') ? '#bbf7d0' : '#fecaca'),
                        color: payoutMessage.startsWith('✅') ? '#15803d' : '#991b1b'
                      }}>
                        {payoutMessage}
                      </div>
                    )}

                    <form onSubmit={handlePayoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Withdrawal Amount (₹) *
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 1500"
                          required
                          value={withdrawalAmount}
                          onChange={(e) => setWithdrawalAmount(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1.5px solid #cbd5e1',
                            borderRadius: '8px',
                            outline: 'none',
                            fontSize: '0.9rem'
                          }}
                        />
                        <span style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block', marginTop: '4px' }}>
                          Available Balance: ₹{affiliateProfile.available_balance.toFixed(2)}. Min. withdrawal is ₹1,000.
                        </span>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Payout Distribution Mode *
                        </label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="paymode"
                              checked={paymentMethod === 'UPI'}
                              onChange={() => setPaymentMethod('UPI')}
                            />
                            UPI ID
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="paymode"
                              checked={paymentMethod === 'Bank Transfer'}
                              onChange={() => setPaymentMethod('Bank Transfer')}
                            />
                            Bank Account
                          </label>
                        </div>
                      </div>

                      {paymentMethod === 'UPI' ? (
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                            UPI ID / VPA *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. shastri@paytm"
                            required={paymentMethod === 'UPI'}
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1.5px solid #cbd5e1',
                              borderRadius: '8px',
                              outline: 'none',
                              fontSize: '0.9rem'
                            }}
                          />
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '4px' }}>Bank Name *</label>
                            <input
                              type="text"
                              placeholder="SBI, HDFC, etc."
                              required={paymentMethod !== 'UPI'}
                              value={bankName}
                              onChange={(e) => setBankName(e.target.value)}
                              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '4px' }}>Account Holder Name *</label>
                            <input
                              type="text"
                              placeholder="Name in Bank account"
                              required={paymentMethod !== 'UPI'}
                              value={holderName}
                              onChange={(e) => setHolderName(e.target.value)}
                              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                            />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '4px' }}>Account Number *</label>
                              <input
                                type="text"
                                placeholder="Account Number"
                                required={paymentMethod !== 'UPI'}
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '4px' }}>IFSC Code *</label>
                              <input
                                type="text"
                                placeholder="IFSC Code"
                                required={paymentMethod !== 'UPI'}
                                value={ifscCode}
                                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isRequestingPayout || affiliateProfile.available_balance < 1000}
                        style={{
                          width: '100%',
                          backgroundColor: '#84cc16',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '12px',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          cursor: (isRequestingPayout || affiliateProfile.available_balance < 1000) ? 'not-allowed' : 'pointer',
                          opacity: (isRequestingPayout || affiliateProfile.available_balance < 1000) ? 0.6 : 1,
                          marginTop: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        {isRequestingPayout ? 'Submitting Request...' : 'Submit Payout Request'}
                      </button>
                    </form>
                  </div>

                  {/* Right Column: Signed up devotee list & Commission Ledger */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Referrals list */}
                    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        <User size={18} style={{ color: '#84cc16' }} />
                        Signed Up Devotees ({referrals.length})
                      </h3>
                      
                      <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                        {loadingLists ? (
                          <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
                        ) : referrals.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No devotee registrations found.</div>
                        ) : (
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Devotee Name</th>
                                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Phone</th>
                                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Date Joined</th>
                              </tr>
                            </thead>
                            <tbody>
                              {referrals.map((r, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#334155' }}>{r.full_name || 'Anonymous'}</td>
                                  <td style={{ padding: '10px 12px' }}>{r.phone_number || 'N/A'}</td>
                                  <td style={{ padding: '10px 12px', color: '#64748b' }}>
                                    {r.joined_at ? new Date(r.joined_at).toLocaleDateString() : 'N/A'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>

                    {/* Commissions list */}
                    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        <TrendingUp size={18} style={{ color: '#84cc16' }} />
                        Commissions Ledger ({commissions.length})
                      </h3>
                      
                      <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                        {loadingLists ? (
                          <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
                        ) : commissions.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No commission entries logged.</div>
                        ) : (
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Order ID</th>
                                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Commission</th>
                                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Status</th>
                                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {commissions.map((c, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{c.order_id}</td>
                                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#16a34a' }}>₹{c.commission_amount}</td>
                                  <td style={{ padding: '10px 12px' }}>
                                    <span style={{
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontSize: '0.68rem',
                                      fontWeight: 800,
                                      backgroundColor: c.status === 'approved' ? '#dcfce7' : '#fee2e2',
                                      color: c.status === 'approved' ? '#166534' : '#991b1b'
                                    }}>
                                      {c.status.toUpperCase()}
                                    </span>
                                  </td>
                                  <td style={{ padding: '10px 12px', color: '#64748b' }}>
                                    {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>

                  </div>

                </div>

                {/* Withdrawals List */}
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <DollarSign size={18} style={{ color: '#84cc16' }} />
                    Payout Withdrawals History
                  </h3>
                  
                  <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                    {loadingLists ? (
                      <div style={{ textAlign: 'center', padding: '24px' }}>Loading payout history...</div>
                    ) : payouts.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>No payout requests submitted yet.</div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Requested Date</th>
                            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Amount</th>
                            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Payment Method</th>
                            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
                            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Txn ID / Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payouts.map((w) => (
                            <tr key={w.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <td style={{ padding: '12px 16px', color: '#475569' }}>
                                {new Date(w.created_at).toLocaleString()}
                              </td>
                              <td style={{ padding: '12px 16px', fontWeight: 800, color: '#1f2937' }}>₹{w.amount}</td>
                              <td style={{ padding: '12px 16px', color: '#475569' }}>{w.payment_method}</td>
                              <td style={{ padding: '12px 16px' }}>
                                <span style={{
                                  padding: '3px 8px',
                                  borderRadius: '9999px',
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  backgroundColor: 
                                    w.status === 'paid' || w.status === 'approved' ? '#dcfce7' :
                                    w.status === 'pending' ? '#fef3c7' : '#fee2e2',
                                  color: 
                                    w.status === 'paid' || w.status === 'approved' ? '#166534' :
                                    w.status === 'pending' ? '#b45309' : '#991b1b'
                                }}>
                                  {w.status.toUpperCase()}
                                </span>
                              </td>
                              <td style={{ padding: '12px 16px', color: '#64748b' }}>
                                {w.txn_id ? `Txn Ref: ${w.txn_id}` : (w.admin_notes || 'Pending processing')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #fecaca', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                <span style={{ fontSize: '3rem' }}>⚠️</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#b91c1c', marginTop: '12px' }}>Profile Setup Error</h3>
                <p style={{ fontSize: '0.9rem', color: '#7f1d1d', marginTop: '8px' }}>
                  No affiliate wallet records could be located for your Shastri profile. Please contact the administrator.
                </p>
              </div>
            )}

          </div>
        )}

        {/* Tab Content: Pundit Bookings coming soon */}
        {activeTab === 'booking' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            animation: 'fadeIn 0.4s ease-out'
          }}>
            
            {/* Header Coming Soon Card */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '48px 32px',
              textAlign: 'center',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: '5px',
                background: 'linear-gradient(90deg, #d97706 0%, #ea580c 100%)'
              }} />
              
              <span style={{ fontSize: '4rem', display: 'block', marginBottom: '16px' }}>🕉️</span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>
                Puja Booking System
              </h2>
              <span style={{
                display: 'inline-block',
                backgroundColor: '#fef3c7',
                border: '1px solid #fde68a',
                color: '#d97706',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: '9999px',
                marginTop: '12px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Coming Soon
              </span>
              
              <p style={{
                fontSize: '0.95rem',
                color: '#64748b',
                marginTop: '16px',
                maxWidth: '600px',
                margin: '16px auto 0 auto',
                lineHeight: 1.6
              }}>
                We are actively building a premium digital booking portal for our Shastri partners. 
                Devotees will soon be able to book you for certified Vedic Pujas, personalized Homa offerings, 
                and spiritual consultations. Direct payments (Dakshina) will be credited to your available balance.
              </p>
            </div>

            {/* Locked feature previews grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              
              {/* Feature 1: Schedule builder */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '24px',
                opacity: 0.8,
                position: 'relative'
              }}>
                <span style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  padding: '3px 8px',
                  borderRadius: '9999px'
                }}>
                  🔒 LOCKED
                </span>
                
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#fff7ed',
                  color: '#ea580c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <Clock size={20} />
                </div>
                
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', margin: '0 0 8px 0' }}>
                  Interactive Calendar & Slots
                </h4>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Configure your weekly availability slots, block festival dates, and set customized timings for morning and evening Aarati prayers.
                </p>
              </div>

              {/* Feature 2: Booking requests */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '24px',
                opacity: 0.8,
                position: 'relative'
              }}>
                <span style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  padding: '3px 8px',
                  borderRadius: '9999px'
                }}>
                  🔒 LOCKED
                </span>
                
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <Calendar size={20} />
                </div>
                
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', margin: '0 0 8px 0' }}>
                  Incoming Devotee Bookings
                </h4>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Receive real-time email alerts and dashboard notifications containing devotee Gotra details, family names, and custom Sankalpa intentions.
                </p>
              </div>

              {/* Feature 3: Live Video streaming integrations */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '24px',
                opacity: 0.8,
                position: 'relative'
              }}>
                <span style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  padding: '3px 8px',
                  borderRadius: '9999px'
                }}>
                  🔒 LOCKED
                </span>
                
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <Video size={20} />
                </div>
                
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', margin: '0 0 8px 0' }}>
                  Live Streams & Dakshina Ledger
                </h4>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Integrate live Zoom or YouTube stream broadcasts directly into the booking page, and log and track dakshina payouts inside a certified bank register.
                </p>
              </div>

            </div>

          </div>
        )}

      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

    </div>
  );
};
