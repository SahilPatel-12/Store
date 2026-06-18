-- Migration: Clear all user accounts, sessions, order histories, and affiliate data to prepare for production deployment.
BEGIN;

-- Disable triggers temporarily to ensure clean truncation with no constraint conflicts
SET CONSTRAINTS ALL DEFERRED;

-- Truncate all customer-specific transactional and session tables
TRUNCATE TABLE
  public.affiliate_audit_logs,
  public.affiliate_withdrawals,
  public.affiliate_commissions,
  public.affiliate_clicks,
  public.affiliate_relationships,
  public.affiliate_wallets,
  public.user_sessions,
  public.admin_sessions,
  public.website_store_coupon_redemptions,
  public.website_store_addresses,
  public.website_store_orders,
  public.website_store_users
RESTART IDENTITY CASCADE;

-- Reset coupon usage counters since redemptions have been cleared
UPDATE public.website_store_coupons SET redemptions_count = 0;

COMMIT;
