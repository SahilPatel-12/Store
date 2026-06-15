-- Migration: Remove all current customer user data and reset associated transactional data
BEGIN;

-- Disable triggers temporarily on tables if necessary, though cascades are clean
-- Truncate all customer-specific tables cascade style
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

-- Reset coupon usage counters since redemptions have been removed
UPDATE public.website_store_coupons SET redemptions_count = 0;

COMMIT;
