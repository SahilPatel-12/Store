-- Migration 87: Add cod_fee column to website_store_orders
ALTER TABLE public.website_store_orders ADD COLUMN IF NOT EXISTS cod_fee NUMERIC DEFAULT 0;
