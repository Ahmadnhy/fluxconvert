# Implementation Plan

## Phase 1: Bug Condition Exploration Tests

### Bug 1: Profile Picture Display

- [x] 1.1 Write bug condition exploration test for profile picture persistence
  - **Property 1: Bug Condition** - Profile Picture Upload Without Persistence
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate profile pictures upload but don't persist in metadata
  - **Scoped PBT Approach**: Test the concrete scenario where user uploads avatar, saves form, and navigates away
  - Test that uploaded avatar URL is NOT persisted in user metadata after form submission (from Bug Condition in design)
  - Test that avatar does not display on profile page after save
  - Test that returning to edit profile page shows default initials instead of uploaded image
  - The test assertions should match Expected Behavior Properties 1, 2, 3 from design (avatar persists in metadata, displays on all pages, shows on return to edit page)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found (e.g., "avatar uploads to storage but metadata.avatar_url remains null")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2_

### Bug 2: Edit Profile Form Label

- [ ] 1.2 Write bug condition exploration test for incorrect label text
  - **Property 1: Bug Condition** - Incorrect Full Name Label Text
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate incorrect label text
  - **Scoped PBT Approach**: Test the concrete scenario where user views edit profile form
  - Test that the "Full Name" input field label displays incorrect or placeholder text (from Bug Condition in design)
  - The test assertions should match Expected Behavior Property 4 from design (label displays "Full Name")
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found (e.g., "label shows 'Name' instead of 'Full Name'")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.3_

### Bug 3: Conversion History Search Button

- [ ] 1.3 Write bug condition exploration test for incorrect search button text
  - **Property 1: Bug Condition** - Incorrect Search Button Text
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate incorrect or missing search button text
  - **Scoped PBT Approach**: Test the concrete scenario where user views conversion history page
  - Test that search button displays incorrect text or is missing "Search" label (from Bug Condition in design)
  - The test assertions should match Expected Behavior Property 5 from design (button displays "Search")
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found (e.g., "search button shows icon only without 'Search' text")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.4_

### Bug 4: Footer Inconsistency

- [ ] 1.4 Write bug condition exploration test for inconsistent footer layouts
  - **Property 1: Bug Condition** - Inconsistent Footer Layouts Across Pages
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate different footer layouts across pages
  - **Scoped PBT Approach**: Test concrete scenarios across login, register, home, dashboard, and other pages
  - Test that login/register pages show three-column layout (FluxConvert branding, links, copyright) (from Bug Condition in design)
  - Test that home/dashboard pages show two-column layout (copyright, links) without branding
  - Test that footer layouts are NOT consistent across all pages
  - The test assertions should match Expected Behavior Properties 6, 7, 8 from design (consistent layout, copyright left, links right)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found (e.g., "login page footer has 3 columns, home page has 2 columns")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.5, 1.6, 1.7_

### Bug 5: Missing Home Menu

- [ ] 1.5 Write bug condition exploration test for missing Home menu item
  - **Property 1: Bug Condition** - Missing Home Menu Item for Non-Logged-In Users
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate missing "Home" menu item
  - **Scoped PBT Approach**: Test the concrete scenario where non-logged-in user views home page navigation
  - Test that center navigation menu does NOT display "Home" menu item (from Bug Condition in design)
  - Test that only "Word to PDF" and "PDF to Word" menu items are visible
  - The test assertions should match Expected Behavior Properties 9, 10 from design (Home menu displays, navigates to /)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found (e.g., "navigation shows only 2 menu items, missing 'Home'")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.8, 1.9_

### Bug 6: Conversion Status Display

- [ ] 1.6 Write bug condition exploration test for incorrect status display
  - **Property 1: Bug Condition** - Incorrect Conversion Status Display
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate incorrect status badges and filter options
  - **Scoped PBT Approach**: Test concrete scenarios with completed conversions
  - Test that completed conversions display "Failed" status with red badge instead of "Completed" with green badge (from Bug Condition in design)
  - Test that status filter dropdown includes "All Status" option that shouldn't exist
  - The test assertions should match Expected Behavior Properties 11, 12, 13 from design (shows "Complete" badge, no "All Status" option)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found (e.g., "completed conversion shows red 'Failed' badge, filter has 'All Status' option")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.10, 1.11, 1.12_

## Phase 2: Preservation Property Tests

- [ ] 2. Write preservation property tests (BEFORE implementing fixes)
  - **Property 2: Preservation** - All Non-Buggy Functionality Preserved
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees

  - [ ] 2.1 Profile functionality preservation tests
    - Observe: Editing name without uploading picture saves correctly on unfixed code
    - Observe: Users without pictures see initials-based avatars with #5b8ba8 background
    - Observe: Invalid file uploads show appropriate error messages
    - Write property-based tests: for all name-only edits, changes persist correctly
    - Write property-based tests: for all users without avatars, initials display correctly
    - Write property-based tests: for all invalid uploads, errors display correctly
    - Verify tests pass on UNFIXED code
    - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 2.2 Conversion history functionality preservation tests
    - Observe: Filtering by type (word-to-pdf, pdf-to-word) works correctly on unfixed code
    - Observe: Searching by filename returns matching results
    - Observe: Downloading conversions generates signed URLs and triggers downloads
    - Observe: Deleting conversions removes entries and updates pagination
    - Observe: Pagination displays and navigates correctly
    - Write property-based tests: for all filter operations, results match filter criteria
    - Write property-based tests: for all search queries, results match search terms
    - Write property-based tests: for all download operations, signed URLs are generated
    - Write property-based tests: for all delete operations, entries are removed
    - Verify tests pass on UNFIXED code
    - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
    - _Requirements: 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ] 2.3 Navigation functionality preservation tests
    - Observe: Logged-in users see Dashboard menu item on unfixed code
    - Observe: All menu items navigate to correct pages
    - Observe: Non-logged-in users see Login and Sign Up buttons
    - Observe: FluxConvert logo navigates to home page
    - Write property-based tests: for all logged-in states, correct menu items display
    - Write property-based tests: for all menu clicks, navigation works correctly
    - Write property-based tests: for all authentication states, correct buttons display
    - Verify tests pass on UNFIXED code
    - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
    - _Requirements: 3.9, 3.10, 3.11, 3.12_

  - [ ] 2.4 Footer functionality preservation tests
    - Observe: Footer links (Privacy Policy, Terms of Service, Help Center) navigate correctly on unfixed code
    - Observe: Footer displays responsive layouts on mobile devices
    - Observe: Copyright year displays dynamically
    - Write property-based tests: for all footer link clicks, navigation works correctly
    - Write property-based tests: for all screen sizes, responsive layouts work
    - Write property-based tests: copyright year matches current year
    - Verify tests pass on UNFIXED code
    - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
    - _Requirements: 3.13, 3.14, 3.15_

  - [ ] 2.5 Authentication and authorization preservation tests
    - Observe: Unauthenticated users accessing protected routes redirect to login on unfixed code
    - Observe: Logout clears session data and redirects to home
    - Observe: Profile updates require valid authentication tokens
    - Write property-based tests: for all protected route access attempts, redirects work correctly
    - Write property-based tests: for all logout operations, session clears correctly
    - Write property-based tests: for all profile updates, authentication is required
    - Verify tests pass on UNFIXED code
    - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
    - _Requirements: 3.16, 3.17, 3.18_

## Phase 3: Implementation

### Bug 1: Profile Picture Display Fix

- [ ] 3.1 Fix profile picture persistence in EditProfileClient

  - [ ] 3.1.1 Investigate and fix avatar URL persistence
    - Read `src/components/profile/EditProfileClient.tsx` to understand current implementation
    - Verify `handleAvatarUpload` sets `avatarUrl` state correctly after upload
    - Verify `handleSubmit` includes `avatar_url` in `supabase.auth.updateUser()` call
    - Check if storage URL format from `getPublicUrl` is correct and accessible
    - Add debugging if needed to track avatar URL through upload → state → submission → persistence flow
    - Fix any issues preventing avatar URL from persisting in user metadata
    - _Bug_Condition: isBugCondition(input) where input.action == "uploadAvatar" AND imageUploadedToStorage(input) AND NOT imagePersistedInMetadata(input)_
    - _Expected_Behavior: Avatar URL persists in user metadata AND displays on all pages (Properties 1, 2, 3 from design)_
    - _Preservation: Profile functionality for name-only edits, initials-based avatars, error handling (Requirements 3.1, 3.2, 3.3)_
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3_

  - [ ] 3.1.2 Verify avatar displays on profile page after save
    - Test that uploaded avatar displays in navbar
    - Test that uploaded avatar displays in profile dropdown
    - Test that uploaded avatar displays on edit profile page
    - _Requirements: 2.2_

  - [ ] 3.1.3 Verify avatar persists when returning to edit profile page
    - Test that previously uploaded avatar displays instead of default initials
    - Test that avatar URL is correctly read from user metadata on component mount
    - _Requirements: 2.3_

  - [ ] 3.1.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Profile Picture Upload With Persistence
    - **IMPORTANT**: Re-run the SAME test from task 1.1 - do NOT write a new test
    - The test from task 1.1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1.1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: Expected Behavior Properties 1, 2, 3 from design_

  - [ ] 3.1.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Profile Functionality Preserved
    - **IMPORTANT**: Re-run the SAME tests from task 2.1 - do NOT write new tests
    - Run preservation property tests from step 2.1
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm name-only edits, initials-based avatars, and error handling still work

### Bug 2: Edit Profile Form Label Fix

- [ ] 3.2 Fix edit profile form label text

  - [ ] 3.2.1 Update "Full Name" label text in EditProfileClient
    - Read `src/components/profile/EditProfileClient.tsx` to locate the label element
    - Verify current label text for the full name input field
    - Update label text to "Full Name" if incorrect
    - Verify label's `htmlFor` attribute matches input's `id` attribute
    - _Bug_Condition: isBugCondition(input) where input.action == "viewEditProfile" AND labelText(input, "fullName") != "Full Name"_
    - _Expected_Behavior: Label displays "Full Name" (Property 4 from design)_
    - _Preservation: All other form labels and functionality (Requirements 3.1, 3.2, 3.3)_
    - _Requirements: 1.3, 2.4_

  - [ ] 3.2.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Correct Full Name Label Text
    - **IMPORTANT**: Re-run the SAME test from task 1.2 - do NOT write a new test
    - The test from task 1.2 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1.2
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: Expected Behavior Property 4 from design_

  - [ ] 3.2.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Profile Functionality Preserved
    - **IMPORTANT**: Re-run the SAME tests from task 2.1 - do NOT write new tests
    - Run preservation property tests from step 2.1
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all other profile functionality still works

### Bug 3: Conversion History Search Button Fix

- [ ] 3.3 Fix conversion history search button text

  - [ ] 3.3.1 Add or update search button in ConversionHistory
    - Read `src/components/dashboard/ConversionHistory.tsx` to locate search input
    - Add a button element next to the search input if missing
    - Set button text to "Search"
    - Style button to match application design system
    - Configure button to trigger search when clicked (call `fetchConversions()`)
    - Update search UI layout to accommodate icon + button
    - _Bug_Condition: isBugCondition(input) where input.action == "viewConversionHistory" AND searchButtonText(input) != "Search"_
    - _Expected_Behavior: Button displays "Search" text (Property 5 from design)_
    - _Preservation: Search functionality, filtering, pagination (Requirements 3.4, 3.5, 3.6, 3.7, 3.8)_
    - _Requirements: 1.4, 2.5_

  - [ ] 3.3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Correct Search Button Text
    - **IMPORTANT**: Re-run the SAME test from task 1.3 - do NOT write a new test
    - The test from task 1.3 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1.3
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: Expected Behavior Property 5 from design_

  - [ ] 3.3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Conversion History Functionality Preserved
    - **IMPORTANT**: Re-run the SAME tests from task 2.2 - do NOT write new tests
    - Run preservation property tests from step 2.2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm filtering, searching, downloading, deleting, and pagination still work

### Bug 4: Footer Inconsistency Fix

- [ ] 3.4 Standardize footer layout across all pages

  - [ ] 3.4.1 Update login and register page footers
    - Read `app/login/page.tsx` and `app/register/page.tsx` to locate footer sections
    - Remove "FluxConvert" branding element from left side
    - Restructure to two-column layout: copyright on left, links on right
    - Match styling from home/dashboard footer pattern
    - Use consistent spacing, text sizing, and color schemes
    - _Bug_Condition: isBugCondition(input) where input.action == "viewPage" AND NOT footerLayoutConsistent(input.page)_
    - _Expected_Behavior: Consistent footer layout across all pages (Properties 6, 7, 8 from design)_
    - _Preservation: Footer link navigation, responsive layouts, dynamic year (Requirements 3.13, 3.14, 3.15)_
    - _Requirements: 1.5, 1.6, 1.7, 2.6, 2.7, 2.8_

  - [ ] 3.4.2 Update other page footers for consistency
    - Read and update footers in:
      - `src/components/pages/HelpCenter.tsx`
      - `src/components/pages/PrivacyPolicy.tsx`
      - `src/components/pages/TermsOfService.tsx`
      - `src/components/converters/PdfToWordConverter.tsx`
      - `src/components/converters/WordToPdfConverter.tsx`
      - `src/components/result.tsx`
    - Ensure all footers follow the same two-column layout
    - Verify copyright on left, links on right
    - Verify consistent styling across all pages
    - _Requirements: 2.6, 2.7, 2.8_

  - [ ] 3.4.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Consistent Footer Layouts Across Pages
    - **IMPORTANT**: Re-run the SAME test from task 1.4 - do NOT write a new test
    - The test from task 1.4 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1.4
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: Expected Behavior Properties 6, 7, 8 from design_

  - [ ] 3.4.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Footer Functionality Preserved
    - **IMPORTANT**: Re-run the SAME tests from task 2.4 - do NOT write new tests
    - Run preservation property tests from step 2.4
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm footer links, responsive layouts, and dynamic year still work

### Bug 5: Missing Home Menu Fix

- [ ] 3.5 Add Home menu item to navigation

  - [ ] 3.5.1 Add "Home" menu item to home page navigation
    - Read `src/components/home.tsx` to locate center navigation menu
    - Add a "Home" link to the navigation menu for non-logged-in users
    - Use same styling as other menu items ("Word to PDF", "PDF to Word")
    - Link to "/" (home page)
    - Position at beginning or appropriate location in menu
    - Verify conditional rendering works correctly for logged-in/non-logged-in users
    - _Bug_Condition: isBugCondition(input) where input.action == "viewHomePage" AND NOT userLoggedIn(input) AND NOT homeMenuItemExists(input)_
    - _Expected_Behavior: "Home" menu item displays and navigates to / (Properties 9, 10 from design)_
    - _Preservation: All other navigation functionality (Requirements 3.9, 3.10, 3.11, 3.12)_
    - _Requirements: 1.8, 1.9, 2.9, 2.10_

  - [ ] 3.5.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Home Menu Item Present for Non-Logged-In Users
    - **IMPORTANT**: Re-run the SAME test from task 1.5 - do NOT write a new test
    - The test from task 1.5 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1.5
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: Expected Behavior Properties 9, 10 from design_

  - [ ] 3.5.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Navigation Functionality Preserved
    - **IMPORTANT**: Re-run the SAME tests from task 2.3 - do NOT write new tests
    - Run preservation property tests from step 2.3
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm Dashboard menu, other menu items, login/signup buttons, and logo navigation still work

### Bug 6: Conversion Status Display Fix

- [ ] 3.6 Fix conversion status display and filter options

  - [ ] 3.6.1 Investigate and fix status badge mapping
    - Read `src/components/dashboard/ConversionHistory.tsx` to locate `getStatusBadge` function
    - Verify the function correctly maps "completed" status to green "Completed" badge
    - Check if database is returning correct status values for completed conversions
    - Investigate conversion creation/update logic if status values are incorrect
    - Fix any issues causing completed conversions to show "Failed" status
    - _Bug_Condition: isBugCondition(input) where input.conversion.status == "completed" AND statusBadgeLabel(input.conversion) == "Failed"_
    - _Expected_Behavior: Completed conversions show "Complete" with green badge (Property 11 from design)_
    - _Preservation: All other conversion history functionality (Requirements 3.4, 3.5, 3.6, 3.7, 3.8)_
    - _Requirements: 1.10, 1.12, 2.11_

  - [ ] 3.6.2 Remove "All Status" filter option
    - Locate status filter dropdown JSX in ConversionHistory component
    - Remove the line: `<option value="all" className="text-gray-500">All Status</option>`
    - Keep only "Completed" and "Failed" options
    - Update default filter state if needed to handle absence of "all" status
    - Verify API query parameter handling works correctly without "all" option
    - _Bug_Condition: isBugCondition(input) where statusFilterHasAllStatusOption(input)_
    - _Expected_Behavior: Status filter shows only "Completed" and "Failed" (Properties 12, 13 from design)_
    - _Preservation: All other filtering functionality (Requirements 3.4, 3.5, 3.6, 3.7, 3.8)_
    - _Requirements: 1.11, 2.12, 2.13_

  - [ ] 3.6.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Correct Conversion Status Display
    - **IMPORTANT**: Re-run the SAME test from task 1.6 - do NOT write a new test
    - The test from task 1.6 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1.6
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: Expected Behavior Properties 11, 12, 13 from design_

  - [ ] 3.6.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Conversion History Functionality Preserved
    - **IMPORTANT**: Re-run the SAME tests from task 2.2 - do NOT write new tests
    - Run preservation property tests from step 2.2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm filtering, searching, downloading, deleting, and pagination still work

## Phase 4: Final Verification

- [ ] 4. Checkpoint - Ensure all tests pass
  - Run all bug condition exploration tests (tasks 1.1-1.6) - all should PASS
  - Run all preservation property tests (tasks 2.1-2.5) - all should PASS
  - Verify all 6 bugs are fixed:
    1. Profile pictures persist and display correctly
    2. "Full Name" label displays correct text
    3. Search button displays "Search" text
    4. All footers use consistent two-column layout
    5. "Home" menu item appears for non-logged-in users
    6. Completed conversions show "Completed" badge, no "All Status" filter
  - Verify all preservation requirements are met (no regressions)
  - Run integration tests to verify all fixes work together
  - Ask the user if questions arise or if any issues are found
