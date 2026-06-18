-- Migration: Add payment_status column to website_store_orders table
ALTER TABLE public.website_store_orders 
ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'Pending';

COMMENT ON COLUMN website_store_orders.payment_status IS 'Direct barcode/QR payment approval status: Pending or Confirmed';
