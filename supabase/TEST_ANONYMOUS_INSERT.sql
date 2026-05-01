-- ============================================
-- TEST ANONYMOUS INSERT DIRECTLY
-- ============================================
-- This script tests if anonymous users can INSERT into files table
-- by simulating the exact scenario from the application
--
-- INSTRUCTIONS:
-- 1. Copy this SQL
-- 2. Open: https://supabase.com/dashboard/project/csabggfdbnkccahmhmxa/sql/new
-- 3. Paste and click "Run"
-- ============================================

-- Test 1: Check current policies
SELECT 
    'Current INSERT policy for files table:' AS info,
    policyname,
    with_check AS policy_condition
FROM pg_policies 
WHERE tablename = 'files' AND cmd = 'INSERT';

-- Test 2: Simulate anonymous user INSERT (using anon role)
DO $$
DECLARE
    test_file_id UUID;
    error_occurred BOOLEAN := FALSE;
    error_message TEXT;
BEGIN
    -- Switch to anon role (this simulates an unauthenticated request)
    SET LOCAL ROLE anon;
    SET LOCAL request.jwt.claims TO '{}';
    
    BEGIN
        -- Try to insert a test file record with user_id = NULL
        INSERT INTO public.files (
            user_id, 
            file_name, 
            file_type, 
            file_size, 
            storage_path, 
            storage_bucket, 
            status
        )
        VALUES (
            NULL,  -- Anonymous user
            'test-anonymous-insert.docx',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            1024,
            'anonymous/1234567890-test.docx',
            'uploads',
            'active'
        )
        RETURNING id INTO test_file_id;
        
        -- If we get here, the INSERT succeeded
        RAISE NOTICE '✅ SUCCESS: Anonymous INSERT worked! File ID: %', test_file_id;
        
        -- Clean up the test record
        DELETE FROM public.files WHERE id = test_file_id;
        RAISE NOTICE '✅ Test record cleaned up';
        
    EXCEPTION
        WHEN OTHERS THEN
            error_occurred := TRUE;
            error_message := SQLERRM;
            RAISE NOTICE '❌ FAILED: Anonymous INSERT failed with error: %', error_message;
            RAISE NOTICE '❌ Error code: %', SQLSTATE;
    END;
    
END $$;

-- Reset role
RESET ROLE;

-- Test 3: Check what auth.uid() returns for anon role
DO $$
BEGIN
    SET LOCAL ROLE anon;
    SET LOCAL request.jwt.claims TO '{}';
    
    RAISE NOTICE 'auth.uid() for anon role: %', auth.uid();
    RAISE NOTICE 'auth.uid() IS NULL: %', (auth.uid() IS NULL);
END $$;

RESET ROLE;

-- Test 4: Show the exact WITH CHECK condition
SELECT 
    'WITH CHECK condition details:' AS info,
    p.polname AS policyname,
    pg_get_expr(polwithcheck, polrelid) AS with_check_expression
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'files' AND polcmd = 'a'; -- 'a' means INSERT

SELECT 'Test completed. Check the NOTICES above for results.' AS final_message;
