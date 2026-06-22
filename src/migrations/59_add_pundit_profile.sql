-- Migration: Add pundit_profile column to website_store_users
-- Date: 2026-06-22

ALTER TABLE public.website_store_users 
  ADD COLUMN IF NOT EXISTS pundit_profile JSONB;
