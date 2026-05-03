# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - pdf-parse Module Import Resolution Failure
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test that pdf-parse import resolves to a callable function that can parse PDF buffers
  - Test implementation: Verify that importing pdf-parse using the current `require('pdf-parse')` method results in a non-callable function or undefined value
  - Test that attempting to invoke `pdfParse(buffer)` with a valid PDF buffer throws `TypeError: pdfParse is not a function`
  - The test assertions should match the Expected Behavior Properties: `isCallableFunction(pdfParse)` AND `canParsePdfBuffer(pdfParse, validPdfBuffer)`
  - Run test on UNFIXED code (with `const pdfParse = require('pdf-parse')` at line 38)
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found: pdfParse is undefined, or pdfParse is an object without a callable function, or TypeError when invoking
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - PDF Conversion Pipeline Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (all operations that don't involve the pdf-parse import)
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Test file upload to Supabase storage works correctly (observe on unfixed code before PDF parsing step)
  - Test database operations (file records, conversion records) are created correctly (observe on unfixed code)
  - Test DOCX generation from text works correctly (using mocked pdf-parse to bypass the import bug)
  - Test error handling for invalid files, empty PDFs, and size limits works correctly
  - Test canvas polyfill initialization (DOMMatrix, ImageData, Path2D) continues to work
  - Test signed URL generation for authenticated users continues to work
  - Test base64 fallback for anonymous users continues to work
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 3. Fix pdf-parse import to resolve ESM/CJS compatibility issue

  - [x] 3.1 Implement the fix
    - Replace `const pdfParse = require('pdf-parse');` at line 38 with dynamic import that properly handles ESM default export
    - Use dynamic import inside POST function: `const pdfParseModule = await import('pdf-parse'); const pdfParse = pdfParseModule.default || pdfParseModule;`
    - Place the dynamic import before the first usage of pdfParse (before line 149)
    - Ensure the imported module's `.default` property is accessed if the dynamic import returns a module object
    - Maintain `export const runtime = 'nodejs'` and `export const dynamic = 'force-dynamic'` configuration
    - Keep canvas polyfill initialization unchanged
    - _Bug_Condition: isBugCondition(input) where input.importMethod == 'require' AND input.moduleName == 'pdf-parse' AND input.nextJsVersion >= 16 AND input.moduleType == 'ESM' AND NOT isCallableFunction(input.resolvedModule)_
    - _Expected_Behavior: For any module import context where pdf-parse is imported in a Next.js 16 API route, the fixed import mechanism SHALL properly resolve the pdf-parse function as a callable function that can successfully parse PDF buffers and extract text content_
    - _Preservation: For any code execution path that does NOT involve the pdf-parse module import statement (file validation, storage operations, database operations, DOCX generation, error handling), the fixed code SHALL produce exactly the same behavior as the original code_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - pdf-parse Module Import Resolution Success
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify that pdf-parse is now a callable function
    - Verify that `pdfParse(buffer)` successfully parses PDF buffers without throwing TypeError
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - PDF Conversion Pipeline Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions in file upload, storage, database operations, DOCX generation, error handling, canvas polyfill, signed URLs, base64 fallback)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 4. Checkpoint - Ensure all tests pass
  - Run all tests (bug condition test + preservation tests)
  - Verify bug condition test passes (confirms fix works)
  - Verify preservation tests pass (confirms no regressions)
  - Test full PDF to Word conversion flow with a real PDF file
  - Test authenticated user flow (conversion record creation, signed URL generation)
  - Test anonymous user flow (base64 fallback)
  - Ensure all tests pass, ask the user if questions arise
