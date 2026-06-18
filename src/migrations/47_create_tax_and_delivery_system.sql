-- Migration: Add GST & Delivery overrides and order snapshots
-- 1. Alter website_pooja_products to support GST and delivery overrides
ALTER TABLE public.website_pooja_products
  ADD COLUMN IF NOT EXISTS gst_override_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_gst NUMERIC,
  ADD COLUMN IF NOT EXISTS delivery_override_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_delivery NUMERIC;

-- 2. Alter website_store_orders to support tax and delivery snapshots
ALTER TABLE public.website_store_orders
  ADD COLUMN IF NOT EXISTS gst_percent_snapshot NUMERIC,
  ADD COLUMN IF NOT EXISTS gst_amount_snapshot NUMERIC,
  ADD COLUMN IF NOT EXISTS delivery_amount_snapshot NUMERIC,
  ADD COLUMN IF NOT EXISTS free_delivery_eligible_snapshot BOOLEAN;

-- 3. Initialize tax_delivery_settings in website_settings if not present
INSERT INTO public.website_settings (key, value)
VALUES ('tax_delivery_settings', '{"global_gst_percent": 8, "global_delivery_charge": 49, "free_delivery_threshold": 999}'::jsonb)
ON CONFLICT (key) DO NOTHING;
