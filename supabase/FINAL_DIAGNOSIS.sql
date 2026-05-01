-- ============================================
-- FINAL DIAGNOSIS: Deep Dive into Configuration
-- ============================================

-- 1. Check ALL policies on files table (including system policies)
SELECT 
    '=== ALL POLICIES ON FILES ===' AS info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'files';

-- 2. Check table ownership and permissions
SELECT 
    '=== TABLE OWNERSHIP ===' AS info,
    c.relname AS table_name,
    pg_catalog.pg_get_userbyid(c.relowner) AS owner,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced
FROM pg_class c
WHERE c.relname IN ('files', 'conversions')
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 3. Check role memberships
SELECT 
    '=== ROLE MEMBERSHIPS ===' AS info,
    r.rolname AS role_name,
    r.rolsuper AS is_superuser,
    r.rolinherit AS inherits_privileges,
    r.rolcreaterole AS can_create_roles,
    r.rolcreatedb AS can_create_db,
    r.rolcanlogin AS can_login,
    r.rolbypassrls AS bypass_rls
FROM pg_roles r
WHERE r.rolname IN ('anon', 'authenticated', 'service_role', 'postgres');

-- 4. Check if there are any triggers that might interfere
SELECT 
    '=== TRIGGERS ON FILES ===' AS info,
    tgname AS trigger_name,
    tgtype AS trigger_type,
    tgenabled AS enabled
FROM pg_trigger
WHERE tgrelid = 'public.files'::regclass
  AND tgname NOT LIKE 'RI_%';  -- Exclude foreign key triggers

-- 5. Try INSERT as postgres role (superuser, bypasses RLS)
DO $$
DECLARE
    test_id UUID;
BEGIN
    -- This should ALWAYS work (superuser bypasses RLS)
    INSERT INTO public.files (user_id, file_name, file_type, file_size, storage_path, storage_bucket, status)
    VALUES (NULL, 'test-superuser.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1024, 'anonymous/test.docx', 'uploads', 'active')
    RETURNING id INTO test_id;
    
    RAISE NOTICE '✅ Superuser INSERT SUCCESS! File ID: %', test_id;
    
    DELETE FROM public.files WHERE id = test_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Even superuser failed! Error: %', SQLERRM;
END $$;

-- 6. Check if anon role has bypass_rls
SELECT 
    '=== CHECKING ANON BYPASS RLS ===' AS info,
    rolname,
    rolbypassrls
FROM pg_roles
WHERE rolname = 'anon';

SELECT '✅ Diagnosis complete. Check all results above.' AS final_message;
