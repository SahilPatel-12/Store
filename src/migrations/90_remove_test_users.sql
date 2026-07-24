-- Migration: Remove Test Users and Associated Transaction/Session Data
-- Sequential number: 90
-- Target Phone Numbers: '7974478098', '917974478098'
-- Date: 2026-07-24

BEGIN;

-- 1. Create a temporary table of target user UUIDs to simplify deletions
CREATE TEMP TABLE target_user_ids AS
SELECT id, phone_number
FROM public.website_store_users
WHERE phone_number IN ('7974478098', '917974478098');

-- 2. Deletions from dependent tables in order of dependency

-- 2.1 User Sessions
DELETE FROM public.user_sessions
WHERE user_id IN (SELECT id FROM target_user_ids);

-- 2.2 Coupon Redemptions
DELETE FROM public.website_store_coupon_redemptions
WHERE user_id IN (SELECT id FROM target_user_ids);

-- 2.3 Addresses
DELETE FROM public.website_store_addresses
WHERE user_id IN (SELECT id FROM target_user_ids);

-- 2.4 Affiliate Clicks
DELETE FROM public.affiliate_clicks
WHERE referrer_id IN (SELECT id FROM target_user_ids);

-- 2.5 Affiliate Relationships
DELETE FROM public.affiliate_relationships
WHERE referrer_id IN (SELECT id FROM target_user_ids)
   OR referred_id IN (SELECT id FROM target_user_ids);

-- 2.6 Affiliate Withdrawals
DELETE FROM public.affiliate_withdrawals
WHERE user_id IN (SELECT id FROM target_user_ids);

-- 2.7 Affiliate Commissions
DELETE FROM public.affiliate_commissions
WHERE referrer_id IN (SELECT id FROM target_user_ids)
   OR buyer_id IN (SELECT id FROM target_user_ids);

-- 2.8 Affiliate Wallets
DELETE FROM public.affiliate_wallets
WHERE user_id IN (SELECT id FROM target_user_ids);

-- 2.9 Pundit Bookings (cascade)
DELETE FROM public.website_store_pundit_bookings
WHERE pundit_id IN (SELECT id FROM target_user_ids)
   OR user_id IN (SELECT id FROM target_user_ids);

-- 2.10 Order Corrections
DELETE FROM public.order_corrections
WHERE order_id IN (
  SELECT id FROM public.website_store_orders
  WHERE user_id IN (SELECT id FROM target_user_ids)
);

-- 2.11 Website Store Orders
DELETE FROM public.website_store_orders
WHERE user_id IN (SELECT id FROM target_user_ids);

-- 2.12 Pundit Profile
DELETE FROM public.website_store_pundits
WHERE user_id IN (SELECT id FROM target_user_ids);

-- 2.13 Astrologer Profile
DELETE FROM public.website_store_astrologers
WHERE user_id IN (SELECT id FROM target_user_ids);

-- 2.14 App Users Profile
DELETE FROM public.app_users
WHERE id IN (SELECT id FROM target_user_ids);

-- 2.15 Self-referential links nullification on users table
UPDATE public.website_store_users
SET referred_by = NULL
WHERE referred_by IN (SELECT id FROM target_user_ids);

-- 2.16 Delete target users from website_store_users
DELETE FROM public.website_store_users
WHERE id IN (SELECT id FROM target_user_ids);

-- 2.17 Delete OTP records by phone number
DELETE FROM public.website_store_otps
WHERE phone_number IN ('7974478098', '917974478098');

DELETE FROM public.website_store_msg91_test_otps
WHERE phone_number IN ('7974478098', '917974478098');

COMMIT;

-- ====================================================================
-- VERIFICATION QUERIES
-- Run the following queries to verify that the test data has been cleared
-- ====================================================================

-- 1. Verify no target users exist
SELECT 'website_store_users' AS table_name, count(*) 
FROM public.website_store_users 
WHERE phone_number IN ('7974478098', '917974478098');

-- 2. Verify no sessions remain for these users
SELECT 'user_sessions' AS table_name, count(*) 
FROM public.user_sessions 
WHERE user_id NOT IN (SELECT id FROM public.website_store_users);

-- 3. Verify no addresses remain for these users
SELECT 'website_store_addresses' AS table_name, count(*) 
FROM public.website_store_addresses 
WHERE user_id NOT IN (SELECT id FROM public.website_store_users);

-- 4. Verify no orders remain for these users
SELECT 'website_store_orders' AS table_name, count(*) 
FROM public.website_store_orders 
WHERE user_id NOT IN (SELECT id FROM public.website_store_users);

-- 5. Verify no affiliate records remain for these users
SELECT 'affiliate_relationships' AS table_name, count(*) 
FROM public.affiliate_relationships 
WHERE referrer_id NOT IN (SELECT id FROM public.website_store_users)
   OR referred_id NOT IN (SELECT id FROM public.website_store_users);

SELECT 'affiliate_commissions' AS table_name, count(*) 
FROM public.affiliate_commissions 
WHERE referrer_id NOT IN (SELECT id FROM public.website_store_users)
   OR buyer_id NOT IN (SELECT id FROM public.website_store_users);

SELECT 'affiliate_wallets' AS table_name, count(*) 
FROM public.affiliate_wallets 
WHERE user_id NOT IN (SELECT id FROM public.website_store_users);

-- 6. Verify no remaining OTPs for target phone numbers
SELECT 'website_store_otps' AS table_name, count(*) 
FROM public.website_store_otps 
WHERE phone_number IN ('7974478098', '917974478098');
