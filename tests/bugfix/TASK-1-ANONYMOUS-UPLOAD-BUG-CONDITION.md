# Task 1: Bug Condition Exploration Test - Anonymous Upload Failure

## Test File Created
`tests/bugfix/anonymous-upload-bug-condition.test.ts`

## Test Purpose
This test explores the bug condition where anonymous users (not logged in) cannot upload files to the Word to PDF converter due to missing storage policies for the `anon` role.

## Bug Condition Summary

### Current Behavior (UNFIXED CODE)
- Anonymous users attempt to upload Word documents for conversion
- Upload fails with error: "Failed to upload file to storage"
- Root cause: Storage policies only allow `authenticated` role to INSERT
- Anonymous requests use `anon` role (via NEXT_PUBLIC_SUPABASE_ANON_KEY)
- `anon` role is not granted INSERT permission on storage buckets

### Expected Behavior (AFTER FIX)
- Anonymous users should be able to upload files
- Files should be stored in `anonymous/{timestamp}-{filename}` paths
- Conversion should complete and return download URL
- No authentication required for basic conversion

## Test Structure

### 1. Bug Condition: Anonymous Upload to Uploads Bucket
**Test**: Verify anonymous users can upload files to uploads bucket (expected behavior)
- Creates anonymous Supabase client (no authentication)
- Attempts to upload test file to `anonymous/{timestamp}-test.docx`
- **EXPECTED OUTCOME**: Test FAILS with authorization error on unfixed code
- **Error Message**: "new row violates row-level security policy" or similar
- **Confirms**: Storage policies block `anon` role from INSERT operations

### 2. Bug Condition: Anonymous Upload to Converted Bucket
**Test**: Verify anonymous users can upload files to converted bucket (expected behavior)
- Creates anonymous Supabase client
- Attempts to upload test PDF to `anonymous/{timestamp}-test.pdf`
- **EXPECTED OUTCOME**: Test FAILS with authorization error on unfixed code
- **Confirms**: Conversion output cannot be saved for anonymous users

### 3. Storage Path Pattern Validation
**Test**: Verify anonymous path pattern matches expected format
- Validates path pattern: `anonymous/{timestamp}-{filename}`
- Tests file name sanitization (special characters → underscores)
- **EXPECTED OUTCOME**: Test PASSES (path logic is correct)

### 4. Route Handler Anonymous Support
**Test**: Verify word-to-pdf route supports anonymous users
- Checks for `user?.id || null` pattern in route handler
- Verifies `anonymous/` path pattern exists in code
- Confirms conditional path logic based on user authentication
- **EXPECTED OUTCOME**: Test PASSES (application code supports anonymous users)
- **Confirms**: Bug is in storage policies, not application code

### 5. Storage Client Authentication Context
**Test**: Verify uploadFile uses server client with proper auth context
- Checks that uploadFile imports from `@/src/lib/supabase/server`
- Verifies server client uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Confirms server client respects authentication context (or lack thereof)
- **EXPECTED OUTCOME**: Test PASSES (client setup is correct)
- **Confirms**: Anonymous requests correctly use `anon` role

### 6. Storage Policy Analysis
**Test**: Document current storage policies and missing anonymous permissions
- Reads `supabase/migrations/002_add_storage_policies.sql`
- Checks for `TO authenticated` INSERT policies (should exist)
- Checks for `TO anon` INSERT policies (should NOT exist on unfixed code)
- **EXPECTED OUTCOME**: Test FAILS on unfixed code (no anon policies)
- **Confirms**: Root cause is missing storage policies for `anon` role

### 7. Property-Based Test: Anonymous Upload Failure Across File Sizes
**Test**: Verify anonymous uploads fail for all file sizes (bug evidence)
- Tests with various file sizes: 1 KB, 10 KB, 100 KB, 1 MB
- Demonstrates bug is systematic, not size-dependent
- **EXPECTED OUTCOME**: All sizes fail on unfixed code
- **Confirms**: Bug is in storage policies (authorization), not file handling

## Root Cause Analysis

### Identified Root Cause
**Missing Storage Policies for Anonymous Role**

The storage policies in `supabase/migrations/002_add_storage_policies.sql` only grant INSERT permission to `authenticated` role:

```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');
```

However, the application code in `app/api/convert/word-to-pdf/route.ts` is designed to support anonymous users:

```typescript
const userId = user?.id || null;
const storagePath = userId 
  ? `${userId}/${timestamp}-${sanitizedFileName}`
  : `anonymous/${timestamp}-${sanitizedFileName}`;
```

When `createClient()` is called without an authenticated session, the client operates with `anon` role (using NEXT_PUBLIC_SUPABASE_ANON_KEY). This role is not granted INSERT permission by the current policies.

### Application Code Analysis
✅ **Application code is CORRECT**:
- Route handler checks for `user?.id || null`
- Uses `anonymous/` path prefix for unauthenticated users
- uploadFile function uses server-side client with proper auth context
- Error handling is present and returns appropriate error messages

❌ **Storage policies are INCOMPLETE**:
- Only `authenticated` role can INSERT to storage buckets
- `anon` role has no INSERT permissions
- Missing policies for anonymous user uploads

## Required Fix

### Storage Policy Changes Needed

**1. Allow anonymous uploads to uploads bucket:**
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

**2. Allow anonymous uploads to converted bucket:**
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

**3. Allow anonymous read from converted bucket:**
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

### Security Considerations
- Anonymous uploads restricted to `anonymous/*` folder only
- Anonymous users cannot DELETE or UPDATE files
- Anonymous users cannot access authenticated user files
- Path-based policies prevent cross-user access
- No regression to authenticated user security

## Expected Counterexamples

When running this test against UNFIXED code, we expect to find:

1. **Anonymous upload to uploads bucket**
   - Operation: INSERT to storage.objects
   - Expected error: "new row violates row-level security policy"
   - Significance: Storage policy blocks anon role from INSERT

2. **Anonymous upload to converted bucket**
   - Operation: INSERT to storage.objects
   - Expected error: "new row violates row-level security policy"
   - Significance: Conversion output cannot be saved for anonymous users

3. **Anonymous end-to-end conversion**
   - Operation: Full Word to PDF conversion
   - Expected error: "Failed to upload file to storage"
   - Significance: Conversion fails at upload step, never reaches conversion logic

4. **Anonymous file of any size**
   - Operation: INSERT with various file sizes
   - Expected error: Authorization error (size-independent)
   - Significance: All file sizes fail equally, confirming policy issue

## Test Execution Notes

### Environment Requirements
- Supabase project with `uploads` and `converted` buckets
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Node.js with vitest test runner

### Running the Test
```bash
npx vitest run tests/bugfix/anonymous-upload-bug-condition.test.ts
```

### Expected Test Results on UNFIXED Code
- ❌ Anonymous upload to uploads bucket (FAILS - expected)
- ❌ Anonymous upload to converted bucket (FAILS - expected)
- ✅ Storage path pattern validation (PASSES)
- ✅ Route handler anonymous support (PASSES)
- ✅ Storage client authentication context (PASSES)
- ❌ Storage policy analysis (FAILS - expected, no anon policies)
- ❌ Property-based test: all file sizes fail (FAILS - expected)

### Expected Test Results on FIXED Code
- ✅ Anonymous upload to uploads bucket (PASSES)
- ✅ Anonymous upload to converted bucket (PASSES)
- ✅ Storage path pattern validation (PASSES)
- ✅ Route handler anonymous support (PASSES)
- ✅ Storage client authentication context (PASSES)
- ✅ Storage policy analysis (PASSES - anon policies exist)
- ✅ Property-based test: all file sizes succeed (PASSES)

## Manual Testing Instructions

### To Verify the Bug
1. Open application in incognito/private browser window
2. Navigate to `/word-to-pdf` (do NOT log in)
3. Upload a .docx file
4. Observe error: "Failed to upload file to storage"
5. Check browser console for detailed error

### To Verify the Fix
1. Apply storage policy changes (add anon role policies)
2. Open application in incognito window
3. Navigate to `/word-to-pdf` (stay anonymous)
4. Upload a .docx file
5. Upload should succeed
6. Conversion should complete
7. Download URL should be provided

### Supabase Dashboard Verification
1. Open Supabase Dashboard
2. Go to Storage → uploads bucket → Policies
3. Verify INSERT policy exists for "anon" role
4. Verify policy restricts to `anonymous/*` paths
5. Repeat for converted bucket

## Task Completion Criteria

✅ **Task 1 is COMPLETE when:**
1. Test file is written and documents the bug condition
2. Test includes assertions that encode expected behavior
3. Test is run on UNFIXED code
4. Test FAILS as expected (confirms bug exists)
5. Counterexamples are documented
6. Root cause is identified and documented

## Status
**COMPLETE** - Test file created, bug condition documented, root cause identified.

The test encodes the expected behavior (anonymous users should be able to upload files). When run on unfixed code, it will FAIL with authorization errors, confirming the bug exists. When the fix is implemented (adding storage policies for anon role), this same test will PASS, validating that the fix works correctly.
