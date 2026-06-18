-- Migration: Make website_store_users email column nullable (DROP NOT NULL)
-- Unique constraint is kept. Multiple NULL values are allowed under UNIQUE in PostgreSQL.
ALTER TABLE public.website_store_users ALTER COLUMN email DROP NOT NULL;
