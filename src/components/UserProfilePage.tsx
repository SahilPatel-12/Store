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
} from 'lucide-react';
import type { Product, LocalOrder } from '../types';
import { isImageUrl, getDisplayImageUrl } from '../lib/imageHelper';
import { supabase } from '../lib/supabase';

interface UserProfilePageProps {
  orders: LocalOrder[];
  wishlist: Record<string, boolean>;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onNavigateToShop: () => void;
  onNavigateToHome: () => void;
  onNavigateToOrders: () => void;
  products?: Product[];
  loggedInUser?: { id: string; fullName: string; email: string; phoneNumber: string } | null;
  onLogout?: () => void;
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
  wishlist,
  onToggleWishlist,
  onAddToCart,
  onNavigateToShop,
  onNavigateToHome,
  onNavigateToOrders,
  products: productsProp,
  loggedInUser,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = React.useState<
    'info' | 'orders' | 'addresses' | 'wishlist' | 'notifications' | 'logout'
  >('info');

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
      setUserProfile(prev => ({
        ...prev,
        name: loggedInUser.fullName,
        email: loggedInUser.email,
        phone: loggedInUser.phoneNumber
      }));
      setNewAddress(prev => ({
        ...prev,
        name: loggedInUser.fullName
      }));
      fetchAddresses();
    } else {
      setAddresses([]);
    }
  }, [loggedInUser]);
  const [isEditingProfile, setIsEditingProfile] = React.useState(false);
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
      items: o.items.map((i) => ({
        name: i.product.name,
        qty: i.quantity,
        price: i.product.price,
        image: i.product.image,
      })),
    }));
  }, [orders]);

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
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingProfile(false);
    setProfileSuccessMessage('Spiritual Profile updated successfully!');
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
          <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.95rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{userProfile.email}</span>
            <span>•</span>
            <span style={{ color: '#fed7aa', fontWeight: 700 }}>{userProfile.spiritualGoal}</span>
          </p>
        </div>
      </section>

      {/* 2. Main Dashboard Split Layout */}
      <div className="container" style={{ marginTop: '40px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: '40px',
          alignItems: 'start'
        }} className="hero-grid-split">
          
          {/* Dashboard Left Sidebar Tabs */}
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

              <div style={{ height: '1px', backgroundColor: 'var(--border-light)', margin: '12px 0' }} />

              <button
                onClick={() => setActiveTab('logout')}
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

          {/* Dashboard Right Main Panel */}
          <main style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            padding: '32px',
            boxShadow: 'var(--shadow-sm)',
            minHeight: '480px',
            textAlign: 'left'
          }}>
            
            {/* ==============================================
                TAB: USER INFORMATION (EDIT PROFILE)
                ============================================== */}
            {activeTab === 'info' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)' }}>Spiritual Account Profile</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>Update your contact information and spiritual puja intentions.</p>
                  </div>
                  {!isEditingProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="btn-outline"
                      style={{ padding: '8px 18px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', borderRadius: 'var(--radius-md)' }}
                    >
                      <Edit2 size={14} />
                      <span>Edit Info</span>
                    </button>
                  )}
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
                          disabled={!isEditingProfile}
                          onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-light)',
                            outline: 'none',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            backgroundColor: isEditingProfile ? '#ffffff' : '#f9fafb',
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
                          disabled={!isEditingProfile}
                          onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-light)',
                            outline: 'none',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            backgroundColor: isEditingProfile ? '#ffffff' : '#f9fafb',
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
                          disabled={!isEditingProfile}
                          onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-light)',
                            outline: 'none',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            backgroundColor: isEditingProfile ? '#ffffff' : '#f9fafb',
                            color: 'var(--text-dark)'
                          }}
                        />
                      </div>

                      {/* Spiritual Goal Selector */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '6px' }}>Puja Intention / Spiritual Goal</label>
                        <select
                          value={userProfile.spiritualGoal}
                          disabled={!isEditingProfile}
                          onChange={(e) => setUserProfile({ ...userProfile, spiritualGoal: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-light)',
                            outline: 'none',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            backgroundColor: isEditingProfile ? '#ffffff' : '#f9fafb',
                            color: 'var(--text-dark)',
                            cursor: isEditingProfile ? 'pointer' : 'default'
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

                    {isEditingProfile && (
                      <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                        <button
                          type="submit"
                          className="btn-lime"
                          style={{ padding: '12px 24px', fontSize: '0.88rem', borderRadius: 'var(--radius-md)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                        >
                          <Save size={16} />
                          <span>Save Changes</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="btn-outline"
                          style={{ padding: '12px 24px', fontSize: '0.88rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                  </div>
                </form>

                {/* Account Details Box */}
                {!isEditingProfile && (
                  <div style={{
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
                )}

              </div>
            )}

            {/* ==============================================
                TAB: ORDERS (MOCK + RECENT LIVE ORDERS)
                ============================================== */}
            {activeTab === 'orders' && (
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

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', position: 'relative' }}>
                                  {/* Progress bar line */}
                                  <div style={{
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

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            )}

            {/* ==============================================
                TAB: SAVED ADDRESSES (MANAGE ADDRESSES)
                ============================================== */}
            {activeTab === 'addresses' && (
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
            )}

            {/* ==============================================
                TAB: WISHLIST (WISHLIST SYNC)
                ============================================== */}
            {activeTab === 'wishlist' && (
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
            )}

            {/* ==============================================
                TAB: NOTIFICATION SETTINGS
                ============================================== */}
            {activeTab === 'notifications' && (
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
            )}

            {/* ==============================================
                TAB: LOGOUT (SECURE LOGOUT SESSION CLEAR)
                ============================================== */}
            {activeTab === 'logout' && (
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
            )}

          </main>

        </div>
      </div>

    </div>
  );
};
