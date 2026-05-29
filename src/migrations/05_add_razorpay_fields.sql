-- Migration: Add razorpay_payment_id to website_store_orders
ALTER TABLE website_store_orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
