-- ============================================
-- DEBUG auth.uid() FUNCTION
-- ============================================

-- Test 1: Check if auth.uid() function exists
SELECT 
    'Test 1: auth.uid() function exists' AS test,
    proname AS function_name,
    pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname = 'uid' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
LIMIT 1;

-- Test 2: Check what auth.uid() returns for anon role
DO $$
DECLARE
    uid_value UUID;
    uid_is_null BOOLEAN;
BEGIN
    -- Switch to anon role
    SET LOCAL ROLE anon;
    SET LOCAL request.jwt.claims TO '{}';
    
    -- Get auth.uid() value
    SELECT auth.uid() INTO uid_value;
    uid_is_null := (uid_value IS NULL);
    
    RAISE NOTICE 'auth.uid() value: %', COALESCE(uid_value::TEXT, 'NULL');
    RAISE NOTICE 'auth.uid() IS NULL: %', uid_is_null;
    RAISE NOTICE 'current_user: %', current_user;
    RAISE NOTICE 'current_setting(request.jwt.claims): %', current_setting('request.jwt.claims', true);
    
END $$;

RESET ROLE;

-- Test 3: Try INSERT with explicit NULL check bypass
DO $$
DECLARE
    test_id UUID;
    uid_value UUID;
BEGIN
    SET LOCAL ROLE anon;
    SET LOCAL request.jwt.claims TO '{}';
    
    SELECT auth.uid() INTO uid_value;
    RAISE NOTICE 'Before INSERT - auth.uid(): %', COALESCE(uid_value::TEXT, 'NULL');
    
    -- Try INSERT
    INSERT INTO public.files (user_id, file_name, file_type, file_size, storage_path, storage_bucket, status)
    VALUES (NULL, 'test.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1024, 'anonymous/test.docx', 'uploads', 'active')
    RETURNING id INTO test_id;
    
    RAISE NOTICE '✅ INSERT SUCCESS! ID: %', test_id;
    DELETE FROM public.files WHERE id = test_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ INSERT FAILED: % (Code: %)', SQLERRM, SQLSTATE;
        RAISE NOTICE 'Checking policy evaluation...';
        
        -- Check if the WITH CHECK condition would pass
        RAISE NOTICE 'Condition 1 (auth.uid() IS NOT NULL): %', (uid_value IS NOT NULL);
        RAISE NOTICE 'Condition 2 (auth.uid() IS NULL): %', (uid_value IS NULL);
        RAISE NOTICE 'Condition 3 (user_id IS NULL): TRUE (we are inserting NULL)';
        RAISE NOTICE 'Expected result: Condition 2 AND Condition 3 = % AND TRUE = %', 
                     (uid_value IS NULL), (uid_value IS NULL);
END $$;

RESET ROLE;

SELECT '✅ Debug completed. Check Messages tab.' AS result;
