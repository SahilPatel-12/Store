-- Migration: Create website_store_pundit_bookings table
-- Date: 2026-06-23

BEGIN;

CREATE TABLE IF NOT EXISTS public.website_store_pundit_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pundit_id UUID REFERENCES public.website_store_users(id) ON DELETE CASCADE,
  user_id UUID,
  puja_name TEXT NOT NULL DEFAULT 'Sacred Ritual',
  devotee_name TEXT NOT NULL,
  gotra TEXT,
  devotee_phone TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  venue_type TEXT NOT NULL,
  venue_address TEXT,
  special_request TEXT,
  dakshina NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'Pending Confirmation',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.website_store_pundit_bookings ENABLE ROW LEVEL SECURITY;

-- Drop policies if exist
DROP POLICY IF EXISTS "Allow public read access to website_store_pundit_bookings" ON public.website_store_pundit_bookings;
DROP POLICY IF EXISTS "Allow public insert access to website_store_pundit_bookings" ON public.website_store_pundit_bookings;
DROP POLICY IF EXISTS "Allow public update access to website_store_pundit_bookings" ON public.website_store_pundit_bookings;
DROP POLICY IF EXISTS "Allow public delete access to website_store_pundit_bookings" ON public.website_store_pundit_bookings;

-- Create policies
CREATE POLICY "Allow public read access to website_store_pundit_bookings"
ON public.website_store_pundit_bookings
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public insert access to website_store_pundit_bookings"
ON public.website_store_pundit_bookings
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow public update access to website_store_pundit_bookings"
ON public.website_store_pundit_bookings
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete access to website_store_pundit_bookings"
ON public.website_store_pundit_bookings
FOR DELETE
TO anon, authenticated
USING (true);

COMMIT;
