-- Migration: Create website_pooja_product_translations table and localized view
BEGIN;

-- Create translation table
CREATE TABLE IF NOT EXISTS public.website_pooja_product_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.website_pooja_products(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published',
  name TEXT,
  sanskrit_name TEXT,
  short_name TEXT,
  category TEXT,
  tags TEXT[],
  subtitle TEXT,
  short_description TEXT,
  description TEXT,
  spiritual_significance TEXT,
  benefits TEXT[],
  rituals_included JSONB DEFAULT '[]'::JSONB,
  samagri_list JSONB DEFAULT '[]'::JSONB,
  priest_details JSONB DEFAULT '{}'::JSONB,
  duration TEXT,
  ideal_occasions TEXT[],
  temple_association TEXT,
  who_should_perform TEXT,
  offers TEXT[],
  badges TEXT[],
  testimonials JSONB DEFAULT '[]'::JSONB,
  faqs JSONB DEFAULT '[]'::JSONB,
  booking_instructions TEXT,
  cta_labels JSONB DEFAULT '{}'::JSONB,
  seo_title TEXT,
  seo_description TEXT,
  og_data JSONB DEFAULT '{}'::JSONB,
  image_alt TEXT,
  image_caption TEXT,
  gallery_images JSONB DEFAULT '[]'::JSONB,
  certificates JSONB DEFAULT '[]'::JSONB,
  material TEXT,
  weight TEXT,
  dimensions TEXT,
  origin TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT website_pooja_product_translations_product_locale_unique UNIQUE (product_id, locale)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.website_pooja_product_translations ENABLE ROW LEVEL SECURITY;

-- Drop policies if exist
DROP POLICY IF EXISTS "Allow public read access to website_pooja_product_translations" ON public.website_pooja_product_translations;
DROP POLICY IF EXISTS "Allow all access to website_pooja_product_translations" ON public.website_pooja_product_translations;

-- Policy for public SELECT (only published translations)
CREATE POLICY "Allow public read access to website_pooja_product_translations"
ON public.website_pooja_product_translations
FOR SELECT
TO anon, authenticated
USING (status = 'published');

-- Policy for administrative write access (using service role or direct admin access)
CREATE POLICY "Allow all access to website_pooja_product_translations"
ON public.website_pooja_product_translations
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS website_pooja_product_translations_product_id_idx ON public.website_pooja_product_translations(product_id);
CREATE INDEX IF NOT EXISTS website_pooja_product_translations_locale_idx ON public.website_pooja_product_translations(locale);

-- Create localized view resolving dynamic locales with English fallback
DROP VIEW IF EXISTS public.localized_website_pooja_products;
CREATE OR REPLACE VIEW public.localized_website_pooja_products AS
SELECT
  p.id,
  p.slug,
  p.price,
  p.original_price,
  p.rating,
  p.reviews_count,
  p.canonical_url,
  p.schema_markup,
  p.is_featured,
  p.is_trending,
  p.in_stock,
  p.recommendation_logic,
  p.related_products,
  p.video_url,
  p.created_at,
  p.updated_at,
  p.published_at,
  p.is_published,
  p.image,
  p.banner_image,
  p.ritual_images,
  p.priest_image,
  p.icon_image,
  p.promo_creatives,
  p.custom_icons,
  locales.locale,
  COALESCE(t.status, 'published') AS translation_status,
  COALESCE(t.name, p.name) AS name,
  COALESCE(t.sanskrit_name, p.sanskrit_name) AS sanskrit_name,
  COALESCE(t.short_name, p.short_name) AS short_name,
  COALESCE(t.category, p.category) AS category,
  COALESCE(t.tags, p.tags) AS tags,
  COALESCE(t.subtitle, p.subtitle) AS subtitle,
  COALESCE(t.short_description, p.short_description) AS short_description,
  COALESCE(t.description, p.description) AS description,
  COALESCE(t.spiritual_significance, p.spiritual_significance) AS spiritual_significance,
  COALESCE(t.benefits, p.benefits) AS benefits,
  COALESCE(t.rituals_included, p.rituals_included) AS rituals_included,
  COALESCE(t.samagri_list, p.samagri_list) AS samagri_list,
  COALESCE(t.priest_details, p.priest_details) AS priest_details,
  COALESCE(t.duration, p.duration) AS duration,
  COALESCE(t.ideal_occasions, p.ideal_occasions) AS ideal_occasions,
  COALESCE(t.temple_association, p.temple_association) AS temple_association,
  COALESCE(t.who_should_perform, p.who_should_perform) AS who_should_perform,
  COALESCE(t.offers, p.offers) AS offers,
  COALESCE(t.badges, p.badges) AS badges,
  COALESCE(t.testimonials, p.testimonials) AS testimonials,
  COALESCE(t.faqs, p.faqs) AS faqs,
  COALESCE(t.booking_instructions, p.booking_instructions) AS booking_instructions,
  COALESCE(t.cta_labels, p.cta_labels) AS cta_labels,
  COALESCE(t.seo_title, p.seo_title) AS seo_title,
  COALESCE(t.seo_description, p.seo_description) AS seo_description,
  COALESCE(t.og_data, p.og_data) AS og_data,
  COALESCE(t.image_alt, p.image_alt) AS image_alt,
  COALESCE(t.image_caption, p.image_caption) AS image_caption,
  COALESCE(t.gallery_images, p.gallery_images) AS gallery_images,
  COALESCE(t.certificates, p.certificates) AS certificates,
  COALESCE(t.material, p.material) AS material,
  COALESCE(t.weight, p.weight) AS weight,
  COALESCE(t.dimensions, p.dimensions) AS dimensions,
  COALESCE(t.origin, p.origin) AS origin
FROM public.website_pooja_products p
CROSS JOIN (SELECT unnest(ARRAY['en', 'hi']) AS locale) locales
LEFT JOIN public.website_pooja_product_translations t 
  ON p.id = t.product_id AND t.locale = locales.locale AND t.status = 'published';

COMMIT;
