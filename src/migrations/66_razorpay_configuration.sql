-- Migration: Create razorpay_configuration table and establish secure settings policies

CREATE TABLE IF NOT EXISTS public.razorpay_configuration (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  mode TEXT NOT NULL,
  key_id TEXT NOT NULL,
  encrypted_key_secret TEXT NOT NULL,
  key_secret_iv TEXT NOT NULL,
  key_secret_auth_tag TEXT NOT NULL,
  encrypted_webhook_secret TEXT NOT NULL,
  webhook_secret_iv TEXT NOT NULL,
  webhook_secret_auth_tag TEXT NOT NULL,
  is_configured BOOLEAN NOT NULL DEFAULT true,
  connection_status TEXT NOT NULL DEFAULT 'Not Tested',
  last_verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_by_admin_id UUID,
  CONSTRAINT razorpay_configuration_pkey PRIMARY KEY (id),
  CONSTRAINT razorpay_configuration_mode_key UNIQUE (mode),
  CONSTRAINT razorpay_configuration_mode_check CHECK (mode IN ('test', 'live')),
  CONSTRAINT razorpay_configuration_connection_status_check CHECK (connection_status IN ('Not Tested', 'Connected', 'Failed'))
);

-- Enable RLS on the new table
ALTER TABLE public.razorpay_configuration ENABLE ROW LEVEL SECURITY;

-- Note: We intentionally do NOT create any public SELECT/INSERT/UPDATE/DELETE policies
-- for public.razorpay_configuration. Only the server-side service role client
-- (which bypasses RLS) will read/write configuration details.

-- Restructure the SELECT policy on website_settings to allow public access to payment_activation_settings
DROP POLICY IF EXISTS "Allow public select access to website_settings" ON public.website_settings;

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
      'homepage_category_images',
      'payment_activation_settings'
    )
  );

-- Initialize default settings for payment activation control (deactivated/manual only by default)
INSERT INTO public.website_settings (key, value)
VALUES (
  'payment_activation_settings',
  '{"activePaymentProvider": "manual_upi", "razorpayMode": "test", "legacyManualUpiEnabled": true}'::jsonb
)
ON CONFLICT (key) DO NOTHING;
