-- ============================================
-- FINAL FIX: Permissive Policy for Anonymous Users
-- ============================================
-- This uses a more permissive approach that should work
-- regardless of how auth.uid() behaves
--
-- INSTRUCTIONS:
-- 1. Copy this SQL
-- 2. Open: https://supabase.com/dashboard/project/csabggfdbnkccahmhmxa/sql/new
-- 3. Paste and click "Run"
-- ============================================

-- Drop existing INSERT policies
DROP POLICY IF EXISTS "Users can insert their own files" ON public.files;
DROP POLICY IF EXISTS "Users can insert their own conversions" ON public.conversions;

-- Create PERMISSIVE policy for files INSERT
-- This allows:
-- 1. Authenticated users to insert with their own user_id
-- 2. ANY insert where user_id IS NULL (anonymous users)
CREATE POLICY "Users can insert their own files"
    ON public.files 
    FOR INSERT
    WITH CHECK (
        user_id IS NULL  -- Allow any insert with NULL user_id
        OR 
        auth.uid() = user_id  -- Or authenticated user inserting their own
    );

-- Create PERMISSIVE policy for conversions INSERT
CREATE POLICY "Users can insert their own conversions"
    ON public.conversions 
    FOR INSERT
    WITH CHECK (
        user_id IS NULL  -- Allow any insert with NULL user_id
        OR 
        auth.uid() = user_id  -- Or authenticated user inserting their own
    );

-- Verify the new policies
SELECT 
    'Files INSERT policy:' AS info,
    pg_get_expr(polwithcheck, polrelid) AS with_check_condition
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'files' AND polcmd = 'a';

SELECT 
    'Conversions INSERT policy:' AS info,
    pg_get_expr(polwithcheck, polrelid) AS with_check_condition
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'conversions' AND polcmd = 'a';

-- Test anonymous INSERT
DO $$
DECLARE
    test_id UUID;
BEGIN
    SET LOCAL ROLE anon;
    SET LOCAL request.jwt.claims TO '{}';
    
    INSERT INTO public.files (user_id, file_name, file_type, file_size, storage_path, storage_bucket, status)
    VALUES (NULL, 'test.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1024, 'anonymous/test.docx', 'uploads', 'active')
    RETURNING id INTO test_id;
    
    RAISE NOTICE '✅ SUCCESS! Anonymous INSERT worked! File ID: %', test_id;
    
    DELETE FROM public.files WHERE id = test_id;
    RAISE NOTICE '✅ Test record cleaned up';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ FAILED! Error: % (Code: %)', SQLERRM, SQLSTATE;
END $$;

RESET ROLE;

SELECT '✅ Policy updated with permissive approach. Check Messages tab for test results.' AS final_status;
