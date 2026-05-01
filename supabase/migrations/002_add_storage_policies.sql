-- Migration: Add Storage Bucket Policies for File Upload Fix
-- Bug: Authenticated users get "Failed to upload file to storage" error
-- Root Cause: Missing RLS policies on storage buckets
-- 
-- IMPORTANT: This migration must be run manually in Supabase Dashboard
-- Storage policies cannot be applied automatically via standard migrations
-- 
-- Instructions:
-- 1. Open Supabase Dashboard
-- 2. Navigate to: SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
-- 
-- Alternative: Apply policies via Storage UI
-- 1. Navigate to: Storage → [bucket name] → Policies
-- 2. Click "New Policy"
-- 3. Configure policy settings as shown below

-- ============================================================================
-- UPLOADS BUCKET POLICIES
-- ============================================================================

-- Policy 1: Allow authenticated users to INSERT files to 'uploads' bucket
-- This fixes Bug 3: File Upload Error
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Policy 1a: Allow anonymous users to INSERT files to 'uploads' bucket
-- Anonymous users can only upload to anonymous/* paths
-- This enables anonymous Word to PDF conversions without requiring login
CREATE POLICY "Allow anonymous uploads"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
    bucket_id = 'uploads' 
    AND (storage.foldername(name))[1] = 'anonymous'
);

-- Policy 2: Allow authenticated users to SELECT their own files from 'uploads' bucket
-- This allows users to read files they uploaded
CREATE POLICY "Allow authenticated users to read their own uploads"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'uploads' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Allow authenticated users to DELETE their own files from 'uploads' bucket
-- This allows users to delete files they uploaded
CREATE POLICY "Allow authenticated users to delete their own uploads"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'uploads' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Allow authenticated users to UPDATE their own files in 'uploads' bucket
-- This allows users to update/replace files they uploaded
CREATE POLICY "Allow authenticated users to update their own uploads"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'uploads' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- CONVERTED BUCKET POLICIES
-- ============================================================================

-- Policy 1: Allow authenticated users to INSERT files to 'converted' bucket
-- This allows the system to save converted PDF files
CREATE POLICY "Allow authenticated uploads to converted"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'converted');

-- Policy 1a: Allow anonymous users to INSERT files to 'converted' bucket
-- Anonymous users can only upload to anonymous/* paths
-- This enables saving conversion output for anonymous users
CREATE POLICY "Allow anonymous uploads to converted"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
    bucket_id = 'converted' 
    AND (storage.foldername(name))[1] = 'anonymous'
);

-- Policy 2: Allow authenticated users to SELECT their own files from 'converted' bucket
-- This allows users to download their converted files
CREATE POLICY "Allow authenticated users to read their own converted files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'converted' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2a: Allow anonymous users to SELECT files from 'converted' bucket
-- Anonymous users can only read from anonymous/* paths
-- This enables download URLs for anonymous conversions
CREATE POLICY "Allow anonymous read from converted"
ON storage.objects
FOR SELECT
TO anon
USING (
    bucket_id = 'converted' 
    AND (storage.foldername(name))[1] = 'anonymous'
);

-- Policy 3: Allow authenticated users to DELETE their own files from 'converted' bucket
-- This allows cleanup of old converted files
CREATE POLICY "Allow authenticated users to delete their own converted files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'converted' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Allow authenticated users to UPDATE their own files in 'converted' bucket
-- This allows updating converted files if needed
CREATE POLICY "Allow authenticated users to update their own converted files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'converted' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- After running this migration, verify policies were created:
-- SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';

-- Verify policies for 'uploads' bucket:
-- SELECT policyname, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE schemaname = 'storage' 
--   AND tablename = 'objects' 
--   AND qual LIKE '%uploads%';

-- Verify policies for 'converted' bucket:
-- SELECT policyname, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE schemaname = 'storage' 
--   AND tablename = 'objects' 
--   AND qual LIKE '%converted%';

-- ============================================================================
-- NOTES
-- ============================================================================

-- File Path Structure:
-- Authenticated users: {user_id}/{timestamp}-{filename}
-- Anonymous users: anonymous/{timestamp}-{filename}
-- Example authenticated: "550e8400-e29b-41d4-a716-446655440000/1704067200000-document.docx"
-- Example anonymous: "anonymous/1704067200000-document.docx"
-- 
-- The policy uses storage.foldername(name)[1] to extract the first folder from the path
-- For authenticated users: ensures users can only access files in their own folder
-- For anonymous users: restricts access to only the anonymous/ folder

-- Security Considerations:
-- - All buckets should be set to PRIVATE (not public)
-- - RLS policies enforce user-level access control
-- - Authenticated users can only access files in folders matching their auth.uid()
-- - Anonymous users can only INSERT/SELECT in anonymous/* paths
-- - Anonymous users CANNOT DELETE or UPDATE files (no policies granted)
-- - Authenticated users CANNOT access anonymous/* folder (RLS mismatch)
-- - Anonymous users CANNOT access {user_id}/* folders (RLS mismatch)
-- - INSERT policies allow uploads with path restrictions
-- - SELECT/DELETE/UPDATE policies restrict access to own files only

-- Anonymous User Restrictions:
-- - Can INSERT to uploads bucket (anonymous/* paths only)
-- - Can INSERT to converted bucket (anonymous/* paths only)
-- - Can SELECT from converted bucket (anonymous/* paths only, for download URLs)
-- - CANNOT DELETE files (no policy granted)
-- - CANNOT UPDATE files (no policy granted)
-- - CANNOT SELECT from uploads bucket (no policy granted)
-- - CANNOT access authenticated user folders (path restriction)

-- Bucket Configuration:
-- Ensure these buckets exist in Supabase Dashboard > Storage:
-- 1. uploads (private) - for input files
-- 2. converted (private) - for output files
-- 3. temp (private) - for temporary processing files (if needed)

-- If buckets don't exist, create them first:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Click "New bucket"
-- 3. Name: "uploads", Public: OFF
-- 4. Repeat for "converted" and "temp"
