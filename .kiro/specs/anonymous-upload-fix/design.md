# Anonymous Upload Fix Bugfix Design

## Overview

This bugfix addresses the issue where anonymous users (users who are not logged in) cannot upload and convert Word documents to PDF. The application code already supports anonymous users by using the path pattern `anonymous/{timestamp}-{filename}`, but the Supabase storage policies only allow `authenticated` users to perform INSERT operations on the `uploads` and `converted` buckets. This mismatch causes a "Failed to upload file to storage" error for anonymous users.

The fix involves updating storage bucket policies to allow `anon` (anonymous) role to INSERT files while maintaining strict RLS policies for SELECT, DELETE, and UPDATE operations to preserve security for authenticated users. The approach ensures anonymous users can upload and convert files without compromising the security model for authenticated users.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when an anonymous user (not logged in) attempts to upload a file to the Word to PDF converter
- **Property (P)**: The desired behavior when anonymous users upload files - files should be successfully uploaded to storage with path `anonymous/{timestamp}-{filename}` and conversion should complete
- **Preservation**: Existing authenticated user behavior that must remain unchanged - file ownership enforcement, RLS policies for read/delete/update operations, conversion history tracking
- **uploadFile**: The function in `src/lib/storage/operations.ts` that uploads files to Supabase storage buckets
- **createClient**: The function in `src/lib/supabase/server.ts` that creates a Supabase client with authentication context
- **anon role**: The Supabase role assigned to unauthenticated requests (uses NEXT_PUBLIC_SUPABASE_ANON_KEY)
- **authenticated role**: The Supabase role assigned to authenticated requests (users who are logged in)
- **RLS (Row Level Security)**: Postgres security feature that restricts database row access based on user identity
- **Storage Policy**: Supabase policy that controls access to storage bucket operations (INSERT, SELECT, DELETE, UPDATE)

## Bug Details

### Bug Condition

The bug manifests when an anonymous user (not logged in) attempts to upload a Word document for conversion to PDF. The `uploadFile` function in `src/lib/storage/operations.ts` is called with a Supabase client that has `anon` role context, but the storage bucket policies only allow `authenticated` role to perform INSERT operations. This causes the storage upload to fail with an authorization error.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { user: User | null, file: File, bucket: string }
  OUTPUT: boolean
  
  RETURN input.user IS NULL
         AND input.bucket IN ['uploads', 'converted']
         AND storagePolicy(input.bucket, 'INSERT') ONLY ALLOWS 'authenticated'
         AND currentRole() = 'anon'
END FUNCTION
```

### Examples

- **Example 1**: Anonymous user visits `/word-to-pdf`, uploads `document.docx` → Expected: File uploads to `anonymous/1234567890-document.docx` and converts successfully. Actual: Error "Failed to upload file to storage"
- **Example 2**: Anonymous user uploads `report.docx` (5MB) → Expected: File uploads and conversion completes with base64 download URL. Actual: Upload fails at storage layer before conversion starts
- **Example 3**: Anonymous user uploads `presentation.docx` → Expected: File record created with `user_id: null`, file stored in `anonymous/` folder. Actual: Storage INSERT rejected by policy, no file record created
- **Edge Case**: Anonymous user uploads file exactly at 50MB limit → Expected: File uploads successfully (within size limit). Actual: Upload fails due to policy, not size validation

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Authenticated users must continue to upload files to `{user_id}/{timestamp}-{filename}` paths
- Authenticated users must continue to have conversion records saved to database with full history tracking
- Authenticated users must continue to receive signed URLs for downloads (not base64)
- RLS policies for SELECT operations must continue to enforce user ownership (users can only read their own files)
- RLS policies for DELETE operations must continue to enforce user ownership (users can only delete their own files)
- RLS policies for UPDATE operations must continue to enforce user ownership (users can only update their own files)
- File cleanup job must continue to delete old files from both `uploads` and `converted` buckets
- Database RLS policies on `files` and `conversions` tables must remain unchanged

**Scope:**
All inputs that involve authenticated users (user_id is not null) should be completely unaffected by this fix. This includes:
- Authenticated user file uploads and conversions
- Dashboard conversion history viewing
- File download operations for authenticated users
- File deletion operations (manual or automated cleanup)
- Database queries filtered by user_id

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is:

1. **Storage Policy Mismatch**: The storage policies in `supabase/migrations/002_add_storage_policies.sql` only grant INSERT permission to `authenticated` role:
   ```sql
   CREATE POLICY "Allow authenticated uploads"
   ON storage.objects
   FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'uploads');
   ```
   However, the application code in `app/api/convert/word-to-pdf/route.ts` is designed to support anonymous users by checking `user?.id || null` and using `anonymous/` path prefix.

2. **Supabase Client Role Context**: When `createClient()` is called in `src/lib/supabase/server.ts` without an authenticated session, the client operates with `anon` role (using NEXT_PUBLIC_SUPABASE_ANON_KEY). This role is not granted INSERT permission by the current policies.

3. **Database vs Storage Policy Inconsistency**: The database RLS policies on the `files` table allow INSERT with `user_id: null` (no explicit check that user_id must equal auth.uid() for INSERT), but the storage policies do not allow `anon` role to INSERT at all.

4. **Path-Based Security Assumption**: The existing policies assume all files will be in user-specific folders (`{user_id}/...`) and use `storage.foldername(name)[1]` to extract user_id for SELECT/DELETE/UPDATE operations. Anonymous files in `anonymous/` folder don't fit this model, but this is acceptable since anonymous users don't need to read/delete their files later.

## Correctness Properties

Property 1: Bug Condition - Anonymous File Upload Success

_For any_ file upload request where the user is not authenticated (user_id is null) and the file is valid (.docx format, under 50MB), the fixed storage policies SHALL allow the file to be uploaded to the `uploads` bucket with path `anonymous/{timestamp}-{filename}`, and the conversion SHALL complete successfully returning a download URL.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Authenticated User Behavior

_For any_ file upload request where the user is authenticated (user_id is not null), the fixed storage policies SHALL produce exactly the same behavior as the original policies, preserving file uploads to `{user_id}/{timestamp}-{filename}` paths, database record creation, signed URL generation, and all RLS enforcement for read/delete/update operations.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `supabase/migrations/002_add_storage_policies.sql`

**Specific Changes**:

1. **Add Anonymous INSERT Policy for Uploads Bucket**: Create a new policy that allows `anon` role to INSERT files to the `uploads` bucket:
   ```sql
   CREATE POLICY "Allow anonymous uploads"
   ON storage.objects
   FOR INSERT
   TO anon
   WITH CHECK (
       bucket_id = 'uploads' 
       AND (storage.foldername(name))[1] = 'anonymous'
   );
   ```
   This policy restricts anonymous uploads to only the `anonymous/` folder path, preventing anonymous users from uploading to authenticated user folders.

2. **Add Anonymous INSERT Policy for Converted Bucket**: Create a new policy that allows `anon` role to INSERT files to the `converted` bucket:
   ```sql
   CREATE POLICY "Allow anonymous uploads to converted"
   ON storage.objects
   FOR INSERT
   TO anon
   WITH CHECK (
       bucket_id = 'converted' 
       AND (storage.foldername(name))[1] = 'anonymous'
   );
   ```
   This allows the conversion process to save output files for anonymous users.

3. **Add Anonymous SELECT Policy for Converted Bucket**: Create a policy that allows `anon` role to SELECT files from the `converted` bucket (needed for signed URL generation):
   ```sql
   CREATE POLICY "Allow anonymous read from converted"
   ON storage.objects
   FOR SELECT
   TO anon
   USING (
       bucket_id = 'converted' 
       AND (storage.foldername(name))[1] = 'anonymous'
   );
   ```
   This allows anonymous users to download their converted files via signed URLs.

4. **Verify Existing Policies Remain Unchanged**: Ensure all existing `authenticated` role policies remain exactly as they are - no modifications to authenticated user policies.

5. **Document Policy Rationale**: Add comments explaining that anonymous users can INSERT/SELECT but cannot DELETE/UPDATE, and that anonymous files are stored in `anonymous/` folder separate from user folders.

**Alternative Approach (if path-based restriction is too strict)**:
If the application needs more flexibility, we could allow `anon` role to INSERT to any path but add application-level validation. However, the path-based restriction is more secure and aligns with the existing code pattern.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code (storage policies without `anon` role permissions), then verify the fix works correctly and preserves existing authenticated user behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that anonymous users cannot upload files due to storage policy restrictions.

**Test Plan**: Write tests that simulate anonymous user file uploads by creating a Supabase client without authentication context and attempting to upload files to `uploads` and `converted` buckets. Run these tests on the UNFIXED storage policies to observe authorization failures.

**Test Cases**:
1. **Anonymous Upload to Uploads Bucket**: Create unauthenticated Supabase client, attempt to upload file to `uploads/anonymous/test.docx` (will fail with authorization error on unfixed policies)
2. **Anonymous Upload to Converted Bucket**: Create unauthenticated Supabase client, attempt to upload file to `converted/anonymous/test.pdf` (will fail with authorization error on unfixed policies)
3. **Anonymous End-to-End Conversion**: Call `/api/convert/word-to-pdf` endpoint without authentication cookies, upload valid .docx file (will fail at storage upload step on unfixed policies)
4. **Anonymous Large File Upload**: Attempt to upload 45MB file as anonymous user (should fail due to policy, not size validation, on unfixed code)

**Expected Counterexamples**:
- Storage operations return authorization errors like "new row violates row-level security policy" or "permission denied for relation objects"
- API endpoint returns "Failed to upload file to storage" error
- Possible causes: missing `anon` role in storage policies, path restrictions preventing anonymous folder access

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds (anonymous user uploads), the fixed storage policies produce the expected behavior (successful upload and conversion).

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := uploadFile_fixed(input.bucket, input.path, input.file)
  ASSERT result.error IS NULL
  ASSERT result.path MATCHES 'anonymous/{timestamp}-{filename}'
  ASSERT fileExistsInStorage(input.bucket, result.path)
END FOR
```

**Test Cases**:
1. **Anonymous Upload Success**: Verify anonymous user can upload .docx file to `uploads` bucket
2. **Anonymous Conversion Success**: Verify anonymous user can complete full Word to PDF conversion
3. **Anonymous Download URL Generation**: Verify anonymous user receives valid download URL (base64 or signed URL)
4. **Anonymous File Path Validation**: Verify files are stored in `anonymous/` folder with correct naming pattern

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (authenticated user uploads), the fixed storage policies produce the same result as the original policies.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT uploadFile_original(input) = uploadFile_fixed(input)
  ASSERT databaseRecord_original(input) = databaseRecord_fixed(input)
  ASSERT rlsEnforcement_original(input) = rlsEnforcement_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain (different file sizes, types, user IDs)
- It catches edge cases that manual unit tests might miss (boundary conditions, concurrent uploads)
- It provides strong guarantees that behavior is unchanged for all authenticated user scenarios

**Test Plan**: Observe behavior on UNFIXED policies first for authenticated users (should work correctly), then write property-based tests capturing that behavior and verify it continues after adding anonymous policies.

**Test Cases**:
1. **Authenticated Upload Preservation**: Observe that authenticated users can upload files to `{user_id}/` folders on unfixed policies, then verify this continues after fix
2. **Authenticated Conversion History Preservation**: Observe that conversion records are created in database for authenticated users on unfixed code, then verify this continues after fix
3. **Authenticated RLS Enforcement Preservation**: Observe that authenticated users cannot access other users' files on unfixed policies, then verify this continues after fix
4. **Authenticated Signed URL Preservation**: Observe that authenticated users receive signed URLs (not base64) on unfixed code, then verify this continues after fix
5. **File Cleanup Job Preservation**: Observe that cleanup job can delete old files on unfixed policies, then verify this continues after fix

### Unit Tests

- Test anonymous user file upload to `uploads` bucket with valid .docx file
- Test anonymous user file upload to `converted` bucket with PDF output
- Test authenticated user file upload continues to work with user-specific paths
- Test storage policy enforcement: anonymous users cannot upload to `{user_id}/` folders
- Test storage policy enforcement: anonymous users cannot DELETE or UPDATE files
- Test edge cases: file at size limit, special characters in filename, concurrent uploads

### Property-Based Tests

- Generate random file sizes (1KB to 50MB) and verify anonymous uploads succeed for all valid sizes
- Generate random authenticated user IDs and verify uploads continue to work with user-specific paths
- Generate random file paths and verify anonymous users can only upload to `anonymous/` folder
- Test that authenticated users cannot access files in `anonymous/` folder (RLS enforcement)
- Test that anonymous users cannot access files in `{user_id}/` folders (RLS enforcement)

### Integration Tests

- Test full anonymous user flow: upload .docx → convert to PDF → receive download URL → verify file exists in storage
- Test full authenticated user flow: upload .docx → convert to PDF → verify database record → verify signed URL → verify dashboard shows conversion
- Test mixed scenario: anonymous upload followed by authenticated upload (verify no interference)
- Test cleanup job: verify old anonymous files are deleted along with authenticated user files
- Test concurrent uploads: multiple anonymous users uploading simultaneously (verify no conflicts)
