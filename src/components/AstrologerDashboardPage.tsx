import React from 'react';
import { 
  Clock, LogOut, CheckCircle, MessageSquare, Send, Power, Sparkles, Compass, ArrowLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AstrologerOnboarding } from './AstrologerOnboarding';

interface AstrologerDashboardPageProps {
  loggedInUser: { id: string; fullName: string; email: string; phoneNumber: string };
  onLogout: () => void;
  isEmbedded?: boolean;
}

export const AstrologerDashboardPage: React.FC<AstrologerDashboardPageProps> = ({
  loggedInUser,
  onLogout,
  isEmbedded = false
}) => {
  const [activeTab, setActiveTab] = React.useState<'chat' | 'history'>('chat');
  const [astrologerProfile, setAstrologerProfile] = React.useState<any>(null);
  const [loadingProfile, setLoadingProfile] = React.useState(true);

  // Bookings & Chat States
  const [bookings, setBookings] = React.useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = React.useState<any>(null);
  const [messages, setMessages] = React.useState<any[]>([]);
  const [inputText, setInputText] = React.useState('');
  const [mobileShowSimulator, setMobileShowSimulator] = React.useState(false);
  
  // Simulator States
  const showSimulator = true;
  const [simName, setSimName] = React.useState('Rohan Sharma');
  const [simGotra, setSimGotra] = React.useState('Kashyap');
  const [simPhone, setSimPhone] = React.useState('+91 98765 43210');
  const [simQuestion, setSimQuestion] = React.useState('My business has been facing issues since March. Will I see recovery soon? (Birth: 12-Oct-1994, 08:45 AM, Varanasi)');
  const [simDevoteeMsg, setSimDevoteeMsg] = React.useState('');

  // 1. Fetch or initialize profile
  const fetchAstrologerProfile = React.useCallback(async () => {
    setLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from('website_store_astrologers')
        .select('*')
        .eq('user_id', loggedInUser.id)
        .maybeSingle();

      if (!error && data) {
        setAstrologerProfile(data);
      } else {
        // Check local storage fallback
        const localProfile = localStorage.getItem(`astrologer_profile_${loggedInUser.id}`);
        if (localProfile) {
          setAstrologerProfile(JSON.parse(localProfile));
        }
      }
    } catch (err) {
      console.error('Error fetching astrologer profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  }, [loggedInUser.id]);

  // 2. Fetch bookings
  const fetchBookings = React.useCallback(async () => {
    try {
      if (astrologerProfile?.id) {
        const { data, error } = await supabase
          .from('astrologer_bookings')
          .select('*')
          .eq('astrologer_id', astrologerProfile.id)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setBookings(data);
          return;
        }
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }

    // Local Storage Mock Fallback
    const localSaved = localStorage.getItem(`astrologer_bookings_${loggedInUser.id}`);
    if (localSaved) {
      setBookings(JSON.parse(localSaved));
    } else {
      const mockBookings = [
        {
          id: 'bk-ast-101',
          astrologer_id: astrologerProfile?.id || 'demo-ast-id',
          user_id: 'user-dev-201',
          devotee_name: 'Priyanka Patel',
          devotee_phone: '+91 99887 76655',
          booking_date: new Date().toISOString().split('T')[0],
          booking_time: '14:30',
          special_notes: 'Career progression & Sade Sati analysis request. Birth: 15-Jun-1996, 18:22, Pune.',
          consult_type: 'chat',
          status: 'Pending',
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          id: 'bk-ast-102',
          astrologer_id: astrologerProfile?.id || 'demo-ast-id',
          user_id: 'user-dev-202',
          devotee_name: 'Vikram Aditya',
          devotee_phone: '+91 91234 56789',
          booking_date: new Date().toISOString().split('T')[0],
          booking_time: '12:00',
          special_notes: 'Marriage chart compatibility (Kundli Milan) check. Birth: 22-Aug-1992, 05:10, Kanpur.',
          consult_type: 'chat',
          status: 'Active',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ];
      setBookings(mockBookings);
      localStorage.setItem(`astrologer_bookings_${loggedInUser.id}`, JSON.stringify(mockBookings));
    }
  }, [astrologerProfile?.id, loggedInUser.id]);

  React.useEffect(() => {
    fetchAstrologerProfile();
  }, [fetchAstrologerProfile]);

  React.useEffect(() => {
    if (astrologerProfile) {
      fetchBookings();
    }
  }, [astrologerProfile, fetchBookings]);

  // Sync selected booking changes
  React.useEffect(() => {
    if (bookings.length > 0 && !selectedBooking) {
      setSelectedBooking(bookings.find(b => b.status === 'Active') || bookings[0]);
    } else if (selectedBooking) {
      const found = bookings.find(b => b.id === selectedBooking.id);
      if (found) setSelectedBooking(found);
    }
  }, [bookings, selectedBooking]);

  // Fetch messages for selected booking
  const fetchMessagesForBooking = React.useCallback(async (bookingId: string) => {
    try {
      const { data, error } = await supabase
        .from('astrologer_chat_messages')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
        return;
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }

    // Local Storage Mock Messages Fallback
    const localMsgs = localStorage.getItem(`chat_messages_${bookingId}`);
    if (localMsgs) {
      setMessages(JSON.parse(localMsgs));
    } else {
      let initialMsgs: any[] = [];
      const currentB = bookings.find(b => b.id === bookingId);
      if (currentB) {
        initialMsgs = [
          {
            id: 'msg-init-1',
            booking_id: bookingId,
            sender_id: currentB.user_id,
            sender_type: 'user',
            message_text: `Namaste Acharya Ji. ${currentB.special_notes || 'I would like to get a chart reading.'}`,
            created_at: currentB.created_at
          }
        ];
        if (currentB.status === 'Active') {
          initialMsgs.push({
            id: 'msg-init-2',
            booking_id: bookingId,
            sender_id: loggedInUser.id,
            sender_type: 'astrologer',
            message_text: 'Pranam. I have analyzed your birth chart details. Please share your specific questions regarding career or marriage alignment.',
            created_at: new Date(new Date(currentB.created_at).getTime() + 10 * 60 * 1000).toISOString()
          });
        }
      }
      setMessages(initialMsgs);
      localStorage.setItem(`chat_messages_${bookingId}`, JSON.stringify(initialMsgs));
    }
  }, [bookings, loggedInUser.id]);

  React.useEffect(() => {
    if (selectedBooking?.id) {
      fetchMessagesForBooking(selectedBooking.id);
    }
  }, [selectedBooking?.id, fetchMessagesForBooking]);

  // Supabase Real-time Messaging Subscription
  React.useEffect(() => {
    if (!selectedBooking?.id) return;

    const channel = supabase
      .channel(`astrologer_chat_${selectedBooking.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'astrologer_chat_messages',
          filter: `booking_id=eq.${selectedBooking.id}`
        },
        (payload) => {
          const newMsg = payload.new;
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [selectedBooking?.id]);

  // Send reply from Astrologer
  const handleSendAstrologerMessage = async () => {
    if (!inputText.trim() || !selectedBooking) return;
    const text = inputText.trim();
    setInputText('');

    const newMsgPayload = {
      booking_id: selectedBooking.id,
      sender_id: loggedInUser.id,
      sender_type: 'astrologer',
      message_text: text,
    };

    // Ensure booking_id is a valid UUID before sending to DB
    const isBookingUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(selectedBooking.id);

    if (isBookingUuid) {
      try {
        const { data, error } = await supabase
          .from('astrologer_chat_messages')
          .insert(newMsgPayload)
          .select()
          .single();

        if (!error && data) {
          setMessages(prev => [...prev, data]);
          return;
        }
      } catch (err) {
        console.warn('DB send failed, updating local state:', err);
      }
    }

    // Local update fallback
    const localMsg = {
      id: `msg-local-${Date.now()}`,
      ...newMsgPayload,
      created_at: new Date().toISOString()
    };
    const updated = [...messages, localMsg];
    setMessages(updated);
    localStorage.setItem(`chat_messages_${selectedBooking.id}`, JSON.stringify(updated));
  };

  // Toggle online availability in DB
  const handleToggleOnline = async () => {
    if (!astrologerProfile) return;
    const nextStatus = !astrologerProfile.is_online;
    
    const updatedProfile = { ...astrologerProfile, is_online: nextStatus };
    setAstrologerProfile(updatedProfile);
    localStorage.setItem(`astrologer_profile_${loggedInUser.id}`, JSON.stringify(updatedProfile));

    try {
      await supabase
        .from('website_store_astrologers')
        .update({ is_online: nextStatus })
        .eq('id', astrologerProfile.id);
    } catch (e) {
      console.warn('DB update failed, using local status:', e);
    }
  };

  // Update Booking Status (e.g. Accept, Complete, Cancel)
  const handleUpdateStatus = async (bookingId: string, nextStatus: 'Active' | 'Completed' | 'Cancelled') => {
    const updatedBookings = bookings.map(b => {
      if (b.id === bookingId) {
        return { ...b, status: nextStatus };
      }
      return b;
    });

    setBookings(updatedBookings);
    localStorage.setItem(`astrologer_bookings_${loggedInUser.id}`, JSON.stringify(updatedBookings));

    try {
      await supabase
        .from('astrologer_bookings')
        .update({ status: nextStatus })
        .eq('id', bookingId);
    } catch (err) {
      console.warn('DB update failed, using local status update:', err);
    }

    if (selectedBooking && selectedBooking.id === bookingId) {
      setSelectedBooking((prev: any) => prev ? ({ ...prev, status: nextStatus }) : null);
    }
  };

  // Onboarding Complete Handler
  const handleOnboardingComplete = async (profileData: any) => {
    const payload = {
      ...profileData,
      user_id: loggedInUser.id,
      id: astrologerProfile?.id || `ast-db-${Date.now()}`
    };

    setAstrologerProfile(payload);
    localStorage.setItem(`astrologer_profile_${loggedInUser.id}`, JSON.stringify(payload));

    // 0. Ensure all astrologer tables, columns, policies, and real-time settings exist in Supabase
    try {
      await supabase.rpc('exec_sql', {
        sql_query: `
          -- Ensure website_store_users has is_astrologer and astrologer_profile columns
          ALTER TABLE public.website_store_users ADD COLUMN IF NOT EXISTS is_astrologer BOOLEAN NOT NULL DEFAULT false;
          ALTER TABLE public.website_store_users ADD COLUMN IF NOT EXISTS astrologer_profile JSONB;

          -- 1. Create website_store_astrologers Table (if not exists)
          CREATE TABLE IF NOT EXISTS public.website_store_astrologers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE UNIQUE,
            full_name TEXT NOT NULL,
            profile_photo TEXT,
            rating NUMERIC(2,1) DEFAULT 4.5 NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
            experience_years INTEGER NOT NULL DEFAULT 5 CHECK (experience_years >= 0),
            readings_count INTEGER NOT NULL DEFAULT 100 CHECK (readings_count >= 0),
            languages TEXT[] NOT NULL,
            specialties TEXT[] NOT NULL,
            charge_per_min INTEGER NOT NULL DEFAULT 30 CHECK (charge_per_min >= 0),
            is_online BOOLEAN NOT NULL DEFAULT true,
            spiritual_title TEXT,
            bio TEXT,
            city TEXT,
            state TEXT,
            created_at TIMESTAMPTZ DEFAULT now() NOT NULL
          );

          -- Enable RLS on website_store_astrologers
          ALTER TABLE public.website_store_astrologers ENABLE ROW LEVEL SECURITY;

          -- Drop existing policies if any and recreate
          DROP POLICY IF EXISTS "Allow public read for website_store_astrologers" ON public.website_store_astrologers;
          CREATE POLICY "Allow public read for website_store_astrologers" ON public.website_store_astrologers 
            FOR SELECT USING (true);

          DROP POLICY IF EXISTS "Allow user to update own astrologer profile" ON public.website_store_astrologers;
          CREATE POLICY "Allow user to update own astrologer profile" ON public.website_store_astrologers 
            FOR ALL USING (true) WITH CHECK (true);

          -- 2. Create astrologer_bookings Table (if not exists)
          CREATE TABLE IF NOT EXISTS public.astrologer_bookings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            astrologer_id UUID REFERENCES public.website_store_astrologers(id) ON DELETE CASCADE NOT NULL,
            user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE NOT NULL,
            devotee_name TEXT NOT NULL,
            devotee_phone TEXT NOT NULL,
            booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
            booking_time TEXT NOT NULL,
            special_notes TEXT,
            consult_type TEXT NOT NULL CHECK (consult_type IN ('chat', 'call')),
            status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Active', 'Completed', 'Cancelled')),
            created_at TIMESTAMPTZ DEFAULT now() NOT NULL
          );

          -- Enable RLS on astrologer_bookings
          ALTER TABLE public.astrologer_bookings ENABLE ROW LEVEL SECURITY;

          -- Drop existing policies if any and recreate
          DROP POLICY IF EXISTS "Allow public read for astrologer_bookings" ON public.astrologer_bookings;
          CREATE POLICY "Allow public read for astrologer_bookings" ON public.astrologer_bookings 
            FOR SELECT USING (true);

          DROP POLICY IF EXISTS "Allow public write for astrologer_bookings" ON public.astrologer_bookings;
          CREATE POLICY "Allow public write for astrologer_bookings" ON public.astrologer_bookings 
            FOR ALL USING (true) WITH CHECK (true);

          -- 3. Create astrologer_chat_messages Table
          CREATE TABLE IF NOT EXISTS public.astrologer_chat_messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            booking_id UUID REFERENCES public.astrologer_bookings(id) ON DELETE CASCADE NOT NULL,
            sender_id UUID NOT NULL,
            sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'astrologer')),
            message_text TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT now() NOT NULL
          );

          -- Enable RLS on astrologer_chat_messages
          ALTER TABLE public.astrologer_chat_messages ENABLE ROW LEVEL SECURITY;

          -- Drop existing policies if any and recreate
          DROP POLICY IF EXISTS "Allow public read for astrologer_chat_messages" ON public.astrologer_chat_messages;
          CREATE POLICY "Allow public read for astrologer_chat_messages" ON public.astrologer_chat_messages 
            FOR SELECT USING (true);

          DROP POLICY IF EXISTS "Allow public write for astrologer_chat_messages" ON public.astrologer_chat_messages;
          CREATE POLICY "Allow public write for astrologer_chat_messages" ON public.astrologer_chat_messages 
            FOR ALL USING (true) WITH CHECK (true);

          -- 4. Enable Realtime Replication for the tables
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_publication_tables 
              WHERE pubname = 'supabase_realtime' AND tablename = 'website_store_astrologers'
            ) THEN
              ALTER PUBLICATION supabase_realtime ADD TABLE public.website_store_astrologers;
            END IF;

            IF NOT EXISTS (
              SELECT 1 FROM pg_publication_tables 
              WHERE pubname = 'supabase_realtime' AND tablename = 'astrologer_bookings'
            ) THEN
              ALTER PUBLICATION supabase_realtime ADD TABLE public.astrologer_bookings;
            END IF;

            IF NOT EXISTS (
              SELECT 1 FROM pg_publication_tables 
              WHERE pubname = 'supabase_realtime' AND tablename = 'astrologer_chat_messages'
            ) THEN
              ALTER PUBLICATION supabase_realtime ADD TABLE public.astrologer_chat_messages;
            END IF;
          END $$;
        `
      });
    } catch (sqlErr) {
      console.warn('Could not execute SQL setup script:', sqlErr);
    }

    // 1. Sync user to app_users to satisfy foreign key references in the database
    try {
      let phoneToSync = loggedInUser.phoneNumber || `+919999988888`;
      const { error: syncError } = await supabase
        .from('app_users')
        .upsert({
          id: loggedInUser.id,
          phone: phoneToSync,
          name: payload.fullName || loggedInUser.fullName,
          email: loggedInUser.email || null
        }, { onConflict: 'id' });

      if (syncError) {
        console.warn('Failed standard app_users sync, trying fallback for unique phone constraint:', syncError);
        
        // Append first block of user ID to phone to guarantee uniqueness
        const uniquePhoneSuffix = `-${loggedInUser.id.substring(0, 8)}`;
        phoneToSync = `${loggedInUser.phoneNumber || '+919999988888'}${uniquePhoneSuffix}`;
        
        const { error: fallbackSyncError } = await supabase
          .from('app_users')
          .upsert({
            id: loggedInUser.id,
            phone: phoneToSync,
            name: payload.fullName || loggedInUser.fullName,
            email: loggedInUser.email || null
          }, { onConflict: 'id' });
          
        if (fallbackSyncError) {
          console.error('Fallback app_users sync failed:', fallbackSyncError);
        }
      }
    } catch (e) {
      console.warn('Could not sync app_users (might be local fallback):', e);
    }

    // 2. Sync user is_astrologer flag in website_store_users table
    try {
      await supabase
        .from('website_store_users')
        .update({
          is_astrologer: true,
          astrologer_profile: payload
        })
        .eq('id', loggedInUser.id);
    } catch (e) {
      console.warn('Could not update website_store_users (might be local fallback):', e);
    }

    // 3. Sync profile to website_store_astrologers table
    try {
      const { error } = await supabase
        .from('website_store_astrologers')
        .upsert({
          user_id: loggedInUser.id,
          full_name: payload.fullName,
          spiritual_title: payload.spiritualTitle,
          bio: payload.bio,
          profile_photo: payload.profilePhoto,
          experience_years: payload.experienceYears,
          readings_count: payload.readingsCount,
          charge_per_min: payload.chargePerMin,
          languages: payload.languages,
          specialties: payload.specialties,
          city: payload.city,
          state: payload.state,
          is_online: payload.isOnline
        }, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (e) {
      console.error('Error saving astrologer profile:', e);
    }
  };

  // Helper to generate a valid v4 UUID for fallback simulator IDs
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Simulator helper: Trigger simulated devotee chat request
  const handleSimulateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simName.trim()) return;

    // Use current astrologer's ID or fallback UUID
    const currentAstrologerId = astrologerProfile?.id || generateUUID();
    // Satisfy foreign key constraints by using the astrologer's own synced user ID as the booking user_id (devotee)
    const bookingUserId = loggedInUser.id;
    const formatTime = new Date().toTimeString().split(' ')[0].substring(0, 5);

    try {
      const { data, error } = await supabase
        .from('astrologer_bookings')
        .insert({
          astrologer_id: currentAstrologerId,
          user_id: bookingUserId,
          devotee_name: simName.trim(),
          devotee_phone: simPhone.trim(),
          booking_time: formatTime,
          special_notes: `${simQuestion.trim()} (Gotra: ${simGotra.trim()})`,
          consult_type: 'chat',
          status: 'Pending'
        })
        .select()
        .single();

      if (!error && data) {
        const updated = [data, ...bookings];
        setBookings(updated);
        localStorage.setItem(`astrologer_bookings_${loggedInUser.id}`, JSON.stringify(updated));
        setSelectedBooking(data);
        return;
      } else {
        console.warn('Failed to insert simulated booking to database:', error);
      }
    } catch (err) {
      console.warn('Simulator database insertion failed:', err);
    }

    // Fallback: local only booking
    const fallbackBookingId = generateUUID();
    const newBooking = {
      id: fallbackBookingId,
      astrologer_id: currentAstrologerId,
      user_id: bookingUserId,
      devotee_name: simName.trim(),
      devotee_phone: simPhone.trim(),
      booking_date: new Date().toISOString().split('T')[0],
      booking_time: formatTime,
      special_notes: `${simQuestion.trim()} (Gotra: ${simGotra.trim()})`,
      consult_type: 'chat',
      status: 'Pending',
      created_at: new Date().toISOString()
    };

    const updated = [newBooking, ...bookings];
    setBookings(updated);
    localStorage.setItem(`astrologer_bookings_${loggedInUser.id}`, JSON.stringify(updated));
    setSelectedBooking(newBooking);
  };

  // Simulator helper: Send chat message as Devotee
  const handleSimulateDevoteeMessage = async () => {
    if (!simDevoteeMsg.trim() || !selectedBooking) return;
    const text = simDevoteeMsg.trim();
    setSimDevoteeMsg('');

    // Ensure sender_id is a valid UUID
    const isSenderUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(selectedBooking.user_id);
    const senderId = isSenderUuid ? selectedBooking.user_id : loggedInUser.id;

    // Ensure booking_id is a valid UUID
    const isBookingUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(selectedBooking.id);

    const payload = {
      booking_id: selectedBooking.id,
      sender_id: senderId,
      sender_type: 'user',
      message_text: text
    };

    if (isBookingUuid) {
      try {
        const { data, error } = await supabase
          .from('astrologer_chat_messages')
          .insert(payload)
          .select()
          .single();

        if (!error && data) {
          setMessages(prev => [...prev, data]);
          return;
        }
      } catch (err) {
        console.warn('DB send devotee message failed, using local state fallback:', err);
      }
    }

    const localMsg = {
      id: `msg-sim-${Date.now()}`,
      ...payload,
      created_at: new Date().toISOString()
    };
    const updated = [...messages, localMsg];
    setMessages(updated);
    localStorage.setItem(`chat_messages_${selectedBooking.id}`, JSON.stringify(updated));
  };

  if (loadingProfile) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0c0f1e',
        color: '#fbbf24'
      }}>
        <div style={{ width: '48px', height: '48px', border: '3.5px solid #1e293b', borderTopColor: '#fbbf24', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
        <p style={{ fontSize: '0.95rem', fontWeight: 700 }}>Reading Astrological Lineage...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!astrologerProfile) {
    return (
      <div style={{
        backgroundColor: '#05070f',
        minHeight: isEmbedded ? 'auto' : '100vh',
        padding: isEmbedded ? '0px' : '40px 24px',
        borderRadius: isEmbedded ? '12px' : '0',
        background: 'radial-gradient(circle at 50% 50%, #0c0f1e 0%, #05070f 100%)'
      }}>
        <AstrologerOnboarding loggedInUser={loggedInUser} onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  const activeBookings = bookings.filter(b => b.status === 'Active' || b.status === 'Pending');
  const completedBookings = bookings.filter(b => b.status === 'Completed' || b.status === 'Cancelled');

  return (
    <div style={{
      backgroundColor: '#070a13',
      minHeight: isEmbedded ? 'auto' : '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      padding: isEmbedded ? '20px 0' : '0',
      borderRadius: isEmbedded ? '12px' : '0'
    }}>
      
      {/* Top Professional Portal Header */}
      {!isEmbedded && (
        <header style={{
          background: 'linear-gradient(135deg, #090c15 0%, #170d1e 100%)',
          color: '#ffffff',
          borderBottom: '3px solid #fbbf24',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}>
          <div className="astro-header-container" style={{
            maxWidth: '1440px',
            margin: '0 auto',
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '2rem' }}>🪐</span>
              <div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, letterSpacing: '-0.3px', color: '#fbbf24' }}>
                  Mantra Puja Astrologer Dashboard
                </h1>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                  Acharya: <strong>{astrologerProfile.fullName}</strong> &bull; {astrologerProfile.spiritualTitle}
                </p>
              </div>
            </div>
            
            <div className="astro-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Online Toggle Switch */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}>Realtime Status:</span>
                <button
                  onClick={handleToggleOnline}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: astrologerProfile.is_online ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: astrologerProfile.is_online ? '#4ade80' : '#fca5a5',
                    border: astrologerProfile.is_online ? '1.5px solid #22c55e' : '1.5px solid #ef4444',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: astrologerProfile.is_online ? '0 0 10px rgba(34, 197, 94, 0.2)' : 'none'
                  }}
                >
                  <Power size={12} />
                  <span>{astrologerProfile.is_online ? 'ONLINE' : 'OFFLINE'}</span>
                </button>
              </div>

              <button
                className="astro-simulator-toggle-btn"
                onClick={() => setMobileShowSimulator(prev => !prev)}
                style={{
                  display: 'none',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: mobileShowSimulator ? 'rgba(217, 119, 6, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                  color: '#fbbf24',
                  border: '1px solid rgba(217, 119, 6, 0.4)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Sparkles size={14} /> Simulator
              </button>

              <button
                onClick={onLogout}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#fca5a5',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Embedded Sub-header with Status Toggle */}
      {isEmbedded && (
        <div className="astro-embedded-subheader" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#0c0f1d',
          border: '1px solid rgba(139, 92, 246, 0.15)',
          borderRadius: '12px',
          padding: '16px 24px',
          marginBottom: '20px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.75rem' }}>🪐</span>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0, color: '#fbbf24' }}>
                Astrologer Portal Dashboard
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Acharya: <strong>{astrologerProfile.fullName}</strong> &bull; {astrologerProfile.spiritualTitle} ({astrologerProfile.city}, {astrologerProfile.state})
              </p>
            </div>
          </div>
          <div className="astro-embedded-subheader-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="astro-simulator-toggle-btn"
              onClick={() => setMobileShowSimulator(prev => !prev)}
              style={{
                display: 'none',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: mobileShowSimulator ? 'rgba(217, 119, 6, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                color: '#fbbf24',
                border: '1px solid rgba(217, 119, 6, 0.4)',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Sparkles size={14} /> Simulator
            </button>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}>Realtime Chat Status:</span>
            <button
              onClick={handleToggleOnline}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: astrologerProfile.is_online ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: astrologerProfile.is_online ? '#4ade80' : '#fca5a5',
                border: astrologerProfile.is_online ? '1.5px solid #22c55e' : '1.5px solid #ef4444',
                borderRadius: '20px',
                padding: '6px 14px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: astrologerProfile.is_online ? '0 0 10px rgba(34, 197, 94, 0.2)' : 'none'
              }}
            >
              <Power size={12} />
              <span>{astrologerProfile.is_online ? 'ONLINE' : 'OFFLINE'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Core Dashboard Layout */}
      <main className={`astro-dashboard-main ${selectedBooking ? 'has-selection' : ''} ${mobileShowSimulator ? 'show-simulator' : ''}`} style={{
        maxWidth: '1440px',
        margin: '0 auto',
        width: '100%',
        padding: isEmbedded ? '0' : '24px',
        display: 'grid',
        gridTemplateColumns: showSimulator ? '280px 1fr 340px' : '300px 1fr',
        gap: '20px',
        flex: 1,
        height: isEmbedded ? '720px' : 'calc(100vh - 80px)',
        overflow: 'hidden'
      }}>
        
        {/* Left Column: Session Queue */}
        <section className="astro-dashboard-queue" style={{
          backgroundColor: '#0c0f1d',
          borderRadius: '12px',
          border: '1px solid rgba(139, 92, 246, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Tab Navigation */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
            backgroundColor: '#080a13'
          }}>
            <button
              onClick={() => setActiveTab('chat')}
              style={{
                padding: '14px',
                background: activeTab === 'chat' ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                color: activeTab === 'chat' ? '#fbbf24' : '#64748b',
                fontWeight: 800,
                fontSize: '0.82rem',
                textTransform: 'uppercase',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Live Sessions
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                padding: '14px',
                background: activeTab === 'history' ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                color: activeTab === 'history' ? '#fbbf24' : '#64748b',
                fontWeight: 800,
                fontSize: '0.82rem',
                textTransform: 'uppercase',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              History
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeTab === 'chat' ? (
              activeBookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 10px', color: '#64748b' }}>
                  <MessageSquare size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.8rem', margin: 0 }}>No active or pending chat sessions.</p>
                  <p style={{ fontSize: '0.72rem', marginTop: '4px', fontStyle: 'italic' }}>Use the simulator to launch a test chat!</p>
                </div>
              ) : (
                activeBookings.map((b) => {
                  const isSelected = selectedBooking?.id === b.id;
                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBooking(b)}
                      style={{
                        padding: '14px',
                        borderRadius: '8px',
                        backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.15)' : '#0f1326',
                        border: isSelected ? '1.5px solid #fbbf24' : '1px solid rgba(139, 92, 246, 0.08)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.88rem' }}>{b.devotee_name}</span>
                        <span style={{
                          fontSize: '0.68rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 800,
                          backgroundColor: b.status === 'Active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: b.status === 'Active' ? '#4ade80' : '#fbbf24'
                        }}>{b.status}</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {b.special_notes}
                      </p>
                      <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={10} /> Requested at {b.booking_time}
                      </span>
                    </div>
                  );
                })
              )
            ) : (
              completedBookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 10px', color: '#64748b' }}>
                  <p style={{ fontSize: '0.8rem', margin: 0 }}>No historical consults found.</p>
                </div>
              ) : (
                completedBookings.map((b) => {
                  const isSelected = selectedBooking?.id === b.id;
                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBooking(b)}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.1)' : '#0f1326',
                        border: '1px solid rgba(139, 92, 246, 0.05)',
                        cursor: 'pointer',
                        opacity: 0.8
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, color: '#e2e8f0', fontSize: '0.82rem' }}>{b.devotee_name}</span>
                        <span style={{
                          fontSize: '0.62rem',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: b.status === 'Completed' ? 'rgba(100, 116, 139, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: b.status === 'Completed' ? '#94a3b8' : '#fca5a5'
                        }}>{b.status}</span>
                      </div>
                      <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                        Date: {b.booking_date}
                      </span>
                    </div>
                  );
                })
              )
            )}
          </div>
        </section>

        {/* Center Section: Main Active Chat Interface */}
        <section className="astro-dashboard-chat" style={{
          backgroundColor: '#0a0f1d',
          borderRadius: '12px',
          border: '1px solid rgba(139, 92, 246, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {selectedBooking ? (
            <>
              {/* Devotee Info Banner */}
              <div className="astro-chat-banner" style={{
                padding: '16px 24px',
                backgroundColor: '#0c1122',
                borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    className="astro-mobile-back-btn"
                    onClick={() => setSelectedBooking(null)}
                    style={{
                      display: 'none',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#fbbf24',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      background: 'none',
                      border: 'none',
                      padding: 0
                    }}
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                      {selectedBooking.devotee_name}
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                      Phone: {selectedBooking.devotee_phone} &bull; Type: <strong>Chat Reading</strong>
                    </p>
                  </div>
                </div>
                
                {selectedBooking.status === 'Active' && (
                  <button
                    className="astro-chat-complete-btn"
                    onClick={() => handleUpdateStatus(selectedBooking.id, 'Completed')}
                    style={{
                      backgroundColor: 'rgba(217, 119, 6, 0.15)',
                      border: '1px solid #fbbf24',
                      color: '#fbbf24',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Complete Consultation
                  </button>
                )}
              </div>

              {/* Special Notes / Birth Chart details bar */}
              <div style={{
                padding: '12px 24px',
                backgroundColor: '#080c18',
                borderBottom: '1px solid rgba(139, 92, 246, 0.05)',
                fontSize: '0.78rem',
                color: '#cbd5e1',
                lineHeight: 1.4,
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>📜</span>
                <div>
                  <strong>Birth Chart Details & Question:</strong> {selectedBooking.special_notes}
                </div>
              </div>

              {/* Chat Thread Panel */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                backgroundImage: 'radial-gradient(rgba(139, 92, 246, 0.04) 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }}>
                {messages.length === 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b' }}>
                    <span>Establishing cosmic chat thread connection...</span>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isAstrologer = m.sender_type === 'astrologer';
                    return (
                      <div
                        key={m.id}
                        style={{
                          alignSelf: isAstrologer ? 'flex-end' : 'flex-start',
                          maxWidth: '75%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isAstrologer ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <div style={{
                          padding: '12px 16px',
                          borderRadius: isAstrologer ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                          backgroundColor: isAstrologer ? 'rgba(217, 119, 6, 0.15)' : '#1e293b',
                          border: isAstrologer ? '1px solid rgba(217, 119, 6, 0.3)' : '1px solid rgba(148, 163, 184, 0.1)',
                          color: '#fff',
                          fontSize: '0.88rem',
                          lineHeight: 1.4,
                          textAlign: 'left'
                        }}>
                          {m.message_text}
                        </div>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '4px' }}>
                          {isAstrologer ? 'You' : selectedBooking.devotee_name} &bull; {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Accept Request Panel (If pending) */}
              {selectedBooking.status === 'Pending' && (
                <div style={{
                  padding: '24px',
                  backgroundColor: '#0c1122',
                  borderTop: '1px solid rgba(139, 92, 246, 0.15)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '1.5rem', animation: 'bounce 1s infinite' }}>🔮</span>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#fbbf24' }}>
                    Incoming Consultation Chat Request
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', maxWidth: '360px' }}>
                    Devotee is online and waiting for you to accept this session to begin.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button
                      onClick={() => handleUpdateStatus(selectedBooking.id, 'Active')}
                      style={{
                        backgroundColor: '#fbbf24',
                        color: '#070a13',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        padding: '12px 28px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(245, 158, 11, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <CheckCircle size={16} /> Accept & Start Chat
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedBooking.id, 'Cancelled')}
                      style={{
                        backgroundColor: 'transparent',
                        border: '1.5px solid rgba(239, 68, 68, 0.4)',
                        color: '#fca5a5',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        padding: '11px 24px',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              )}

              {/* Chat Input Console (If active) */}
              {selectedBooking.status === 'Active' && (
                <div style={{
                  padding: '16px 24px',
                  backgroundColor: '#0c1122',
                  borderTop: '1px solid rgba(139, 92, 246, 0.15)',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center'
                }}>
                  <input
                    type="text"
                    placeholder="Type your astrological reading..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendAstrologerMessage()}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      backgroundColor: '#131930',
                      border: '1.5px solid rgba(139, 92, 246, 0.2)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={handleSendAstrologerMessage}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#fbbf24',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(245, 158, 11, 0.2)'
                    }}
                  >
                    <Send size={18} style={{ color: '#070a13', marginLeft: '2px' }} />
                  </button>
                </div>
              )}

              {/* Status Alert Panels (Completed/Declined) */}
              {selectedBooking.status === 'Completed' && (
                <div style={{
                  padding: '16px',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  borderTop: '1px solid rgba(34, 197, 94, 0.2)',
                  color: '#4ade80',
                  textAlign: 'center',
                  fontWeight: 800,
                  fontSize: '0.85rem'
                }}>
                  🙏 Consultation Session Completed. Blessings Credited!
                </div>
              )}

              {selectedBooking.status === 'Cancelled' && (
                <div style={{
                  padding: '16px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderTop: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#fca5a5',
                  textAlign: 'center',
                  fontWeight: 800,
                  fontSize: '0.85rem'
                }}>
                  🛑 Consultation Session Cancelled / Declined.
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px', color: '#64748b', textAlign: 'center' }}>
              <Compass size={64} style={{ color: '#fbbf24', opacity: 0.3, marginBottom: '20px', animation: 'spin 40s linear infinite' }} />
              <h3 style={{ margin: 0, color: '#94a3b8', fontSize: '1.1rem', fontWeight: 800 }}>Cosmic Reading Console</h3>
              <p style={{ fontSize: '0.82rem', maxWidth: '320px', marginTop: '6px', lineHeight: 1.5 }}>
                Select an active session from the left queue to check birth charts or click the right panel to simulate an request.
              </p>
            </div>
          )}
        </section>

        {/* Right Column: Cosmic Devotee Simulator Panel */}
        {showSimulator && (
          <aside className="astro-dashboard-simulator" style={{
            backgroundColor: '#090c15',
            borderRadius: '12px',
            border: '1px dashed rgba(217, 119, 6, 0.4)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(217, 119, 6, 0.15)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} style={{ color: '#fbbf24' }} />
                <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Devotee Simulator
                </h3>
              </div>
              <button
                className="astro-mobile-close-simulator-btn"
                onClick={() => setMobileShowSimulator(false)}
                style={{
                  display: 'none',
                  color: '#fca5a5',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  background: 'none',
                  border: 'none',
                  padding: 0
                }}
              >
                Close
              </button>
            </div>

            {/* Simulated request form */}
            <form onSubmit={handleSimulateRequest} style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.4 }}>
                Generate an incoming consultation request to test the dashboard acceptance and real-time chat flows.
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '4px' }}>Devotee Name</label>
                <input
                  type="text"
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#131930', border: '1px solid rgba(139, 92, 246, 0.15)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '4px' }}>Gotra</label>
                  <input
                    type="text"
                    value={simGotra}
                    onChange={(e) => setSimGotra(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: '#131930', border: '1px solid rgba(139, 92, 246, 0.15)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '4px' }}>Phone</label>
                  <input
                    type="text"
                    value={simPhone}
                    onChange={(e) => setSimPhone(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: '#131930', border: '1px solid rgba(139, 92, 246, 0.15)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '4px' }}>Consultation Question & Birth Info</label>
                <textarea
                  rows={3}
                  value={simQuestion}
                  onChange={(e) => setSimQuestion(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#131930', border: '1px solid rgba(139, 92, 246, 0.15)', borderRadius: '6px', color: '#fff', fontSize: '0.78rem', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(217, 119, 6, 0.12)',
                  border: '1px dashed #fbbf24',
                  color: '#fbbf24',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  padding: '10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(217, 119, 6, 0.25)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(217, 119, 6, 0.12)'}
              >
                🌌 Launch Incoming request
              </button>
            </form>

            {/* Simulated message sender */}
            {selectedBooking && selectedBooking.status === 'Active' && (
              <div style={{ borderTop: '1px solid rgba(217, 119, 6, 0.15)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase' }}>
                  Chat as Devotee ({selectedBooking.devotee_name})
                </span>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  Send a reply as the devotee into the chat screen to test the live message sync.
                </div>
                <textarea
                  rows={2}
                  placeholder="e.g. Yes Acharya Ji. Which gemstone should I wear?"
                  value={simDevoteeMsg}
                  onChange={(e) => setSimDevoteeMsg(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#131930', border: '1px solid rgba(139, 92, 246, 0.15)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', outline: 'none', resize: 'vertical' }}
                />
                <button
                  onClick={handleSimulateDevoteeMessage}
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#fff',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Send Message as Devotee
                </button>
              </div>
            )}
          </aside>
        )}
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
