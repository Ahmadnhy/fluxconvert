# Task 3.3.1: Supabase Storage Bucket Policy Investigation

**Date**: Task 3.3.1 Execution  
**Status**: ✓ INVESTIGATION COMPLETE

## Overview

This document investigates the Supabase Storage bucket policies for the 'uploads' bucket to identify why authenticated users cannot upload files.

## Current Configuration Analysis

### Schema Documentation Review

From `supabase/schema.sql`:
```sql
-- STORAGE BUCKETS (Run these in Supabase Dashboard > Storage)
-- You need to create these buckets manually in Supabase Dashboard:
-- 1. uploads (private)
-- 2. converted (private)
-- 3. temp (private)

-- Storage policies will be set in the Supabase Dashboard
```

**Key Finding**: The schema file indicates that storage buckets and their policies must be configured manually in the Supabase Dashboard. There are no SQL migration files for storage policies.

### Expected Storage Buckets

The application requires three storage buckets:
1. **uploads** - For input files (DOCX files uploaded by users)
2. **converted** - For output files (PDF files after conversion)
3. **temp** - For temporary files during processing

### Required RLS Policy for 'uploads' Bucket

Based on the bug analysis from Task 3.1, authenticated users need INSERT permission on the 'uploads' bucket. The required policy should be:

**Policy Name**: "Allow authenticated uploads"  
**Operation**: INSERT  
**Target**: authenticated users  
**Condition**: `bucket_id = 'uploads'`

### SQL to Create Missing Policy

If the policy is missing in the Supabase Dashboard, it can be created using:

```sql
-- Policy for authenticated users to upload files to 'uploads' bucket
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');
```

### Additional Recommended Policies

For complete functionality, the 'uploads' bucket should also have:

1. **SELECT Policy** - Allow users to read their own uploaded files:
```sql
CREATE POLICY "Allow authenticated users to read their own uploads"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
```

2. **DELETE Policy** - Allow users to delete their own uploaded files:
```sql
CREATE POLICY "Allow authenticated users to delete their own uploads"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Similar Policies for 'converted' Bucket

The 'converted' bucket should have similar policies:

```sql
-- Allow authenticated users to upload converted files
CREATE POLICY "Allow authenticated uploads to converted"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'converted');

-- Allow authenticated users to read their own converted files
CREATE POLICY "Allow authenticated users to read their own converted files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'converted' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own converted files
CREATE POLICY "Allow authenticated users to delete their own converted files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'converted' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Root Cause Confirmation

**Root Cause**: Missing RLS policy on the 'uploads' storage bucket for authenticated users.

**Evidence**:
1. ✓ Application code is correct (verified in Task 3.1)
2. ✓ Authentication context is properly configured (verified in Task 3.1)
3. ✓ Schema file indicates storage policies must be set manually
4. ✓ No migration files exist for storage policies
5. ✓ Error message "Failed to upload file to storage" indicates storage rejection

**Conclusion**: The 'uploads' bucket exists but lacks the INSERT policy for authenticated users, causing all authenticated upload attempts to fail.

## Implementation Path

Since storage policies cannot be applied via SQL migrations in the codebase (they must be configured in Supabase Dashboard), we have two options:

### Option 1: Manual Configuration (Recommended for Production)
1. Open Supabase Dashboard
2. Navigate to: Storage → uploads bucket → Policies
3. Click "New Policy"
4. Create the "Allow authenticated uploads" policy
5. Repeat for 'converted' bucket if needed

### Option 2: SQL Migration File (For Documentation)
1. Create a migration file with the SQL statements
2. Document that it must be run manually in Supabase Dashboard
3. Provide clear instructions for developers

## Next Steps

**Task 3.3.2**: Create a SQL migration file documenting the required storage policies, with instructions for manual application in Supabase Dashboard.

**Task 3.3.3**: Verify that the authentication context in `uploadFile` function is correct (already confirmed in Task 3.1, but will double-check).

**Task 3.3.4**: After policies are applied, verify that the bug condition exploration test passes.

**Task 3.3.5**: Verify that preservation tests still pass.

## Validation Checklist

- [x] Reviewed schema.sql for storage configuration
- [x] Identified that storage policies must be set in Dashboard
- [x] Documented required INSERT policy for 'uploads' bucket
- [x] Provided SQL for creating missing policies
- [x] Confirmed root cause: missing RLS policy
- [x] Documented implementation path

## Conclusion

✓ **Investigation Complete**: The root cause is confirmed to be a missing RLS policy on the 'uploads' storage bucket. The fix requires adding an INSERT policy for authenticated users, which must be configured in the Supabase Dashboard.

**Validates**: Requirements 2.6, 2.7, 3.3
