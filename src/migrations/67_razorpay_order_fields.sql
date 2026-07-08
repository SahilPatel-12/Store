-- Migration: Add Razorpay columns to website_store_orders and create webhook events logging table

-- 1. Add Razorpay payment fields to website_store_orders
ALTER TABLE public.website_store_orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE public.website_store_orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE public.website_store_orders ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.website_store_orders ADD COLUMN IF NOT EXISTS amount_paid_paise BIGINT;
ALTER TABLE public.website_store_orders ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
ALTER TABLE public.website_store_orders ADD COLUMN IF NOT EXISTS payment_failure_reason TEXT;
ALTER TABLE public.website_store_orders ADD COLUMN IF NOT EXISTS razorpay_mode TEXT;

-- Add check constraint for razorpay_mode if it does not exist
ALTER TABLE public.website_store_orders DROP CONSTRAINT IF EXISTS website_store_orders_razorpay_mode_check;
ALTER TABLE public.website_store_orders ADD CONSTRAINT website_store_orders_razorpay_mode_check CHECK (razorpay_mode IN ('test', 'live'));

-- Add unique constraints (dropping existing ones first to prevent duplicate errors)
ALTER TABLE public.website_store_orders DROP CONSTRAINT IF EXISTS website_store_orders_razorpay_order_id_key;
ALTER TABLE public.website_store_orders ADD CONSTRAINT website_store_orders_razorpay_order_id_key UNIQUE (razorpay_order_id);

ALTER TABLE public.website_store_orders DROP CONSTRAINT IF EXISTS website_store_orders_razorpay_payment_id_key;
ALTER TABLE public.website_store_orders ADD CONSTRAINT website_store_orders_razorpay_payment_id_key UNIQUE (razorpay_payment_id);

-- Create performance indexes for search and reconciliation lookup
CREATE INDEX IF NOT EXISTS idx_website_store_orders_rzp_order_id ON public.website_store_orders (razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_website_store_orders_rzp_payment_id ON public.website_store_orders (razorpay_payment_id);

-- 2. Create razorpay_webhook_events table for webhook idempotency
CREATE TABLE IF NOT EXISTS public.razorpay_webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  deduplication_key TEXT NOT NULL,
  event_type TEXT NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  processing_status TEXT NOT NULL DEFAULT 'Pending',
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  processed_at TIMESTAMP WITH TIME ZONE,
  safe_error_code TEXT,
  CONSTRAINT razorpay_webhook_events_pkey PRIMARY KEY (id),
  CONSTRAINT razorpay_webhook_events_deduplication_key_key UNIQUE (deduplication_key),
  CONSTRAINT razorpay_webhook_events_processing_status_check CHECK (processing_status IN ('Pending', 'Processed', 'Failed'))
);

-- Enable Row Level Security (RLS) on webhook events
ALTER TABLE public.razorpay_webhook_events ENABLE ROW LEVEL SECURITY;

-- Note: We do NOT define any public policies for razorpay_webhook_events.
-- Access is restricted purely to server-side service role queries.
