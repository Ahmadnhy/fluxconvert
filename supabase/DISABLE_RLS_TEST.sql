-- ============================================
-- TEMPORARY: Disable RLS for Testing
-- ============================================
-- This will temporarily disable RLS to confirm
-- that the issue is with RLS policies, not permissions
--
-- WARNING: This makes tables accessible to everyone!
-- Only use for testing, then re-enable RLS immediately
--
-- INSTRUCTIONS:
-- 1. Copy this SQL
-- 2. Open: https://supabase.com/dashboard/project/csabggfdbnkccahmhmxa/sql/new
-- 3. Paste and click "Run"
-- ============================================

-- Temporarily disable RLS
ALTER TABLE public.files DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions DISABLE ROW LEVEL SECURITY;

-- Test anonymous INSERT without RLS
DO $$
DECLARE
    test_id UUID;
BEGIN
    SET LOCAL ROLE anon;
    SET LOCAL request.jwt.claims TO '{}';
    
    INSERT INTO public.files (user_id, file_name, file_type, file_size, storage_path, storage_bucket, status)
    VALUES (NULL, 'test-no-rls.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1024, 'anonymous/test.docx', 'uploads', 'active')
    RETURNING id INTO test_id;
    
    RAISE NOTICE '✅ SUCCESS WITHOUT RLS! File ID: %', test_id;
    RAISE NOTICE 'This confirms permissions are OK, issue is with RLS policy evaluation';
    
    DELETE FROM public.files WHERE id = test_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ FAILED EVEN WITHOUT RLS! Error: % (Code: %)', SQLERRM, SQLSTATE;
        RAISE NOTICE 'This means the issue is with table permissions, not RLS';
END $$;

RESET ROLE;

-- RE-ENABLE RLS (IMPORTANT!)
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;

SELECT '✅ Test completed. RLS has been re-enabled. Check Messages tab.' AS result;
