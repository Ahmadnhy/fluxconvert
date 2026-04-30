# Implementation Plan

## Bug 1: Middleware Deprecation Warning

### 1.1 Write bug condition exploration test

- [x] 1.1 Write bug condition exploration test
  - **Property 1: Bug Condition** - Middleware Deprecation Warning Detection
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface evidence that the deprecation warning appears in Next.js 16.2.4
  - **Scoped PBT Approach**: For this deterministic bug, scope the property to the concrete failing case: running the application with Next.js 16.2.4 and middleware.ts at project root
  - Test implementation: Run `npm run dev` and capture console output, assert that output does NOT contain deprecation warnings related to middleware file convention
  - The test assertions should match the Expected Behavior Properties from design: no deprecation warnings should appear
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found: exact deprecation warning message, when it appears (dev/build/start)
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2_

### 1.2 Write preservation property tests (BEFORE implementing fix)

- [x] 1.2 Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Middleware Functionality Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code: middleware protects routes, updates session cookies, validates authentication
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - For all requests to protected routes, middleware validates authentication
    - For all authenticated requests, session cookies are updated correctly
    - For all unauthenticated requests to protected routes, redirect to login occurs
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.6, 3.7_

### 1.3 Fix middleware deprecation warning

- [x] 1.3 Fix middleware deprecation warning

  - [x] 1.3.1 Investigate Next.js 16.2.4 recommended convention
    - Read `node_modules/next/dist/docs/` to understand the correct middleware convention for Next.js 16.2.4
    - Check if 'proxy' is the correct replacement or if documentation indicates a different pattern
    - Verify if file needs to be renamed, restructured, or if API changes are required
    - Document the recommended approach
    - _Bug_Condition: isBugCondition(context) where context.nextJsVersion == "16.2.4" AND fileExists("middleware.ts") AND NOT usingRecommendedConvention()_
    - _Expected_Behavior: No deprecation warnings appear when running the application_
    - _Preservation: All middleware functionality (session management, route protection) continues to work identically_
    - _Requirements: 2.1, 2.2, 3.6, 3.7_

  - [x] 1.3.2 Apply the recommended convention
    - Implement the Next.js 16.2.4 recommended pattern (rename file, update API calls, or modify configuration as needed)
    - Ensure all middleware behavior remains identical (session cookie management, route matching, authentication validation)
    - Preserve the existing `updateSession` function call and route matching configuration
    - _Requirements: 2.1, 2.2_

  - [x] 1.3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - No Deprecation Warnings
    - **IMPORTANT**: Re-run the SAME test from task 1.1 - do NOT write a new test
    - The test from task 1.1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1.1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Run `npm run dev` and verify no deprecation warnings in console
    - Run `npm run build` and verify clean build output
    - _Requirements: 2.1, 2.2_

  - [x] 1.3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Middleware Functionality Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 1.2 - do NOT write new tests
    - Run preservation property tests from step 1.2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Test protected route access and verify authentication works
    - Test session cookie updates and verify they work correctly
    - Confirm all middleware functionality remains unchanged
    - _Requirements: 3.6, 3.7_

### 1.4 Checkpoint - Ensure all Bug 1 tests pass

- [x] 1.4 Checkpoint - Ensure all Bug 1 tests pass
  - Verify no deprecation warnings appear in dev, build, or start modes
  - Verify all middleware functionality works correctly
  - Ensure all tests pass, ask the user if questions arise

---

## Bug 2: Remember Me Feature Not Working

### 2.1 Write bug condition exploration test

- [x] 2.1 Write bug condition exploration test
  - **Property 1: Bug Condition** - Remember Me Has No Effect
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the checkbox has no functionality
  - **Scoped PBT Approach**: For this deterministic bug, scope the property to concrete failing cases: login with checkbox checked vs unchecked
  - Test implementation details from Bug Condition in design:
    - Test that checkbox has no state management (no checked/onChange props)
    - Test that login behavior is identical regardless of checkbox state
    - Test that no session persistence configuration is applied
  - The test assertions should match the Expected Behavior Properties from design: session persistence should differ based on checkbox state
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found: checkbox state is not managed, login behavior is identical, no Supabase session options
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.3, 2.4_

### 2.2 Write preservation property tests (BEFORE implementing fix)

- [x] 2.2 Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Default Login Behavior Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code: login without "Remember me" authenticates successfully with default session
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - For all login attempts where rememberMeChecked == false, authentication succeeds with default session behavior
    - For all logout actions, session is cleared and redirect to login occurs
    - For all invalid credentials, same error messages are shown
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2_

### 2.3 Implement Remember Me functionality

- [x] 2.3 Implement Remember Me functionality

  - [ ] 2.3.1 Add state management for checkbox
    - Add React state variable: `const [rememberMe, setRememberMe] = useState(false);`
    - Connect checkbox to state with `checked` and `onChange` props
    - Optional: Add localStorage persistence to remember checkbox state across page refreshes
    - File: `src/components/auth/LoginForm.tsx`
    - _Bug_Condition: isBugCondition(input) where input.rememberMeChecked == true AND NOT sessionPersistenceConfigured(input.rememberMeChecked)_
    - _Expected_Behavior: Session persistence is configured based on checkbox state_
    - _Preservation: Login without "Remember me" works exactly as before_
    - _Requirements: 2.3, 2.4, 3.1_

  - [ ] 2.3.2 Research Supabase session persistence options
    - Investigate Supabase auth configuration for session persistence
    - Check if `persistSession` option exists in `signInWithPassword`
    - Determine correct way to implement "Remember me" with Supabase (session duration, persistence options)
    - Document the approach to be used
    - _Requirements: 2.3, 2.4_

  - [ ] 2.3.3 Configure session persistence based on checkbox state
    - Modify `signInWithPassword` call to use checkbox value for session configuration
    - Apply Supabase session options based on `rememberMe` state
    - Ensure extended session duration when checkbox is checked
    - Ensure default session behavior when checkbox is unchecked
    - File: `src/components/auth/LoginForm.tsx`
    - _Requirements: 2.3, 2.4, 2.5_

  - [ ] 2.3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Remember Me Configures Session Persistence
    - **IMPORTANT**: Re-run the SAME test from task 2.1 - do NOT write a new test
    - The test from task 2.1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 2.1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify checkbox state is managed correctly
    - Verify login with "Remember me" checked results in extended session
    - _Requirements: 2.3, 2.4_

  - [ ] 2.3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Default Login Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2.2 - do NOT write new tests
    - Run preservation property tests from step 2.2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Verify login without "Remember me" works identically to original
    - Verify logout clears session correctly
    - Verify form validation and error messages unchanged
    - _Requirements: 3.1, 3.2_

### 2.4 Checkpoint - Ensure all Bug 2 tests pass

- [ ] 2.4 Checkpoint - Ensure all Bug 2 tests pass
  - Verify "Remember me" checkbox has state management
  - Verify session persistence differs based on checkbox state
  - Verify default login behavior is unchanged
  - Ensure all tests pass, ask the user if questions arise

---

## Bug 3: File Upload Error

### 3.1 Write bug condition exploration test

- [ ] 3.1 Write bug condition exploration test
  - **Property 1: Bug Condition** - Authenticated File Upload Fails
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate authenticated uploads fail
  - **Scoped PBT Approach**: For this deterministic bug, scope the property to concrete failing cases: authenticated user uploading valid DOCX files
  - Test implementation details from Bug Condition in design:
    - Test that uploadFile to 'uploads' bucket fails for authenticated users
    - Test with various file sizes (small: 1 KB, medium: 5 MB, large: 40 MB)
    - Test that error message is "Failed to upload file to storage"
  - The test assertions should match the Expected Behavior Properties from design: upload should succeed and return storage path
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found: exact error message, storage error details, authentication context issues
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.6, 2.7_

### 3.2 Write preservation property tests (BEFORE implementing fix)

- [ ] 3.2 Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Unauthenticated Conversion Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code: unauthenticated users can convert files and receive base64 results
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - For all conversions by unauthenticated users, conversion succeeds and returns base64 result
    - For all invalid file types, same validation errors are shown
    - For all files exceeding size limit, same error messages are shown
    - For all valid conversions, PDF quality and formatting remain unchanged
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.3, 3.4, 3.5_

### 3.3 Fix file upload error

- [ ] 3.3 Fix file upload error

  - [ ] 3.3.1 Investigate Supabase Storage bucket policies
    - Check RLS policies on 'uploads' bucket in Supabase Dashboard
    - Verify if authenticated users have INSERT permission
    - Check if policy exists: `(bucket_id = 'uploads') AND (auth.uid() IS NOT NULL)`
    - Document current policies and identify missing permissions
    - _Bug_Condition: isBugCondition(input) where input.userAuthenticated == true AND uploadToStorage(input.file, "uploads") == FAILURE_
    - _Expected_Behavior: Upload succeeds and returns storage path_
    - _Preservation: Unauthenticated conversions work exactly as before_
    - _Requirements: 2.6, 2.7, 3.3_

  - [ ] 3.3.2 Add or update storage bucket policy
    - Create policy "Allow authenticated uploads" if missing:
      ```sql
      CREATE POLICY "Allow authenticated uploads"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'uploads');
      ```
    - Or update existing policy to allow authenticated INSERT operations
    - Verify policy is applied correctly in Supabase Dashboard
    - _Requirements: 2.6, 2.7_

  - [ ] 3.3.3 Verify authentication context in uploadFile
    - Ensure `createClient()` in `src/lib/storage/operations.ts` has proper auth context
    - Verify that `src/lib/supabase/server.ts` properly handles cookies and session
    - Add detailed error logging to identify exact failure point if issues persist
    - Test with different file sizes to ensure issue is not size-related
    - _Requirements: 2.6, 2.7_

  - [ ] 3.3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Authenticated Upload Succeeds
    - **IMPORTANT**: Re-run the SAME test from task 3.1 - do NOT write a new test
    - The test from task 3.1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 3.1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Login and upload valid DOCX file → should succeed
    - Verify file appears in Supabase Storage 'uploads' bucket
    - Verify conversion completes successfully
    - _Requirements: 2.6, 2.7_

  - [ ] 3.3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Unauthenticated Conversion Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 3.2 - do NOT write new tests
    - Run preservation property tests from step 3.2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Verify unauthenticated conversion returns base64 result
    - Verify file validation errors unchanged
    - Verify size limit errors unchanged
    - Verify PDF output quality unchanged
    - _Requirements: 3.3, 3.4, 3.5_

### 3.4 Checkpoint - Ensure all Bug 3 tests pass

- [ ] 3.4 Checkpoint - Ensure all Bug 3 tests pass
  - Verify authenticated users can upload files successfully
  - Verify files appear in Supabase Storage
  - Verify unauthenticated conversions work as before
  - Ensure all tests pass, ask the user if questions arise

---

## Bug 4: Download File Opens in Browser

### 4.1 Write bug condition exploration test

- [ ] 4.1 Write bug condition exploration test
  - **Property 1: Bug Condition** - Download Opens in Browser Instead of Downloading
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate files open inline instead of downloading
  - **Scoped PBT Approach**: For this deterministic bug, scope the property to concrete failing cases: clicking download button on converted PDF
  - Test implementation details from Bug Condition in design:
    - Test that signed URL does not include download parameters
    - Test that clicking download opens PDF in new tab instead of downloading
    - Test in multiple browsers (Chrome, Firefox, Safari)
  - The test assertions should match the Expected Behavior Properties from design: download should trigger file save, not inline display
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found: browser opens PDF inline, no "Save As" dialog, missing Content-Disposition header
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.9, 2.10, 2.11_

### 4.2 Write preservation property tests (BEFORE implementing fix)

- [ ] 4.2 Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Download Access Control Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code: download access control works correctly (404 for deleted files, 403 for unauthorized access)
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - For all download attempts for deleted files, system returns 404 error
    - For all download attempts for files owned by other users, system returns 403 Forbidden
    - For all signed URLs after expiration (> 1 hour), access fails appropriately
    - For all unauthenticated download attempts, system returns 401 error
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.8, 3.9, 3.10_

### 4.3 Fix download behavior

- [ ] 4.3 Fix download behavior

  - [ ] 4.3.1 Research Supabase Storage download options
    - Check if `createSignedUrl` supports a `download` parameter or option
    - Review Supabase Storage documentation for Content-Disposition header support
    - Determine the best approach: download parameter, client-side fetch, or proxy endpoint
    - Document the recommended approach
    - _Bug_Condition: isBugCondition(input) where input.downloadButtonClicked == true AND NOT hasDownloadForceParameter(input.signedUrl)_
    - _Expected_Behavior: Browser initiates direct file download_
    - _Preservation: Download access control and URL expiration work exactly as before_
    - _Requirements: 2.9, 2.10, 2.11, 3.8, 3.9, 3.10_

  - [ ] 4.3.2 Implement download fix (Approach 1: Add download parameter to signed URL)
    - Modify `generateSignedUrl` in `src/lib/storage/signedUrls.ts`
    - Add download option to `createSignedUrl` call if supported by Supabase:
      ```typescript
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn, {
          download: true  // or download: filename
        });
      ```
    - Test if this approach works before proceeding to alternative approaches
    - _Requirements: 2.9, 2.10, 2.11_

  - [ ] 4.3.3 Implement alternative if needed (Approach 2: Client-side download trigger)
    - If Approach 1 doesn't work, implement client-side download in `src/components/dashboard/ConversionHistory.tsx`
    - Fetch file as blob and trigger download programmatically:
      ```typescript
      const handleDownload = async (url: string, filename: string) => {
        const response = await fetch(url);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(objectUrl);
      };
      ```
    - Update download button to call this handler
    - _Requirements: 2.9, 2.10, 2.11_

  - [ ] 4.3.4 Implement proxy endpoint if needed (Approach 3: Proxy with Content-Disposition header)
    - If Approaches 1 and 2 don't work, modify `app/api/conversions/[id]/download/route.ts`
    - Fetch file from storage and return with Content-Disposition header:
      ```typescript
      const response = await fetch(url);
      const blob = await response.blob();
      return new NextResponse(blob, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${outputFile.file_name}"`,
        },
      });
      ```
    - _Requirements: 2.9, 2.10, 2.11_

  - [ ] 4.3.5 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Download Triggers File Save
    - **IMPORTANT**: Re-run the SAME test from task 4.1 - do NOT write a new test
    - The test from task 4.1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 4.1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Click "Download" button → file should download directly
    - Verify "Save As" dialog appears or file saves to Downloads
    - Test in multiple browsers (Chrome, Firefox, Safari)
    - _Requirements: 2.9, 2.10, 2.11_

  - [ ] 4.3.6 Verify preservation tests still pass
    - **Property 2: Preservation** - Download Access Control Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 4.2 - do NOT write new tests
    - Run preservation property tests from step 4.2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Verify deleted file returns 404
    - Verify unauthorized access returns 403
    - Verify expired URLs fail appropriately
    - Verify signed URLs still expire after 1 hour
    - _Requirements: 3.8, 3.9, 3.10_

### 4.4 Checkpoint - Ensure all Bug 4 tests pass

- [ ] 4.4 Checkpoint - Ensure all Bug 4 tests pass
  - Verify download button triggers direct file download
  - Verify download access control works correctly
  - Verify URL expiration still works
  - Ensure all tests pass, ask the user if questions arise

---

## Final Checkpoint

- [ ] 5. Final Checkpoint - Ensure all tests pass
  - Run all exploration tests and verify they pass (bugs are fixed)
  - Run all preservation tests and verify they pass (no regressions)
  - Verify all four bugs are resolved:
    1. No middleware deprecation warnings
    2. "Remember me" checkbox functions correctly
    3. Authenticated file uploads succeed
    4. Downloads trigger file save instead of opening in browser
  - Ensure all tests pass, ask the user if questions arise
