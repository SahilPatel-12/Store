-- Migration: Add is_astrologer and astrologer_profile columns to website_store_users
-- Date: 2026-06-25

ALTER TABLE public.website_store_users 
  ADD COLUMN IF NOT EXISTS is_astrologer BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.website_store_users 
  ADD COLUMN IF NOT EXISTS astrologer_profile JSONB;
