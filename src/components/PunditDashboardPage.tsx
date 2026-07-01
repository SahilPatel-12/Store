import React from 'react';
import { 
  User, 
  Copy, 
  Check, 
  Search, 
  Wallet, 
  Calendar, 
  LogOut, 
  TrendingUp,
  Award,
  DollarSign,
  CheckCircle,
  XCircle,
  ExternalLink,
  Phone,
  Edit,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';
import { PunditOnboarding } from './PunditOnboarding';

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
  
  // Onboarding & Booking States
  const [punditProfile, setPunditProfile] = React.useState<any>(null);
  const [loadingPunditProfile, setLoadingPunditProfile] = React.useState(true);
  const [bookings, setBookings] = React.useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = React.useState<any>(null);
  const [bookingFilter, setBookingFilter] = React.useState<'All' | 'Pending' | 'Confirmed' | 'Completed'>('All');

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

  const fetchPunditProfile = React.useCallback(async () => {
    setLoadingPunditProfile(true);
    try {
      const { data: settingsData, error: err } = await supabase
        .from('website_settings')
        .select('value')
        .eq('key', `pundit_profile_${loggedInUser.id}`)
        .maybeSingle();

      if (!err && settingsData && settingsData.value) {
        setPunditProfile(settingsData.value);
        setLoadingPunditProfile(false);
        return;
      }

      const { data: userData } = await supabase
        .from('website_store_users')
        .select('pundit_profile')
        .eq('id', loggedInUser.id)
        .maybeSingle();

      if (userData && (userData as any).pundit_profile) {
        setPunditProfile((userData as any).pundit_profile);
        setLoadingPunditProfile(false);
        return;
      }
    } catch (e) {
      console.error('Error fetching pundit profile:', e);
    }

    const localProfile = localStorage.getItem(`pundit_profile_${loggedInUser.id}`);
    if (localProfile) {
      setPunditProfile(JSON.parse(localProfile));
    }
    setLoadingPunditProfile(false);
  }, [loggedInUser.id]);

  React.useEffect(() => {
    fetchAffiliateProfile();
    fetchDashboardLists();
    fetchPunditProfile();

    const mockBookings = [
      {
        id: 'BK-1001',
        devoteeName: 'Sunil Mishra',
        gotra: 'Kashyap',
        familyNames: 'Sunil, wife Renu, son Ayush',
        ritualName: '🏡 Griha Pravesh (House Warming)',
        dateTime: 'June 28, 2026 at 09:30 AM',
        serviceMode: 'Home Visit',
        details: 'Flat 902, A-Wing, Orchid Heights, Sector-15, Thane, Maharashtra',
        phone: '+91 98192 83746',
        dakshina: 8500,
        sankalpa: 'Peace, family prosperity, and protection from negative energy.',
        status: 'Pending Confirmation'
      },
      {
        id: 'BK-1002',
        devoteeName: 'Amit Sen',
        gotra: 'Vashishtha',
        familyNames: 'Amit, wife Suchitra',
        ritualName: '🕉 Rudrabhishek Puja',
        dateTime: 'June 30, 2026 at 07:00 AM',
        serviceMode: 'Online',
        details: 'https://zoom.us/j/9876543210?pwd=MantraPujaRudrabhishek',
        phone: '+91 90048 57122',
        dakshina: 5100,
        sankalpa: 'Good health, removal of health obstacles, and spiritual growth.',
        status: 'Confirmed'
      },
      {
        id: 'BK-1003',
        devoteeName: 'Rajesh Iyer',
        gotra: 'Bharadwaj',
        familyNames: 'Rajesh, wife Meenakshi, daughter Anjali',
        ritualName: '💰 Lakshmi Puja (Office Blessing)',
        dateTime: 'June 22, 2026 at 11:30 AM',
        serviceMode: 'Temple Visit',
        details: 'Kashi Vishwanath Mandir Hall A, Varanasi, UP',
        phone: '+91 98203 94857',
        dakshina: 11000,
        sankalpa: 'Business expansion, financial growth, and obstacle removal.',
        status: 'Completed'
      },
      {
        id: 'BK-1004',
        devoteeName: 'Karan Johar',
        gotra: 'Gautam',
        familyNames: 'Karan, mother Hiroo',
        ritualName: '🌞 Navgraha Shanti Havan',
        dateTime: 'July 05, 2026 at 08:00 AM',
        serviceMode: 'Home Visit',
        details: 'Bungalow No 4, Carter Road, Bandra West, Mumbai, Maharashtra',
        phone: '+91 98210 29384',
        dakshina: 15000,
        sankalpa: 'Calming Saturn (Shani) and Rahu planetary alignments for peace of mind.',
        status: 'Pending Confirmation'
      }
    ];

    const savedBookings = localStorage.getItem(`pundit_bookings_${loggedInUser.id}`);
    if (savedBookings) {
      const parsed = JSON.parse(savedBookings);
      setBookings(parsed);
      setSelectedBooking(parsed[0] || null);
    } else {
      localStorage.setItem(`pundit_bookings_${loggedInUser.id}`, JSON.stringify(mockBookings));
      setBookings(mockBookings);
      setSelectedBooking(mockBookings[0]);
    }
  }, [fetchAffiliateProfile, fetchDashboardLists, fetchPunditProfile, loggedInUser.id]);

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

  const handleOnboardingComplete = async (profileData: any) => {
    setPunditProfile(profileData);
    localStorage.setItem(`pundit_profile_${loggedInUser.id}`, JSON.stringify(profileData));

    try {
      await supabase.from('website_settings').upsert({
        key: `pundit_profile_${loggedInUser.id}`,
        value: profileData
      });
    } catch (e) {
      console.error('Error saving to website_settings fallback:', e);
    }

    try {
      await supabase.from('website_store_users').update({
        pundit_profile: profileData,
        full_name: profileData.fullName
      }).eq('id', loggedInUser.id);
    } catch (e) {
      console.warn('Could not update users table directly (fallback is active):', e);
    }
  };

  const handleUpdateBookingStatus = (id: string, newStatus: string) => {
    const updated = bookings.map(b => {
      if (b.id === id) {
        return { ...b, status: newStatus };
      }
      return b;
    });
    setBookings(updated);
    localStorage.setItem(`pundit_bookings_${loggedInUser.id}`, JSON.stringify(updated));
    if (selectedBooking && selectedBooking.id === id) {
      setSelectedBooking({ ...selectedBooking, status: newStatus });
    }
  };

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
                Mantra Puja Pandit Portal
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
            <Calendar size={16} /> Pandit Puja Bookings
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
                    Default Pandit Referral sharing
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

        {/* Tab Content: Pandit Bookings */}
        {activeTab === 'booking' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            animation: 'fadeIn 0.4s ease-out'
          }}>
            {loadingPunditProfile ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: '#f97316', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>Loading Shastri Profile...</p>
              </div>
            ) : !punditProfile ? (
              <PunditOnboarding
                loggedInUser={loggedInUser}
                onComplete={handleOnboardingComplete}
                onLogout={onLogout}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Header card with profile overview & Edit profile action */}
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', border: '2.5px solid #f97316', backgroundColor: '#f3f4f6' }}>
                      <img src={punditProfile.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#2d140e', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{punditProfile.spiritualTitle} {punditProfile.fullName}</span>
                        {punditProfile.verificationUploaded && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 900, backgroundColor: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            ✓ Verified Partner
                          </span>
                        )}
                      </h2>
                      <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: '2px 0 0 0' }}>
                        {punditProfile.experience} years practice &bull; Gotra: {punditProfile.gotra} &bull; {punditProfile.location?.city}, {punditProfile.location?.state}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm("Would you like to edit your profile? This will let you re-run the 14-screen onboarding flow.")) {
                        setPunditProfile(null);
                      }
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '0.8rem',
                      fontWeight: 750,
                      color: '#475569',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#f97316'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                  >
                    <Edit size={14} />
                    <span>Edit Profile</span>
                  </button>
                </div>

                {/* Booking stats grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '16px'
                }}>
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>Total Puja Bookings</span>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1f2937', marginTop: '4px' }}>{bookings.length} Bookings</div>
                  </div>
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>Confirmed Pujas</span>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#2563eb', marginTop: '4px' }}>{bookings.filter(b => b.status === 'Confirmed').length} Active</div>
                  </div>
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>Pending Confirmation</span>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#d97706', marginTop: '4px' }}>{bookings.filter(b => b.status === 'Pending Confirmation').length} Requests</div>
                  </div>
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>Total Dakshina Earned</span>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#16a34a', marginTop: '4px' }}>
                      ₹{bookings.filter(b => b.status === 'Completed').reduce((sum, b) => sum + b.dakshina, 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Booking list & Detail section */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1.8fr',
                  gap: '24px',
                  alignItems: 'start'
                }} className="hero-grid-split">
                  
                  {/* Left Column: Filter and Scrollable List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Filters tabs */}
                    <div style={{
                      display: 'flex',
                      backgroundColor: '#f1f5f9',
                      padding: '4px',
                      borderRadius: '8px',
                      gap: '4px'
                    }}>
                      {['All', 'Pending', 'Confirmed', 'Completed'].map((filterVal) => {
                        const count = filterVal === 'All' ? bookings.length :
                                      filterVal === 'Pending' ? bookings.filter(b => b.status === 'Pending Confirmation').length :
                                      filterVal === 'Confirmed' ? bookings.filter(b => b.status === 'Confirmed').length :
                                      bookings.filter(b => b.status === 'Completed').length;
                        const isSelected = bookingFilter === filterVal;
                        return (
                          <button
                            key={filterVal}
                            onClick={() => setBookingFilter(filterVal as any)}
                            style={{
                              flex: 1,
                              padding: '8px 4px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: isSelected ? 800 : 600,
                              backgroundColor: isSelected ? '#ffffff' : 'transparent',
                              color: isSelected ? '#f97316' : '#64748b',
                              boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                              textAlign: 'center',
                              transition: 'all 0.15s'
                            }}
                          >
                            {filterVal} ({count})
                          </button>
                        );
                      })}
                    </div>

                    {/* Bookings scroll container */}
                    <div style={{
                      maxHeight: '450px',
                      overflowY: 'auto',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      backgroundColor: '#ffffff'
                    }}>
                      {bookings
                        .filter(b => {
                          if (bookingFilter === 'All') return true;
                          if (bookingFilter === 'Pending') return b.status === 'Pending Confirmation';
                          if (bookingFilter === 'Confirmed') return b.status === 'Confirmed';
                          return b.status === 'Completed';
                        }).length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                            <Calendar size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                            <p style={{ fontSize: '0.8rem', margin: 0 }}>No bookings match this filter.</p>
                          </div>
                        ) : (
                          bookings
                            .filter(b => {
                              if (bookingFilter === 'All') return true;
                              if (bookingFilter === 'Pending') return b.status === 'Pending Confirmation';
                              if (bookingFilter === 'Confirmed') return b.status === 'Confirmed';
                              return b.status === 'Completed';
                            })
                            .map((b) => {
                              const isSelected = selectedBooking && selectedBooking.id === b.id;
                              const statusColor = b.status === 'Completed' ? '#16a34a' :
                                                  b.status === 'Confirmed' ? '#2563eb' :
                                                  b.status === 'Pending Confirmation' ? '#d97706' : '#dc2626';
                              const statusBg = b.status === 'Completed' ? '#dcfce7' :
                                                b.status === 'Confirmed' ? '#eff6ff' :
                                                b.status === 'Pending Confirmation' ? '#fef3c7' : '#fee2e2';
                              return (
                                <div
                                  key={b.id}
                                  onClick={() => setSelectedBooking(b)}
                                  style={{
                                    padding: '16px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #e5e7eb',
                                    backgroundColor: isSelected ? '#fff7ed' : '#ffffff',
                                    borderLeft: isSelected ? '4px solid #f97316' : '4px solid transparent',
                                    transition: 'all 0.15s',
                                    textAlign: 'left'
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                    <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1f2937', margin: 0 }}>
                                      {b.ritualName}
                                    </h4>
                                    <span style={{
                                      fontSize: '0.65rem',
                                      fontWeight: 800,
                                      padding: '2px 8px',
                                      borderRadius: '9999px',
                                      color: statusColor,
                                      backgroundColor: statusBg
                                    }}>
                                      {b.status === 'Pending Confirmation' ? 'Pending' : b.status}
                                    </span>
                                  </div>
                                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4b5563', margin: '0 0 4px 0' }}>
                                    Devotee: {b.devoteeName} ({b.gotra} Gotra)
                                  </p>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                    <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                                      📅 {b.dateTime}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 850, color: '#16a34a' }}>
                                      ₹{b.dakshina.toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                        )}
                    </div>
                  </div>

                  {/* Right Column: Selected Booking Details */}
                  <div>
                    {selectedBooking ? (
                      <div style={{
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #ffedd5',
                        borderRadius: '12px',
                        padding: '24px',
                        boxShadow: '0 4px 6px -1px rgba(249, 115, 22, 0.05)',
                        textAlign: 'left'
                      }}>
                        <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '16px' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', display: 'block' }}>
                            Booking Reference: {selectedBooking.id}
                          </span>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#2d140e', margin: '4px 0 6px 0' }}>
                            {selectedBooking.ritualName}
                          </h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.78rem', color: '#4b5563', fontWeight: 750 }}>
                              Dakshina: <strong style={{ color: '#16a34a', fontSize: '0.9rem' }}>₹{selectedBooking.dakshina.toLocaleString('en-IN')}</strong>
                            </span>
                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              color: selectedBooking.status === 'Completed' ? '#16a34a' : selectedBooking.status === 'Confirmed' ? '#2563eb' : '#d97706',
                              backgroundColor: selectedBooking.status === 'Completed' ? '#dcfce7' : selectedBooking.status === 'Confirmed' ? '#eff6ff' : '#fef3c7',
                              padding: '2px 8px',
                              borderRadius: '9999px'
                            }}>
                              {selectedBooking.status}
                            </span>
                          </div>
                        </div>

                        {/* Booking properties list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.82rem' }}>
                          <div>
                            <span style={{ fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '2px' }}>Devotee Details:</span>
                            <p style={{ margin: 0, fontWeight: 700, color: '#1f2937' }}>
                              {selectedBooking.devoteeName} ({selectedBooking.gotra} Gotra)
                            </p>
                            <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>Family Names: {selectedBooking.familyNames}</span>
                          </div>

                          <div>
                            <span style={{ fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '2px' }}>Date & Puja Time:</span>
                            <span style={{ fontWeight: 700, color: '#1f2937' }}>📅 {selectedBooking.dateTime}</span>
                          </div>

                          <div>
                            <span style={{ fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '2px' }}>Service Mode & Location:</span>
                            <span style={{ fontWeight: 700, color: '#1f2937' }}>
                              {selectedBooking.serviceMode === 'Home Visit' ? '🏠 Home Visit' : selectedBooking.serviceMode === 'Online' ? '💻 Online Video Call' : '🏛 Temple Puja'}
                            </span>
                            
                            {selectedBooking.serviceMode === 'Online' ? (
                              <a
                                href={selectedBooking.details}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  color: '#2563eb',
                                  fontWeight: 800,
                                  marginTop: '4px',
                                  textDecoration: 'underline'
                                }}
                              >
                                <span>Join Zoom Meeting</span>
                                <ExternalLink size={12} />
                              </a>
                            ) : (
                              <p style={{ margin: '4px 0 0 0', color: '#4b5563', lineHeight: 1.4 }}>
                                {selectedBooking.details}
                              </p>
                            )}
                          </div>

                          <div>
                            <span style={{ fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '2px' }}>Devotee Contact:</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                              <a
                                href={`tel:${selectedBooking.phone}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  backgroundColor: '#f1f5f9',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontWeight: 750,
                                  color: '#334155'
                                }}
                              >
                                <Phone size={12} /> Call
                              </a>
                              <a
                                href={`https://wa.me/${selectedBooking.phone.replace(/[^\d]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  backgroundColor: '#dcfce7',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontWeight: 750,
                                  color: '#166534'
                                }}
                              >
                                WhatsApp
                              </a>
                            </div>
                          </div>

                          <div style={{
                            backgroundColor: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: '8px',
                            padding: '12px 16px'
                          }}>
                            <span style={{ fontWeight: 800, color: '#b45309', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.5px' }}>Sankalpa / Intention:</span>
                            <p style={{ margin: 0, fontStyle: 'italic', color: '#78350f', lineHeight: 1.4 }}>
                              "{selectedBooking.sankalpa}"
                            </p>
                          </div>
                        </div>

                        {/* Interactive Status Actions */}
                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px', marginTop: '20px' }}>
                          {selectedBooking.status === 'Pending Confirmation' && (
                            <div style={{ display: 'flex', gap: '12px' }}>
                              <button
                                onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'Confirmed')}
                                style={{
                                  flex: 1,
                                  backgroundColor: '#16a34a',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '12px',
                                  fontSize: '0.85rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px'
                                }}
                              >
                                <CheckCircle size={16} /> Accept Request
                              </button>
                              <button
                                onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'Declined')}
                                style={{
                                  backgroundColor: '#fef2f2',
                                  border: '1.5px solid #fecaca',
                                  color: '#dc2626',
                                  borderRadius: '8px',
                                  padding: '12px 16px',
                                  fontSize: '0.85rem',
                                  fontWeight: 800,
                                  cursor: 'pointer'
                                }}
                              >
                                Decline
                              </button>
                            </div>
                          )}

                          {selectedBooking.status === 'Confirmed' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'Completed')}
                              style={{
                                width: '100%',
                                backgroundColor: '#f97316',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px',
                                fontSize: '0.9rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2)'
                              }}
                            >
                              <CheckCircle size={18} /> Mark Puja as Completed
                            </button>
                          )}

                          {selectedBooking.status === 'Completed' && (
                            <div style={{
                              padding: '12px',
                              borderRadius: '8px',
                              backgroundColor: '#dcfce7',
                              border: '1px solid #bbf7d0',
                              color: '#15803d',
                              textAlign: 'center',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}>
                              <CheckCircle size={16} />
                              <span>Puja Completed & Dakshina Credited!</span>
                            </div>
                          )}

                          {selectedBooking.status === 'Declined' && (
                            <div style={{
                              padding: '12px',
                              borderRadius: '8px',
                              backgroundColor: '#fee2e2',
                              border: '1px solid #fecaca',
                              color: '#b91c1c',
                              textAlign: 'center',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}>
                              <XCircle size={16} />
                              <span>Puja Request Declined</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        backgroundColor: '#ffffff',
                        border: '1px dashed #cbd5e1',
                        borderRadius: '12px',
                        padding: '48px 24px',
                        textAlign: 'center',
                        color: '#64748b'
                      }}>
                        <AlertCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>No Booking Selected</h4>
                        <p style={{ fontSize: '0.78rem', margin: '4px 0 0 0' }}>Select a puja booking from the left list to view details.</p>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}
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
