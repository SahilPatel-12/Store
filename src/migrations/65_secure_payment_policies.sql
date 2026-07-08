-- Migration: Hardened security policies and added columns for Razorpay checkout integration
-- Active migration: 65_secure_payment_policies.sql

-- 1. Alter website_store_orders table to support payment provider and unique checkout idempotency
ALTER TABLE public.website_store_orders 
  ADD COLUMN IF NOT EXISTS checkout_attempt_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS payment_provider TEXT NOT NULL DEFAULT 'manual_upi';

-- 2. Restructure RLS policies for website_store_orders
ALTER TABLE public.website_store_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select" ON public.website_store_orders;
DROP POLICY IF EXISTS "Allow public insert" ON public.website_store_orders;
DROP POLICY IF EXISTS "Allow public update" ON public.website_store_orders;
DROP POLICY IF EXISTS "Allow admin select access to website_store_orders" ON public.website_store_orders;

-- Standard clients (anonymous role) are blocked from direct writes/reads.
-- Service role operations remain unrestricted.
-- Authenticated admins can perform direct queries.
CREATE POLICY "Allow admin select access to website_store_orders"
  ON public.website_store_orders FOR SELECT TO anon, authenticated
  USING (public.fn_validate_admin_session(coalesce(current_setting('request.headers', true)::json->>'x-admin-token', '')) IS NOT NULL);

-- 3. Restructure RLS policies for website_store_addresses
ALTER TABLE public.website_store_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select" ON public.website_store_addresses;
DROP POLICY IF EXISTS "Allow public insert" ON public.website_store_addresses;
DROP POLICY IF EXISTS "Allow public update" ON public.website_store_addresses;
DROP POLICY IF EXISTS "Allow public delete" ON public.website_store_addresses;

-- All direct client access to addresses is blocked; queries are routed through server API.

-- 4. Restructure RLS policies for website_store_coupons
ALTER TABLE public.website_store_coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to website_store_coupons" ON public.website_store_coupons;
DROP POLICY IF EXISTS "Allow all access to website_store_coupons" ON public.website_store_coupons;
DROP POLICY IF EXISTS "Allow public select access to website_store_coupons" ON public.website_store_coupons;
DROP POLICY IF EXISTS "Allow admin write access to website_store_coupons" ON public.website_store_coupons;

-- Allow read access for public validation.
CREATE POLICY "Allow public select access to website_store_coupons" 
  ON public.website_store_coupons FOR SELECT TO anon, authenticated USING (true);

-- Allow all writes and updates for authenticated admins.
CREATE POLICY "Allow admin write access to website_store_coupons" 
  ON public.website_store_coupons FOR ALL TO anon, authenticated
  USING (public.fn_validate_admin_session(coalesce(current_setting('request.headers', true)::json->>'x-admin-token', '')) IS NOT NULL)
  WITH CHECK (public.fn_validate_admin_session(coalesce(current_setting('request.headers', true)::json->>'x-admin-token', '')) IS NOT NULL);

-- 5. Restructure RLS policies for website_store_coupon_redemptions
ALTER TABLE public.website_store_coupon_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to website_store_coupon_redemptions" ON public.website_store_coupon_redemptions;
DROP POLICY IF EXISTS "Allow all access to website_store_coupon_redemptions" ON public.website_store_coupon_redemptions;

-- 6. Restructure RLS policies for website_settings
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to website_settings" ON public.website_settings;
DROP POLICY IF EXISTS "Allow all access to website_settings" ON public.website_settings;
DROP POLICY IF EXISTS "Allow public select access to website_settings" ON public.website_settings;
DROP POLICY IF EXISTS "Allow admin write access to website_settings" ON public.website_settings;

-- Allow read access ONLY for public settings, block sensitive credentials.
CREATE POLICY "Allow public select access to website_settings" 
  ON public.website_settings FOR SELECT TO anon, authenticated
  USING (
    key IN (
      'homepage_settings',
      'shop_banners_settings',
      'shop_categories_settings',
      'category_products_settings',
      'tax_delivery_settings',
      'payment_barcode_settings',
      'view_all_settings',
      'store_categories',
      'homepage_category_images'
    )
  );

-- Allow all actions for authenticated admins.
CREATE POLICY "Allow admin write access to website_settings" 
  ON public.website_settings FOR ALL TO anon, authenticated
  USING (public.fn_validate_admin_session(coalesce(current_setting('request.headers', true)::json->>'x-admin-token', '')) IS NOT NULL)
  WITH CHECK (public.fn_validate_admin_session(coalesce(current_setting('request.headers', true)::json->>'x-admin-token', '')) IS NOT NULL);

-- 7. Restructure RLS policies for website_pooja_products
ALTER TABLE public.website_pooja_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to website_pooja_products" ON public.website_pooja_products;
DROP POLICY IF EXISTS "Allow all access to website_pooja_products" ON public.website_pooja_products;
DROP POLICY IF EXISTS "Allow public select access to website_pooja_products" ON public.website_pooja_products;
DROP POLICY IF EXISTS "Allow admin write access to website_pooja_products" ON public.website_pooja_products;

-- Allow read access for product catalog.
CREATE POLICY "Allow public select access to website_pooja_products" 
  ON public.website_pooja_products FOR SELECT TO anon, authenticated USING (true);

-- Allow all actions for authenticated admins.
CREATE POLICY "Allow admin write access to website_pooja_products" 
  ON public.website_pooja_products FOR ALL TO anon, authenticated
  USING (public.fn_validate_admin_session(coalesce(current_setting('request.headers', true)::json->>'x-admin-token', '')) IS NOT NULL)
  WITH CHECK (public.fn_validate_admin_session(coalesce(current_setting('request.headers', true)::json->>'x-admin-token', '')) IS NOT NULL);
