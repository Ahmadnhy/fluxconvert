# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Anonymous User RLS Policy Violation
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing cases - anonymous user (auth.uid() IS NULL) attempting to INSERT file record with user_id = NULL
  - Test that anonymous file upload fails with RLS policy violation on UNFIXED code
  - Create integration test that POSTs to `/api/convert/word-to-pdf` without authentication headers with a valid .docx file
  - Test direct database INSERT into `files` table with `user_id: null` using Supabase client without auth
  - Test storage upload to `uploads/anonymous/test.docx` without authentication
  - The test assertions should match the Expected Behavior Properties: INSERT operations should succeed with user_id = NULL
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS with "Failed to upload file to storage" or RLS policy violation error (error code 42501)
  - Document counterexamples found: specific error messages, stack traces, and which operation fails (storage upload vs database INSERT)
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Authenticated User Restrictions Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for authenticated user operations
  - Test authenticated user file upload: POST to `/api/convert/word-to-pdf` with valid auth headers → observe success
  - Test authenticated user file access restriction: User A attempts to access User B's files → observe denial
  - Test dashboard history: Authenticated user views dashboard → observe only their own conversions displayed
  - Test file path format: Authenticated user uploads file → observe path format `{user_id}/{timestamp}-{filename}`
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Generate random authenticated user operations (SELECT, INSERT, UPDATE, DELETE) and verify RLS policies enforce user_id matching
  - Generate random user IDs and file operations to verify users can only access their own files
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix RLS policies to allow anonymous user uploads

  - [x] 3.1 Modify RLS policy for files table INSERT operations
    - Open `supabase/schema.sql` file
    - Locate the policy "Users can insert their own files" on the `files` table
    - Change `WITH CHECK (auth.uid() = user_id)` to `WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL))`
    - This allows INSERTs where both auth.uid() and user_id are NULL (anonymous users) OR where they match (authenticated users)
    - _Bug_Condition: isBugCondition(input) where input.user_id IS NULL AND input.operation = 'INSERT' AND input.table = 'files' AND auth.uid() IS NULL_
    - _Expected_Behavior: INSERT operations succeed with user_id = NULL for anonymous users_
    - _Preservation: Authenticated users continue to be restricted to inserting only their own files (auth.uid() = user_id)_
    - _Requirements: 2.1, 2.2, 3.1, 3.5_

  - [x] 3.2 Modify RLS policy for conversions table INSERT operations (future-proofing)
    - In `supabase/schema.sql`, locate the policy "Users can insert their own conversions" on the `conversions` table
    - Change `WITH CHECK (auth.uid() = user_id)` to `WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL))`
    - Although current code skips conversion records for anonymous users, this enables future functionality if needed
    - _Bug_Condition: isBugCondition(input) where input.user_id IS NULL AND input.operation = 'INSERT' AND input.table = 'conversions' AND auth.uid() IS NULL_
    - _Expected_Behavior: INSERT operations succeed with user_id = NULL for anonymous conversions_
    - _Preservation: Authenticated users continue to be restricted to inserting only their own conversions (auth.uid() = user_id)_
    - _Requirements: 2.2, 3.2, 3.5_

  - [x] 3.3 Apply database migration
    - Run the updated schema against the Supabase database
    - Use Supabase CLI: `npx supabase db push` or apply via Supabase Dashboard SQL Editor
    - Verify migration completes without errors
    - _Requirements: 2.1, 2.2_

  - [x] 3.4 Configure storage bucket policies for anonymous uploads
    - Open Supabase Dashboard → Storage → `uploads` bucket → Policies
    - Create new policy: "Allow anonymous uploads to anonymous folder"
    - Operation: INSERT
    - Policy definition: `bucket_id = 'uploads' AND (auth.uid() = (storage.foldername(name))[1] OR (storage.foldername(name))[1] = 'anonymous')`
    - This allows uploads to `anonymous/*` path for anonymous users, and `{user_id}/*` for authenticated users
    - _Bug_Condition: Anonymous users (auth.uid() IS NULL) attempting to upload files to storage_
    - _Expected_Behavior: Storage allows uploads to anonymous/* path without authentication_
    - _Preservation: Authenticated users continue to upload to their own {user_id}/* paths_
    - _Requirements: 2.1, 3.4_

  - [x] 3.5 Configure storage bucket policies for converted files
    - Open Supabase Dashboard → Storage → `converted` bucket → Policies
    - Create new policy: "Allow anonymous uploads to anonymous folder"
    - Operation: INSERT
    - Policy definition: `bucket_id = 'converted' AND (auth.uid() = (storage.foldername(name))[1] OR (storage.foldername(name))[1] = 'anonymous')`
    - This allows uploads to `anonymous/*` path for converted files from anonymous users
    - _Expected_Behavior: Storage allows converted file uploads to anonymous/* path without authentication_
    - _Preservation: Authenticated users continue to store converted files in their own {user_id}/* paths_
    - _Requirements: 2.3, 2.4, 3.4_

  - [x] 3.6 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Anonymous User File Upload Success
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - Verify anonymous user can POST to `/api/convert/word-to-pdf` without auth and receive 200 response with downloadUrl
    - Verify direct database INSERT into `files` with `user_id: null` succeeds and returns file ID
    - Verify storage upload to `uploads/anonymous/test.docx` succeeds
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.7 Verify preservation tests still pass
    - **Property 2: Preservation** - Authenticated User Restrictions Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - Verify authenticated user file upload still works with same behavior
    - Verify authenticated users still cannot access other users' files
    - Verify dashboard still shows only user's own conversions
    - Verify file path format still uses `{user_id}/{timestamp}-{filename}` for authenticated users
    - Verify RLS policies still enforce user_id matching for authenticated users
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Checkpoint - Ensure all tests pass
  - Run full test suite including bug condition and preservation tests
  - Verify all tests pass without errors
  - Test manual anonymous user flow: navigate to /word-to-pdf → upload .docx → convert → download PDF
  - Test manual authenticated user flow: login → navigate to /word-to-pdf → upload .docx → convert → view in dashboard → download PDF
  - Verify no console errors or warnings in browser or server logs
  - Ensure all tests pass, ask the user if questions arise
