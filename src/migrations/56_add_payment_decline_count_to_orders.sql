-- Migration: Add payment_decline_count column to website_store_orders
ALTER TABLE public.website_store_orders ADD COLUMN IF NOT EXISTS payment_decline_count INTEGER DEFAULT 0;
