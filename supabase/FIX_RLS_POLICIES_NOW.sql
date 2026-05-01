-- ============================================
-- FIX RLS POLICIES: Allow Anonymous User Uploads
-- ============================================
-- This script fixes the RLS policies to allow anonymous users
-- to INSERT file and conversion records with user_id = NULL
--
-- INSTRUCTIONS:
-- 1. Copy this entire SQL script
-- 2. Open: https://supabase.com/dashboard/project/csabggfdbnkccahmhmxa/sql/new
-- 3. Paste and click "Run"
-- ============================================

-- Drop existing INSERT policies
DROP POLICY IF EXISTS "Users can insert their own files" ON public.files;
DROP POLICY IF EXISTS "Users can insert their own conversions" ON public.conversions;

-- Recreate files INSERT policy with anonymous user support
CREATE POLICY "Users can insert their own files"
    ON public.files FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        OR 
        (auth.uid() IS NULL AND user_id IS NULL)
    );

-- Recreate conversions INSERT policy with anonymous user support
CREATE POLICY "Users can insert their own conversions"
    ON public.conversions FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        OR 
        (auth.uid() IS NULL AND user_id IS NULL)
    );

-- Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('files', 'conversions') 
  AND policyname LIKE '%insert%'
ORDER BY tablename, policyname;

-- Success message
SELECT 'RLS policies updated successfully! Anonymous users can now upload files.' AS status;
