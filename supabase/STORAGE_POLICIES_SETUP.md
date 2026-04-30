# Supabase Storage Policies Setup Guide

This guide provides step-by-step instructions for configuring Row Level Security (RLS) policies for the FluxConvert application's storage buckets. These policies control who can upload, read, and delete files in the `uploads` and `converted` buckets.

## Overview

Storage policies define access control rules for Supabase Storage buckets. This task configures policies to ensure:

- ✅ Users can only upload files to their own folder in the `uploads` bucket
- ✅ Users can only read their own files from the `uploads` bucket
- ✅ Users can only read their own converted files from the `converted` bucket
- ✅ The application service can write converted files to the `converted` bucket
- ✅ Users cannot access other users' files
- ✅ Unauthenticated users have no direct storage access

---

## Prerequisites

Before starting, ensure you have:

- ✅ Completed **Task 7.1** (Storage buckets created)
- ✅ Both `uploads` and `converted` buckets exist in Supabase Storage
- ✅ Access to the Supabase Dashboard
- ✅ Admin/Owner permissions on the Supabase project

---

## Understanding Storage Policies

### Policy Structure

Storage policies in Supabase work on the `storage.objects` table and use the following structure:

```sql
CREATE POLICY "policy_name"
ON storage.objects
FOR <operation>  -- SELECT, INSERT, UPDATE, DELETE
TO <role>        -- authenticated, anon, public
USING (<condition>)      -- For SELECT, UPDATE, DELETE
WITH CHECK (<condition>) -- For INSERT, UPDATE
```

### File Path Organization

Files in buckets are organized by user ID:

```
uploads/{user-id}/{filename}
converted/{user-id}/{filename}
```

This organization enables policies to check if the user ID in the path matches the authenticated user's ID.

### Helper Functions

Supabase provides helper functions for storage policies:

- `storage.foldername(name)` - Extracts folder path components from file path
- `auth.uid()` - Returns the authenticated user's UUID
- `bucket_id` - The bucket identifier (e.g., 'uploads', 'converted')

---

## Step 1: Access SQL Editor

1. Log in to your Supabase Dashboard at https://supabase.com/dashboard
2. Select your FluxConvert project
3. In the left sidebar, click on **SQL Editor** (icon looks like a database or code)
4. You should see the SQL Editor interface with a query editor

---

## Step 2: Create Policies for 'uploads' Bucket

### Policy 1: Users Can Upload Their Own Files

This policy allows authenticated users to upload files to their own folder in the `uploads` bucket.

**Copy and run this SQL:**

```sql
-- Policy: Users can upload their own files to uploads bucket
CREATE POLICY "Users can upload their own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**What this policy does:**
- ✅ Allows INSERT operations (file uploads)
- ✅ Only for authenticated users
- ✅ Only to the 'uploads' bucket
- ✅ Only if the first folder in the path matches the user's ID
- ❌ Blocks uploads to other users' folders
- ❌ Blocks unauthenticated uploads

**Example:**
- User ID: `123e4567-e89b-12d3-a456-426614174000`
- ✅ Can upload to: `uploads/123e4567-e89b-12d3-a456-426614174000/document.docx`
- ❌ Cannot upload to: `uploads/other-user-id/document.docx`

---

### Policy 2: Users Can Read Their Own Files

This policy allows authenticated users to read (download) files from their own folder in the `uploads` bucket.

**Copy and run this SQL:**

```sql
-- Policy: Users can read their own files from uploads bucket
CREATE POLICY "Users can read their own uploaded files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**What this policy does:**
- ✅ Allows SELECT operations (file reads/downloads)
- ✅ Only for authenticated users
- ✅ Only from the 'uploads' bucket
- ✅ Only if the first folder in the path matches the user's ID
- ❌ Blocks reading other users' files

**Example:**
- User ID: `123e4567-e89b-12d3-a456-426614174000`
- ✅ Can read: `uploads/123e4567-e89b-12d3-a456-426614174000/document.docx`
- ❌ Cannot read: `uploads/other-user-id/document.docx`

---

### Policy 3: Users Can Delete Their Own Files (Optional)

This policy allows authenticated users to delete files from their own folder in the `uploads` bucket. This is optional but recommended for user file management.

**Copy and run this SQL:**

```sql
-- Policy: Users can delete their own files from uploads bucket
CREATE POLICY "Users can delete their own uploaded files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**What this policy does:**
- ✅ Allows DELETE operations (file deletion)
- ✅ Only for authenticated users
- ✅ Only from the 'uploads' bucket
- ✅ Only if the first folder in the path matches the user's ID
- ❌ Blocks deleting other users' files

---

## Step 3: Create Policies for 'converted' Bucket

### Policy 4: Users Can Read Their Converted Files

This policy allows authenticated users to read (download) converted files from their own folder in the `converted` bucket.

**Copy and run this SQL:**

```sql
-- Policy: Users can read their converted files from converted bucket
CREATE POLICY "Users can read their converted files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'converted' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**What this policy does:**
- ✅ Allows SELECT operations (file reads/downloads)
- ✅ Only for authenticated users
- ✅ Only from the 'converted' bucket
- ✅ Only if the first folder in the path matches the user's ID
- ❌ Blocks reading other users' converted files

**Example:**
- User ID: `123e4567-e89b-12d3-a456-426614174000`
- ✅ Can read: `converted/123e4567-e89b-12d3-a456-426614174000/document.pdf`
- ❌ Cannot read: `converted/other-user-id/document.pdf`

---

### Policy 5: Service Can Write Converted Files

This policy allows the application service (authenticated users) to write converted files to the `converted` bucket. The service runs with user authentication, so this policy allows any authenticated user to write to the converted bucket (but the application code ensures they only write to their own folder).

**Copy and run this SQL:**

```sql
-- Policy: Service can write converted files to converted bucket
CREATE POLICY "Service can write converted files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'converted'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**What this policy does:**
- ✅ Allows INSERT operations (file uploads)
- ✅ Only for authenticated users (service runs as authenticated user)
- ✅ Only to the 'converted' bucket
- ✅ Only if the first folder in the path matches the user's ID
- ❌ Blocks writing to other users' folders

**Note**: The application code is responsible for ensuring files are written to the correct user folder. This policy provides a safety check.

---

### Policy 6: Users Can Delete Their Converted Files (Optional)

This policy allows authenticated users to delete converted files from their own folder. This is optional but useful for user file management.

**Copy and run this SQL:**

```sql
-- Policy: Users can delete their converted files from converted bucket
CREATE POLICY "Users can delete their converted files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'converted' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**What this policy does:**
- ✅ Allows DELETE operations (file deletion)
- ✅ Only for authenticated users
- ✅ Only from the 'converted' bucket
- ✅ Only if the first folder in the path matches the user's ID
- ❌ Blocks deleting other users' files

---

## Step 4: Run All Policies (Complete Script)

For convenience, here's a complete script with all policies. You can copy and run this entire script in the SQL Editor:

```sql
-- ============================================================================
-- FluxConvert Storage Policies
-- Task 7.2: Configure storage policies for uploads and converted buckets
-- ============================================================================

-- UPLOADS BUCKET POLICIES
-- ============================================================================

-- Policy 1: Users can upload their own files to uploads bucket
CREATE POLICY "Users can upload their own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Users can read their own files from uploads bucket
CREATE POLICY "Users can read their own uploaded files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Users can delete their own files from uploads bucket (optional)
CREATE POLICY "Users can delete their own uploaded files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- CONVERTED BUCKET POLICIES
-- ============================================================================

-- Policy 4: Users can read their converted files from converted bucket
CREATE POLICY "Users can read their converted files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'converted' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 5: Service can write converted files to converted bucket
CREATE POLICY "Service can write converted files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'converted'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 6: Users can delete their converted files (optional)
CREATE POLICY "Users can delete their converted files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'converted' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- View all storage policies
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
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;

-- Count policies by bucket (should see policies for uploads and converted)
SELECT 
  policyname,
  cmd as operation,
  roles
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;
```

---

## Step 5: Verify Policies

After running the SQL script, verify the policies were created correctly.

### Method 1: Using SQL Query

Run this query in the SQL Editor:

```sql
-- View all storage policies
SELECT 
  policyname,
  cmd as operation,
  roles
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;
```

**Expected output** (6 policies):

| policyname | operation | roles |
|------------|-----------|-------|
| Service can write converted files | INSERT | {authenticated} |
| Users can delete their converted files | DELETE | {authenticated} |
| Users can delete their own uploaded files | DELETE | {authenticated} |
| Users can read their converted files | SELECT | {authenticated} |
| Users can read their own uploaded files | SELECT | {authenticated} |
| Users can upload their own files | INSERT | {authenticated} |

### Method 2: Using Supabase Dashboard

1. Go to **Authentication** → **Policies** in the Supabase Dashboard
2. Look for policies on the `storage.objects` table
3. You should see 6 policies listed (or 4 if you skipped the optional DELETE policies)

---

## Step 6: Test Policies (Optional)

To test that policies work correctly, you can use the Supabase JavaScript client:

### Test 1: Upload File to Uploads Bucket

```javascript
// This should succeed for authenticated users
const { data, error } = await supabase.storage
  .from('uploads')
  .upload(`${userId}/test-file.txt`, file);

console.log('Upload result:', { data, error });
// Expected: data contains file path, error is null
```

### Test 2: Read File from Uploads Bucket

```javascript
// This should succeed for the file owner
const { data, error } = await supabase.storage
  .from('uploads')
  .download(`${userId}/test-file.txt`);

console.log('Download result:', { data, error });
// Expected: data contains file blob, error is null
```

### Test 3: Upload File to Converted Bucket

```javascript
// This should succeed for authenticated users (service)
const { data, error } = await supabase.storage
  .from('converted')
  .upload(`${userId}/converted-file.pdf`, file);

console.log('Upload result:', { data, error });
// Expected: data contains file path, error is null
```

### Test 4: Read File from Converted Bucket

```javascript
// This should succeed for the file owner
const { data, error } = await supabase.storage
  .from('converted')
  .download(`${userId}/converted-file.pdf`);

console.log('Download result:', { data, error });
// Expected: data contains file blob, error is null
```

### Test 5: Access Another User's File (Should Fail)

```javascript
// This should FAIL - user cannot access other users' files
const { data, error } = await supabase.storage
  .from('uploads')
  .download(`other-user-id/their-file.txt`);

console.log('Download result:', { data, error });
// Expected: error is not null, contains permission denied message
```

---

## Understanding Policy Logic

### Path Extraction

The key to these policies is extracting the user ID from the file path:

```sql
(storage.foldername(name))[1]
```

**How it works:**

1. `name` is the full file path: `uploads/user-id/filename.txt`
2. `storage.foldername(name)` splits the path into an array: `['user-id', 'filename.txt']`
3. `[1]` gets the first element (user ID): `'user-id'`
4. Compare with `auth.uid()::text` (authenticated user's ID)

**Example:**
- File path: `uploads/123e4567-e89b-12d3-a456-426614174000/document.docx`
- Extracted user ID: `123e4567-e89b-12d3-a456-426614174000`
- Authenticated user ID: `123e4567-e89b-12d3-a456-426614174000`
- Match: ✅ Access granted

### Policy Conditions

**WITH CHECK** (for INSERT):
- Evaluated when creating new records
- Determines if the insert is allowed
- Used for upload operations

**USING** (for SELECT, DELETE):
- Evaluated when reading or deleting records
- Determines if the operation is allowed
- Used for download and delete operations

---

## Security Considerations

### What These Policies Protect Against

✅ **Unauthorized Access**: Users cannot access other users' files  
✅ **Data Leakage**: Files are isolated by user ID  
✅ **Malicious Uploads**: Users can only upload to their own folder  
✅ **Unauthorized Deletion**: Users can only delete their own files  
✅ **Anonymous Access**: Unauthenticated users have no direct storage access  

### What These Policies Do NOT Protect Against

❌ **Application Logic Errors**: If the application writes to the wrong folder, policies won't catch it (but will prevent access)  
❌ **Service Role Bypass**: Service role key bypasses RLS policies (keep it secret!)  
❌ **File Content Validation**: Policies don't validate file content (use MIME type restrictions on buckets)  

### Best Practices

1. **Never expose service role key** to the client
2. **Always use user authentication** for storage operations
3. **Validate file paths** in application code before storage operations
4. **Use signed URLs** for file downloads (time-limited access)
5. **Monitor storage usage** to detect abuse
6. **Regularly audit policies** to ensure they match requirements

---

## Troubleshooting

### Issue: "Permission denied" when uploading files

**Possible causes:**
1. User is not authenticated
2. File path doesn't match user ID
3. Policies not created correctly
4. Bucket doesn't exist

**Solutions:**
- Verify user is authenticated: `const { data: { user } } = await supabase.auth.getUser()`
- Check file path format: `uploads/{user-id}/{filename}`
- Re-run policy creation script
- Verify buckets exist in Storage dashboard

### Issue: "Policy already exists" error

**Solution:**
- Policies with the same name already exist
- Drop existing policies first:

```sql
-- Drop existing policies (if needed)
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own uploaded files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploaded files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their converted files" ON storage.objects;
DROP POLICY IF EXISTS "Service can write converted files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their converted files" ON storage.objects;
```

Then re-run the creation script.

### Issue: Policies created but still getting permission errors

**Possible causes:**
1. RLS not enabled on storage.objects table (should be enabled by default)
2. User ID in path doesn't match authenticated user
3. Bucket name mismatch

**Solutions:**
- Verify RLS is enabled:

```sql
-- Check if RLS is enabled on storage.objects
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';
-- rowsecurity should be true
```

- Log the file path and user ID in your application to debug
- Verify bucket names are exactly 'uploads' and 'converted' (case-sensitive)

### Issue: Cannot delete files

**Solution:**
- Ensure you created the DELETE policies (Policy 3 and Policy 6)
- If you skipped them, run:

```sql
-- Add DELETE policies
CREATE POLICY "Users can delete their own uploaded files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their converted files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'converted' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## Verification Checklist

Before proceeding to the next task, verify:

- [ ] All 6 policies created successfully (or 4 if skipping DELETE policies)
- [ ] Policies appear in `pg_policies` query results
- [ ] No SQL errors when running the script
- [ ] Test upload to `uploads` bucket succeeds for authenticated user
- [ ] Test download from `uploads` bucket succeeds for file owner
- [ ] Test upload to `converted` bucket succeeds for authenticated user
- [ ] Test download from `converted` bucket succeeds for file owner
- [ ] Test accessing another user's file fails with permission error
- [ ] Unauthenticated access fails with permission error

---

## Policy Summary

| Policy Name | Bucket | Operation | Role | Purpose |
|-------------|--------|-----------|------|---------|
| Users can upload their own files | uploads | INSERT | authenticated | Allow users to upload input files |
| Users can read their own uploaded files | uploads | SELECT | authenticated | Allow users to download their input files |
| Users can delete their own uploaded files | uploads | DELETE | authenticated | Allow users to delete their input files |
| Users can read their converted files | converted | SELECT | authenticated | Allow users to download converted files |
| Service can write converted files | converted | INSERT | authenticated | Allow service to save converted files |
| Users can delete their converted files | converted | DELETE | authenticated | Allow users to delete converted files |

---

## Next Steps

After completing this task, proceed to:

**Task 8.1-8.4**: Create storage utility functions
- Implement file upload function
- Implement file deletion function
- Implement signed URL generator
- Write unit tests for storage utilities

These utility functions will use the storage buckets and policies configured in Tasks 7.1 and 7.2.

---

## Related Documentation

- **Task 7.1 Summary**: `supabase/migrations/TASK_7.1_SUMMARY.md`
- **Storage Buckets Setup**: `supabase/STORAGE_BUCKETS_SETUP.md`
- **Storage Buckets Quick Reference**: `supabase/STORAGE_BUCKETS_QUICK_REFERENCE.md`
- **Design Document**: `.kiro/specs/app-enhancements/design.md` (Storage Policies section)
- **Requirements**: `.kiro/specs/app-enhancements/requirements.md` (Requirements 6.1, 6.2, 6.3)
- **Supabase Storage Docs**: https://supabase.com/docs/guides/storage
- **Supabase RLS Docs**: https://supabase.com/docs/guides/auth/row-level-security

---

## Additional Resources

### Supabase Storage Policy Examples

For more complex policy scenarios, see:
- https://supabase.com/docs/guides/storage/security/access-control
- https://supabase.com/docs/guides/storage/uploads/standard-uploads

### PostgreSQL Policy Documentation

For understanding PostgreSQL RLS policies:
- https://www.postgresql.org/docs/current/sql-createpolicy.html

---

**Document Version**: 1.0  
**Task**: 7.2 Configure storage policies  
**Requirements**: 6.1, 6.2, 6.3  
**Related Tasks**: 7.1 (Create storage buckets), 8.1-8.4 (Storage utility functions)

