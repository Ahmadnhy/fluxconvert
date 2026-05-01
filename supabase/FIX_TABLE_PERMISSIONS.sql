-- ============================================
-- FIX TABLE PERMISSIONS FOR ANON ROLE
-- ============================================
-- The issue is NOT with RLS policies, but with table-level permissions
-- This script grants explicit permissions to the anon role
--
-- INSTRUCTIONS:
-- 1. Copy this SQL
-- 2. Open: https://supabase.com/dashboard/project/csabggfdbnkccahmhmxa/sql/new
-- 3. Paste and click "Run"
-- ============================================

-- Revoke all existing permissions first (clean slate)
REVOKE ALL ON public.files FROM anon;
REVOKE ALL ON public.conversions FROM anon;
REVOKE ALL ON public.profiles FROM anon;

-- Grant explicit permissions to anon role
GRANT SELECT, INSERT ON public.files TO anon;
GRANT SELECT, INSERT, UPDATE ON public.conversions TO anon;
GRANT SELECT, INSERT ON public.profiles TO anon;

-- Grant USAGE on sequences (needed for auto-generated UUIDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Grant EXECUTE on uuid_generate_v4 function (if it exists)
GRANT EXECUTE ON FUNCTION uuid_generate_v4() TO anon;

-- Verify permissions
SELECT 
    '=== ANON ROLE PERMISSIONS ===' AS section,
    table_name,
    string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privileges
FROM information_schema.table_privileges
WHERE grantee = 'anon' 
  AND table_schema = 'public'
  AND table_name IN ('files', 'conversions', 'profiles')
GROUP BY table_name
ORDER BY table_name;

-- Test INSERT with new permissions
DO $$
DECLARE
    test_id UUID;
BEGIN
    -- Switch to anon role
    SET LOCAL ROLE anon;
    SET LOCAL request.jwt.claims TO '{}';
    
    -- Try INSERT
    INSERT INTO public.files (user_id, file_name, file_type, file_size, storage_path, storage_bucket, status)
    VALUES (NULL, 'test-with-grants.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1024, 'anonymous/test.docx', 'uploads', 'active')
    RETURNING id INTO test_id;
    
    RAISE NOTICE '✅ SUCCESS! Anonymous INSERT worked! File ID: %', test_id;
    RAISE NOTICE '✅ Table permissions are now correct!';
    
    -- Cleanup
    DELETE FROM public.files WHERE id = test_id;
    RAISE NOTICE '✅ Test record cleaned up';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ FAILED! Error: % (Code: %)', SQLERRM, SQLSTATE;
        RAISE NOTICE 'Additional debugging needed...';
END $$;

RESET ROLE;

SELECT '✅ Permissions granted. Check Messages tab for test results.' AS final_status;
