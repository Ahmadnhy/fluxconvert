# FluxConvert Bugfixes Design

## Overview

This design document addresses four critical bugs in the FluxConvert application that affect user experience, compatibility, and core functionality:

1. **Middleware Deprecation Warning**: Next.js 16.2.4 displays a deprecation warning about the `middleware.ts` file convention
2. **Remember Me Feature**: The "Remember me" checkbox on the login page has no functionality
3. **File Upload Error**: Authenticated users encounter "Failed to upload file to storage" when converting Word documents to PDF
4. **Download Behavior**: Converted PDF files open in the browser instead of downloading directly

The fix strategy focuses on minimal, targeted changes that address root causes while preserving all existing functionality for non-buggy scenarios.

## Glossary

- **Bug_Condition (C)**: The specific conditions that trigger each bug
- **Property (P)**: The desired correct behavior when the bug condition is met
- **Preservation**: Existing behaviors that must remain unchanged by the fixes
- **middleware.ts**: The Next.js middleware file at the project root that handles session updates
- **updateSession**: The function in `src/lib/supabase/middleware.ts` that manages Supabase authentication cookies
- **LoginForm**: The React component in `src/components/auth/LoginForm.tsx` that handles user authentication
- **uploadFile**: The function in `src/lib/storage/operations.ts` that uploads files to Supabase Storage
- **generateSignedUrl**: The function in `src/lib/storage/signedUrls.ts` that creates temporary download URLs
- **Supabase Storage Bucket**: Cloud storage containers ('uploads' for input files, 'converted' for output files)
- **Signed URL**: A temporary URL with authentication token for secure file access
- **Content-Disposition**: HTTP header that controls whether files are displayed inline or downloaded

## Bug Details

### Bug 1: Middleware Deprecation Warning

#### Bug Condition

The bug manifests when the application runs on Next.js 16.2.4. The framework detects the `middleware.ts` file at the project root and displays a deprecation warning indicating this convention is no longer recommended.

**Formal Specification:**
```
FUNCTION isBugCondition_Middleware(context)
  INPUT: context of type ApplicationContext
  OUTPUT: boolean
  
  RETURN context.nextJsVersion == "16.2.4"
         AND fileExists("middleware.ts")
         AND NOT usingRecommendedConvention()
END FUNCTION
```

#### Examples

- **Current behavior**: Running `npm run dev` displays: "The 'middleware' file convention is deprecated. Please use 'proxy' instead."
- **Expected behavior**: No deprecation warnings should appear when running the application
- **Edge case**: The middleware functionality (session management, route protection) must continue working exactly as before

### Bug 2: Remember Me Feature Not Working

#### Bug Condition

The bug manifests when a user interacts with the "Remember me" checkbox on the login page. The checkbox is rendered but has no state management, no event handlers, and does not affect the authentication session persistence.

**Formal Specification:**
```
FUNCTION isBugCondition_RememberMe(input)
  INPUT: input of type UserLoginAction
  OUTPUT: boolean
  
  RETURN input.rememberMeChecked == true
         AND input.loginAttempted == true
         AND NOT sessionPersistenceConfigured(input.rememberMeChecked)
END FUNCTION
```

#### Examples

- **Scenario 1**: User checks "Remember me" and logs in → Session expires at the same time as if unchecked
- **Scenario 2**: User unchecks "Remember me" and logs in → Session behavior is identical to checked state
- **Scenario 3**: User refreshes the page after checking "Remember me" → Checkbox state is lost (not persisted)
- **Edge case**: User logs in without interacting with checkbox → Should use default session behavior

### Bug 3: File Upload Error

#### Bug Condition

The bug manifests when an authenticated user uploads a DOCX file for Word-to-PDF conversion. The `uploadFile` function in `src/lib/storage/operations.ts` attempts to upload to the 'uploads' bucket but fails, returning the error "Failed to upload file to storage".

**Formal Specification:**
```
FUNCTION isBugCondition_FileUpload(input)
  INPUT: input of type FileUploadRequest
  OUTPUT: boolean
  
  RETURN input.userAuthenticated == true
         AND input.fileType == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
         AND input.fileSize <= MAX_FILE_SIZE
         AND uploadToStorage(input.file, "uploads") == FAILURE
END FUNCTION
```

#### Examples

- **Concrete example 1**: User "john@example.com" uploads "MAMADDDDD.docx" (11.69 KB) → Error: "Failed to upload file to storage"
- **Concrete example 2**: User "jane@example.com" uploads "report.docx" (25 KB) → Error: "Failed to upload file to storage"
- **Concrete example 3**: Unauthenticated user uploads "test.docx" (10 KB) → Conversion succeeds (no storage upload attempted)
- **Edge case**: Authenticated user uploads file exactly at 50 MB limit → Should succeed if storage permissions are correct

### Bug 4: Download File Opens in Browser

#### Bug Condition

The bug manifests when an authenticated user clicks the "Download" button for a converted PDF file in their conversion history. The signed URL generated by `generateSignedUrl` does not include parameters to force download behavior, causing browsers to display the PDF inline instead of downloading it.

**Formal Specification:**
```
FUNCTION isBugCondition_Download(input)
  INPUT: input of type DownloadRequest
  OUTPUT: boolean
  
  RETURN input.userAuthenticated == true
         AND input.fileType == "application/pdf"
         AND input.downloadButtonClicked == true
         AND NOT hasDownloadForceParameter(input.signedUrl)
END FUNCTION
```

#### Examples

- **Scenario 1**: User clicks "Download" on "document.pdf" → Browser opens PDF in new tab instead of downloading
- **Scenario 2**: User right-clicks "Download" and selects "Save link as" → File downloads correctly (browser override)
- **Scenario 3**: User on mobile device clicks "Download" → PDF opens in browser's PDF viewer
- **Edge case**: User with browser setting "Always download PDFs" → File downloads correctly (browser override)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**

**Authentication & Session Management:**
- Users logging in without checking "Remember me" must continue to authenticate successfully with default session behavior
- User logout must continue to clear sessions and redirect to login page
- Session cookie updates in middleware must continue to work for all routes

**File Conversion Process:**
- Unauthenticated users must continue to convert files and receive base64-encoded results
- Authenticated users must continue to have conversions saved to database
- File validation (type, size) must continue to work identically
- PDF generation quality and formatting must remain unchanged

**Middleware Functionality:**
- Protected routes must continue to require authentication
- Session validation must continue to work on every request
- Cookie management must continue to update session tokens correctly

**Download & Storage:**
- Signed URLs must continue to expire after 1 hour
- Users attempting to download deleted files must continue to receive 404 errors
- Users attempting to download files they don't own must continue to receive 403 Forbidden errors
- File access permissions must remain unchanged

**UI & User Experience:**
- Conversion history display must continue to show all user conversions
- Loading indicators must continue to appear during uploads and conversions
- Error messages must continue to display for validation failures
- Form validation must continue to work for all input fields

**Scope:**

All inputs and scenarios that do NOT involve the four specific bug conditions should be completely unaffected by these fixes. This includes:
- All non-middleware routes and API endpoints
- Login attempts without "Remember me" interaction
- File conversions by unauthenticated users
- Any file operations not involving authenticated uploads or downloads
- All other UI components and pages

## Hypothesized Root Cause

### Bug 1: Middleware Deprecation Warning

Based on the deprecation message and Next.js 16.2.4 release notes, the most likely issue is:

1. **Convention Change**: Next.js 16.2.4 has deprecated the `middleware.ts` file convention in favor of a new approach
   - The warning explicitly mentions using 'proxy' instead
   - However, Next.js documentation may indicate a different recommended pattern
   - The actual functionality still works, but the framework warns about future removal

2. **Documentation Mismatch**: The current implementation follows older Next.js patterns
   - Need to check `node_modules/next/dist/docs/` for the correct 16.2.4 convention
   - The fix may involve renaming, restructuring, or using a different configuration approach

### Bug 2: Remember Me Feature Not Working

Based on the LoginForm component analysis, the issues are:

1. **No State Management**: The checkbox has no `checked` or `onChange` props
   - Line in LoginForm.tsx shows: `<input type="checkbox" className="..." />`
   - No React state variable tracks the checkbox value
   - No event handler captures user interaction

2. **No Session Configuration**: The `signInWithPassword` call doesn't use the checkbox value
   - Supabase auth supports session persistence options
   - The current implementation doesn't pass any persistence configuration
   - Need to use Supabase's session management options based on checkbox state

3. **Missing Persistence Logic**: No mechanism to store or retrieve the "Remember me" preference
   - Could use localStorage to remember the checkbox state across page loads
   - Could use different session durations based on checkbox state

### Bug 3: File Upload Error

Based on the code analysis, the most likely issues are:

1. **Storage Bucket Permissions**: The 'uploads' bucket may not have correct RLS (Row Level Security) policies
   - Authenticated users need INSERT permission on the 'uploads' bucket
   - The bucket may be configured for public access only or have restrictive policies
   - Unauthenticated uploads work because they might use a different code path or bucket

2. **Authentication Context**: The `createClient()` call in `uploadFile` may not have proper auth context
   - The function uses `await createClient()` from server-side
   - The auth session may not be properly passed to the storage client
   - Server-side Supabase client may need explicit session handling

3. **File Path or Naming Issues**: The storage path format may be invalid
   - Path format: `${userId}/${timestamp}-${sanitizedFileName}`
   - Bucket policies may restrict certain path patterns
   - File name sanitization may create invalid paths

4. **Buffer Conversion Issue**: The Buffer to ArrayBuffer conversion may fail
   - The code converts Buffer to ArrayBuffer for upload
   - This conversion may not work correctly in all cases
   - The Supabase client may not accept the converted format

### Bug 4: Download File Opens in Browser

Based on the signed URL generation analysis, the issue is:

1. **Missing Content-Disposition Parameter**: Supabase Storage's `createSignedUrl` doesn't automatically add download headers
   - The signed URL points directly to the file without download instructions
   - Browsers default to displaying PDFs inline when no Content-Disposition header is present
   - Need to add `download` parameter or use a different URL generation approach

2. **No Download Query Parameter**: The signed URL may need a `?download` query parameter
   - Supabase Storage may support a download parameter in the URL
   - This would instruct the storage service to add Content-Disposition headers
   - Alternative: Use a proxy endpoint that adds the header

3. **Client-Side Download Approach**: May need to fetch and trigger download programmatically
   - Instead of direct link navigation, fetch the file as a blob
   - Create an object URL and trigger download via JavaScript
   - This gives full control over download behavior

## Correctness Properties

Property 1: Bug Condition - Middleware Deprecation Resolved

_For any_ application startup or build process on Next.js 16.2.4, the system SHALL NOT display deprecation warnings related to middleware file conventions, and all middleware functionality (session management, route protection) SHALL continue to work identically to the current implementation.

**Validates: Requirements 2.1, 2.2**

Property 2: Bug Condition - Remember Me Functionality

_For any_ login attempt where the "Remember me" checkbox is checked, the system SHALL configure the Supabase authentication session with extended persistence, and the session SHALL remain valid for a longer duration than unchecked logins.

**Validates: Requirements 2.3, 2.4**

Property 3: Bug Condition - File Upload Success

_For any_ authenticated user uploading a valid DOCX file (correct type, within size limit), the system SHALL successfully upload the file to the 'uploads' storage bucket and return a success response with the storage path.

**Validates: Requirements 2.6, 2.7**

Property 4: Bug Condition - Direct File Download

_For any_ authenticated user clicking the "Download" button on a converted PDF file, the browser SHALL initiate a direct file download (showing save dialog or saving to Downloads folder) instead of opening the file inline in a new tab.

**Validates: Requirements 2.9, 2.10, 2.11**

Property 5: Preservation - Authentication Without Remember Me

_For any_ login attempt where the "Remember me" checkbox is NOT checked, the system SHALL produce exactly the same authentication behavior as the original code, preserving default session duration and behavior.

**Validates: Requirements 3.1**

Property 6: Preservation - Unauthenticated File Conversion

_For any_ file conversion by an unauthenticated user, the system SHALL produce exactly the same behavior as the original code, processing the conversion and returning base64-encoded results without storage operations.

**Validates: Requirements 3.3**

Property 7: Preservation - Middleware Route Protection

_For any_ request to protected routes, the middleware SHALL continue to validate authentication status and manage session cookies exactly as the original implementation.

**Validates: Requirements 3.6, 3.7**

Property 8: Preservation - Download Access Control

_For any_ download attempt for deleted files or files owned by other users, the system SHALL continue to return appropriate error responses (404 for deleted, 403 for unauthorized) exactly as the original implementation.

**Validates: Requirements 3.9, 3.10**

## Fix Implementation

### Bug 1: Middleware Deprecation Warning

Assuming the root cause is the deprecated file convention:

**File**: `middleware.ts` (root directory)

**Approach**: Check Next.js 16.2.4 documentation for the correct convention

**Specific Changes**:

1. **Investigate Next.js 16.2.4 Convention**: Read `node_modules/next/dist/docs/` to understand the recommended approach
   - Check if 'proxy' is the correct replacement
   - Verify if the file needs to be renamed or restructured
   - Understand any API changes in the middleware function signature

2. **Apply Recommended Convention**: Implement the Next.js 16.2.4 recommended pattern
   - If renaming is required: rename `middleware.ts` to the new convention
   - If API changes are required: update the `updateSession` function call
   - If configuration changes are required: update `next.config.ts`

3. **Preserve Functionality**: Ensure all middleware behavior remains identical
   - Session cookie management must work the same way
   - Route matching configuration must remain unchanged
   - Authentication validation must continue to work

4. **Verify No Warnings**: Test that the deprecation warning no longer appears
   - Run `npm run dev` and check console output
   - Run `npm run build` and check build output
   - Verify no new warnings are introduced

**Note**: The actual implementation depends on what the Next.js 16.2.4 documentation specifies. The fix should be minimal and only address the convention change.

### Bug 2: Remember Me Feature Not Working

Assuming the root cause is missing state management and session configuration:

**File**: `src/components/auth/LoginForm.tsx`

**Specific Changes**:

1. **Add State Management**: Create a state variable for the checkbox
   ```typescript
   const [rememberMe, setRememberMe] = useState(false);
   ```

2. **Connect Checkbox to State**: Add `checked` and `onChange` props
   ```typescript
   <input
     type="checkbox"
     checked={rememberMe}
     onChange={(e) => setRememberMe(e.target.checked)}
     className="..."
   />
   ```

3. **Configure Session Persistence**: Modify the `signInWithPassword` call to use the checkbox value
   ```typescript
   const { data, error } = await supabase.auth.signInWithPassword({
     email,
     password,
     options: {
       // Configure session based on rememberMe state
       // May need to set session duration or persistence options
     }
   });
   ```

4. **Research Supabase Session Options**: Investigate Supabase auth configuration
   - Check if `persistSession` option exists
   - Check if session duration can be configured
   - Determine the correct way to implement "Remember me" with Supabase

5. **Optional: Persist Checkbox State**: Store the checkbox preference in localStorage
   ```typescript
   useEffect(() => {
     const saved = localStorage.getItem('rememberMe');
     if (saved !== null) {
       setRememberMe(saved === 'true');
     }
   }, []);

   useEffect(() => {
     localStorage.setItem('rememberMe', rememberMe.toString());
   }, [rememberMe]);
   ```

### Bug 3: File Upload Error

Assuming the root cause is storage bucket permissions or authentication context:

**Primary Investigation**: Check Supabase Storage bucket policies

**File**: Supabase Dashboard → Storage → 'uploads' bucket → Policies

**Specific Changes**:

1. **Verify Bucket Policies**: Check RLS policies on the 'uploads' bucket
   - Ensure authenticated users have INSERT permission
   - Policy should allow: `(bucket_id = 'uploads') AND (auth.uid() IS NOT NULL)`
   - May need to add a policy like: "Allow authenticated users to upload"

2. **Add Storage Policy (if missing)**:
   ```sql
   CREATE POLICY "Allow authenticated uploads"
   ON storage.objects
   FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'uploads');
   ```

3. **Verify Authentication Context**: Ensure the server-side client has auth context
   - The `createClient()` in `src/lib/storage/operations.ts` should have the user session
   - May need to verify that `src/lib/supabase/server.ts` properly handles cookies

4. **Add Detailed Error Logging**: Enhance error messages to identify the exact failure point
   ```typescript
   if (error) {
     console.error(`Storage upload error for ${bucket}/${path}:`, {
       message: error.message,
       statusCode: error.statusCode,
       details: error
     });
   }
   ```

5. **Test with Different File Sizes**: Verify the issue isn't size-related
   - Test with very small files (< 1 KB)
   - Test with medium files (~ 5 MB)
   - Ensure the issue is consistent across file sizes

**Alternative Fix (if permissions are correct)**: Modify the upload approach

**File**: `src/lib/storage/operations.ts`

**Changes**:
- Try using `File` or `Blob` directly instead of converting Buffer to ArrayBuffer
- Add explicit content-type headers
- Verify the storage path format is valid

### Bug 4: Download File Opens in Browser

Assuming the root cause is missing Content-Disposition header:

**Approach 1: Add Download Parameter to Signed URL**

**File**: `src/lib/storage/signedUrls.ts`

**Specific Changes**:

1. **Research Supabase Storage Download Options**: Check if `createSignedUrl` supports download parameter
   - Supabase Storage may support a `download` option
   - Check Supabase documentation for signed URL options

2. **Add Download Option (if supported)**:
   ```typescript
   const { data, error } = await supabase.storage
     .from(bucket)
     .createSignedUrl(path, expiresIn, {
       download: true  // or download: filename
     });
   ```

**Approach 2: Use Client-Side Download Trigger**

**File**: `src/components/dashboard/ConversionHistory.tsx` (or wherever download button is)

**Specific Changes**:

1. **Fetch File as Blob**: Instead of direct link, fetch the file
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

2. **Update Download Button**: Call the download handler instead of direct navigation

**Approach 3: Create Proxy Endpoint**

**File**: `app/api/conversions/[id]/download/route.ts`

**Specific Changes**:

1. **Modify GET Handler**: Instead of returning the signed URL, proxy the file with headers
   ```typescript
   // Fetch file from storage
   const response = await fetch(url);
   const blob = await response.blob();
   
   // Return with Content-Disposition header
   return new NextResponse(blob, {
     headers: {
       'Content-Type': 'application/pdf',
       'Content-Disposition': `attachment; filename="${outputFile.file_name}"`,
     },
   });
   ```

**Recommended Approach**: Try Approach 1 first (simplest), then Approach 2 (client-side), then Approach 3 (proxy) if needed.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach for each bug:
1. **Exploratory Bug Condition Checking**: Demonstrate the bug on unfixed code to confirm root cause
2. **Fix and Preservation Checking**: Verify the fix works correctly and doesn't break existing functionality

### Bug 1: Middleware Deprecation Warning

#### Exploratory Bug Condition Checking

**Goal**: Confirm the deprecation warning appears on unfixed code and identify the exact message.

**Test Plan**: Run the application and build process on unfixed code to observe the warning.

**Test Cases**:
1. **Development Server Test**: Run `npm run dev` and check console for deprecation warnings (will show warning on unfixed code)
2. **Build Process Test**: Run `npm run build` and check build output for warnings (will show warning on unfixed code)
3. **Production Start Test**: Run `npm run start` after build and verify no runtime warnings (may show warning on unfixed code)

**Expected Counterexamples**:
- Console output shows: "The 'middleware' file convention is deprecated. Please use 'proxy' instead."
- Build process may show similar warnings
- Possible causes: outdated file convention, API changes in Next.js 16.2.4

#### Fix Checking

**Goal**: Verify that after applying the fix, no deprecation warnings appear and middleware functionality works correctly.

**Pseudocode:**
```
FOR ALL applicationStartup WHERE nextJsVersion == "16.2.4" DO
  output := runApplication()
  ASSERT NOT containsDeprecationWarning(output)
  ASSERT middlewareFunctionsCorrectly()
END FOR
```

**Test Cases**:
1. Run `npm run dev` and verify no deprecation warnings
2. Run `npm run build` and verify clean build output
3. Test protected route access and verify authentication works
4. Test session cookie updates and verify they work correctly

#### Preservation Checking

**Goal**: Verify that all middleware functionality remains unchanged after the fix.

**Pseudocode:**
```
FOR ALL request WHERE requiresMiddleware(request) DO
  ASSERT middlewareFixed(request) = middlewareOriginal(request)
END FOR
```

**Test Cases**:
1. **Route Protection**: Access protected routes without auth → should redirect to login
2. **Session Management**: Login and verify session cookies are set correctly
3. **Cookie Updates**: Make multiple requests and verify cookies are refreshed
4. **Public Routes**: Access public routes and verify no authentication required

### Bug 2: Remember Me Feature

#### Exploratory Bug Condition Checking

**Goal**: Confirm the checkbox has no functionality on unfixed code.

**Test Plan**: Interact with the checkbox and observe that it has no effect on login behavior.

**Test Cases**:
1. **Checkbox State Test**: Check the checkbox, refresh page → checkbox state is lost (will fail on unfixed code)
2. **Session Duration Test**: Login with checkbox checked vs unchecked → session duration is identical (will fail on unfixed code)
3. **Visual Feedback Test**: Click checkbox → visual state may not update properly (will fail on unfixed code)

**Expected Counterexamples**:
- Checkbox state is not managed by React
- Login behavior is identical regardless of checkbox state
- No session persistence configuration is applied
- Possible causes: missing state management, no event handlers, no Supabase session options

#### Fix Checking

**Goal**: Verify that checking "Remember me" results in extended session persistence.

**Pseudocode:**
```
FOR ALL loginAttempt WHERE rememberMeChecked == true DO
  result := performLogin(loginAttempt)
  ASSERT sessionPersistence(result) == EXTENDED
  ASSERT sessionDuration(result) > defaultSessionDuration
END FOR
```

**Test Cases**:
1. Login with "Remember me" checked → verify session persists longer
2. Login with "Remember me" unchecked → verify default session behavior
3. Check checkbox, refresh page → verify checkbox state is remembered (if implemented)
4. Verify checkbox visual state updates correctly on interaction

#### Preservation Checking

**Goal**: Verify that login without "Remember me" works exactly as before.

**Pseudocode:**
```
FOR ALL loginAttempt WHERE rememberMeChecked == false DO
  ASSERT loginFixed(loginAttempt) = loginOriginal(loginAttempt)
END FOR
```

**Test Cases**:
1. **Default Login**: Login without checking "Remember me" → should work identically to original
2. **Logout**: Logout after login → should clear session correctly
3. **Invalid Credentials**: Try login with wrong password → should show same error
4. **Form Validation**: Submit empty form → should show same validation errors

### Bug 3: File Upload Error

#### Exploratory Bug Condition Checking

**Goal**: Reproduce the upload failure on unfixed code and identify the exact error.

**Test Plan**: Attempt to upload a DOCX file as an authenticated user and observe the failure.

**Test Cases**:
1. **Authenticated Upload Test**: Login, upload "test.docx" → should fail with "Failed to upload file to storage" (will fail on unfixed code)
2. **Unauthenticated Upload Test**: Upload without login → should succeed (conversion works, no storage)
3. **Different File Sizes**: Try small (1 KB), medium (5 MB), large (40 MB) files → all should fail for authenticated users
4. **Console Error Analysis**: Check browser console and server logs for detailed error messages

**Expected Counterexamples**:
- Supabase Storage returns permission denied or authentication error
- Upload fails at the `supabase.storage.from(bucket).upload()` call
- Possible causes: missing RLS policy, incorrect auth context, invalid storage path

#### Fix Checking

**Goal**: Verify that authenticated users can successfully upload files after the fix.

**Pseudocode:**
```
FOR ALL uploadRequest WHERE userAuthenticated == true AND fileValid == true DO
  result := uploadFile(uploadRequest)
  ASSERT result.success == true
  ASSERT result.storagePath != ""
  ASSERT fileExistsInStorage(result.storagePath)
END FOR
```

**Test Cases**:
1. Login and upload valid DOCX file → should succeed
2. Verify file appears in Supabase Storage 'uploads' bucket
3. Verify file record is created in database
4. Verify conversion completes successfully
5. Test with various file sizes (1 KB, 5 MB, 40 MB)

#### Preservation Checking

**Goal**: Verify that unauthenticated uploads and other file operations work exactly as before.

**Pseudocode:**
```
FOR ALL uploadRequest WHERE userAuthenticated == false DO
  ASSERT uploadFixed(uploadRequest) = uploadOriginal(uploadRequest)
END FOR
```

**Test Cases**:
1. **Unauthenticated Conversion**: Upload file without login → should return base64 result
2. **File Validation**: Upload invalid file type → should show same error
3. **Size Limit**: Upload file > 50 MB → should show same error
4. **Conversion Quality**: Compare PDF output quality before and after fix

### Bug 4: Download File Opens in Browser

#### Exploratory Bug Condition Checking

**Goal**: Confirm that clicking download opens the file in browser instead of downloading.

**Test Plan**: Complete a conversion, click the download button, and observe browser behavior.

**Test Cases**:
1. **Download Button Test**: Click "Download" on converted PDF → opens in new tab instead of downloading (will fail on unfixed code)
2. **Right-Click Test**: Right-click "Download" and select "Save as" → should work (browser override)
3. **Mobile Browser Test**: Test on mobile device → PDF opens in browser viewer (will fail on unfixed code)
4. **Different Browsers**: Test in Chrome, Firefox, Safari → all show inline display (will fail on unfixed code)

**Expected Counterexamples**:
- Browser navigates to signed URL and displays PDF inline
- No "Save As" dialog appears
- File is not saved to Downloads folder
- Possible causes: missing Content-Disposition header, no download parameter in URL

#### Fix Checking

**Goal**: Verify that clicking download triggers a direct file download.

**Pseudocode:**
```
FOR ALL downloadRequest WHERE userAuthenticated == true AND fileType == "pdf" DO
  result := initiateDownload(downloadRequest)
  ASSERT downloadTriggered(result) == true
  ASSERT NOT openedInBrowser(result)
END FOR
```

**Test Cases**:
1. Click "Download" button → file should download directly
2. Verify "Save As" dialog appears (or file saves to Downloads)
3. Verify file is not opened in browser tab
4. Test in multiple browsers (Chrome, Firefox, Safari)
5. Test on mobile devices

#### Preservation Checking

**Goal**: Verify that download access control and URL expiration work exactly as before.

**Pseudocode:**
```
FOR ALL downloadRequest WHERE NOT validDownloadRequest(downloadRequest) DO
  ASSERT downloadFixed(downloadRequest) = downloadOriginal(downloadRequest)
END FOR
```

**Test Cases**:
1. **Deleted File**: Try to download deleted file → should return 404
2. **Unauthorized Access**: Try to download another user's file → should return 403
3. **Expired URL**: Wait for URL to expire (> 1 hour) → should fail with appropriate error
4. **URL Expiration Time**: Verify signed URLs still expire after 1 hour
5. **Unauthenticated Access**: Try to access download endpoint without login → should return 401

### Unit Tests

**Middleware:**
- Test that middleware function is called on protected routes
- Test that session cookies are updated correctly
- Test that unauthenticated requests to protected routes are handled

**Remember Me:**
- Test checkbox state management (checked/unchecked)
- Test that login with "Remember me" uses correct Supabase options
- Test that checkbox state persists across page refreshes (if implemented)

**File Upload:**
- Test uploadFile function with authenticated user context
- Test that storage path is generated correctly
- Test error handling for storage failures

**Download:**
- Test that signed URLs are generated with download parameters
- Test that download endpoint returns correct headers
- Test access control for download requests

### Property-Based Tests

**Session Management:**
- Generate random user sessions and verify middleware handles them correctly
- Test that session persistence varies based on "Remember me" state

**File Upload:**
- Generate random valid DOCX files and verify all upload successfully
- Generate random file sizes (within limit) and verify upload success
- Test that file paths are always valid regardless of filename characters

**Download:**
- Generate random download requests and verify access control is enforced
- Test that download behavior is consistent across different file types
- Verify that expired URLs always fail regardless of timing variations

### Integration Tests

**Full Login Flow:**
- Register user → Login with "Remember me" → Verify extended session → Logout
- Login without "Remember me" → Verify default session → Close browser → Verify session expired

**Full Conversion Flow:**
- Login → Upload DOCX → Verify storage upload → Verify conversion → Download PDF → Verify direct download
- Upload DOCX without login → Verify conversion → Verify base64 result

**Middleware Integration:**
- Start application → Verify no deprecation warnings → Access protected routes → Verify authentication works
- Test session management across multiple requests and route transitions

**Download Access Control:**
- User A uploads file → User B tries to download → Verify 403 error
- User uploads file → File is deleted → User tries to download → Verify 404 error
- User downloads file → Wait 1 hour → Try to use same URL → Verify expiration error
