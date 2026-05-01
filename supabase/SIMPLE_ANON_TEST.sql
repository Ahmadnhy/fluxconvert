-- ============================================
-- SIMPLE ANONYMOUS INSERT TEST
-- ============================================

-- Step 1: Check current policy
SELECT 
    'Step 1: Current INSERT policy' AS step,
    polname AS policy_name,
    pg_get_expr(polwithcheck, polrelid) AS with_check_condition
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'files' AND polcmd = 'a';

-- Step 2: Test anonymous INSERT
DO $$
DECLARE
    test_id UUID;
BEGIN
    -- Simulate anonymous user
    SET LOCAL ROLE anon;
    SET LOCAL request.jwt.claims TO '{}';
    
    -- Try INSERT
    INSERT INTO public.files (user_id, file_name, file_type, file_size, storage_path, storage_bucket, status)
    VALUES (NULL, 'test.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1024, 'anonymous/test.docx', 'uploads', 'active')
    RETURNING id INTO test_id;
    
    RAISE NOTICE '✅ SUCCESS! File ID: %', test_id;
    
    -- Cleanup
    DELETE FROM public.files WHERE id = test_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ FAILED! Error: % (Code: %)', SQLERRM, SQLSTATE;
END $$;

RESET ROLE;

SELECT '✅ Test completed. Check Messages/Notices tab for results.' AS result;
