# Word to PDF Anonymous Upload Fix - Bugfix Design

## Overview

This bugfix addresses the Row-Level Security (RLS) policy violation that prevents anonymous users from uploading Word files for conversion to PDF. The current RLS policies on the `files` and `conversions` tables require `auth.uid()` to match `user_id`, which fails for anonymous users where `user_id` is NULL. The fix involves modifying RLS policies to allow INSERT operations for anonymous users while maintaining security for authenticated users, and adjusting storage bucket policies to permit anonymous uploads to specific paths.

The fix is minimal and targeted: we modify only the RLS policies and storage permissions necessary to enable anonymous uploads, without changing application logic or data structures. This ensures authenticated user functionality remains completely unchanged.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when anonymous users (auth.uid() IS NULL) attempt to INSERT records into the `files` or `conversions` tables
- **Property (P)**: The desired behavior when anonymous users upload files - INSERT operations should succeed with user_id = NULL
- **Preservation**: Existing authenticated user behavior that must remain unchanged - RLS policies continue to restrict authenticated users to their own files
- **RLS (Row-Level Security)**: PostgreSQL security feature that restricts which rows users can access based on policies
- **auth.uid()**: Supabase function that returns the authenticated user's ID, or NULL for anonymous users
- **Storage Bucket**: Supabase Storage container for files (uploads, converted)
- **Anonymous User**: User who has not logged in, where auth.uid() returns NULL

## Bug Details

### Bug Condition

The bug manifests when an anonymous user attempts to upload a Word file for conversion. The `createFileRecord` function in `src/lib/database/files.ts` attempts to INSERT a record with `user_id: null`, but the RLS policy "Users can insert their own files" requires `auth.uid() = user_id`. Since `NULL = NULL` evaluates to NULL (not TRUE) in SQL, the policy check fails.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { user_id: string | null, operation: string, table: string }
  OUTPUT: boolean
  
  RETURN input.user_id IS NULL
         AND input.operation = 'INSERT'
         AND input.table IN ['files', 'conversions']
         AND auth.uid() IS NULL
         AND RLS_policy_requires_user_id_match(input.table)
END FUNCTION
```

### Examples

- **Example 1**: Anonymous user uploads "report.docx" → `createFileRecord({ user_id: null, ... })` → RLS policy violation (error code 42501) → "Failed to upload file to storage"
- **Example 2**: Anonymous user clicks "Convert to PDF" → API route calls `uploadFile()` → succeeds → calls `createFileRecord()` → RLS policy violation → conversion fails
- **Example 3**: Authenticated user uploads "document.docx" → `createFileRecord({ user_id: "abc-123", ... })` → RLS policy passes (auth.uid() = user_id) → success
- **Edge Case**: Anonymous user attempts to upload to storage bucket → storage policy may also block if not configured for anonymous access → upload fails before database INSERT

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Authenticated users must continue to be restricted to viewing, inserting, and deleting only their own files
- Authenticated users must continue to be restricted to viewing, inserting, and updating only their own conversions
- Dashboard functionality for authenticated users must continue to display only their conversion history
- File storage paths for authenticated users must continue to use format `{user_id}/{timestamp}-{filename}`
- All existing RLS policies for authenticated users must continue to enforce user_id matching

**Scope:**
All inputs that do NOT involve anonymous users (where auth.uid() IS NOT NULL) should be completely unaffected by this fix. This includes:
- Authenticated user file uploads and conversions
- Authenticated user dashboard access
- Authenticated user file downloads
- Any SELECT, UPDATE, or DELETE operations by authenticated users

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **RLS Policy on `files` Table**: The policy "Users can insert their own files" uses `WITH CHECK (auth.uid() = user_id)`, which fails for anonymous users because `NULL = NULL` is NULL in SQL, not TRUE. The policy needs to allow INSERTs where both `auth.uid()` and `user_id` are NULL.

2. **RLS Policy on `conversions` Table**: Similarly, "Users can insert their own conversions" uses `WITH CHECK (auth.uid() = user_id)`, which will fail if anonymous conversions are created (though currently the code skips conversion records for anonymous users).

3. **Storage Bucket Policies**: The `uploads` and `converted` buckets may have policies that require authentication, blocking anonymous users from uploading files even before the database INSERT is attempted.

4. **Missing NULL Handling in RLS**: SQL's three-valued logic (TRUE, FALSE, NULL) means that `NULL = NULL` does not evaluate to TRUE, so the current equality check fails for anonymous users.

## Correctness Properties

Property 1: Bug Condition - Anonymous User File Upload

_For any_ file upload request where the user is not authenticated (auth.uid() IS NULL) and user_id is NULL, the fixed RLS policies SHALL allow the INSERT operation to succeed, enabling anonymous users to upload files and create file records in the database.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Authenticated User Restrictions

_For any_ file or conversion operation where the user is authenticated (auth.uid() IS NOT NULL), the fixed RLS policies SHALL continue to enforce the same restrictions as before, ensuring authenticated users can only access their own files and conversions.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `supabase/schema.sql`

**Section**: RLS Policies for `files` table

**Specific Changes**:

1. **Modify "Users can insert their own files" policy**:
   - **Current**: `WITH CHECK (auth.uid() = user_id)`
   - **Fixed**: `WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL))`
   - **Rationale**: Allow INSERTs where both auth.uid() and user_id are NULL (anonymous users) OR where they match (authenticated users)

2. **Modify "Users can view their own files" policy** (if needed for anonymous downloads):
   - **Current**: `USING (auth.uid() = user_id)`
   - **Consider**: May need adjustment if anonymous users need to retrieve their files, but current implementation uses signed URLs or base64, so likely no change needed
   - **Decision**: No change needed - anonymous users receive files via data URLs, not database queries

3. **Modify "Users can delete their own files" policy**:
   - **Current**: `USING (auth.uid() = user_id)`
   - **Decision**: No change needed - anonymous users should not be able to delete files (cleanup handled by cron job)

4. **Modify "Users can insert their own conversions" policy** (for future-proofing):
   - **Current**: `WITH CHECK (auth.uid() = user_id)`
   - **Fixed**: `WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL))`
   - **Rationale**: Although current code skips conversion records for anonymous users, this enables future functionality if needed

5. **Storage Bucket Policies** (configured in Supabase Dashboard):
   - **Bucket**: `uploads`
   - **Policy Name**: "Allow anonymous uploads to anonymous folder"
   - **Operation**: INSERT
   - **Policy**: `bucket_id = 'uploads' AND (auth.uid() = (storage.foldername(name))[1] OR (storage.foldername(name))[1] = 'anonymous')`
   - **Rationale**: Allow uploads to `anonymous/*` path for anonymous users, and `{user_id}/*` for authenticated users

6. **Storage Bucket Policies** (configured in Supabase Dashboard):
   - **Bucket**: `converted`
   - **Policy Name**: "Allow anonymous uploads to anonymous folder"
   - **Operation**: INSERT
   - **Policy**: `bucket_id = 'converted' AND (auth.uid() = (storage.foldername(name))[1] OR (storage.foldername(name))[1] = 'anonymous')`
   - **Rationale**: Allow uploads to `anonymous/*` path for converted files from anonymous users

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write integration tests that simulate anonymous user file uploads by making API requests without authentication headers. Run these tests on the UNFIXED code to observe RLS policy violations and confirm the root cause.

**Test Cases**:
1. **Anonymous File Upload Test**: POST to `/api/convert/word-to-pdf` without auth headers with a valid .docx file (will fail on unfixed code with "Failed to upload file to storage")
2. **Anonymous Database Insert Test**: Directly attempt to INSERT into `files` table with `user_id: null` using Supabase client without auth (will fail with error code 42501)
3. **Anonymous Storage Upload Test**: Attempt to upload file to `uploads/anonymous/test.docx` without auth (may fail if storage policies block anonymous uploads)
4. **Authenticated Upload Test**: POST to `/api/convert/word-to-pdf` with valid auth headers (should succeed on unfixed code - baseline)

**Expected Counterexamples**:
- Anonymous file upload fails with "Failed to upload file to storage" error
- Database INSERT fails with "new row violates row-level security policy for table 'files'" (error code: 42501)
- Possible causes: RLS policy requires auth.uid() = user_id, storage policy blocks anonymous uploads

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := createFileRecord_fixed(input)
  ASSERT result.id IS NOT NULL AND result.error IS NULL
  ASSERT file_record_exists_in_database(result.id)
END FOR
```

**Test Plan**: After applying RLS policy fixes, run the same tests that failed during exploratory checking and verify they now succeed.

**Test Cases**:
1. **Anonymous File Upload Success**: POST to `/api/convert/word-to-pdf` without auth → should return 200 with downloadUrl
2. **Anonymous Database Insert Success**: INSERT into `files` with `user_id: null` → should succeed and return file ID
3. **Anonymous Storage Upload Success**: Upload to `uploads/anonymous/test.docx` → should succeed
4. **Anonymous Full Conversion Flow**: Upload .docx → convert → download PDF → all steps succeed

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT createFileRecord_original(input) = createFileRecord_fixed(input)
  ASSERT RLS_policy_behavior_unchanged(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all authenticated user inputs

**Test Plan**: Observe behavior on UNFIXED code first for authenticated user operations, then write property-based tests capturing that behavior and verify it remains unchanged after the fix.

**Test Cases**:
1. **Authenticated File Upload Preservation**: Observe that authenticated users can upload files on unfixed code, then verify this continues after fix with same behavior
2. **Authenticated File Access Restriction Preservation**: Observe that User A cannot access User B's files on unfixed code, then verify this restriction continues after fix
3. **Dashboard History Preservation**: Observe that authenticated users see only their own conversions on unfixed code, then verify this continues after fix
4. **File Path Format Preservation**: Observe that authenticated user files use `{user_id}/{timestamp}-{filename}` format on unfixed code, then verify this continues after fix
5. **RLS Policy Enforcement Preservation**: Generate random authenticated user operations (SELECT, INSERT, UPDATE, DELETE) and verify RLS policies enforce the same restrictions before and after fix

### Unit Tests

- Test RLS policy evaluation for anonymous users (auth.uid() IS NULL, user_id IS NULL) → should allow INSERT
- Test RLS policy evaluation for authenticated users (auth.uid() = user_id) → should allow INSERT
- Test RLS policy evaluation for mismatched users (auth.uid() != user_id) → should deny INSERT
- Test storage policy evaluation for anonymous uploads to `anonymous/*` path → should allow
- Test storage policy evaluation for authenticated uploads to `{user_id}/*` path → should allow
- Test storage policy evaluation for authenticated uploads to wrong user path → should deny

### Property-Based Tests

- Generate random file upload requests with varying auth states (authenticated, anonymous) and verify correct RLS policy behavior
- Generate random user IDs and file operations to verify authenticated users can only access their own files
- Generate random storage paths and verify storage policies correctly allow/deny based on auth state and path
- Test that all authenticated user operations produce identical results before and after fix across many scenarios

### Integration Tests

- Test full anonymous user flow: upload .docx → convert → download PDF → verify all steps succeed
- Test full authenticated user flow: login → upload .docx → convert → view in dashboard → download PDF → verify all steps succeed
- Test that anonymous files are stored in `anonymous/*` path and authenticated files in `{user_id}/*` path
- Test that authenticated users cannot access anonymous user files and vice versa
- Test file cleanup cron job correctly deletes old anonymous and authenticated files
