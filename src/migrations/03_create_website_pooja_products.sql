-- Migration: Create website_pooja_products table for dynamic pooja product data
CREATE TABLE IF NOT EXISTS public.website_pooja_products (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sanskrit_name TEXT,
  short_name TEXT,
  slug TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}'::TEXT[],
  subtitle TEXT,
  short_description TEXT,
  description TEXT NOT NULL,
  spiritual_significance TEXT,
  benefits TEXT[] DEFAULT '{}'::TEXT[],
  rituals_included JSONB DEFAULT '[]'::JSONB,
  samagri_list JSONB DEFAULT '[]'::JSONB,
  priest_details JSONB DEFAULT '{}'::JSONB,
  duration TEXT,
  ideal_occasions TEXT[] DEFAULT '{}'::TEXT[],
  temple_association TEXT,
  who_should_perform TEXT,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  offers TEXT[] DEFAULT '{}'::TEXT[],
  badges TEXT[] DEFAULT '{}'::TEXT[],
  rating NUMERIC DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  testimonials JSONB DEFAULT '[]'::JSONB,
  faqs JSONB DEFAULT '[]'::JSONB,
  booking_instructions TEXT,
  cta_labels JSONB DEFAULT '{}'::JSONB,
  seo_title TEXT,
  seo_description TEXT,
  canonical_url TEXT,
  og_data JSONB DEFAULT '{}'::JSONB,
  schema_markup JSONB DEFAULT '{}'::JSONB,
  image_alt TEXT,
  image_caption TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  in_stock BOOLEAN DEFAULT true,
  recommendation_logic TEXT,
  related_products UUID[] DEFAULT '{}'::UUID[],
  video_url TEXT,
  translations JSONB DEFAULT '{}'::JSONB,
  ui_labels JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  published_at TIMESTAMP WITH TIME ZONE,
  is_published BOOLEAN DEFAULT true,
  image TEXT NOT NULL,
  banner_image TEXT,
  gallery_images JSONB DEFAULT '[]'::JSONB,
  ritual_images JSONB DEFAULT '[]'::JSONB,
  priest_image TEXT,
  certificates JSONB DEFAULT '[]'::JSONB,
  icon_image TEXT,
  promo_creatives JSONB DEFAULT '[]'::JSONB,
  CONSTRAINT website_pooja_products_pkey PRIMARY KEY (id),
  CONSTRAINT website_pooja_products_slug_key UNIQUE (slug)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.website_pooja_products ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Allow public read access to website_pooja_products" ON public.website_pooja_products;
DROP POLICY IF EXISTS "Allow all access to website_pooja_products" ON public.website_pooja_products;

-- Create policy to allow public select
CREATE POLICY "Allow public read access to website_pooja_products"
ON public.website_pooja_products
FOR SELECT
TO anon, authenticated
USING (true);

-- Create policy to allow all write access (since admin panel performs writes directly)
CREATE POLICY "Allow all access to website_pooja_products"
ON public.website_pooja_products
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS website_pooja_products_category_idx ON public.website_pooja_products(category);
CREATE INDEX IF NOT EXISTS website_pooja_products_is_featured_idx ON public.website_pooja_products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS website_pooja_products_is_published_idx ON public.website_pooja_products(is_published) WHERE is_published = true;
