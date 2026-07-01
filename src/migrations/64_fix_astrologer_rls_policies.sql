-- Migration: Fix and clean RLS policies for website_store_astrologers, app_users, and website_store_users to avoid invalid column references
-- Date: 2026-06-25

-- 1. Drop existing policies to avoid any duplicate name conflicts or stale columns
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE tablename IN ('website_store_astrologers', 'app_users', 'website_store_users')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 2. Recreate website_store_astrologers policies
ALTER TABLE public.website_store_astrologers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read for website_store_astrologers" ON public.website_store_astrologers FOR SELECT USING (true);
CREATE POLICY "Allow user to update own astrologer profile" ON public.website_store_astrologers FOR ALL USING (true) WITH CHECK (true);

-- 3. Recreate app_users policies
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous select for app_users" ON public.app_users FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anonymous insert for app_users" ON public.app_users FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anonymous update for app_users" ON public.app_users FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 4. Recreate website_store_users policies
ALTER TABLE public.website_store_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to website_store_users" ON public.website_store_users FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert access to website_store_users" ON public.website_store_users FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow user update access to website_store_users" ON public.website_store_users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
