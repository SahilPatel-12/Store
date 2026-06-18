-- Migration: Drop/Clear all existing user testing accounts and reset associated transaction tables
-- Executed inside public schema
BEGIN;

-- Disable triggers temporarily to ensure no side effects during truncation
SET CONSTRAINTS ALL DEFERRED;

-- Truncate all customer-specific tables using cascade style to clean out foreign key references
TRUNCATE TABLE
  public.affiliate_audit_logs,
  public.affiliate_withdrawals,
  public.affiliate_commissions,
  public.affiliate_clicks,
  public.affiliate_relationships,
  public.affiliate_wallets,
  public.user_sessions,
  public.website_store_coupon_redemptions,
  public.website_store_addresses,
  public.website_store_orders,
  public.website_store_users
RESTART IDENTITY CASCADE;

-- Reset coupon usage counters since redemptions have been cleared
UPDATE public.website_store_coupons SET redemptions_count = 0;

COMMIT;
