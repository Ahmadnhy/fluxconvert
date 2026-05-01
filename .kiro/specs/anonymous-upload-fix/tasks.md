# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Anonymous User Upload Failure
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test that anonymous users (user_id = null) can upload files to 'uploads' bucket with path `anonymous/{timestamp}-{filename}`
  - Test that anonymous users can upload files to 'converted' bucket with path `anonymous/{timestamp}-{filename}`
  - Test that anonymous users can complete full Word to PDF conversion via `/api/convert/word-to-pdf` endpoint
  - The test assertions should match the Expected Behavior Properties from design:
    - File upload succeeds (no authorization error)
    - File path matches `anonymous/{timestamp}-{filename}` pattern
    - Conversion completes and returns download URL
  - Run test on UNFIXED code (current storage policies without anon role permissions)
  - **EXPECTED OUTCOME**: Test FAILS with authorization errors like "new row violates row-level security policy" or "permission denied"
  - Document counterexamples found to understand root cause:
    - Which storage operations fail (INSERT to uploads, INSERT to converted)
    - Exact error messages from Supabase
    - Whether failure occurs at upload or conversion stage
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Authenticated User Behavior Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for authenticated users (should work correctly):
    - Authenticated users can upload files to `{user_id}/{timestamp}-{filename}` paths
    - Authenticated users get conversion records saved to database
    - Authenticated users receive signed URLs (not base64)
    - RLS policies enforce user ownership for SELECT/DELETE/UPDATE operations
    - File cleanup job can delete old files from both buckets
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - For all authenticated users (user_id != null), file uploads succeed to user-specific paths
    - For all authenticated users, conversion records are created in database
    - For all authenticated users, RLS policies prevent access to other users' files
    - For all authenticated users, signed URLs are generated (not base64)
    - File cleanup job can delete files regardless of user ownership
  - Property-based testing generates many test cases for stronger guarantees:
    - Generate random user IDs and verify uploads work with user-specific paths
    - Generate random file sizes (1KB to 50MB) and verify uploads succeed
    - Test concurrent uploads from multiple authenticated users
    - Test RLS enforcement: users cannot access files in other users' folders
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [-] 3. Fix for anonymous user upload authorization failure

  - [x] 3.1 Update storage policies to allow anonymous uploads
    - Add anonymous INSERT policy for uploads bucket:
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
    - Add anonymous INSERT policy for converted bucket:
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
    - Add anonymous SELECT policy for converted bucket (needed for download URLs):
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
    - Verify existing authenticated policies remain unchanged
    - Add comments documenting policy rationale (anonymous users can INSERT/SELECT but not DELETE/UPDATE)
    - _Bug_Condition: isBugCondition(input) where input.user IS NULL AND input.bucket IN ['uploads', 'converted'] AND storagePolicy(input.bucket, 'INSERT') ONLY ALLOWS 'authenticated'_
    - _Expected_Behavior: For all anonymous users, file uploads succeed to anonymous/{timestamp}-{filename} paths and conversion completes with download URL_
    - _Preservation: Authenticated users continue to upload to {user_id}/ paths, RLS policies continue to enforce user ownership for SELECT/DELETE/UPDATE, database records and signed URLs continue to work_
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Anonymous User Upload Success
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify all assertions pass:
      - Anonymous users can upload files to 'uploads' bucket
      - Anonymous users can upload files to 'converted' bucket
      - Anonymous users can complete full Word to PDF conversion
      - File paths match `anonymous/{timestamp}-{filename}` pattern
      - No authorization errors occur
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Authenticated User Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all preservation tests still pass after fix:
      - Authenticated users can still upload to user-specific paths
      - Authenticated users still get database records and signed URLs
      - RLS policies still enforce user ownership
      - File cleanup job still works
      - No authenticated user behavior has changed
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Run all bug condition tests (should pass - confirms fix works)
  - Run all preservation tests (should pass - confirms no regressions)
  - Verify anonymous users can upload and convert files end-to-end
  - Verify authenticated users continue to work exactly as before
  - Document any issues found and resolve before marking complete
  - Ensure all tests pass, ask the user if questions arise
