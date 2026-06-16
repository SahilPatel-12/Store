-- Migration: Add purchase_limit to website_pooja_products table
ALTER TABLE public.website_pooja_products 
ADD COLUMN IF NOT EXISTS purchase_limit INTEGER DEFAULT NULL;

COMMENT ON COLUMN public.website_pooja_products.purchase_limit IS 'Maximum quantity of this product allowed in a single order (null or <=0 means no limit)';
