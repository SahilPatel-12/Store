# Real-Time Astrologer Consultation & Chat Integration Guide

This guide details the database tables, real-time sync structure, and client behaviors needed to enable real-time messaging between mobile users and astrologers logged into the web portal.

---

## 1. Database Schema Configuration

To support chat sessions and real-time syncing, deploy the following tables in Supabase:

### `public.website_store_astrologers`
Represents registered astrologers on the platform.
```sql
CREATE TABLE IF NOT EXISTS public.website_store_astrologers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  profile_photo TEXT,
  rating NUMERIC(2,1) DEFAULT 4.5 NOT NULL,
  experience_years INTEGER NOT NULL DEFAULT 5,
  readings_count INTEGER NOT NULL DEFAULT 100,
  languages TEXT[] NOT NULL,
  specialties TEXT[] NOT NULL,
  charge_per_min INTEGER NOT NULL DEFAULT 30,
  is_online BOOLEAN NOT NULL DEFAULT true,
  spiritual_title TEXT,
  bio TEXT,
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

### `public.astrologer_bookings`
Logs consultation sessions initiated by the mobile user.
```sql
CREATE TABLE IF NOT EXISTS public.astrologer_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  astrologer_id UUID REFERENCES public.website_store_astrologers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE NOT NULL,
  devotee_name TEXT NOT NULL,
  devotee_phone TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  special_notes TEXT,
  consult_type TEXT NOT NULL CHECK (consult_type IN ('chat', 'call')),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Active', 'Completed', 'Cancelled')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

### `public.astrologer_chat_messages`
Stores individual chat messages for consultation sessions.
```sql
CREATE TABLE IF NOT EXISTS public.astrologer_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.astrologer_bookings(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'astrologer')),
  message_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

---

## 2. Enabling Real-Time Syncing (Supabase Realtime)

You **must** add these tables to the Supabase Realtime publication to allow clients to subscribe to changes automatically:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.website_store_astrologers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.astrologer_bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.astrologer_chat_messages;
```

---

## 3. Real-Time Chat Implementation Flow

### Step A: Starting a Chat Session (Mobile Client)
1. User opens the profile page of an online astrologer in the app.
2. User taps **"START CONSULTATION"** with method type `chat`.
3. The app inserts a row into `public.astrologer_bookings` (status: `Active`, consult_type: `chat`).
4. The app navigates the user to the Chat Screen, passing the created `booking_id`.

### Step B: Listening to Messages (Real-Time Subscription)
Both the web portal (used by the astrologer) and the mobile application (used by the devotee) subscribe to database updates on the `astrologer_chat_messages` table for their specific `booking_id`.

**Javascript / React / React Native Subscription Code:**
```javascript
import { supabase } from './supabaseClient';

const bookingId = "YOUR_ACTIVE_BOOKING_ID";

const chatChannel = supabase
  .channel(`chat_session_${bookingId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'astrologer_chat_messages',
      filter: `booking_id=eq.${bookingId}`
    },
    (payload) => {
      const newMessage = payload.new;
      console.log("New message received in real-time:", newMessage);
      // Append the message to your local UI chat state list
    }
  )
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Real-time connection active for booking chat:', bookingId);
    }
  });

// Cleanup on unmount
// chatChannel.unsubscribe();
```

### Step C: Sending a Message (Web & Mobile Clients)
To send a message, execute a standard Postgres insert. Supabase automatically broadcasts the row to all active subscribers.

**Insert Message Example:**
```javascript
const sendMessage = async (text, senderId, senderType) => {
  const { error } = await supabase
    .from('astrologer_chat_messages')
    .insert({
      booking_id: bookingId,
      sender_id: senderId,
      sender_type: senderType, // 'user' from app, 'astrologer' from website
      message_text: text
    });

  if (error) {
    console.error("Failed to send message:", error.message);
  }
};
```

---

## 4. Web Portal Dashboard Guidelines (For Astrologers)

To build the consultation section on your website:
1. **Fetch Active Bookings**: Periodically query or subscribe to `public.astrologer_bookings` where `astrologer_id` matches the current logged-in astrologer and `status = 'Active'`.
2. **Open Consultation Panel**: Clicking on an active booking loads the devotee details and opens a chat box.
3. **Listen for Messages**: Run the real-time subscription code using the selected `booking_id`.
4. **Send Replies**: Insert chat messages into `public.astrologer_chat_messages` with `sender_type = 'astrologer'`.
5. **Complete Session**: When done, update the status in `public.astrologer_bookings` to `Completed` to end the session.
