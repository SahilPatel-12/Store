-- Migration: Create website_store_coupons and website_store_coupon_redemptions tables

CREATE TABLE IF NOT EXISTS public.website_store_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  user_limit INTEGER, -- total usage limit (number of peoples). null means unlimited
  redemptions_count INTEGER NOT NULL DEFAULT 0,
  product_id UUID REFERENCES public.website_pooja_products(id) ON DELETE SET NULL, -- specific product constraint. null means all products
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.website_store_coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.website_store_coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.website_store_users(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT website_store_coupon_redemptions_user_coupon_unique UNIQUE (user_id, coupon_id)
);

-- Enable RLS
ALTER TABLE public.website_store_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_store_coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Allow public read access to website_store_coupons" ON public.website_store_coupons;
DROP POLICY IF EXISTS "Allow all access to website_store_coupons" ON public.website_store_coupons;
DROP POLICY IF EXISTS "Allow public read access to website_store_coupon_redemptions" ON public.website_store_coupon_redemptions;
DROP POLICY IF EXISTS "Allow all access to website_store_coupon_redemptions" ON public.website_store_coupon_redemptions;

-- Create policies
CREATE POLICY "Allow public read access to website_store_coupons"
ON public.website_store_coupons
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow all access to website_store_coupons"
ON public.website_store_coupons
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public read access to website_store_coupon_redemptions"
ON public.website_store_coupon_redemptions
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow all access to website_store_coupon_redemptions"
ON public.website_store_coupon_redemptions
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);
