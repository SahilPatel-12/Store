-- Migration: Add payment_screenshot column to website_store_orders table
-- Description: Allows uploading and storing proof-of-payment screenshot for direct UPI barcode/QR payments.

ALTER TABLE website_store_orders 
ADD COLUMN IF NOT EXISTS payment_screenshot TEXT;

-- Comments for documentation
COMMENT ON COLUMN website_store_orders.payment_screenshot IS 'CDN URL of the direct barcode/QR payment screenshot uploaded by the customer for admin verification';
