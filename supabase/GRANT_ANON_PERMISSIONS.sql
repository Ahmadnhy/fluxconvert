-- ============================================
-- GRANT PERMISSIONS TO ANON ROLE
-- ============================================
-- This ensures the anon role has necessary permissions
-- to INSERT into files and conversions tables
--
-- INSTRUCTIONS:
-- 1. Copy this SQL
-- 2. Open: https://supabase.com/dashboard/project/csabggfdbnkccahmhmxa/sql/new
-- 3. Paste and click "Run"
-- ============================================

-- Grant INSERT permission on files table to anon role
GRANT INSERT ON public.files TO anon;
GRANT SELECT ON public.files TO anon;

-- Grant INSERT permission on conversions table to anon role
GRANT INSERT ON public.conversions TO anon;
GRANT SELECT ON public.conversions TO anon;

-- Grant USAGE on sequences (for auto-generated IDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Verify grants
SELECT 
    'Permissions for anon role on files table:' AS info,
    privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'anon' AND table_name = 'files';

SELECT 
    'Permissions for anon role on conversions table:' AS info,
    privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'anon' AND table_name = 'conversions';

SELECT '✅ Permissions granted to anon role!' AS result;
