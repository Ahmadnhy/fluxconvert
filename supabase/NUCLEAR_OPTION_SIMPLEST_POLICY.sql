-- ============================================
-- NUCLEAR OPTION: Simplest Possible Policy
-- ============================================
-- This removes ALL policies and creates the absolute
-- simplest policy that should work
--
-- INSTRUCTIONS:
-- 1. Copy this SQL
-- 2. Open: https://supabase.com/dashboard/project/csabggfdbnkccahmhmxa/sql/new
-- 3. Paste and click "Run"
-- ============================================

-- Step 1: Drop ALL policies on files table
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'files'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.files', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- Step 2: Drop ALL policies on conversions table
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'conversions'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.conversions', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- Step 3: Create SIMPLEST possible INSERT policy for files
-- This policy allows ANYONE to insert ANYTHING
CREATE POLICY "allow_all_inserts"
    ON public.files
    FOR INSERT
    WITH CHECK (true);  -- Always allow

-- Step 4: Create SIMPLEST possible INSERT policy for conversions
CREATE POLICY "allow_all_inserts"
    ON public.conversions
    FOR INSERT
    WITH CHECK (true);  -- Always allow

-- Step 5: Create SELECT policies (so authenticated users can view their files)
CREATE POLICY "allow_authenticated_select"
    ON public.files
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "allow_authenticated_select"
    ON public.conversions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Step 6: Verify policies
SELECT 
    '=== FILES TABLE POLICIES ===' AS section,
    p.polname AS policyname,
    polcmd::text AS operation,
    pg_get_expr(polwithcheck, polrelid) AS with_check
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'files'
ORDER BY polcmd, p.polname;

SELECT 
    '=== CONVERSIONS TABLE POLICIES ===' AS section,
    p.polname AS policyname,
    polcmd::text AS operation,
    pg_get_expr(polwithcheck, polrelid) AS with_check
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'conversions'
ORDER BY polcmd, p.polname;

-- Step 7: Test INSERT
DO $$
DECLARE
    test_id UUID;
BEGIN
    SET LOCAL ROLE anon;
    SET LOCAL request.jwt.claims TO '{}';
    
    INSERT INTO public.files (user_id, file_name, file_type, file_size, storage_path, storage_bucket, status)
    VALUES (NULL, 'test-nuclear.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1024, 'anonymous/test.docx', 'uploads', 'active')
    RETURNING id INTO test_id;
    
    RAISE NOTICE '🎉 SUCCESS! Anonymous INSERT worked with simplest policy! File ID: %', test_id;
    RAISE NOTICE '✅ This confirms RLS is working, we just need the right policy syntax';
    
    DELETE FROM public.files WHERE id = test_id;
    RAISE NOTICE '✅ Test record cleaned up';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ STILL FAILED! Error: % (Code: %)', SQLERRM, SQLSTATE;
        RAISE NOTICE '❌ This is a deeper Supabase configuration issue';
END $$;

RESET ROLE;

SELECT '✅ Nuclear option applied. Check Messages tab.' AS final_status;
