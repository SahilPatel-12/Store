-- Migration: Add customizable specifications and custom section icons to website_pooja_products
ALTER TABLE public.website_pooja_products 
ADD COLUMN IF NOT EXISTS material TEXT,
ADD COLUMN IF NOT EXISTS weight TEXT,
ADD COLUMN IF NOT EXISTS dimensions TEXT,
ADD COLUMN IF NOT EXISTS origin TEXT,
ADD COLUMN IF NOT EXISTS custom_icons JSONB DEFAULT '{}'::JSONB;

COMMENT ON COLUMN public.website_pooja_products.material IS 'Custom product material description';
COMMENT ON COLUMN public.website_pooja_products.weight IS 'Custom product weight details';
COMMENT ON COLUMN public.website_pooja_products.dimensions IS 'Custom product measurements and dimensions';
COMMENT ON COLUMN public.website_pooja_products.origin IS 'Custom origin location for sacred items';
COMMENT ON COLUMN public.website_pooja_products.custom_icons IS 'Custom R2 section-header icon links (significance, rituals, samagri, guidelines, priest, cert)';
