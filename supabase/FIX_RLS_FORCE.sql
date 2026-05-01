-- ============================================
-- FORCE FIX RLS POLICIES (Complete Rebuild)
-- ============================================
-- This script completely removes and recreates RLS policies
-- with explicit support for anonymous users
--
-- INSTRUCTIONS:
-- 1. Copy this entire SQL script
-- 2. Open: https://supabase.com/dashboard/project/csabggfdbnkccahmhmxa/sql/new
-- 3. Paste and click "Run"
-- ============================================

-- ============================================
-- STEP 1: Disable RLS temporarily
-- ============================================
ALTER TABLE public.files DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Drop ALL existing policies
-- ============================================

-- Drop all files policies
DROP POLICY IF EXISTS "Users can view their own files" ON public.files;
DROP POLICY IF EXISTS "Users can insert their own files" ON public.files;
DROP POLICY IF EXISTS "Users can delete their own files" ON public.files;
DROP POLICY IF EXISTS "Users can update their own files" ON public.files;

-- Drop all conversions policies
DROP POLICY IF EXISTS "Users can view their own conversions" ON public.conversions;
DROP POLICY IF EXISTS "Users can insert their own conversions" ON public.conversions;
DROP POLICY IF EXISTS "Users can update their own conversions" ON public.conversions;
DROP POLICY IF EXISTS "Users can delete their own conversions" ON public.conversions;

-- ============================================
-- STEP 3: Re-enable RLS
-- ============================================
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Create NEW policies with anonymous support
-- ============================================

-- FILES TABLE POLICIES
-- ------------------------------------

-- SELECT policy: Users can view their own files (authenticated only)
CREATE POLICY "Users can view their own files"
    ON public.files 
    FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT policy: Allow both authenticated and anonymous users
CREATE POLICY "Users can insert their own files"
    ON public.files 
    FOR INSERT
    WITH CHECK (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id)
        OR
        (auth.uid() IS NULL AND user_id IS NULL)
    );

-- DELETE policy: Users can delete their own files (authenticated only)
CREATE POLICY "Users can delete their own files"
    ON public.files 
    FOR DELETE
    USING (auth.uid() = user_id);

-- CONVERSIONS TABLE POLICIES
-- ------------------------------------

-- SELECT policy: Users can view their own conversions (authenticated only)
CREATE POLICY "Users can view their own conversions"
    ON public.conversions 
    FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT policy: Allow both authenticated and anonymous users
CREATE POLICY "Users can insert their own conversions"
    ON public.conversions 
    FOR INSERT
    WITH CHECK (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id)
        OR
        (auth.uid() IS NULL AND user_id IS NULL)
    );

-- UPDATE policy: Users can update their own conversions (authenticated only)
CREATE POLICY "Users can update their own conversions"
    ON public.conversions 
    FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- STEP 5: Verify the new policies
-- ============================================

SELECT 
    '=== FILES TABLE POLICIES ===' AS section,
    policyname,
    cmd AS operation,
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
        WHEN qual IS NOT NULL THEN 'USING: ' || qual
        ELSE 'No condition'
    END AS policy_condition
FROM pg_policies 
WHERE tablename = 'files'
ORDER BY cmd, policyname;

SELECT 
    '=== CONVERSIONS TABLE POLICIES ===' AS section,
    policyname,
    cmd AS operation,
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
        WHEN qual IS NOT NULL THEN 'USING: ' || qual
        ELSE 'No condition'
    END AS policy_condition
FROM pg_policies 
WHERE tablename = 'conversions'
ORDER BY cmd, policyname;

-- ============================================
-- STEP 6: Test anonymous INSERT
-- ============================================

-- This should succeed (anonymous user with user_id = NULL)
DO $$
DECLARE
    test_file_id UUID;
BEGIN
    -- Reset role to anon (simulating anonymous user)
    SET LOCAL ROLE anon;
    
    -- Try to insert a test file record
    INSERT INTO public.files (user_id, file_name, file_type, file_size, storage_path, storage_bucket, status)
    VALUES (NULL, 'test-anonymous.txt', 'text/plain', 100, 'anonymous/test.txt', 'uploads', 'active')
    RETURNING id INTO test_file_id;
    
    -- Clean up test record
    DELETE FROM public.files WHERE id = test_file_id;
    
    RAISE NOTICE 'SUCCESS: Anonymous INSERT test passed! File ID: %', test_file_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'FAILED: Anonymous INSERT test failed with error: %', SQLERRM;
END $$;

-- Reset role back to authenticated
RESET ROLE;

SELECT 'RLS policies rebuilt successfully! Check the results above.' AS final_status;
