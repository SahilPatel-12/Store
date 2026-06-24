-- Migration: Create website_store_pundits table and seed 20 Vedic Acharyas
-- Date: 2026-06-23

BEGIN;

-- 1. Create public.website_store_pundits table
CREATE TABLE IF NOT EXISTS public.website_store_pundits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.website_store_users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  spiritual_title TEXT NOT NULL,
  languages TEXT[] NOT NULL,
  gotra TEXT NOT NULL,
  experience_years INT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  latitude NUMERIC(10, 6),
  longitude NUMERIC(10, 6),
  service_modes TEXT[] NOT NULL,
  temple_name TEXT,
  service_area TEXT,
  specialties TEXT[] NOT NULL,
  profile_photo TEXT,
  bio TEXT,
  verified_badge TEXT DEFAULT 'Registered Partner',
  verification_uploaded BOOLEAN DEFAULT false,
  onboarded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT website_store_pundits_user_id_key UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.website_store_pundits ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists
DROP POLICY IF EXISTS "Allow public read access to website_store_pundits" ON public.website_store_pundits;

-- Create policy to allow public select
CREATE POLICY "Allow public read access to website_store_pundits"
ON public.website_store_pundits
FOR SELECT
TO anon, authenticated
USING (true);

-- 2. Seed User accounts and Pundit tracking details

-- Seed Pundit: Acharya Raghav Sharma
DO $$
DECLARE
  v_user_id UUID;
  v_phone_exists BOOLEAN;
BEGIN
  -- Check if phone already registered
  SELECT EXISTS(SELECT 1 FROM public.website_store_users WHERE phone_number = '+919000000001') INTO v_phone_exists;
  
  IF NOT v_phone_exists THEN
    INSERT INTO public.website_store_users (
      id,
      full_name,
      email,
      phone_number,
      password_hash,
      is_pundit,
      affiliate_code,
      affiliate_status,
      affiliate_joined_at,
      pundit_profile
    ) VALUES (
      '4bfd2ae3-3889-4786-9939-a7bb9391f326',
      'Acharya Raghav Sharma',
      'acharyaraghavsharma@mantrapuja.com',
      '+919000000001',
      '9c25ac6b65a51dfdcc7a1045ce5ac0166fb6393e034166be2b9828f8a031bc98',
      true,
      'MP66CD92',
      'active',
      now(),
      '{"fullName":"Acharya Raghav Sharma","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit"],"gotra":"Bharadwaj","experience":18,"location":{"city":"Varanasi","state":"Uttar Pradesh","latitude":25.3176,"longitude":82.9739},"serviceModes":["Temple","Home Visits"],"templeName":"Kashi Vishwanath Temple","serviceArea":"Varanasi","ritualExpertise":["🕉 Rudrabhishek","🔥 Havan","🕉 Shanti Path"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Raghav%20Sharma","bio":"Acharya Raghav Sharma has performed thousands of authentic Vedic Rudraksha energization rituals following traditional Shiva Agama and Rudra Vidhi procedures.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.833Z"}'::JSONB
    ) RETURNING id INTO v_user_id;

    -- Add wallet
    INSERT INTO public.affiliate_wallets (user_id, total_earned, pending_earnings, approved_earnings, withdrawn_amount)
    VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    SELECT id INTO v_user_id FROM public.website_store_users WHERE phone_number = '+919000000001';
    UPDATE public.website_store_users
    SET 
      is_pundit = true,
      pundit_profile = '{"fullName":"Acharya Raghav Sharma","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit"],"gotra":"Bharadwaj","experience":18,"location":{"city":"Varanasi","state":"Uttar Pradesh","latitude":25.3176,"longitude":82.9739},"serviceModes":["Temple","Home Visits"],"templeName":"Kashi Vishwanath Temple","serviceArea":"Varanasi","ritualExpertise":["🕉 Rudrabhishek","🔥 Havan","🕉 Shanti Path"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Raghav%20Sharma","bio":"Acharya Raghav Sharma has performed thousands of authentic Vedic Rudraksha energization rituals following traditional Shiva Agama and Rudra Vidhi procedures.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.833Z"}'::JSONB,
      full_name = 'Acharya Raghav Sharma'
    WHERE id = v_user_id;
  END IF;

  -- Insert/update Pundit directory tracker table
  INSERT INTO public.website_store_pundits (
    user_id,
    full_name,
    spiritual_title,
    languages,
    gotra,
    experience_years,
    city,
    state,
    latitude,
    longitude,
    service_modes,
    temple_name,
    service_area,
    specialties,
    profile_photo,
    bio,
    verified_badge,
    verification_uploaded,
    onboarded_at
  ) VALUES (
    v_user_id,
    'Acharya Raghav Sharma',
    'Acharya',
    ARRAY['Hindi', 'Sanskrit'],
    'Bharadwaj',
    18,
    'Varanasi',
    'Uttar Pradesh',
    25.3176,
    82.9739,
    ARRAY['Temple', 'Home Visits'],
    'Kashi Vishwanath Temple',
    'Varanasi',
    ARRAY['🕉 Rudrabhishek', '🔥 Havan', '🕉 Shanti Path'],
    'https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Raghav%20Sharma',
    'Acharya Raghav Sharma has performed thousands of authentic Vedic Rudraksha energization rituals following traditional Shiva Agama and Rudra Vidhi procedures.',
    'Verified Pandit',
    true,
    now()
  ) ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    spiritual_title = EXCLUDED.spiritual_title,
    languages = EXCLUDED.languages,
    gotra = EXCLUDED.gotra,
    experience_years = EXCLUDED.experience_years,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    service_modes = EXCLUDED.service_modes,
    temple_name = EXCLUDED.temple_name,
    service_area = EXCLUDED.service_area,
    specialties = EXCLUDED.specialties,
    profile_photo = EXCLUDED.profile_photo,
    bio = EXCLUDED.bio,
    verified_badge = EXCLUDED.verified_badge,
    verification_uploaded = EXCLUDED.verification_uploaded,
    updated_at = now();
END;
$$;

-- Seed Pundit: Acharya Devendra Shastri
DO $$
DECLARE
  v_user_id UUID;
  v_phone_exists BOOLEAN;
BEGIN
  -- Check if phone already registered
  SELECT EXISTS(SELECT 1 FROM public.website_store_users WHERE phone_number = '+919000000002') INTO v_phone_exists;
  
  IF NOT v_phone_exists THEN
    INSERT INTO public.website_store_users (
      id,
      full_name,
      email,
      phone_number,
      password_hash,
      is_pundit,
      affiliate_code,
      affiliate_status,
      affiliate_joined_at,
      pundit_profile
    ) VALUES (
      '042ca4a8-1576-4604-8e05-7aec91f02d2d',
      'Acharya Devendra Shastri',
      'acharyadevendrashastri@mantrapuja.com',
      '+919000000002',
      '9c25ac6b65a51dfdcc7a1045ce5ac0166fb6393e034166be2b9828f8a031bc98',
      true,
      'MPF190DA',
      'active',
      now(),
      '{"fullName":"Acharya Devendra Shastri","spiritualTitle":"Shastri","languages":["Hindi","Sanskrit","English"],"gotra":"Vashishtha","experience":15,"location":{"city":"Varanasi","state":"Uttar Pradesh","latitude":25.318,"longitude":82.9745},"serviceModes":["Home Visits","Online"],"templeName":"","serviceArea":"Varanasi","ritualExpertise":["🪔 Satyanarayan Katha","🏡 Griha Pravesh","🔥 Havan"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Devendra%20Shastri","bio":"Acharya Devendra Shastri specializes in Vedic mantra siddhi, Saraswati worship rituals, and traditional Rudraksha energization ceremonies.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB
    ) RETURNING id INTO v_user_id;

    -- Add wallet
    INSERT INTO public.affiliate_wallets (user_id, total_earned, pending_earnings, approved_earnings, withdrawn_amount)
    VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    SELECT id INTO v_user_id FROM public.website_store_users WHERE phone_number = '+919000000002';
    UPDATE public.website_store_users
    SET 
      is_pundit = true,
      pundit_profile = '{"fullName":"Acharya Devendra Shastri","spiritualTitle":"Shastri","languages":["Hindi","Sanskrit","English"],"gotra":"Vashishtha","experience":15,"location":{"city":"Varanasi","state":"Uttar Pradesh","latitude":25.318,"longitude":82.9745},"serviceModes":["Home Visits","Online"],"templeName":"","serviceArea":"Varanasi","ritualExpertise":["🪔 Satyanarayan Katha","🏡 Griha Pravesh","🔥 Havan"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Devendra%20Shastri","bio":"Acharya Devendra Shastri specializes in Vedic mantra siddhi, Saraswati worship rituals, and traditional Rudraksha energization ceremonies.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB,
      full_name = 'Acharya Devendra Shastri'
    WHERE id = v_user_id;
  END IF;

  -- Insert/update Pundit directory tracker table
  INSERT INTO public.website_store_pundits (
    user_id,
    full_name,
    spiritual_title,
    languages,
    gotra,
    experience_years,
    city,
    state,
    latitude,
    longitude,
    service_modes,
    temple_name,
    service_area,
    specialties,
    profile_photo,
    bio,
    verified_badge,
    verification_uploaded,
    onboarded_at
  ) VALUES (
    v_user_id,
    'Acharya Devendra Shastri',
    'Shastri',
    ARRAY['Hindi', 'Sanskrit', 'English'],
    'Vashishtha',
    15,
    'Varanasi',
    'Uttar Pradesh',
    25.318,
    82.9745,
    ARRAY['Home Visits', 'Online'],
    NULL,
    'Varanasi',
    ARRAY['🪔 Satyanarayan Katha', '🏡 Griha Pravesh', '🔥 Havan'],
    'https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Devendra%20Shastri',
    'Acharya Devendra Shastri specializes in Vedic mantra siddhi, Saraswati worship rituals, and traditional Rudraksha energization ceremonies.',
    'Verified Pandit',
    true,
    now()
  ) ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    spiritual_title = EXCLUDED.spiritual_title,
    languages = EXCLUDED.languages,
    gotra = EXCLUDED.gotra,
    experience_years = EXCLUDED.experience_years,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    service_modes = EXCLUDED.service_modes,
    temple_name = EXCLUDED.temple_name,
    service_area = EXCLUDED.service_area,
    specialties = EXCLUDED.specialties,
    profile_photo = EXCLUDED.profile_photo,
    bio = EXCLUDED.bio,
    verified_badge = EXCLUDED.verified_badge,
    verification_uploaded = EXCLUDED.verification_uploaded,
    updated_at = now();
END;
$$;

-- Seed Pundit: Acharya Subramanya Iyer
DO $$
DECLARE
  v_user_id UUID;
  v_phone_exists BOOLEAN;
BEGIN
  -- Check if phone already registered
  SELECT EXISTS(SELECT 1 FROM public.website_store_users WHERE phone_number = '+919000000003') INTO v_phone_exists;
  
  IF NOT v_phone_exists THEN
    INSERT INTO public.website_store_users (
      id,
      full_name,
      email,
      phone_number,
      password_hash,
      is_pundit,
      affiliate_code,
      affiliate_status,
      affiliate_joined_at,
      pundit_profile
    ) VALUES (
      '77eea0f0-b841-4740-8bac-520161f335e1',
      'Acharya Subramanya Iyer',
      'acharyasubramanyaiyer@mantrapuja.com',
      '+919000000003',
      '9c25ac6b65a51dfdcc7a1045ce5ac0166fb6393e034166be2b9828f8a031bc98',
      true,
      'MP7DD150',
      'active',
      now(),
      '{"fullName":"Acharya Subramanya Iyer","spiritualTitle":"Acharya","languages":["Tamil","Sanskrit","English"],"gotra":"Kashyap","experience":20,"location":{"city":"Chennai","state":"Tamil Nadu","latitude":13.0827,"longitude":80.2707},"serviceModes":["Temple","Home Visits","Online"],"templeName":"Kapaleeshwarar Temple","serviceArea":"Chennai","ritualExpertise":["🕉 Rudrabhishek","💍 Vivah Sanskar","💰 Lakshmi Puja"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Subramanya%20Iyer","bio":"Acharya Subramanya Iyer specializes in Murugan worship rituals, sacred mantra recitations, and spiritual energization ceremonies.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB
    ) RETURNING id INTO v_user_id;

    -- Add wallet
    INSERT INTO public.affiliate_wallets (user_id, total_earned, pending_earnings, approved_earnings, withdrawn_amount)
    VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    SELECT id INTO v_user_id FROM public.website_store_users WHERE phone_number = '+919000000003';
    UPDATE public.website_store_users
    SET 
      is_pundit = true,
      pundit_profile = '{"fullName":"Acharya Subramanya Iyer","spiritualTitle":"Acharya","languages":["Tamil","Sanskrit","English"],"gotra":"Kashyap","experience":20,"location":{"city":"Chennai","state":"Tamil Nadu","latitude":13.0827,"longitude":80.2707},"serviceModes":["Temple","Home Visits","Online"],"templeName":"Kapaleeshwarar Temple","serviceArea":"Chennai","ritualExpertise":["🕉 Rudrabhishek","💍 Vivah Sanskar","💰 Lakshmi Puja"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Subramanya%20Iyer","bio":"Acharya Subramanya Iyer specializes in Murugan worship rituals, sacred mantra recitations, and spiritual energization ceremonies.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB,
      full_name = 'Acharya Subramanya Iyer'
    WHERE id = v_user_id;
  END IF;

  -- Insert/update Pundit directory tracker table
  INSERT INTO public.website_store_pundits (
    user_id,
    full_name,
    spiritual_title,
    languages,
    gotra,
    experience_years,
    city,
    state,
    latitude,
    longitude,
    service_modes,
    temple_name,
    service_area,
    specialties,
    profile_photo,
    bio,
    verified_badge,
    verification_uploaded,
    onboarded_at
  ) VALUES (
    v_user_id,
    'Acharya Subramanya Iyer',
    'Acharya',
    ARRAY['Tamil', 'Sanskrit', 'English'],
    'Kashyap',
    20,
    'Chennai',
    'Tamil Nadu',
    13.0827,
    80.2707,
    ARRAY['Temple', 'Home Visits', 'Online'],
    'Kapaleeshwarar Temple',
    'Chennai',
    ARRAY['🕉 Rudrabhishek', '💍 Vivah Sanskar', '💰 Lakshmi Puja'],
    'https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Subramanya%20Iyer',
    'Acharya Subramanya Iyer specializes in Murugan worship rituals, sacred mantra recitations, and spiritual energization ceremonies.',
    'Verified Pandit',
    true,
    now()
  ) ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    spiritual_title = EXCLUDED.spiritual_title,
    languages = EXCLUDED.languages,
    gotra = EXCLUDED.gotra,
    experience_years = EXCLUDED.experience_years,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    service_modes = EXCLUDED.service_modes,
    temple_name = EXCLUDED.temple_name,
    service_area = EXCLUDED.service_area,
    specialties = EXCLUDED.specialties,
    profile_photo = EXCLUDED.profile_photo,
    bio = EXCLUDED.bio,
    verified_badge = EXCLUDED.verified_badge,
    verification_uploaded = EXCLUDED.verification_uploaded,
    updated_at = now();
END;
$$;

-- Seed Pundit: Acharya Bhavesh Shukla
DO $$
DECLARE
  v_user_id UUID;
  v_phone_exists BOOLEAN;
BEGIN
  -- Check if phone already registered
  SELECT EXISTS(SELECT 1 FROM public.website_store_users WHERE phone_number = '+919000000004') INTO v_phone_exists;
  
  IF NOT v_phone_exists THEN
    INSERT INTO public.website_store_users (
      id,
      full_name,
      email,
      phone_number,
      password_hash,
      is_pundit,
      affiliate_code,
      affiliate_status,
      affiliate_joined_at,
      pundit_profile
    ) VALUES (
      '3fa0555c-e38d-4304-b518-7f3a0745d6a6',
      'Acharya Bhavesh Shukla',
      'acharyabhaveshshukla@mantrapuja.com',
      '+919000000004',
      '9c25ac6b65a51dfdcc7a1045ce5ac0166fb6393e034166be2b9828f8a031bc98',
      true,
      'MPCA7755',
      'active',
      now(),
      '{"fullName":"Acharya Bhavesh Shukla","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit"],"gotra":"Gautam","experience":12,"location":{"city":"Ujjain","state":"Madhya Pradesh","latitude":23.176,"longitude":75.7885},"serviceModes":["Temple","Home Visits"],"templeName":"Mahakaleshwar Jyotirlinga Temple","serviceArea":"Ujjain","ritualExpertise":["🌞 Navgraha Puja","🏡 Griha Pravesh","🏠 Vastu Shanti"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Bhavesh%20Shukla","bio":"Acharya Bhavesh Shukla specializes in family harmony rituals, Ganesh Sadhana, and authentic Vedic Rudraksha energization ceremonies.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB
    ) RETURNING id INTO v_user_id;

    -- Add wallet
    INSERT INTO public.affiliate_wallets (user_id, total_earned, pending_earnings, approved_earnings, withdrawn_amount)
    VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    SELECT id INTO v_user_id FROM public.website_store_users WHERE phone_number = '+919000000004';
    UPDATE public.website_store_users
    SET 
      is_pundit = true,
      pundit_profile = '{"fullName":"Acharya Bhavesh Shukla","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit"],"gotra":"Gautam","experience":12,"location":{"city":"Ujjain","state":"Madhya Pradesh","latitude":23.176,"longitude":75.7885},"serviceModes":["Temple","Home Visits"],"templeName":"Mahakaleshwar Jyotirlinga Temple","serviceArea":"Ujjain","ritualExpertise":["🌞 Navgraha Puja","🏡 Griha Pravesh","🏠 Vastu Shanti"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Bhavesh%20Shukla","bio":"Acharya Bhavesh Shukla specializes in family harmony rituals, Ganesh Sadhana, and authentic Vedic Rudraksha energization ceremonies.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB,
      full_name = 'Acharya Bhavesh Shukla'
    WHERE id = v_user_id;
  END IF;

  -- Insert/update Pundit directory tracker table
  INSERT INTO public.website_store_pundits (
    user_id,
    full_name,
    spiritual_title,
    languages,
    gotra,
    experience_years,
    city,
    state,
    latitude,
    longitude,
    service_modes,
    temple_name,
    service_area,
    specialties,
    profile_photo,
    bio,
    verified_badge,
    verification_uploaded,
    onboarded_at
  ) VALUES (
    v_user_id,
    'Acharya Bhavesh Shukla',
    'Acharya',
    ARRAY['Hindi', 'Sanskrit'],
    'Gautam',
    12,
    'Ujjain',
    'Madhya Pradesh',
    23.176,
    75.7885,
    ARRAY['Temple', 'Home Visits'],
    'Mahakaleshwar Jyotirlinga Temple',
    'Ujjain',
    ARRAY['🌞 Navgraha Puja', '🏡 Griha Pravesh', '🏠 Vastu Shanti'],
    'https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Bhavesh%20Shukla',
    'Acharya Bhavesh Shukla specializes in family harmony rituals, Ganesh Sadhana, and authentic Vedic Rudraksha energization ceremonies.',
    'Verified Pandit',
    true,
    now()
  ) ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    spiritual_title = EXCLUDED.spiritual_title,
    languages = EXCLUDED.languages,
    gotra = EXCLUDED.gotra,
    experience_years = EXCLUDED.experience_years,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    service_modes = EXCLUDED.service_modes,
    temple_name = EXCLUDED.temple_name,
    service_area = EXCLUDED.service_area,
    specialties = EXCLUDED.specialties,
    profile_photo = EXCLUDED.profile_photo,
    bio = EXCLUDED.bio,
    verified_badge = EXCLUDED.verified_badge,
    verification_uploaded = EXCLUDED.verification_uploaded,
    updated_at = now();
END;
$$;

-- Seed Pundit: Acharya Gaurang Bhatt
DO $$
DECLARE
  v_user_id UUID;
  v_phone_exists BOOLEAN;
BEGIN
  -- Check if phone already registered
  SELECT EXISTS(SELECT 1 FROM public.website_store_users WHERE phone_number = '+919000000005') INTO v_phone_exists;
  
  IF NOT v_phone_exists THEN
    INSERT INTO public.website_store_users (
      id,
      full_name,
      email,
      phone_number,
      password_hash,
      is_pundit,
      affiliate_code,
      affiliate_status,
      affiliate_joined_at,
      pundit_profile
    ) VALUES (
      '4f84f27a-17ee-4e22-81aa-66ea1f1e3103',
      'Acharya Gaurang Bhatt',
      'acharyagaurangbhatt@mantrapuja.com',
      '+919000000005',
      '9c25ac6b65a51dfdcc7a1045ce5ac0166fb6393e034166be2b9828f8a031bc98',
      true,
      'MP21335B',
      'active',
      now(),
      '{"fullName":"Acharya Gaurang Bhatt","spiritualTitle":"Acharya","languages":["Gujarati","Hindi","Sanskrit"],"gotra":"Atri","experience":16,"location":{"city":"Ahmedabad","state":"Gujarat","latitude":23.0225,"longitude":72.5714},"serviceModes":["Home Visits","Online"],"templeName":"","serviceArea":"Ahmedabad","ritualExpertise":["💰 Lakshmi Puja","🔥 Havan","🌞 Navgraha Puja"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Gaurang%20Bhatt","bio":"Acharya Gaurang Bhatt has extensive expertise in Mahalakshmi worship, prosperity rituals, and authentic Vedic Rudraksha energization ceremonies.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB
    ) RETURNING id INTO v_user_id;

    -- Add wallet
    INSERT INTO public.affiliate_wallets (user_id, total_earned, pending_earnings, approved_earnings, withdrawn_amount)
    VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    SELECT id INTO v_user_id FROM public.website_store_users WHERE phone_number = '+919000000005';
    UPDATE public.website_store_users
    SET 
      is_pundit = true,
      pundit_profile = '{"fullName":"Acharya Gaurang Bhatt","spiritualTitle":"Acharya","languages":["Gujarati","Hindi","Sanskrit"],"gotra":"Atri","experience":16,"location":{"city":"Ahmedabad","state":"Gujarat","latitude":23.0225,"longitude":72.5714},"serviceModes":["Home Visits","Online"],"templeName":"","serviceArea":"Ahmedabad","ritualExpertise":["💰 Lakshmi Puja","🔥 Havan","🌞 Navgraha Puja"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Gaurang%20Bhatt","bio":"Acharya Gaurang Bhatt has extensive expertise in Mahalakshmi worship, prosperity rituals, and authentic Vedic Rudraksha energization ceremonies.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB,
      full_name = 'Acharya Gaurang Bhatt'
    WHERE id = v_user_id;
  END IF;

  -- Insert/update Pundit directory tracker table
  INSERT INTO public.website_store_pundits (
    user_id,
    full_name,
    spiritual_title,
    languages,
    gotra,
    experience_years,
    city,
    state,
    latitude,
    longitude,
    service_modes,
    temple_name,
    service_area,
    specialties,
    profile_photo,
    bio,
    verified_badge,
    verification_uploaded,
    onboarded_at
  ) VALUES (
    v_user_id,
    'Acharya Gaurang Bhatt',
    'Acharya',
    ARRAY['Gujarati', 'Hindi', 'Sanskrit'],
    'Atri',
    16,
    'Ahmedabad',
    'Gujarat',
    23.0225,
    72.5714,
    ARRAY['Home Visits', 'Online'],
    NULL,
    'Ahmedabad',
    ARRAY['💰 Lakshmi Puja', '🔥 Havan', '🌞 Navgraha Puja'],
    'https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Gaurang%20Bhatt',
    'Acharya Gaurang Bhatt has extensive expertise in Mahalakshmi worship, prosperity rituals, and authentic Vedic Rudraksha energization ceremonies.',
    'Verified Pandit',
    true,
    now()
  ) ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    spiritual_title = EXCLUDED.spiritual_title,
    languages = EXCLUDED.languages,
    gotra = EXCLUDED.gotra,
    experience_years = EXCLUDED.experience_years,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    service_modes = EXCLUDED.service_modes,
    temple_name = EXCLUDED.temple_name,
    service_area = EXCLUDED.service_area,
    specialties = EXCLUDED.specialties,
    profile_photo = EXCLUDED.profile_photo,
    bio = EXCLUDED.bio,
    verified_badge = EXCLUDED.verified_badge,
    verification_uploaded = EXCLUDED.verification_uploaded,
    updated_at = now();
END;
$$;

-- Seed Pundit: Acharya Kuberanand Mishra
DO $$
DECLARE
  v_user_id UUID;
  v_phone_exists BOOLEAN;
BEGIN
  -- Check if phone already registered
  SELECT EXISTS(SELECT 1 FROM public.website_store_users WHERE phone_number = '+919000000006') INTO v_phone_exists;
  
  IF NOT v_phone_exists THEN
    INSERT INTO public.website_store_users (
      id,
      full_name,
      email,
      phone_number,
      password_hash,
      is_pundit,
      affiliate_code,
      affiliate_status,
      affiliate_joined_at,
      pundit_profile
    ) VALUES (
      '1d00f2c0-1b9d-43ac-9232-72c69e77404f',
      'Acharya Kuberanand Mishra',
      'acharyakuberanandmishra@mantrapuja.com',
      '+919000000006',
      '9c25ac6b65a51dfdcc7a1045ce5ac0166fb6393e034166be2b9828f8a031bc98',
      true,
      'MP304F15',
      'active',
      now(),
      '{"fullName":"Acharya Kuberanand Mishra","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit"],"gotra":"Agastya","experience":14,"location":{"city":"Haridwar","state":"Uttarakhand","latitude":29.9457,"longitude":78.1642},"serviceModes":["Temple","Home Visits"],"templeName":"Har Ki Pauri Temple","serviceArea":"Haridwar","ritualExpertise":["💰 Lakshmi Puja","🔥 Havan","🏠 Vastu Shanti"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Kuberanand%20Mishra","bio":"Acharya Kuberanand Mishra specializes in crystal energization, prosperity rituals, and sacred wealth-attraction ceremonies.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB
    ) RETURNING id INTO v_user_id;

    -- Add wallet
    INSERT INTO public.affiliate_wallets (user_id, total_earned, pending_earnings, approved_earnings, withdrawn_amount)
    VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    SELECT id INTO v_user_id FROM public.website_store_users WHERE phone_number = '+919000000006';
    UPDATE public.website_store_users
    SET 
      is_pundit = true,
      pundit_profile = '{"fullName":"Acharya Kuberanand Mishra","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit"],"gotra":"Agastya","experience":14,"location":{"city":"Haridwar","state":"Uttarakhand","latitude":29.9457,"longitude":78.1642},"serviceModes":["Temple","Home Visits"],"templeName":"Har Ki Pauri Temple","serviceArea":"Haridwar","ritualExpertise":["💰 Lakshmi Puja","🔥 Havan","🏠 Vastu Shanti"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Kuberanand%20Mishra","bio":"Acharya Kuberanand Mishra specializes in crystal energization, prosperity rituals, and sacred wealth-attraction ceremonies.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB,
      full_name = 'Acharya Kuberanand Mishra'
    WHERE id = v_user_id;
  END IF;

  -- Insert/update Pundit directory tracker table
  INSERT INTO public.website_store_pundits (
    user_id,
    full_name,
    spiritual_title,
    languages,
    gotra,
    experience_years,
    city,
    state,
    latitude,
    longitude,
    service_modes,
    temple_name,
    service_area,
    specialties,
    profile_photo,
    bio,
    verified_badge,
    verification_uploaded,
    onboarded_at
  ) VALUES (
    v_user_id,
    'Acharya Kuberanand Mishra',
    'Acharya',
    ARRAY['Hindi', 'Sanskrit'],
    'Agastya',
    14,
    'Haridwar',
    'Uttarakhand',
    29.9457,
    78.1642,
    ARRAY['Temple', 'Home Visits'],
    'Har Ki Pauri Temple',
    'Haridwar',
    ARRAY['💰 Lakshmi Puja', '🔥 Havan', '🏠 Vastu Shanti'],
    'https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Kuberanand%20Mishra',
    'Acharya Kuberanand Mishra specializes in crystal energization, prosperity rituals, and sacred wealth-attraction ceremonies.',
    'Verified Pandit',
    true,
    now()
  ) ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    spiritual_title = EXCLUDED.spiritual_title,
    languages = EXCLUDED.languages,
    gotra = EXCLUDED.gotra,
    experience_years = EXCLUDED.experience_years,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    service_modes = EXCLUDED.service_modes,
    temple_name = EXCLUDED.temple_name,
    service_area = EXCLUDED.service_area,
    specialties = EXCLUDED.specialties,
    profile_photo = EXCLUDED.profile_photo,
    bio = EXCLUDED.bio,
    verified_badge = EXCLUDED.verified_badge,
    verification_uploaded = EXCLUDED.verification_uploaded,
    updated_at = now();
END;
$$;

-- Seed Pundit: Acharya Lakshmikant Dwivedi
DO $$
DECLARE
  v_user_id UUID;
  v_phone_exists BOOLEAN;
BEGIN
  -- Check if phone already registered
  SELECT EXISTS(SELECT 1 FROM public.website_store_users WHERE phone_number = '+919000000007') INTO v_phone_exists;
  
  IF NOT v_phone_exists THEN
    INSERT INTO public.website_store_users (
      id,
      full_name,
      email,
      phone_number,
      password_hash,
      is_pundit,
      affiliate_code,
      affiliate_status,
      affiliate_joined_at,
      pundit_profile
    ) VALUES (
      '95028405-5e46-4400-817e-7a911c54001e',
      'Acharya Lakshmikant Dwivedi',
      'acharyalakshmikantdwivedi@mantrapuja.com',
      '+919000000007',
      '9c25ac6b65a51dfdcc7a1045ce5ac0166fb6393e034166be2b9828f8a031bc98',
      true,
      'MPD3A741',
      'active',
      now(),
      '{"fullName":"Acharya Lakshmikant Dwivedi","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit","English"],"gotra":"Vatsa","experience":17,"location":{"city":"Varanasi","state":"Uttar Pradesh","latitude":25.321,"longitude":82.978},"serviceModes":["Temple","Home Visits","Online"],"templeName":"Sankat Mochan Hanuman Temple","serviceArea":"Varanasi","ritualExpertise":["💰 Lakshmi Puja","🌞 Navgraha Puja","🪔 Satyanarayan Katha"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Lakshmikant%20Dwivedi","bio":"Acharya Lakshmikant Dwivedi specializes in Lakshmi-Kuber rituals and spiritual energization ceremonies focused on prosperity and abundance.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB
    ) RETURNING id INTO v_user_id;

    -- Add wallet
    INSERT INTO public.affiliate_wallets (user_id, total_earned, pending_earnings, approved_earnings, withdrawn_amount)
    VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    SELECT id INTO v_user_id FROM public.website_store_users WHERE phone_number = '+919000000007';
    UPDATE public.website_store_users
    SET 
      is_pundit = true,
      pundit_profile = '{"fullName":"Acharya Lakshmikant Dwivedi","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit","English"],"gotra":"Vatsa","experience":17,"location":{"city":"Varanasi","state":"Uttar Pradesh","latitude":25.321,"longitude":82.978},"serviceModes":["Temple","Home Visits","Online"],"templeName":"Sankat Mochan Hanuman Temple","serviceArea":"Varanasi","ritualExpertise":["💰 Lakshmi Puja","🌞 Navgraha Puja","🪔 Satyanarayan Katha"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Lakshmikant%20Dwivedi","bio":"Acharya Lakshmikant Dwivedi specializes in Lakshmi-Kuber rituals and spiritual energization ceremonies focused on prosperity and abundance.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB,
      full_name = 'Acharya Lakshmikant Dwivedi'
    WHERE id = v_user_id;
  END IF;

  -- Insert/update Pundit directory tracker table
  INSERT INTO public.website_store_pundits (
    user_id,
    full_name,
    spiritual_title,
    languages,
    gotra,
    experience_years,
    city,
    state,
    latitude,
    longitude,
    service_modes,
    temple_name,
    service_area,
    specialties,
    profile_photo,
    bio,
    verified_badge,
    verification_uploaded,
    onboarded_at
  ) VALUES (
    v_user_id,
    'Acharya Lakshmikant Dwivedi',
    'Acharya',
    ARRAY['Hindi', 'Sanskrit', 'English'],
    'Vatsa',
    17,
    'Varanasi',
    'Uttar Pradesh',
    25.321,
    82.978,
    ARRAY['Temple', 'Home Visits', 'Online'],
    'Sankat Mochan Hanuman Temple',
    'Varanasi',
    ARRAY['💰 Lakshmi Puja', '🌞 Navgraha Puja', '🪔 Satyanarayan Katha'],
    'https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Lakshmikant%20Dwivedi',
    'Acharya Lakshmikant Dwivedi specializes in Lakshmi-Kuber rituals and spiritual energization ceremonies focused on prosperity and abundance.',
    'Verified Pandit',
    true,
    now()
  ) ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    spiritual_title = EXCLUDED.spiritual_title,
    languages = EXCLUDED.languages,
    gotra = EXCLUDED.gotra,
    experience_years = EXCLUDED.experience_years,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    service_modes = EXCLUDED.service_modes,
    temple_name = EXCLUDED.temple_name,
    service_area = EXCLUDED.service_area,
    specialties = EXCLUDED.specialties,
    profile_photo = EXCLUDED.profile_photo,
    bio = EXCLUDED.bio,
    verified_badge = EXCLUDED.verified_badge,
    verification_uploaded = EXCLUDED.verification_uploaded,
    updated_at = now();
END;
$$;

-- Seed Pundit: Acharya Narayan Shukla
DO $$
DECLARE
  v_user_id UUID;
  v_phone_exists BOOLEAN;
BEGIN
  -- Check if phone already registered
  SELECT EXISTS(SELECT 1 FROM public.website_store_users WHERE phone_number = '+919000000008') INTO v_phone_exists;
  
  IF NOT v_phone_exists THEN
    INSERT INTO public.website_store_users (
      id,
      full_name,
      email,
      phone_number,
      password_hash,
      is_pundit,
      affiliate_code,
      affiliate_status,
      affiliate_joined_at,
      pundit_profile
    ) VALUES (
      'ac61ed6a-ffad-4783-85e7-ef77df4dbb93',
      'Acharya Narayan Shukla',
      'acharyanarayanshukla@mantrapuja.com',
      '+919000000008',
      '9c25ac6b65a51dfdcc7a1045ce5ac0166fb6393e034166be2b9828f8a031bc98',
      true,
      'MP6AC649',
      'active',
      now(),
      '{"fullName":"Acharya Narayan Shukla","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit"],"gotra":"Angirasa","experience":22,"location":{"city":"Prayagraj","state":"Uttar Pradesh","latitude":25.4358,"longitude":81.8463},"serviceModes":["Home Visits","Online"],"templeName":"","serviceArea":"Prayagraj","ritualExpertise":["🕉 Rudrabhishek","🔥 Havan","🕉 Shanti Path"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Narayan%20Shukla","bio":"Acharya Narayan Shukla is renowned for performing Vishnu Sadhana, Vedic protection rituals, and authentic Rudraksha energization ceremonies according to ancient scriptures.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB
    ) RETURNING id INTO v_user_id;

    -- Add wallet
    INSERT INTO public.affiliate_wallets (user_id, total_earned, pending_earnings, approved_earnings, withdrawn_amount)
    VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    SELECT id INTO v_user_id FROM public.website_store_users WHERE phone_number = '+919000000008';
    UPDATE public.website_store_users
    SET 
      is_pundit = true,
      pundit_profile = '{"fullName":"Acharya Narayan Shukla","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit"],"gotra":"Angirasa","experience":22,"location":{"city":"Prayagraj","state":"Uttar Pradesh","latitude":25.4358,"longitude":81.8463},"serviceModes":["Home Visits","Online"],"templeName":"","serviceArea":"Prayagraj","ritualExpertise":["🕉 Rudrabhishek","🔥 Havan","🕉 Shanti Path"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Narayan%20Shukla","bio":"Acharya Narayan Shukla is renowned for performing Vishnu Sadhana, Vedic protection rituals, and authentic Rudraksha energization ceremonies according to ancient scriptures.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB,
      full_name = 'Acharya Narayan Shukla'
    WHERE id = v_user_id;
  END IF;

  -- Insert/update Pundit directory tracker table
  INSERT INTO public.website_store_pundits (
    user_id,
    full_name,
    spiritual_title,
    languages,
    gotra,
    experience_years,
    city,
    state,
    latitude,
    longitude,
    service_modes,
    temple_name,
    service_area,
    specialties,
    profile_photo,
    bio,
    verified_badge,
    verification_uploaded,
    onboarded_at
  ) VALUES (
    v_user_id,
    'Acharya Narayan Shukla',
    'Acharya',
    ARRAY['Hindi', 'Sanskrit'],
    'Angirasa',
    22,
    'Prayagraj',
    'Uttar Pradesh',
    25.4358,
    81.8463,
    ARRAY['Home Visits', 'Online'],
    NULL,
    'Prayagraj',
    ARRAY['🕉 Rudrabhishek', '🔥 Havan', '🕉 Shanti Path'],
    'https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Narayan%20Shukla',
    'Acharya Narayan Shukla is renowned for performing Vishnu Sadhana, Vedic protection rituals, and authentic Rudraksha energization ceremonies according to ancient scriptures.',
    'Verified Pandit',
    true,
    now()
  ) ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    spiritual_title = EXCLUDED.spiritual_title,
    languages = EXCLUDED.languages,
    gotra = EXCLUDED.gotra,
    experience_years = EXCLUDED.experience_years,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    service_modes = EXCLUDED.service_modes,
    temple_name = EXCLUDED.temple_name,
    service_area = EXCLUDED.service_area,
    specialties = EXCLUDED.specialties,
    profile_photo = EXCLUDED.profile_photo,
    bio = EXCLUDED.bio,
    verified_badge = EXCLUDED.verified_badge,
    verification_uploaded = EXCLUDED.verification_uploaded,
    updated_at = now();
END;
$$;

-- Seed Pundit: Acharya Venkatesh Trivedi
DO $$
DECLARE
  v_user_id UUID;
  v_phone_exists BOOLEAN;
BEGIN
  -- Check if phone already registered
  SELECT EXISTS(SELECT 1 FROM public.website_store_users WHERE phone_number = '+919000000009') INTO v_phone_exists;
  
  IF NOT v_phone_exists THEN
    INSERT INTO public.website_store_users (
      id,
      full_name,
      email,
      phone_number,
      password_hash,
      is_pundit,
      affiliate_code,
      affiliate_status,
      affiliate_joined_at,
      pundit_profile
    ) VALUES (
      '3cf73291-5ea7-46b6-96c6-00cb1e0440cb',
      'Acharya Venkatesh Trivedi',
      'acharyavenkateshtrivedi@mantrapuja.com',
      '+919000000009',
      '9c25ac6b65a51dfdcc7a1045ce5ac0166fb6393e034166be2b9828f8a031bc98',
      true,
      'MP200948',
      'active',
      now(),
      '{"fullName":"Acharya Venkatesh Trivedi","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit","Gujarati"],"gotra":"Vishwamitra","experience":15,"location":{"city":"Somnath","state":"Gujarat","latitude":20.888,"longitude":70.4012},"serviceModes":["Temple","Home Visits"],"templeName":"Somnath Jyotirlinga Temple","serviceArea":"Somnath","ritualExpertise":["🕉 Rudrabhishek","🔥 Havan","🏠 Vastu Shanti"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Venkatesh%20Trivedi","bio":"Acharya Venkatesh Trivedi specializes in traditional Rudraksha energization and sacred Shiva-Parvati worship rituals performed according to authentic Vedic scriptures.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB
    ) RETURNING id INTO v_user_id;

    -- Add wallet
    INSERT INTO public.affiliate_wallets (user_id, total_earned, pending_earnings, approved_earnings, withdrawn_amount)
    VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    SELECT id INTO v_user_id FROM public.website_store_users WHERE phone_number = '+919000000009';
    UPDATE public.website_store_users
    SET 
      is_pundit = true,
      pundit_profile = '{"fullName":"Acharya Venkatesh Trivedi","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit","Gujarati"],"gotra":"Vishwamitra","experience":15,"location":{"city":"Somnath","state":"Gujarat","latitude":20.888,"longitude":70.4012},"serviceModes":["Temple","Home Visits"],"templeName":"Somnath Jyotirlinga Temple","serviceArea":"Somnath","ritualExpertise":["🕉 Rudrabhishek","🔥 Havan","🏠 Vastu Shanti"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Venkatesh%20Trivedi","bio":"Acharya Venkatesh Trivedi specializes in traditional Rudraksha energization and sacred Shiva-Parvati worship rituals performed according to authentic Vedic scriptures.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB,
      full_name = 'Acharya Venkatesh Trivedi'
    WHERE id = v_user_id;
  END IF;

  -- Insert/update Pundit directory tracker table
  INSERT INTO public.website_store_pundits (
    user_id,
    full_name,
    spiritual_title,
    languages,
    gotra,
    experience_years,
    city,
    state,
    latitude,
    longitude,
    service_modes,
    temple_name,
    service_area,
    specialties,
    profile_photo,
    bio,
    verified_badge,
    verification_uploaded,
    onboarded_at
  ) VALUES (
    v_user_id,
    'Acharya Venkatesh Trivedi',
    'Acharya',
    ARRAY['Hindi', 'Sanskrit', 'Gujarati'],
    'Vishwamitra',
    15,
    'Somnath',
    'Gujarat',
    20.888,
    70.4012,
    ARRAY['Temple', 'Home Visits'],
    'Somnath Jyotirlinga Temple',
    'Somnath',
    ARRAY['🕉 Rudrabhishek', '🔥 Havan', '🏠 Vastu Shanti'],
    'https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Venkatesh%20Trivedi',
    'Acharya Venkatesh Trivedi specializes in traditional Rudraksha energization and sacred Shiva-Parvati worship rituals performed according to authentic Vedic scriptures.',
    'Verified Pandit',
    true,
    now()
  ) ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    spiritual_title = EXCLUDED.spiritual_title,
    languages = EXCLUDED.languages,
    gotra = EXCLUDED.gotra,
    experience_years = EXCLUDED.experience_years,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    service_modes = EXCLUDED.service_modes,
    temple_name = EXCLUDED.temple_name,
    service_area = EXCLUDED.service_area,
    specialties = EXCLUDED.specialties,
    profile_photo = EXCLUDED.profile_photo,
    bio = EXCLUDED.bio,
    verified_badge = EXCLUDED.verified_badge,
    verification_uploaded = EXCLUDED.verification_uploaded,
    updated_at = now();
END;
$$;

-- Seed Pundit: Acharya Adwait Raman
DO $$
DECLARE
  v_user_id UUID;
  v_phone_exists BOOLEAN;
BEGIN
  -- Check if phone already registered
  SELECT EXISTS(SELECT 1 FROM public.website_store_users WHERE phone_number = '+919000000010') INTO v_phone_exists;
  
  IF NOT v_phone_exists THEN
    INSERT INTO public.website_store_users (
      id,
      full_name,
      email,
      phone_number,
      password_hash,
      is_pundit,
      affiliate_code,
      affiliate_status,
      affiliate_joined_at,
      pundit_profile
    ) VALUES (
      'af5a11fe-b0fc-440a-8cfe-991f58a84d4b',
      'Acharya Adwait Raman',
      'acharyaadwaitraman@mantrapuja.com',
      '+919000000010',
      '9c25ac6b65a51dfdcc7a1045ce5ac0166fb6393e034166be2b9828f8a031bc98',
      true,
      'MPC38C3C',
      'active',
      now(),
      '{"fullName":"Acharya Adwait Raman","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit","English"],"gotra":"Bharadwaj","experience":19,"location":{"city":"Rishikesh","state":"Uttarakhand","latitude":30.0869,"longitude":78.2676},"serviceModes":["Temple","Home Visits","Online"],"templeName":"Parmarth Niketan Temple","serviceArea":"Rishikesh","ritualExpertise":["🕉 Rudrabhishek","🔥 Havan","🕉 Shanti Path"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Adwait%20Raman","bio":"Acharya Adwait Raman specializes in advanced Vedic rituals, Rudraksha energization, and sacred spiritual ceremonies rooted in traditional practices.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB
    ) RETURNING id INTO v_user_id;

    -- Add wallet
    INSERT INTO public.affiliate_wallets (user_id, total_earned, pending_earnings, approved_earnings, withdrawn_amount)
    VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    SELECT id INTO v_user_id FROM public.website_store_users WHERE phone_number = '+919000000010';
    UPDATE public.website_store_users
    SET 
      is_pundit = true,
      pundit_profile = '{"fullName":"Acharya Adwait Raman","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit","English"],"gotra":"Bharadwaj","experience":19,"location":{"city":"Rishikesh","state":"Uttarakhand","latitude":30.0869,"longitude":78.2676},"serviceModes":["Temple","Home Visits","Online"],"templeName":"Parmarth Niketan Temple","serviceArea":"Rishikesh","ritualExpertise":["🕉 Rudrabhishek","🔥 Havan","🕉 Shanti Path"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Adwait%20Raman","bio":"Acharya Adwait Raman specializes in advanced Vedic rituals, Rudraksha energization, and sacred spiritual ceremonies rooted in traditional practices.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB,
      full_name = 'Acharya Adwait Raman'
    WHERE id = v_user_id;
  END IF;

  -- Insert/update Pundit directory tracker table
  INSERT INTO public.website_store_pundits (
    user_id,
    full_name,
    spiritual_title,
    languages,
    gotra,
    experience_years,
    city,
    state,
    latitude,
    longitude,
    service_modes,
    temple_name,
    service_area,
    specialties,
    profile_photo,
    bio,
    verified_badge,
    verification_uploaded,
    onboarded_at
  ) VALUES (
    v_user_id,
    'Acharya Adwait Raman',
    'Acharya',
    ARRAY['Hindi', 'Sanskrit', 'English'],
    'Bharadwaj',
    19,
    'Rishikesh',
    'Uttarakhand',
    30.0869,
    78.2676,
    ARRAY['Temple', 'Home Visits', 'Online'],
    'Parmarth Niketan Temple',
    'Rishikesh',
    ARRAY['🕉 Rudrabhishek', '🔥 Havan', '🕉 Shanti Path'],
    'https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Adwait%20Raman',
    'Acharya Adwait Raman specializes in advanced Vedic rituals, Rudraksha energization, and sacred spiritual ceremonies rooted in traditional practices.',
    'Verified Pandit',
    true,
    now()
  ) ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    spiritual_title = EXCLUDED.spiritual_title,
    languages = EXCLUDED.languages,
    gotra = EXCLUDED.gotra,
    experience_years = EXCLUDED.experience_years,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    service_modes = EXCLUDED.service_modes,
    temple_name = EXCLUDED.temple_name,
    service_area = EXCLUDED.service_area,
    specialties = EXCLUDED.specialties,
    profile_photo = EXCLUDED.profile_photo,
    bio = EXCLUDED.bio,
    verified_badge = EXCLUDED.verified_badge,
    verification_uploaded = EXCLUDED.verification_uploaded,
    updated_at = now();
END;
$$;

-- Seed Pundit: Acharya Arvind Pathak
DO $$
DECLARE
  v_user_id UUID;
  v_phone_exists BOOLEAN;
BEGIN
  -- Check if phone already registered
  SELECT EXISTS(SELECT 1 FROM public.website_store_users WHERE phone_number = '+919000000011') INTO v_phone_exists;
  
  IF NOT v_phone_exists THEN
    INSERT INTO public.website_store_users (
      id,
      full_name,
      email,
      phone_number,
      password_hash,
      is_pundit,
      affiliate_code,
      affiliate_status,
      affiliate_joined_at,
      pundit_profile
    ) VALUES (
      '8406eb40-fd79-4fdf-8204-a8e9ca4e3ea1',
      'Acharya Arvind Pathak',
      'acharyaarvindpathak@mantrapuja.com',
      '+919000000011',
      '9c25ac6b65a51dfdcc7a1045ce5ac0166fb6393e034166be2b9828f8a031bc98',
      true,
      'MP6FC624',
      'active',
      now(),
      '{"fullName":"Acharya Arvind Pathak","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit"],"gotra":"Kashyap","experience":13,"location":{"city":"Varanasi","state":"Uttar Pradesh","latitude":25.3195,"longitude":82.971},"serviceModes":["Home Visits","Online"],"templeName":"","serviceArea":"Varanasi","ritualExpertise":["🔥 Havan","💰 Lakshmi Puja","🏠 Vastu Shanti"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Arvind%20Pathak","bio":"Acharya Arvind Pathak specializes in crystal activation rituals and prosperity-focused Vedic energization ceremonies.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB
    ) RETURNING id INTO v_user_id;

    -- Add wallet
    INSERT INTO public.affiliate_wallets (user_id, total_earned, pending_earnings, approved_earnings, withdrawn_amount)
    VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    SELECT id INTO v_user_id FROM public.website_store_users WHERE phone_number = '+919000000011';
    UPDATE public.website_store_users
    SET 
      is_pundit = true,
      pundit_profile = '{"fullName":"Acharya Arvind Pathak","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit"],"gotra":"Kashyap","experience":13,"location":{"city":"Varanasi","state":"Uttar Pradesh","latitude":25.3195,"longitude":82.971},"serviceModes":["Home Visits","Online"],"templeName":"","serviceArea":"Varanasi","ritualExpertise":["🔥 Havan","💰 Lakshmi Puja","🏠 Vastu Shanti"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Arvind%20Pathak","bio":"Acharya Arvind Pathak specializes in crystal activation rituals and prosperity-focused Vedic energization ceremonies.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB,
      full_name = 'Acharya Arvind Pathak'
    WHERE id = v_user_id;
  END IF;

  -- Insert/update Pundit directory tracker table
  INSERT INTO public.website_store_pundits (
    user_id,
    full_name,
    spiritual_title,
    languages,
    gotra,
    experience_years,
    city,
    state,
    latitude,
    longitude,
    service_modes,
    temple_name,
    service_area,
    specialties,
    profile_photo,
    bio,
    verified_badge,
    verification_uploaded,
    onboarded_at
  ) VALUES (
    v_user_id,
    'Acharya Arvind Pathak',
    'Acharya',
    ARRAY['Hindi', 'Sanskrit'],
    'Kashyap',
    13,
    'Varanasi',
    'Uttar Pradesh',
    25.3195,
    82.971,
    ARRAY['Home Visits', 'Online'],
    NULL,
    'Varanasi',
    ARRAY['🔥 Havan', '💰 Lakshmi Puja', '🏠 Vastu Shanti'],
    'https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Arvind%20Pathak',
    'Acharya Arvind Pathak specializes in crystal activation rituals and prosperity-focused Vedic energization ceremonies.',
    'Verified Pandit',
    true,
    now()
  ) ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    spiritual_title = EXCLUDED.spiritual_title,
    languages = EXCLUDED.languages,
    gotra = EXCLUDED.gotra,
    experience_years = EXCLUDED.experience_years,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    service_modes = EXCLUDED.service_modes,
    temple_name = EXCLUDED.temple_name,
    service_area = EXCLUDED.service_area,
    specialties = EXCLUDED.specialties,
    profile_photo = EXCLUDED.profile_photo,
    bio = EXCLUDED.bio,
    verified_badge = EXCLUDED.verified_badge,
    verification_uploaded = EXCLUDED.verification_uploaded,
    updated_at = now();
END;
$$;

-- Seed Pundit: Acharya Rudransh Pathak
DO $$
DECLARE
  v_user_id UUID;
  v_phone_exists BOOLEAN;
BEGIN
  -- Check if phone already registered
  SELECT EXISTS(SELECT 1 FROM public.website_store_users WHERE phone_number = '+919000000012') INTO v_phone_exists;
  
  IF NOT v_phone_exists THEN
    INSERT INTO public.website_store_users (
      id,
      full_name,
      email,
      phone_number,
      password_hash,
      is_pundit,
      affiliate_code,
      affiliate_status,
      affiliate_joined_at,
      pundit_profile
    ) VALUES (
      '51a288a2-b7aa-4436-aa8a-844e56e05dd7',
      'Acharya Rudransh Pathak',
      'acharyarudranshpathak@mantrapuja.com',
      '+919000000012',
      '9c25ac6b65a51dfdcc7a1045ce5ac0166fb6393e034166be2b9828f8a031bc98',
      true,
      'MP1DD2B3',
      'active',
      now(),
      '{"fullName":"Acharya Rudransh Pathak","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit"],"gotra":"Vashishtha","experience":11,"location":{"city":"Varanasi","state":"Uttar Pradesh","latitude":25.3205,"longitude":82.9725},"serviceModes":["Temple","Home Visits"],"templeName":"Durga Kund Mandir","serviceArea":"Varanasi","ritualExpertise":["🔥 Havan","🕉 Shanti Path","🌞 Navgraha Puja"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Rudransh%20Pathak","bio":"Acharya Rudransh Pathak is highly experienced in Durga worship, Navarna mantra rituals, and authentic Vedic Rudraksha energization ceremonies.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB
    ) RETURNING id INTO v_user_id;

    -- Add wallet
    INSERT INTO public.affiliate_wallets (user_id, total_earned, pending_earnings, approved_earnings, withdrawn_amount)
    VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    SELECT id INTO v_user_id FROM public.website_store_users WHERE phone_number = '+919000000012';
    UPDATE public.website_store_users
    SET 
      is_pundit = true,
      pundit_profile = '{"fullName":"Acharya Rudransh Pathak","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit"],"gotra":"Vashishtha","experience":11,"location":{"city":"Varanasi","state":"Uttar Pradesh","latitude":25.3205,"longitude":82.9725},"serviceModes":["Temple","Home Visits"],"templeName":"Durga Kund Mandir","serviceArea":"Varanasi","ritualExpertise":["🔥 Havan","🕉 Shanti Path","🌞 Navgraha Puja"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Rudransh%20Pathak","bio":"Acharya Rudransh Pathak is highly experienced in Durga worship, Navarna mantra rituals, and authentic Vedic Rudraksha energization ceremonies.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB,
      full_name = 'Acharya Rudransh Pathak'
    WHERE id = v_user_id;
  END IF;

  -- Insert/update Pundit directory tracker table
  INSERT INTO public.website_store_pundits (
    user_id,
    full_name,
    spiritual_title,
    languages,
    gotra,
    experience_years,
    city,
    state,
    latitude,
    longitude,
    service_modes,
    temple_name,
    service_area,
    specialties,
    profile_photo,
    bio,
    verified_badge,
    verification_uploaded,
    onboarded_at
  ) VALUES (
    v_user_id,
    'Acharya Rudransh Pathak',
    'Acharya',
    ARRAY['Hindi', 'Sanskrit'],
    'Vashishtha',
    11,
    'Varanasi',
    'Uttar Pradesh',
    25.3205,
    82.9725,
    ARRAY['Temple', 'Home Visits'],
    'Durga Kund Mandir',
    'Varanasi',
    ARRAY['🔥 Havan', '🕉 Shanti Path', '🌞 Navgraha Puja'],
    'https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Rudransh%20Pathak',
    'Acharya Rudransh Pathak is highly experienced in Durga worship, Navarna mantra rituals, and authentic Vedic Rudraksha energization ceremonies.',
    'Verified Pandit',
    true,
    now()
  ) ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    spiritual_title = EXCLUDED.spiritual_title,
    languages = EXCLUDED.languages,
    gotra = EXCLUDED.gotra,
    experience_years = EXCLUDED.experience_years,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    service_modes = EXCLUDED.service_modes,
    temple_name = EXCLUDED.temple_name,
    service_area = EXCLUDED.service_area,
    specialties = EXCLUDED.specialties,
    profile_photo = EXCLUDED.profile_photo,
    bio = EXCLUDED.bio,
    verified_badge = EXCLUDED.verified_badge,
    verification_uploaded = EXCLUDED.verification_uploaded,
    updated_at = now();
END;
$$;

-- Seed Pundit: Acharya Veerendra Joshi
DO $$
DECLARE
  v_user_id UUID;
  v_phone_exists BOOLEAN;
BEGIN
  -- Check if phone already registered
  SELECT EXISTS(SELECT 1 FROM public.website_store_users WHERE phone_number = '+919000000013') INTO v_phone_exists;
  
  IF NOT v_phone_exists THEN
    INSERT INTO public.website_store_users (
      id,
      full_name,
      email,
      phone_number,
      password_hash,
      is_pundit,
      affiliate_code,
      affiliate_status,
      affiliate_joined_at,
      pundit_profile
    ) VALUES (
      '5577676d-495f-4cd5-800f-f65f04892586',
      'Acharya Veerendra Joshi',
      'acharyaveerendrajoshi@mantrapuja.com',
      '+919000000013',
      '9c25ac6b65a51dfdcc7a1045ce5ac0166fb6393e034166be2b9828f8a031bc98',
      true,
      'MP67706C',
      'active',
      now(),
      '{"fullName":"Acharya Veerendra Joshi","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit","Marathi"],"gotra":"Gautam","experience":21,"location":{"city":"Nashik","state":"Maharashtra","latitude":19.9975,"longitude":73.7898},"serviceModes":["Temple","Home Visits","Online"],"templeName":"Trimbakeshwar Shiva Temple","serviceArea":"Nashik","ritualExpertise":["🔥 Havan","🕉 Shanti Path","🕉 Rudrabhishek"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Veerendra%20Joshi","bio":"Acharya Veerendra Joshi specializes in Hanuman worship, Rudra rituals, and powerful Vedic energization ceremonies performed according to sacred traditions.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB
    ) RETURNING id INTO v_user_id;

    -- Add wallet
    INSERT INTO public.affiliate_wallets (user_id, total_earned, pending_earnings, approved_earnings, withdrawn_amount)
    VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    SELECT id INTO v_user_id FROM public.website_store_users WHERE phone_number = '+919000000013';
    UPDATE public.website_store_users
    SET 
      is_pundit = true,
      pundit_profile = '{"fullName":"Acharya Veerendra Joshi","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit","Marathi"],"gotra":"Gautam","experience":21,"location":{"city":"Nashik","state":"Maharashtra","latitude":19.9975,"longitude":73.7898},"serviceModes":["Temple","Home Visits","Online"],"templeName":"Trimbakeshwar Shiva Temple","serviceArea":"Nashik","ritualExpertise":["🔥 Havan","🕉 Shanti Path","🕉 Rudrabhishek"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Veerendra%20Joshi","bio":"Acharya Veerendra Joshi specializes in Hanuman worship, Rudra rituals, and powerful Vedic energization ceremonies performed according to sacred traditions.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB,
      full_name = 'Acharya Veerendra Joshi'
    WHERE id = v_user_id;
  END IF;

  -- Insert/update Pundit directory tracker table
  INSERT INTO public.website_store_pundits (
    user_id,
    full_name,
    spiritual_title,
    languages,
    gotra,
    experience_years,
    city,
    state,
    latitude,
    longitude,
    service_modes,
    temple_name,
    service_area,
    specialties,
    profile_photo,
    bio,
    verified_badge,
    verification_uploaded,
    onboarded_at
  ) VALUES (
    v_user_id,
    'Acharya Veerendra Joshi',
    'Acharya',
    ARRAY['Hindi', 'Sanskrit', 'Marathi'],
    'Gautam',
    21,
    'Nashik',
    'Maharashtra',
    19.9975,
    73.7898,
    ARRAY['Temple', 'Home Visits', 'Online'],
    'Trimbakeshwar Shiva Temple',
    'Nashik',
    ARRAY['🔥 Havan', '🕉 Shanti Path', '🕉 Rudrabhishek'],
    'https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Veerendra%20Joshi',
    'Acharya Veerendra Joshi specializes in Hanuman worship, Rudra rituals, and powerful Vedic energization ceremonies performed according to sacred traditions.',
    'Verified Pandit',
    true,
    now()
  ) ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    spiritual_title = EXCLUDED.spiritual_title,
    languages = EXCLUDED.languages,
    gotra = EXCLUDED.gotra,
    experience_years = EXCLUDED.experience_years,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    service_modes = EXCLUDED.service_modes,
    temple_name = EXCLUDED.temple_name,
    service_area = EXCLUDED.service_area,
    specialties = EXCLUDED.specialties,
    profile_photo = EXCLUDED.profile_photo,
    bio = EXCLUDED.bio,
    verified_badge = EXCLUDED.verified_badge,
    verification_uploaded = EXCLUDED.verification_uploaded,
    updated_at = now();
END;
$$;

-- Seed Pundit: Acharya Suryakant Vyas
DO $$
DECLARE
  v_user_id UUID;
  v_phone_exists BOOLEAN;
BEGIN
  -- Check if phone already registered
  SELECT EXISTS(SELECT 1 FROM public.website_store_users WHERE phone_number = '+919000000014') INTO v_phone_exists;
  
  IF NOT v_phone_exists THEN
    INSERT INTO public.website_store_users (
      id,
      full_name,
      email,
      phone_number,
      password_hash,
      is_pundit,
      affiliate_code,
      affiliate_status,
      affiliate_joined_at,
      pundit_profile
    ) VALUES (
      '7da1e7c8-741a-4cb6-aff4-bb22b5a09412',
      'Acharya Suryakant Vyas',
      'acharyasuryakantvyas@mantrapuja.com',
      '+919000000014',
      '9c25ac6b65a51dfdcc7a1045ce5ac0166fb6393e034166be2b9828f8a031bc98',
      true,
      'MPB02270',
      'active',
      now(),
      '{"fullName":"Acharya Suryakant Vyas","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit","Gujarati"],"gotra":"Atri","experience":25,"location":{"city":"Dwarka","state":"Gujarat","latitude":22.2442,"longitude":68.9685},"serviceModes":["Temple","Home Visits"],"templeName":"Dwarkadhish Temple","serviceArea":"Dwarka","ritualExpertise":["🔥 Havan","🌞 Navgraha Puja","🪔 Satyanarayan Katha"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Suryakant%20Vyas","bio":"Acharya Suryakant Vyas specializes in Surya worship, Aditya Hridayam recitations, and authentic Vedic Rudraksha energization ceremonies.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB
    ) RETURNING id INTO v_user_id;

    -- Add wallet
    INSERT INTO public.affiliate_wallets (user_id, total_earned, pending_earnings, approved_earnings, withdrawn_amount)
    VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    SELECT id INTO v_user_id FROM public.website_store_users WHERE phone_number = '+919000000014';
    UPDATE public.website_store_users
    SET 
      is_pundit = true,
      pundit_profile = '{"fullName":"Acharya Suryakant Vyas","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit","Gujarati"],"gotra":"Atri","experience":25,"location":{"city":"Dwarka","state":"Gujarat","latitude":22.2442,"longitude":68.9685},"serviceModes":["Temple","Home Visits"],"templeName":"Dwarkadhish Temple","serviceArea":"Dwarka","ritualExpertise":["🔥 Havan","🌞 Navgraha Puja","🪔 Satyanarayan Katha"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Suryakant%20Vyas","bio":"Acharya Suryakant Vyas specializes in Surya worship, Aditya Hridayam recitations, and authentic Vedic Rudraksha energization ceremonies.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB,
      full_name = 'Acharya Suryakant Vyas'
    WHERE id = v_user_id;
  END IF;

  -- Insert/update Pundit directory tracker table
  INSERT INTO public.website_store_pundits (
    user_id,
    full_name,
    spiritual_title,
    languages,
    gotra,
    experience_years,
    city,
    state,
    latitude,
    longitude,
    service_modes,
    temple_name,
    service_area,
    specialties,
    profile_photo,
    bio,
    verified_badge,
    verification_uploaded,
    onboarded_at
  ) VALUES (
    v_user_id,
    'Acharya Suryakant Vyas',
    'Acharya',
    ARRAY['Hindi', 'Sanskrit', 'Gujarati'],
    'Atri',
    25,
    'Dwarka',
    'Gujarat',
    22.2442,
    68.9685,
    ARRAY['Temple', 'Home Visits'],
    'Dwarkadhish Temple',
    'Dwarka',
    ARRAY['🔥 Havan', '🌞 Navgraha Puja', '🪔 Satyanarayan Katha'],
    'https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Suryakant%20Vyas',
    'Acharya Suryakant Vyas specializes in Surya worship, Aditya Hridayam recitations, and authentic Vedic Rudraksha energization ceremonies.',
    'Verified Pandit',
    true,
    now()
  ) ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    spiritual_title = EXCLUDED.spiritual_title,
    languages = EXCLUDED.languages,
    gotra = EXCLUDED.gotra,
    experience_years = EXCLUDED.experience_years,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    service_modes = EXCLUDED.service_modes,
    temple_name = EXCLUDED.temple_name,
    service_area = EXCLUDED.service_area,
    specialties = EXCLUDED.specialties,
    profile_photo = EXCLUDED.profile_photo,
    bio = EXCLUDED.bio,
    verified_badge = EXCLUDED.verified_badge,
    verification_uploaded = EXCLUDED.verification_uploaded,
    updated_at = now();
END;
$$;

-- Seed Pundit: Acharya Shubhendra Sharma
DO $$
DECLARE
  v_user_id UUID;
  v_phone_exists BOOLEAN;
BEGIN
  -- Check if phone already registered
  SELECT EXISTS(SELECT 1 FROM public.website_store_users WHERE phone_number = '+919000000015') INTO v_phone_exists;
  
  IF NOT v_phone_exists THEN
    INSERT INTO public.website_store_users (
      id,
      full_name,
      email,
      phone_number,
      password_hash,
      is_pundit,
      affiliate_code,
      affiliate_status,
      affiliate_joined_at,
      pundit_profile
    ) VALUES (
      '8a7bdc6c-1ee1-462b-a10d-d193c93f18cc',
      'Acharya Shubhendra Sharma',
      'acharyashubhendrasharma@mantrapuja.com',
      '+919000000015',
      '9c25ac6b65a51dfdcc7a1045ce5ac0166fb6393e034166be2b9828f8a031bc98',
      true,
      'MPF10DD0',
      'active',
      now(),
      '{"fullName":"Acharya Shubhendra Sharma","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit","English"],"gotra":"Agastya","experience":14,"location":{"city":"Delhi","state":"Delhi","latitude":28.6139,"longitude":77.209},"serviceModes":["Home Visits","Online"],"templeName":"","serviceArea":"Delhi","ritualExpertise":["🏠 Vastu Shanti","🏡 Griha Pravesh","🔥 Havan"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Shubhendra%20Sharma","bio":"Acharya Shubhendra Sharma specializes in prosperity rituals, Vastu remedies, and sacred energy activation ceremonies for homes and businesses.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB
    ) RETURNING id INTO v_user_id;

    -- Add wallet
    INSERT INTO public.affiliate_wallets (user_id, total_earned, pending_earnings, approved_earnings, withdrawn_amount)
    VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    SELECT id INTO v_user_id FROM public.website_store_users WHERE phone_number = '+919000000015';
    UPDATE public.website_store_users
    SET 
      is_pundit = true,
      pundit_profile = '{"fullName":"Acharya Shubhendra Sharma","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit","English"],"gotra":"Agastya","experience":14,"location":{"city":"Delhi","state":"Delhi","latitude":28.6139,"longitude":77.209},"serviceModes":["Home Visits","Online"],"templeName":"","serviceArea":"Delhi","ritualExpertise":["🏠 Vastu Shanti","🏡 Griha Pravesh","🔥 Havan"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Shubhendra%20Sharma","bio":"Acharya Shubhendra Sharma specializes in prosperity rituals, Vastu remedies, and sacred energy activation ceremonies for homes and businesses.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB,
      full_name = 'Acharya Shubhendra Sharma'
    WHERE id = v_user_id;
  END IF;

  -- Insert/update Pundit directory tracker table
  INSERT INTO public.website_store_pundits (
    user_id,
    full_name,
    spiritual_title,
    languages,
    gotra,
    experience_years,
    city,
    state,
    latitude,
    longitude,
    service_modes,
    temple_name,
    service_area,
    specialties,
    profile_photo,
    bio,
    verified_badge,
    verification_uploaded,
    onboarded_at
  ) VALUES (
    v_user_id,
    'Acharya Shubhendra Sharma',
    'Acharya',
    ARRAY['Hindi', 'Sanskrit', 'English'],
    'Agastya',
    14,
    'Delhi',
    'Delhi',
    28.6139,
    77.209,
    ARRAY['Home Visits', 'Online'],
    NULL,
    'Delhi',
    ARRAY['🏠 Vastu Shanti', '🏡 Griha Pravesh', '🔥 Havan'],
    'https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Shubhendra%20Sharma',
    'Acharya Shubhendra Sharma specializes in prosperity rituals, Vastu remedies, and sacred energy activation ceremonies for homes and businesses.',
    'Verified Pandit',
    true,
    now()
  ) ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    spiritual_title = EXCLUDED.spiritual_title,
    languages = EXCLUDED.languages,
    gotra = EXCLUDED.gotra,
    experience_years = EXCLUDED.experience_years,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    service_modes = EXCLUDED.service_modes,
    temple_name = EXCLUDED.temple_name,
    service_area = EXCLUDED.service_area,
    specialties = EXCLUDED.specialties,
    profile_photo = EXCLUDED.profile_photo,
    bio = EXCLUDED.bio,
    verified_badge = EXCLUDED.verified_badge,
    verification_uploaded = EXCLUDED.verification_uploaded,
    updated_at = now();
END;
$$;

-- Seed Pundit: Acharya Vishwajeet Dwivedi
DO $$
DECLARE
  v_user_id UUID;
  v_phone_exists BOOLEAN;
BEGIN
  -- Check if phone already registered
  SELECT EXISTS(SELECT 1 FROM public.website_store_users WHERE phone_number = '+919000000016') INTO v_phone_exists;
  
  IF NOT v_phone_exists THEN
    INSERT INTO public.website_store_users (
      id,
      full_name,
      email,
      phone_number,
      password_hash,
      is_pundit,
      affiliate_code,
      affiliate_status,
      affiliate_joined_at,
      pundit_profile
    ) VALUES (
      'f073c97b-46de-4c17-a1fc-2eaef5fff512',
      'Acharya Vishwajeet Dwivedi',
      'acharyavishwajeetdwivedi@mantrapuja.com',
      '+919000000016',
      '9c25ac6b65a51dfdcc7a1045ce5ac0166fb6393e034166be2b9828f8a031bc98',
      true,
      'MPC274CD',
      'active',
      now(),
      '{"fullName":"Acharya Vishwajeet Dwivedi","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit"],"gotra":"Vatsa","experience":15,"location":{"city":"Varanasi","state":"Uttar Pradesh","latitude":25.3225,"longitude":82.9799},"serviceModes":["Temple","Home Visits"],"templeName":"Vishalakshi Temple","serviceArea":"Varanasi","ritualExpertise":["🔥 Havan","🌞 Navgraha Puja","🕉 Rudrabhishek"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Vishwajeet%20Dwivedi","bio":"Acharya Vishwajeet Dwivedi specializes in Ganapati rituals, Vedic mantra siddhi, and authentic Rudraksha energization ceremonies performed according to traditional scriptures.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB
    ) RETURNING id INTO v_user_id;

    -- Add wallet
    INSERT INTO public.affiliate_wallets (user_id, total_earned, pending_earnings, approved_earnings, withdrawn_amount)
    VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    SELECT id INTO v_user_id FROM public.website_store_users WHERE phone_number = '+919000000016';
    UPDATE public.website_store_users
    SET 
      is_pundit = true,
      pundit_profile = '{"fullName":"Acharya Vishwajeet Dwivedi","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit"],"gotra":"Vatsa","experience":15,"location":{"city":"Varanasi","state":"Uttar Pradesh","latitude":25.3225,"longitude":82.9799},"serviceModes":["Temple","Home Visits"],"templeName":"Vishalakshi Temple","serviceArea":"Varanasi","ritualExpertise":["🔥 Havan","🌞 Navgraha Puja","🕉 Rudrabhishek"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Vishwajeet%20Dwivedi","bio":"Acharya Vishwajeet Dwivedi specializes in Ganapati rituals, Vedic mantra siddhi, and authentic Rudraksha energization ceremonies performed according to traditional scriptures.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB,
      full_name = 'Acharya Vishwajeet Dwivedi'
    WHERE id = v_user_id;
  END IF;

  -- Insert/update Pundit directory tracker table
  INSERT INTO public.website_store_pundits (
    user_id,
    full_name,
    spiritual_title,
    languages,
    gotra,
    experience_years,
    city,
    state,
    latitude,
    longitude,
    service_modes,
    temple_name,
    service_area,
    specialties,
    profile_photo,
    bio,
    verified_badge,
    verification_uploaded,
    onboarded_at
  ) VALUES (
    v_user_id,
    'Acharya Vishwajeet Dwivedi',
    'Acharya',
    ARRAY['Hindi', 'Sanskrit'],
    'Vatsa',
    15,
    'Varanasi',
    'Uttar Pradesh',
    25.3225,
    82.9799,
    ARRAY['Temple', 'Home Visits'],
    'Vishalakshi Temple',
    'Varanasi',
    ARRAY['🔥 Havan', '🌞 Navgraha Puja', '🕉 Rudrabhishek'],
    'https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Vishwajeet%20Dwivedi',
    'Acharya Vishwajeet Dwivedi specializes in Ganapati rituals, Vedic mantra siddhi, and authentic Rudraksha energization ceremonies performed according to traditional scriptures.',
    'Verified Pandit',
    true,
    now()
  ) ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    spiritual_title = EXCLUDED.spiritual_title,
    languages = EXCLUDED.languages,
    gotra = EXCLUDED.gotra,
    experience_years = EXCLUDED.experience_years,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    service_modes = EXCLUDED.service_modes,
    temple_name = EXCLUDED.temple_name,
    service_area = EXCLUDED.service_area,
    specialties = EXCLUDED.specialties,
    profile_photo = EXCLUDED.profile_photo,
    bio = EXCLUDED.bio,
    verified_badge = EXCLUDED.verified_badge,
    verification_uploaded = EXCLUDED.verification_uploaded,
    updated_at = now();
END;
$$;

-- Seed Pundit: Acharya Somnath Shastri
DO $$
DECLARE
  v_user_id UUID;
  v_phone_exists BOOLEAN;
BEGIN
  -- Check if phone already registered
  SELECT EXISTS(SELECT 1 FROM public.website_store_users WHERE phone_number = '+919000000017') INTO v_phone_exists;
  
  IF NOT v_phone_exists THEN
    INSERT INTO public.website_store_users (
      id,
      full_name,
      email,
      phone_number,
      password_hash,
      is_pundit,
      affiliate_code,
      affiliate_status,
      affiliate_joined_at,
      pundit_profile
    ) VALUES (
      'faf1b162-41d8-4d66-b9c5-99eed4a2a815',
      'Acharya Somnath Shastri',
      'acharyasomnathshastri@mantrapuja.com',
      '+919000000017',
      '9c25ac6b65a51dfdcc7a1045ce5ac0166fb6393e034166be2b9828f8a031bc98',
      true,
      'MP52D1B3',
      'active',
      now(),
      '{"fullName":"Acharya Somnath Shastri","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit","English"],"gotra":"Angirasa","experience":20,"location":{"city":"Varanasi","state":"Uttar Pradesh","latitude":25.317,"longitude":82.973},"serviceModes":["Temple","Home Visits","Online"],"templeName":"Kashi Vishwanath Temple","serviceArea":"Varanasi","ritualExpertise":["🕉 Rudrabhishek","🔥 Havan","🕉 Shanti Path"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Somnath%20Shastri","bio":"Highly revered scholar from Varanasi conducting sacred Mahamrityunjaya and planetary homas.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB
    ) RETURNING id INTO v_user_id;

    -- Add wallet
    INSERT INTO public.affiliate_wallets (user_id, total_earned, pending_earnings, approved_earnings, withdrawn_amount)
    VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    SELECT id INTO v_user_id FROM public.website_store_users WHERE phone_number = '+919000000017';
    UPDATE public.website_store_users
    SET 
      is_pundit = true,
      pundit_profile = '{"fullName":"Acharya Somnath Shastri","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit","English"],"gotra":"Angirasa","experience":20,"location":{"city":"Varanasi","state":"Uttar Pradesh","latitude":25.317,"longitude":82.973},"serviceModes":["Temple","Home Visits","Online"],"templeName":"Kashi Vishwanath Temple","serviceArea":"Varanasi","ritualExpertise":["🕉 Rudrabhishek","🔥 Havan","🕉 Shanti Path"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Somnath%20Shastri","bio":"Highly revered scholar from Varanasi conducting sacred Mahamrityunjaya and planetary homas.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB,
      full_name = 'Acharya Somnath Shastri'
    WHERE id = v_user_id;
  END IF;

  -- Insert/update Pundit directory tracker table
  INSERT INTO public.website_store_pundits (
    user_id,
    full_name,
    spiritual_title,
    languages,
    gotra,
    experience_years,
    city,
    state,
    latitude,
    longitude,
    service_modes,
    temple_name,
    service_area,
    specialties,
    profile_photo,
    bio,
    verified_badge,
    verification_uploaded,
    onboarded_at
  ) VALUES (
    v_user_id,
    'Acharya Somnath Shastri',
    'Acharya',
    ARRAY['Hindi', 'Sanskrit', 'English'],
    'Angirasa',
    20,
    'Varanasi',
    'Uttar Pradesh',
    25.317,
    82.973,
    ARRAY['Temple', 'Home Visits', 'Online'],
    'Kashi Vishwanath Temple',
    'Varanasi',
    ARRAY['🕉 Rudrabhishek', '🔥 Havan', '🕉 Shanti Path'],
    'https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Somnath%20Shastri',
    'Highly revered scholar from Varanasi conducting sacred Mahamrityunjaya and planetary homas.',
    'Verified Pandit',
    true,
    now()
  ) ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    spiritual_title = EXCLUDED.spiritual_title,
    languages = EXCLUDED.languages,
    gotra = EXCLUDED.gotra,
    experience_years = EXCLUDED.experience_years,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    service_modes = EXCLUDED.service_modes,
    temple_name = EXCLUDED.temple_name,
    service_area = EXCLUDED.service_area,
    specialties = EXCLUDED.specialties,
    profile_photo = EXCLUDED.profile_photo,
    bio = EXCLUDED.bio,
    verified_badge = EXCLUDED.verified_badge,
    verification_uploaded = EXCLUDED.verification_uploaded,
    updated_at = now();
END;
$$;

-- Seed Pundit: Acharya Vidyadhar Dwivedi
DO $$
DECLARE
  v_user_id UUID;
  v_phone_exists BOOLEAN;
BEGIN
  -- Check if phone already registered
  SELECT EXISTS(SELECT 1 FROM public.website_store_users WHERE phone_number = '+919000000018') INTO v_phone_exists;
  
  IF NOT v_phone_exists THEN
    INSERT INTO public.website_store_users (
      id,
      full_name,
      email,
      phone_number,
      password_hash,
      is_pundit,
      affiliate_code,
      affiliate_status,
      affiliate_joined_at,
      pundit_profile
    ) VALUES (
      '53ad2078-82a6-4462-9eba-7295c517e8cc',
      'Acharya Vidyadhar Dwivedi',
      'acharyavidyadhardwivedi@mantrapuja.com',
      '+919000000018',
      '9c25ac6b65a51dfdcc7a1045ce5ac0166fb6393e034166be2b9828f8a031bc98',
      true,
      'MP60E3C9',
      'active',
      now(),
      '{"fullName":"Acharya Vidyadhar Dwivedi","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit"],"gotra":"Vishwamitra","experience":14,"location":{"city":"Varanasi","state":"Uttar Pradesh","latitude":25.3185,"longitude":82.975},"serviceModes":["Home Visits","Online"],"templeName":"","serviceArea":"Varanasi","ritualExpertise":["💰 Lakshmi Puja","🔥 Havan","🪔 Satyanarayan Katha"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Vidyadhar%20Dwivedi","bio":"Expert scholar from Shri Jagannath Sanskrit Vishvavidyalaya specializing in Lakshmi rituals.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB
    ) RETURNING id INTO v_user_id;

    -- Add wallet
    INSERT INTO public.affiliate_wallets (user_id, total_earned, pending_earnings, approved_earnings, withdrawn_amount)
    VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    SELECT id INTO v_user_id FROM public.website_store_users WHERE phone_number = '+919000000018';
    UPDATE public.website_store_users
    SET 
      is_pundit = true,
      pundit_profile = '{"fullName":"Acharya Vidyadhar Dwivedi","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit"],"gotra":"Vishwamitra","experience":14,"location":{"city":"Varanasi","state":"Uttar Pradesh","latitude":25.3185,"longitude":82.975},"serviceModes":["Home Visits","Online"],"templeName":"","serviceArea":"Varanasi","ritualExpertise":["💰 Lakshmi Puja","🔥 Havan","🪔 Satyanarayan Katha"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Vidyadhar%20Dwivedi","bio":"Expert scholar from Shri Jagannath Sanskrit Vishvavidyalaya specializing in Lakshmi rituals.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB,
      full_name = 'Acharya Vidyadhar Dwivedi'
    WHERE id = v_user_id;
  END IF;

  -- Insert/update Pundit directory tracker table
  INSERT INTO public.website_store_pundits (
    user_id,
    full_name,
    spiritual_title,
    languages,
    gotra,
    experience_years,
    city,
    state,
    latitude,
    longitude,
    service_modes,
    temple_name,
    service_area,
    specialties,
    profile_photo,
    bio,
    verified_badge,
    verification_uploaded,
    onboarded_at
  ) VALUES (
    v_user_id,
    'Acharya Vidyadhar Dwivedi',
    'Acharya',
    ARRAY['Hindi', 'Sanskrit'],
    'Vishwamitra',
    14,
    'Varanasi',
    'Uttar Pradesh',
    25.3185,
    82.975,
    ARRAY['Home Visits', 'Online'],
    NULL,
    'Varanasi',
    ARRAY['💰 Lakshmi Puja', '🔥 Havan', '🪔 Satyanarayan Katha'],
    'https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Vidyadhar%20Dwivedi',
    'Expert scholar from Shri Jagannath Sanskrit Vishvavidyalaya specializing in Lakshmi rituals.',
    'Verified Pandit',
    true,
    now()
  ) ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    spiritual_title = EXCLUDED.spiritual_title,
    languages = EXCLUDED.languages,
    gotra = EXCLUDED.gotra,
    experience_years = EXCLUDED.experience_years,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    service_modes = EXCLUDED.service_modes,
    temple_name = EXCLUDED.temple_name,
    service_area = EXCLUDED.service_area,
    specialties = EXCLUDED.specialties,
    profile_photo = EXCLUDED.profile_photo,
    bio = EXCLUDED.bio,
    verified_badge = EXCLUDED.verified_badge,
    verification_uploaded = EXCLUDED.verification_uploaded,
    updated_at = now();
END;
$$;

-- Seed Pundit: Pandit Ramakant Joshi
DO $$
DECLARE
  v_user_id UUID;
  v_phone_exists BOOLEAN;
BEGIN
  -- Check if phone already registered
  SELECT EXISTS(SELECT 1 FROM public.website_store_users WHERE phone_number = '+919000000019') INTO v_phone_exists;
  
  IF NOT v_phone_exists THEN
    INSERT INTO public.website_store_users (
      id,
      full_name,
      email,
      phone_number,
      password_hash,
      is_pundit,
      affiliate_code,
      affiliate_status,
      affiliate_joined_at,
      pundit_profile
    ) VALUES (
      '98c6097b-7b04-442a-8d7c-1bdec85528e3',
      'Pandit Ramakant Joshi',
      'panditramakantjoshi@mantrapuja.com',
      '+919000000019',
      '9c25ac6b65a51dfdcc7a1045ce5ac0166fb6393e034166be2b9828f8a031bc98',
      true,
      'MPD2CD94',
      'active',
      now(),
      '{"fullName":"Pandit Ramakant Joshi","spiritualTitle":"Pandit Ji","languages":["Hindi","Sanskrit"],"gotra":"Bharadwaj","experience":12,"location":{"city":"Rishikesh","state":"Uttarakhand","latitude":30.088,"longitude":78.269},"serviceModes":["Home Visits","Online"],"templeName":"","serviceArea":"Rishikesh","ritualExpertise":["🪔 Satyanarayan Katha","🏡 Griha Pravesh","🔥 Havan"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Pandit%20Ramakant%20Joshi","bio":"A traditional Uttarakhand Pandit specializing in Vishnu Stotras and monthly household vrat ceremonies.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB
    ) RETURNING id INTO v_user_id;

    -- Add wallet
    INSERT INTO public.affiliate_wallets (user_id, total_earned, pending_earnings, approved_earnings, withdrawn_amount)
    VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    SELECT id INTO v_user_id FROM public.website_store_users WHERE phone_number = '+919000000019';
    UPDATE public.website_store_users
    SET 
      is_pundit = true,
      pundit_profile = '{"fullName":"Pandit Ramakant Joshi","spiritualTitle":"Pandit Ji","languages":["Hindi","Sanskrit"],"gotra":"Bharadwaj","experience":12,"location":{"city":"Rishikesh","state":"Uttarakhand","latitude":30.088,"longitude":78.269},"serviceModes":["Home Visits","Online"],"templeName":"","serviceArea":"Rishikesh","ritualExpertise":["🪔 Satyanarayan Katha","🏡 Griha Pravesh","🔥 Havan"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Pandit%20Ramakant%20Joshi","bio":"A traditional Uttarakhand Pandit specializing in Vishnu Stotras and monthly household vrat ceremonies.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB,
      full_name = 'Pandit Ramakant Joshi'
    WHERE id = v_user_id;
  END IF;

  -- Insert/update Pundit directory tracker table
  INSERT INTO public.website_store_pundits (
    user_id,
    full_name,
    spiritual_title,
    languages,
    gotra,
    experience_years,
    city,
    state,
    latitude,
    longitude,
    service_modes,
    temple_name,
    service_area,
    specialties,
    profile_photo,
    bio,
    verified_badge,
    verification_uploaded,
    onboarded_at
  ) VALUES (
    v_user_id,
    'Pandit Ramakant Joshi',
    'Pandit Ji',
    ARRAY['Hindi', 'Sanskrit'],
    'Bharadwaj',
    12,
    'Rishikesh',
    'Uttarakhand',
    30.088,
    78.269,
    ARRAY['Home Visits', 'Online'],
    NULL,
    'Rishikesh',
    ARRAY['🪔 Satyanarayan Katha', '🏡 Griha Pravesh', '🔥 Havan'],
    'https://api.dicebear.com/7.x/avataaars/png?seed=Pandit%20Ramakant%20Joshi',
    'A traditional Uttarakhand Pandit specializing in Vishnu Stotras and monthly household vrat ceremonies.',
    'Verified Pandit',
    true,
    now()
  ) ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    spiritual_title = EXCLUDED.spiritual_title,
    languages = EXCLUDED.languages,
    gotra = EXCLUDED.gotra,
    experience_years = EXCLUDED.experience_years,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    service_modes = EXCLUDED.service_modes,
    temple_name = EXCLUDED.temple_name,
    service_area = EXCLUDED.service_area,
    specialties = EXCLUDED.specialties,
    profile_photo = EXCLUDED.profile_photo,
    bio = EXCLUDED.bio,
    verified_badge = EXCLUDED.verified_badge,
    verification_uploaded = EXCLUDED.verification_uploaded,
    updated_at = now();
END;
$$;

-- Seed Pundit: Acharya Rajesh Shastri
DO $$
DECLARE
  v_user_id UUID;
  v_phone_exists BOOLEAN;
BEGIN
  -- Check if phone already registered
  SELECT EXISTS(SELECT 1 FROM public.website_store_users WHERE phone_number = '+919000000020') INTO v_phone_exists;
  
  IF NOT v_phone_exists THEN
    INSERT INTO public.website_store_users (
      id,
      full_name,
      email,
      phone_number,
      password_hash,
      is_pundit,
      affiliate_code,
      affiliate_status,
      affiliate_joined_at,
      pundit_profile
    ) VALUES (
      '84f07633-f2ce-4a8f-84f4-99168e25c223',
      'Acharya Rajesh Shastri',
      'acharyarajeshshastri@mantrapuja.com',
      '+919000000020',
      '9c25ac6b65a51dfdcc7a1045ce5ac0166fb6393e034166be2b9828f8a031bc98',
      true,
      'MP6D5786',
      'active',
      now(),
      '{"fullName":"Acharya Rajesh Shastri","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit","English"],"gotra":"Kashyap","experience":15,"location":{"city":"Varanasi","state":"Uttar Pradesh","latitude":25.319,"longitude":82.976},"serviceModes":["Temple","Home Visits","Online"],"templeName":"Kashi Vishwanath Temple","serviceArea":"Varanasi","ritualExpertise":["🕉 Rudrabhishek","🔥 Havan","🏡 Griha Pravesh"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Rajesh%20Shastri","bio":"Highly trained scholar from Banaras Hindu University specializing in Rigveda rituals.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB
    ) RETURNING id INTO v_user_id;

    -- Add wallet
    INSERT INTO public.affiliate_wallets (user_id, total_earned, pending_earnings, approved_earnings, withdrawn_amount)
    VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    SELECT id INTO v_user_id FROM public.website_store_users WHERE phone_number = '+919000000020';
    UPDATE public.website_store_users
    SET 
      is_pundit = true,
      pundit_profile = '{"fullName":"Acharya Rajesh Shastri","spiritualTitle":"Acharya","languages":["Hindi","Sanskrit","English"],"gotra":"Kashyap","experience":15,"location":{"city":"Varanasi","state":"Uttar Pradesh","latitude":25.319,"longitude":82.976},"serviceModes":["Temple","Home Visits","Online"],"templeName":"Kashi Vishwanath Temple","serviceArea":"Varanasi","ritualExpertise":["🕉 Rudrabhishek","🔥 Havan","🏡 Griha Pravesh"],"profilePhoto":"https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Rajesh%20Shastri","bio":"Highly trained scholar from Banaras Hindu University specializing in Rigveda rituals.","verificationUploaded":true,"verifiedBadge":"Verified Pandit","onboardedAt":"2026-06-23T08:39:23.838Z"}'::JSONB,
      full_name = 'Acharya Rajesh Shastri'
    WHERE id = v_user_id;
  END IF;

  -- Insert/update Pundit directory tracker table
  INSERT INTO public.website_store_pundits (
    user_id,
    full_name,
    spiritual_title,
    languages,
    gotra,
    experience_years,
    city,
    state,
    latitude,
    longitude,
    service_modes,
    temple_name,
    service_area,
    specialties,
    profile_photo,
    bio,
    verified_badge,
    verification_uploaded,
    onboarded_at
  ) VALUES (
    v_user_id,
    'Acharya Rajesh Shastri',
    'Acharya',
    ARRAY['Hindi', 'Sanskrit', 'English'],
    'Kashyap',
    15,
    'Varanasi',
    'Uttar Pradesh',
    25.319,
    82.976,
    ARRAY['Temple', 'Home Visits', 'Online'],
    'Kashi Vishwanath Temple',
    'Varanasi',
    ARRAY['🕉 Rudrabhishek', '🔥 Havan', '🏡 Griha Pravesh'],
    'https://api.dicebear.com/7.x/avataaars/png?seed=Acharya%20Rajesh%20Shastri',
    'Highly trained scholar from Banaras Hindu University specializing in Rigveda rituals.',
    'Verified Pandit',
    true,
    now()
  ) ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    spiritual_title = EXCLUDED.spiritual_title,
    languages = EXCLUDED.languages,
    gotra = EXCLUDED.gotra,
    experience_years = EXCLUDED.experience_years,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    service_modes = EXCLUDED.service_modes,
    temple_name = EXCLUDED.temple_name,
    service_area = EXCLUDED.service_area,
    specialties = EXCLUDED.specialties,
    profile_photo = EXCLUDED.profile_photo,
    bio = EXCLUDED.bio,
    verified_badge = EXCLUDED.verified_badge,
    verification_uploaded = EXCLUDED.verification_uploaded,
    updated_at = now();
END;
$$;

COMMIT;
