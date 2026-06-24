console.log('Script started');
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import https from 'https';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
const envPath = path.join(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local file not found at:', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

const endpoint = env['VITE_CLOUDFLARE_ENDPOINT'];
const accessKeyId = env['VITE_CLOUDFLARE_ACCESS_KEY_ID'];
const secretAccessKey = env['VITE_CLOUDFLARE_SECRET_ACCESS_KEY'];
const bucketName = env['VITE_CLOUDFLARE_BUCKET_NAME'] || 'mantrapujaapp';
const publicBaseUrl = env['VITE_CLOUDFLARE_PUBLIC_BASE_URL'];
const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];

if (!endpoint || !accessKeyId || !secretAccessKey || !publicBaseUrl || !supabaseUrl || !supabaseAnonKey) {
  console.error('Missing configuration variables in .env.local');
  process.exit(1);
}

// S3 Client configuration for Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: endpoint,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
});

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const punditsList = [
  {
    name: 'Acharya Raghav Sharma',
    phone: '+919000000001',
    title: 'Acharya',
    gotra: 'Bharadwaj',
    experience: 18,
    languages: ['Hindi', 'Sanskrit'],
    specialties: ['🕉 Rudrabhishek', '🔥 Havan', '🕉 Shanti Path'],
    bio: 'Acharya Raghav Sharma has performed thousands of authentic Vedic Rudraksha energization rituals following traditional Shiva Agama and Rudra Vidhi procedures.',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    lat: 25.3176,
    lng: 82.9739,
    modes: ['Temple', 'Home Visits'],
    temple: 'Kashi Vishwanath Temple'
  },
  {
    name: 'Acharya Devendra Shastri',
    phone: '+919000000002',
    title: 'Shastri',
    gotra: 'Vashishtha',
    experience: 15,
    languages: ['Hindi', 'Sanskrit', 'English'],
    specialties: ['🪔 Satyanarayan Katha', '🏡 Griha Pravesh', '🔥 Havan'],
    bio: 'Acharya Devendra Shastri specializes in Vedic mantra siddhi, Saraswati worship rituals, and traditional Rudraksha energization ceremonies.',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    lat: 25.3180,
    lng: 82.9745,
    modes: ['Home Visits', 'Online'],
    temple: ''
  },
  {
    name: 'Acharya Subramanya Iyer',
    phone: '+919000000003',
    title: 'Acharya',
    gotra: 'Kashyap',
    experience: 20,
    languages: ['Tamil', 'Sanskrit', 'English'],
    specialties: ['🕉 Rudrabhishek', '💍 Vivah Sanskar', '💰 Lakshmi Puja'],
    bio: 'Acharya Subramanya Iyer specializes in Murugan worship rituals, sacred mantra recitations, and spiritual energization ceremonies.',
    city: 'Chennai',
    state: 'Tamil Nadu',
    lat: 13.0827,
    lng: 80.2707,
    modes: ['Temple', 'Home Visits', 'Online'],
    temple: 'Kapaleeshwarar Temple'
  },
  {
    name: 'Acharya Bhavesh Shukla',
    phone: '+919000000004',
    title: 'Acharya',
    gotra: 'Gautam',
    experience: 12,
    languages: ['Hindi', 'Sanskrit'],
    specialties: ['🌞 Navgraha Puja', '🏡 Griha Pravesh', '🏠 Vastu Shanti'],
    bio: 'Acharya Bhavesh Shukla specializes in family harmony rituals, Ganesh Sadhana, and authentic Vedic Rudraksha energization ceremonies.',
    city: 'Ujjain',
    state: 'Madhya Pradesh',
    lat: 23.1760,
    lng: 75.7885,
    modes: ['Temple', 'Home Visits'],
    temple: 'Mahakaleshwar Jyotirlinga Temple'
  },
  {
    name: 'Acharya Gaurang Bhatt',
    phone: '+919000000005',
    title: 'Acharya',
    gotra: 'Atri',
    experience: 16,
    languages: ['Gujarati', 'Hindi', 'Sanskrit'],
    specialties: ['💰 Lakshmi Puja', '🔥 Havan', '🌞 Navgraha Puja'],
    bio: 'Acharya Gaurang Bhatt has extensive expertise in Mahalakshmi worship, prosperity rituals, and authentic Vedic Rudraksha energization ceremonies.',
    city: 'Ahmedabad',
    state: 'Gujarat',
    lat: 23.0225,
    lng: 72.5714,
    modes: ['Home Visits', 'Online'],
    temple: ''
  },
  {
    name: 'Acharya Kuberanand Mishra',
    phone: '+919000000006',
    title: 'Acharya',
    gotra: 'Agastya',
    experience: 14,
    languages: ['Hindi', 'Sanskrit'],
    specialties: ['💰 Lakshmi Puja', '🔥 Havan', '🏠 Vastu Shanti'],
    bio: 'Acharya Kuberanand Mishra specializes in crystal energization, prosperity rituals, and sacred wealth-attraction ceremonies.',
    city: 'Haridwar',
    state: 'Uttarakhand',
    lat: 29.9457,
    lng: 78.1642,
    modes: ['Temple', 'Home Visits'],
    temple: 'Har Ki Pauri Temple'
  },
  {
    name: 'Acharya Lakshmikant Dwivedi',
    phone: '+919000000007',
    title: 'Acharya',
    gotra: 'Vatsa',
    experience: 17,
    languages: ['Hindi', 'Sanskrit', 'English'],
    specialties: ['💰 Lakshmi Puja', '🌞 Navgraha Puja', '🪔 Satyanarayan Katha'],
    bio: 'Acharya Lakshmikant Dwivedi specializes in Lakshmi-Kuber rituals and spiritual energization ceremonies focused on prosperity and abundance.',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    lat: 25.3210,
    lng: 82.9780,
    modes: ['Temple', 'Home Visits', 'Online'],
    temple: 'Sankat Mochan Hanuman Temple'
  },
  {
    name: 'Acharya Narayan Shukla',
    phone: '+919000000008',
    title: 'Acharya',
    gotra: 'Angirasa',
    experience: 22,
    languages: ['Hindi', 'Sanskrit'],
    specialties: ['🕉 Rudrabhishek', '🔥 Havan', '🕉 Shanti Path'],
    bio: 'Acharya Narayan Shukla is renowned for performing Vishnu Sadhana, Vedic protection rituals, and authentic Rudraksha energization ceremonies according to ancient scriptures.',
    city: 'Prayagraj',
    state: 'Uttar Pradesh',
    lat: 25.4358,
    lng: 81.8463,
    modes: ['Home Visits', 'Online'],
    temple: ''
  },
  {
    name: 'Acharya Venkatesh Trivedi',
    phone: '+919000000009',
    title: 'Acharya',
    gotra: 'Vishwamitra',
    experience: 15,
    languages: ['Hindi', 'Sanskrit', 'Gujarati'],
    specialties: ['🕉 Rudrabhishek', '🔥 Havan', '🏠 Vastu Shanti'],
    bio: 'Acharya Venkatesh Trivedi specializes in traditional Rudraksha energization and sacred Shiva-Parvati worship rituals performed according to authentic Vedic scriptures.',
    city: 'Somnath',
    state: 'Gujarat',
    lat: 20.8880,
    lng: 70.4012,
    modes: ['Temple', 'Home Visits'],
    temple: 'Somnath Jyotirlinga Temple'
  },
  {
    name: 'Acharya Adwait Raman',
    phone: '+919000000010',
    title: 'Acharya',
    gotra: 'Bharadwaj',
    experience: 19,
    languages: ['Hindi', 'Sanskrit', 'English'],
    specialties: ['🕉 Rudrabhishek', '🔥 Havan', '🕉 Shanti Path'],
    bio: 'Acharya Adwait Raman specializes in advanced Vedic rituals, Rudraksha energization, and sacred spiritual ceremonies rooted in traditional practices.',
    city: 'Rishikesh',
    state: 'Uttarakhand',
    lat: 30.0869,
    lng: 78.2676,
    modes: ['Temple', 'Home Visits', 'Online'],
    temple: 'Parmarth Niketan Temple'
  },
  {
    name: 'Acharya Arvind Pathak',
    phone: '+919000000011',
    title: 'Acharya',
    gotra: 'Kashyap',
    experience: 13,
    languages: ['Hindi', 'Sanskrit'],
    specialties: ['🔥 Havan', '💰 Lakshmi Puja', '🏠 Vastu Shanti'],
    bio: 'Acharya Arvind Pathak specializes in crystal activation rituals and prosperity-focused Vedic energization ceremonies.',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    lat: 25.3195,
    lng: 82.9710,
    modes: ['Home Visits', 'Online'],
    temple: ''
  },
  {
    name: 'Acharya Rudransh Pathak',
    phone: '+919000000012',
    title: 'Acharya',
    gotra: 'Vashishtha',
    experience: 11,
    languages: ['Hindi', 'Sanskrit'],
    specialties: ['🔥 Havan', '🕉 Shanti Path', '🌞 Navgraha Puja'],
    bio: 'Acharya Rudransh Pathak is highly experienced in Durga worship, Navarna mantra rituals, and authentic Vedic Rudraksha energization ceremonies.',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    lat: 25.3205,
    lng: 82.9725,
    modes: ['Temple', 'Home Visits'],
    temple: 'Durga Kund Mandir'
  },
  {
    name: 'Acharya Veerendra Joshi',
    phone: '+919000000013',
    title: 'Acharya',
    gotra: 'Gautam',
    experience: 21,
    languages: ['Hindi', 'Sanskrit', 'Marathi'],
    specialties: ['🔥 Havan', '🕉 Shanti Path', '🕉 Rudrabhishek'],
    bio: 'Acharya Veerendra Joshi specializes in Hanuman worship, Rudra rituals, and powerful Vedic energization ceremonies performed according to sacred traditions.',
    city: 'Nashik',
    state: 'Maharashtra',
    lat: 19.9975,
    lng: 73.7898,
    modes: ['Temple', 'Home Visits', 'Online'],
    temple: 'Trimbakeshwar Shiva Temple'
  },
  {
    name: 'Acharya Suryakant Vyas',
    phone: '+919000000014',
    title: 'Acharya',
    gotra: 'Atri',
    experience: 25,
    languages: ['Hindi', 'Sanskrit', 'Gujarati'],
    specialties: ['🔥 Havan', '🌞 Navgraha Puja', '🪔 Satyanarayan Katha'],
    bio: 'Acharya Suryakant Vyas specializes in Surya worship, Aditya Hridayam recitations, and authentic Vedic Rudraksha energization ceremonies.',
    city: 'Dwarka',
    state: 'Gujarat',
    lat: 22.2442,
    lng: 68.9685,
    modes: ['Temple', 'Home Visits'],
    temple: 'Dwarkadhish Temple'
  },
  {
    name: 'Acharya Shubhendra Sharma',
    phone: '+919000000015',
    title: 'Acharya',
    gotra: 'Agastya',
    experience: 14,
    languages: ['Hindi', 'Sanskrit', 'English'],
    specialties: ['🏠 Vastu Shanti', '🏡 Griha Pravesh', '🔥 Havan'],
    bio: 'Acharya Shubhendra Sharma specializes in prosperity rituals, Vastu remedies, and sacred energy activation ceremonies for homes and businesses.',
    city: 'Delhi',
    state: 'Delhi',
    lat: 28.6139,
    lng: 77.2090,
    modes: ['Home Visits', 'Online'],
    temple: ''
  },
  {
    name: 'Acharya Vishwajeet Dwivedi',
    phone: '+919000000016',
    title: 'Acharya',
    gotra: 'Vatsa',
    experience: 15,
    languages: ['Hindi', 'Sanskrit'],
    specialties: ['🔥 Havan', '🌞 Navgraha Puja', '🕉 Rudrabhishek'],
    bio: 'Acharya Vishwajeet Dwivedi specializes in Ganapati rituals, Vedic mantra siddhi, and authentic Rudraksha energization ceremonies performed according to traditional scriptures.',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    lat: 25.3225,
    lng: 82.9799,
    modes: ['Temple', 'Home Visits'],
    temple: 'Vishalakshi Temple'
  },
  {
    name: 'Acharya Somnath Shastri',
    phone: '+919000000017',
    title: 'Acharya',
    gotra: 'Angirasa',
    experience: 20,
    languages: ['Hindi', 'Sanskrit', 'English'],
    specialties: ['🕉 Rudrabhishek', '🔥 Havan', '🕉 Shanti Path'],
    bio: 'Highly revered scholar from Varanasi conducting sacred Mahamrityunjaya and planetary homas.',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    lat: 25.3170,
    lng: 82.9730,
    modes: ['Temple', 'Home Visits', 'Online'],
    temple: 'Kashi Vishwanath Temple'
  },
  {
    name: 'Acharya Vidyadhar Dwivedi',
    phone: '+919000000018',
    title: 'Acharya',
    gotra: 'Vishwamitra',
    experience: 14,
    languages: ['Hindi', 'Sanskrit'],
    specialties: ['💰 Lakshmi Puja', '🔥 Havan', '🪔 Satyanarayan Katha'],
    bio: 'Expert scholar from Shri Jagannath Sanskrit Vishvavidyalaya specializing in Lakshmi rituals.',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    lat: 25.3185,
    lng: 82.9750,
    modes: ['Home Visits', 'Online'],
    temple: ''
  },
  {
    name: 'Pandit Ramakant Joshi',
    phone: '+919000000019',
    title: 'Pandit Ji',
    gotra: 'Bharadwaj',
    experience: 12,
    languages: ['Hindi', 'Sanskrit'],
    specialties: ['🪔 Satyanarayan Katha', '🏡 Griha Pravesh', '🔥 Havan'],
    bio: 'A traditional Uttarakhand Pandit specializing in Vishnu Stotras and monthly household vrat ceremonies.',
    city: 'Rishikesh',
    state: 'Uttarakhand',
    lat: 30.0880,
    lng: 78.2690,
    modes: ['Home Visits', 'Online'],
    temple: ''
  },
  {
    name: 'Acharya Rajesh Shastri',
    phone: '+919000000020',
    title: 'Acharya',
    gotra: 'Kashyap',
    experience: 15,
    languages: ['Hindi', 'Sanskrit', 'English'],
    specialties: ['🕉 Rudrabhishek', '🔥 Havan', '🏡 Griha Pravesh'],
    bio: 'Highly trained scholar from Banaras Hindu University specializing in Rigveda rituals.',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    lat: 25.3190,
    lng: 82.9760,
    modes: ['Temple', 'Home Visits', 'Online'],
    temple: 'Kashi Vishwanath Temple'
  }
];

// Helper to hash password using SHA-256
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Download image buffer from Dicebear
function downloadAvatar(seed) {
  return new Promise((resolve, reject) => {
    const url = `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(seed)}`;
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download avatar, status: ${res.statusCode}`));
        return;
      }
      const data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data)));
    }).on('error', reject);
  });
}

// Upload buffer to Cloudflare R2
async function uploadToR2(buffer, filename) {
  const key = `products/pundits/${filename}`;
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: 'image/png',
  });

  await s3Client.send(command);
  const cleanBaseUrl = publicBaseUrl.endsWith('/') ? publicBaseUrl.slice(0, -1) : publicBaseUrl;
  return `${cleanBaseUrl}/${key}`;
}

async function main() {
  try {
    console.log('Starting avatar download and Cloudflare R2 upload for 20 pundits...');
    const uploadedPundits = [];

    for (let i = 0; i < punditsList.length; i++) {
      const p = punditsList[i];
      console.log(`Processing [${i + 1}/20]: ${p.name}...`);
      
      let r2Url = '';
      try {
        const imgBuffer = await downloadAvatar(p.name);
        const nameSlug = p.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const filename = `${nameSlug}_${crypto.randomUUID().substring(0, 8)}.png`;
        r2Url = await uploadToR2(imgBuffer, filename);
        console.log(`Uploaded profile picture to R2: ${r2Url}`);
      } catch (err) {
        console.warn(`Failed to upload R2 photo for ${p.name}, using dicebear URL directly as fallback.`, err);
        r2Url = `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(p.name)}`;
      }

      uploadedPundits.push({
        ...p,
        profile_photo: r2Url
      });
    }

    console.log('Successfully completed uploads. Generating SQL migration code...');

    // Generate migration SQL content
    let sqlContent = `-- Migration: Create website_store_pundits table and seed 20 Vedic Acharyas
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
`;

    const commonPasswordHash = hashPassword('pundit123');

    uploadedPundits.forEach(p => {
      const userUuid = crypto.randomUUID();
      const code = 'MP' + crypto.randomBytes(3).toString('hex').toUpperCase();
      
      const email = `${p.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@mantrapuja.com`;
      const phone = p.phone;

      // Construct JSONB pundit profile payload
      const payload = {
        fullName: p.name,
        spiritualTitle: p.title,
        languages: p.languages,
        gotra: p.gotra,
        experience: p.experience,
        location: {
          city: p.city,
          state: p.state,
          latitude: p.lat,
          longitude: p.lng
        },
        serviceModes: p.modes,
        templeName: p.temple,
        serviceArea: p.city,
        ritualExpertise: p.specialties,
        profilePhoto: p.profile_photo,
        bio: p.bio,
        verificationUploaded: true,
        verifiedBadge: 'Verified Pandit',
        onboardedAt: new Date().toISOString()
      };

      const payloadStr = JSON.stringify(payload).replace(/'/g, "''");
      const bioEscaped = p.bio.replace(/'/g, "''");
      const nameEscaped = p.name.replace(/'/g, "''");
      const titleEscaped = p.title.replace(/'/g, "''");
      const gotraEscaped = p.gotra.replace(/'/g, "''");
      const cityEscaped = p.city.replace(/'/g, "''");
      const stateEscaped = p.state.replace(/'/g, "''");
      const templeEscaped = p.temple ? p.temple.replace(/'/g, "''") : '';
      
      sqlContent += `
-- Seed Pundit: ${p.name}
DO $$
DECLARE
  v_user_id UUID;
  v_phone_exists BOOLEAN;
BEGIN
  -- Check if phone already registered
  SELECT EXISTS(SELECT 1 FROM public.website_store_users WHERE phone_number = '${phone}') INTO v_phone_exists;
  
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
      '${userUuid}',
      '${nameEscaped}',
      '${email}',
      '${phone}',
      '${commonPasswordHash}',
      true,
      '${code}',
      'active',
      now(),
      '${payloadStr}'::JSONB
    ) RETURNING id INTO v_user_id;

    -- Add wallet
    INSERT INTO public.affiliate_wallets (user_id, total_earned, pending_earnings, approved_earnings, withdrawn_amount)
    VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    SELECT id INTO v_user_id FROM public.website_store_users WHERE phone_number = '${phone}';
    UPDATE public.website_store_users
    SET 
      is_pundit = true,
      pundit_profile = '${payloadStr}'::JSONB,
      full_name = '${nameEscaped}'
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
    '${nameEscaped}',
    '${titleEscaped}',
    ARRAY[${p.languages.map(x => `'${x}'`).join(', ')}],
    '${gotraEscaped}',
    ${p.experience},
    '${cityEscaped}',
    '${stateEscaped}',
    ${p.lat},
    ${p.lng},
    ARRAY[${p.modes.map(x => `'${x}'`).join(', ')}],
    ${templeEscaped ? `'${templeEscaped}'` : 'NULL'},
    '${cityEscaped}',
    ARRAY[${p.specialties.map(x => `'${x}'`).join(', ')}],
    '${p.profile_photo}',
    '${bioEscaped}',
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
`;
    });

    sqlContent += `\nCOMMIT;\n`;

    const sqlFilename = '60_create_pundits_table_and_seed.sql';
    const sqlFilePath = path.join(__dirname, '../src/migrations/', sqlFilename);

    console.log(`Writing SQL migration file to: ${sqlFilePath}`);
    fs.writeFileSync(sqlFilePath, sqlContent, 'utf-8');

    console.log('Applying migration via exec_sql RPC...');
    const { data: runData, error: runError } = await supabase.rpc('exec_sql', {
      sql_query: sqlContent
    });

    if (runError) {
      console.error('SQL Migration failed:', runError);
      process.exit(1);
    }

    console.log('Migration successfully executed and committed in Supabase!');
    console.log('Result:', runData);
    process.exit(0);

  } catch (err) {
    console.error('An exception occurred in the script:', err);
    process.exit(1);
  }
}

main();
