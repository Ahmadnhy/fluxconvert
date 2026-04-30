# Supabase Storage Setup Guide

## Overview

This guide explains how to configure Supabase Storage buckets and policies to fix Bug 3: "File Upload Error" where authenticated users cannot upload files.

## Problem

Authenticated users encounter the error "Failed to upload file to storage" when uploading DOCX files for conversion. This is caused by missing Row Level Security (RLS) policies on the storage buckets.

## Solution

Apply RLS policies to the 'uploads' and 'converted' storage buckets to allow authenticated users to upload, read, update, and delete their own files.

## Prerequisites

- Access to Supabase Dashboard
- Project URL and API keys configured in `.env.local`
- Supabase project with authentication enabled

## Step 1: Verify Storage Buckets Exist

1. Open your Supabase Dashboard
2. Navigate to: **Storage** (left sidebar)
3. Verify these buckets exist:
   - `uploads` (private)
   - `converted` (private)
   - `temp` (private, optional)

### If Buckets Don't Exist

Create them manually:

1. Click **"New bucket"**
2. Enter bucket name: `uploads`
3. Set **Public bucket**: OFF (keep it private)
4. Click **"Create bucket"**
5. Repeat for `converted` and `temp` buckets

## Step 2: Apply Storage Policies

You have two options to apply the policies:

### Option A: Using SQL Editor (Recommended)

1. Navigate to: **SQL Editor** in Supabase Dashboard
2. Click **"New query"**
3. Copy the entire contents of `supabase/migrations/002_add_storage_policies.sql`
4. Paste into the SQL Editor
5. Click **"Run"** to execute
6. Verify success message appears

### Option B: Using Storage UI

For each bucket (`uploads` and `converted`):

1. Navigate to: **Storage** → Select bucket → **Policies** tab
2. Click **"New Policy"**
3. Create the following policies:

#### For 'uploads' bucket:

**Policy 1: Allow authenticated uploads**
- Policy name: `Allow authenticated uploads`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- WITH CHECK expression: `bucket_id = 'uploads'`

**Policy 2: Allow users to read their own uploads**
- Policy name: `Allow authenticated users to read their own uploads`
- Allowed operation: `SELECT`
- Target roles: `authenticated`
- USING expression: `bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]`

**Policy 3: Allow users to delete their own uploads**
- Policy name: `Allow authenticated users to delete their own uploads`
- Allowed operation: `DELETE`
- Target roles: `authenticated`
- USING expression: `bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]`

**Policy 4: Allow users to update their own uploads**
- Policy name: `Allow authenticated users to update their own uploads`
- Allowed operation: `UPDATE`
- Target roles: `authenticated`
- USING expression: `bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]`

#### For 'converted' bucket:

Repeat the same policies, replacing `'uploads'` with `'converted'` in all expressions.

## Step 3: Verify Policies Are Applied

### Using SQL Editor

Run this query to verify policies exist:

```sql
SELECT 
    policyname, 
    cmd as operation,
    qual as using_expression,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (qual LIKE '%uploads%' OR qual LIKE '%converted%')
ORDER BY policyname;
```

Expected output: You should see 8 policies (4 for 'uploads', 4 for 'converted').

### Using Storage UI

1. Navigate to: **Storage** → `uploads` → **Policies**
2. Verify you see 4 policies listed
3. Navigate to: **Storage** → `converted` → **Policies**
4. Verify you see 4 policies listed

## Step 4: Test the Fix

### Manual Testing

1. Start the application: `npm run dev`
2. Register or login as an authenticated user
3. Navigate to the Word-to-PDF converter
4. Upload a DOCX file (e.g., test.docx)
5. **Expected**: Upload succeeds and conversion completes
6. **Previous behavior**: Error "Failed to upload file to storage"

### Automated Testing

Run the bug condition exploration test:

```bash
npm test tests/bugfix/file-upload-bug-condition.test.ts
```

**Expected**: Test should PASS (previously failed on unfixed code)

Run the preservation tests:

```bash
npm test tests/bugfix/file-upload-preservation.test.ts
```

**Expected**: All tests should PASS (confirms no regressions)

## Understanding the Policies

### File Path Structure

Files are stored with this path structure:
```
{user_id}/{timestamp}-{filename}
```

Example:
```
550e8400-e29b-41d4-a716-446655440000/1704067200000-document.docx
```

### Policy Logic

**INSERT Policy**: Allows any authenticated user to upload files to the bucket
```sql
WITH CHECK (bucket_id = 'uploads')
```

**SELECT/DELETE/UPDATE Policies**: Restricts access to files in the user's own folder
```sql
USING (
    bucket_id = 'uploads' 
    AND auth.uid()::text = (storage.foldername(name))[1]
)
```

The expression `(storage.foldername(name))[1]` extracts the first folder name from the file path, which is the user_id. This ensures users can only access files in their own folder.

## Security Considerations

- ✓ All buckets are set to **PRIVATE** (not public)
- ✓ RLS policies enforce user-level access control
- ✓ Users can only access files in folders matching their `auth.uid()`
- ✓ INSERT policies allow any authenticated user to upload
- ✓ SELECT/DELETE/UPDATE policies restrict access to own files only
- ✓ Unauthenticated users have no access to storage buckets

## Troubleshooting

### Issue: Policies don't appear after running SQL

**Solution**: 
- Refresh the Supabase Dashboard page
- Check SQL Editor for error messages
- Verify you're connected to the correct project

### Issue: Upload still fails after applying policies

**Possible causes**:
1. **Bucket doesn't exist**: Verify bucket exists in Storage
2. **Bucket is public**: Ensure bucket is set to PRIVATE
3. **Wrong bucket name**: Verify code uses 'uploads' (not 'upload' or 'uploaded')
4. **Authentication issue**: Verify user is logged in and session is valid
5. **File path format**: Verify file path starts with user_id

**Debug steps**:
1. Check browser console for detailed error messages
2. Check server logs for Supabase storage errors
3. Verify `auth.uid()` returns a valid user ID
4. Test with a simple file (< 1 KB) to rule out size issues

### Issue: User can access other users' files

**Solution**: 
- Verify SELECT/DELETE/UPDATE policies include the folder check:
  ```sql
  auth.uid()::text = (storage.foldername(name))[1]
  ```
- Ensure file paths are created with user_id as the first folder

### Issue: Unauthenticated conversion stopped working

**Solution**: 
- This should NOT happen - unauthenticated conversions don't use storage
- Verify the route handler still has conditional storage logic:
  ```typescript
  if (userId) {
    // Upload to storage (authenticated users only)
  } else {
    // Return base64 result (unauthenticated users)
  }
  ```
- Run preservation tests to verify: `npm test tests/bugfix/file-upload-preservation.test.ts`

## Additional Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Supabase Storage RLS Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

## Support

If you encounter issues not covered in this guide:
1. Check the Supabase Dashboard logs
2. Review the application server logs
3. Run the test suite to identify specific failures
4. Consult the Supabase community or documentation

## Conclusion

After applying these storage policies, authenticated users should be able to:
- ✓ Upload DOCX files to the 'uploads' bucket
- ✓ Convert files to PDF successfully
- ✓ Download converted PDF files
- ✓ Access only their own files
- ✓ Delete their own files

Unauthenticated users should continue to:
- ✓ Convert files without storage (base64 result)
- ✓ Receive the same validation errors
- ✓ Experience no changes in functionality

**Bug Status**: FIXED (after applying policies)
