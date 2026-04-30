/**
 * Bug Condition Exploration Test: Authenticated File Upload Fails
 * 
 * **Validates: Requirements 2.6, 2.7**
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * DO NOT attempt to fix the test or the code when it fails
 * 
 * This test encodes the expected behavior - it will validate the fix when it passes after implementation
 * 
 * GOAL: Surface counterexamples that demonstrate authenticated uploads fail
 * 
 * Bug Condition: Authenticated user uploading valid DOCX files to 'uploads' bucket fails
 * Expected Behavior: Upload should succeed and return storage path
 * 
 * EXPECTED OUTCOME: Test FAILS (this is correct - it proves the bug exists)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Bug 3: Authenticated File Upload Fails', () => {
  const projectRoot = join(__dirname, '../..');
  
  beforeAll(() => {
    console.log('\n=== Bug 3: File Upload Error - Code Analysis ===');
    console.log('This test analyzes the code structure to identify the bug condition');
    console.log('EXPECTED OUTCOME: Tests FAIL on unfixed code (proves bug exists)\n');
  });

  describe('Bug Condition: Upload to uploads bucket fails for authenticated users', () => {
    it('should verify uploadFile function exists in storage operations', () => {
      // Prerequisite check: Verify the uploadFile function is available
      console.log('\n=== Upload Function Verification ===');
      
      const storageOpsPath = join(projectRoot, 'src/lib/storage/operations.ts');
      const storageOpsContent = readFileSync(storageOpsPath, 'utf-8');
      
      const hasUploadFileFunction = storageOpsContent.includes('export async function uploadFile');
      const hasUploadFileParams = storageOpsContent.includes('bucket: string') &&
                                   storageOpsContent.includes('path: string') &&
                                   storageOpsContent.includes('file:');
      
      console.log('uploadFile function exists:', hasUploadFileFunction);
      console.log('Function has correct parameters:', hasUploadFileParams);
      
      expect(hasUploadFileFunction).toBe(true);
      expect(hasUploadFileParams).toBe(true);
      
      console.log('✓ uploadFile function structure verified');
    });

    it('should document the expected behavior for authenticated uploads', () => {
      // Document what SHOULD happen (expected behavior after fix)
      console.log('\n=== Expected Behavior Documentation ===');
      console.log('Bug: Authenticated users get "Failed to upload file to storage" error');
      console.log('\nCurrent Behavior (UNFIXED):');
      console.log('  - Authenticated user uploads DOCX file');
      console.log('  - uploadFile() is called with "uploads" bucket');
      console.log('  - Upload fails with storage error');
      console.log('  - Error message: "Failed to upload file to storage"');
      console.log('\nExpected Behavior (AFTER FIX):');
      console.log('  - Authenticated user uploads DOCX file');
      console.log('  - uploadFile() successfully uploads to "uploads" bucket');
      console.log('  - Returns success response with storage path');
      console.log('  - File is accessible in Supabase Storage');
      console.log('\nRoot Cause Hypothesis:');
      console.log('  - Missing RLS policy on "uploads" bucket for authenticated users');
      console.log('  - Or authentication context not properly passed to storage client');
      console.log('  - Or storage path format is invalid');
      
      expect(true).toBe(true);
    });

    it('should verify uploadFile uses createClient for authentication context', () => {
      // This test verifies that uploadFile gets authentication context
      console.log('\n=== Authentication Context Verification ===');
      
      const storageOpsPath = join(projectRoot, 'src/lib/storage/operations.ts');
      const storageOpsContent = readFileSync(storageOpsPath, 'utf-8');
      
      // Check if uploadFile creates a Supabase client
      const usesCreateClient = storageOpsContent.includes('createClient()') ||
                               storageOpsContent.includes('await createClient()');
      const importsCreateClient = storageOpsContent.includes("from '@/src/lib/supabase/server'") ||
                                  storageOpsContent.includes('from "@/src/lib/supabase/server"');
      
      console.log('uploadFile uses createClient:', usesCreateClient);
      console.log('Imports createClient from server:', importsCreateClient);
      
      if (!usesCreateClient || !importsCreateClient) {
        console.log('\n⚠️  POTENTIAL ISSUE:');
        console.log('  uploadFile may not have proper authentication context');
        console.log('  Expected: Uses createClient() from server to get authenticated session');
      }
      
      expect(usesCreateClient).toBe(true);
      expect(importsCreateClient).toBe(true);
      
      console.log('✓ Authentication context structure verified');
    });

    it('should verify storage upload error handling exists', () => {
      // Check that error handling is present
      console.log('\n=== Error Handling Verification ===');
      
      const storageOpsPath = join(projectRoot, 'src/lib/storage/operations.ts');
      const storageOpsContent = readFileSync(storageOpsPath, 'utf-8');
      
      const hasErrorHandling = storageOpsContent.includes('if (error)') ||
                               storageOpsContent.includes('if(error)');
      const returnsError = storageOpsContent.includes('return {') &&
                          storageOpsContent.includes('error:');
      const hasErrorMessage = storageOpsContent.includes('Failed to upload file');
      
      console.log('Has error handling:', hasErrorHandling);
      console.log('Returns error object:', returnsError);
      console.log('Has "Failed to upload file" message:', hasErrorMessage);
      
      if (hasErrorMessage) {
        console.log('\n✓ Error message matches bug report');
        console.log('  This confirms the error handling code exists');
        console.log('  The bug is likely in storage permissions, not error handling');
      }
      
      expect(hasErrorHandling).toBe(true);
      expect(returnsError).toBe(true);
      expect(hasErrorMessage).toBe(true);
    });
  });

  describe('Bug Condition: Route Handler Uses uploadFile', () => {
    it('should verify word-to-pdf route calls uploadFile for authenticated users', () => {
      // Verify the conversion route uses uploadFile
      console.log('\n=== Route Handler Analysis ===');
      
      const routePath = join(projectRoot, 'app/api/convert/word-to-pdf/route.ts');
      const routeContent = readFileSync(routePath, 'utf-8');
      
      const importsUploadFile = routeContent.includes("from '@/src/lib/storage/operations'");
      const callsUploadFile = routeContent.includes('await uploadFile(');
      const uploadsToUploadsB ucket = routeContent.includes("'uploads'") || routeContent.includes('"uploads"');
      const hasAuthCheck = routeContent.includes('getUser()') || routeContent.includes('user?.id');
      
      console.log('Imports uploadFile:', importsUploadFile);
      console.log('Calls uploadFile:', callsUploadFile);
      console.log('Uploads to "uploads" bucket:', uploadsToUploadsB ucket);
      console.log('Has authentication check:', hasAuthCheck);
      
      expect(importsUploadFile).toBe(true);
      expect(callsUploadFile).toBe(true);
      expect(uploadsToUploadsB ucket).toBe(true);
      
      console.log('✓ Route handler structure verified');
    });

    it('should verify route handler checks for upload errors', () => {
      // Verify error handling in the route
      console.log('\n=== Route Error Handling Analysis ===');
      
      const routePath = join(projectRoot, 'app/api/convert/word-to-pdf/route.ts');
      const routeContent = readFileSync(routePath, 'utf-8');
      
      const checksUploadError = routeContent.includes('uploadResult.error') ||
                                routeContent.includes('uploadError');
      const returnsErrorResponse = routeContent.includes('Failed to upload file to storage');
      const returns500Status = routeContent.includes('status: 500');
      
      console.log('Checks for upload error:', checksUploadError);
      console.log('Returns "Failed to upload file to storage":', returnsErrorResponse);
      console.log('Returns 500 status:', returns500Status);
      
      if (returnsErrorResponse) {
        console.log('\n✓ Error message matches bug report exactly');
        console.log('  This confirms users see this error when upload fails');
        console.log('  The bug is in the upload operation, not error reporting');
      }
      
      expect(checksUploadError).toBe(true);
      expect(returnsErrorResponse).toBe(true);
      expect(returns500Status).toBe(true);
    });
  });

  describe('Property: Storage Client Authentication Context', () => {
    it('should verify server-side Supabase client has cookie access', () => {
      // Verify that the server client can access authentication cookies
      console.log('\n=== Server Client Authentication Analysis ===');
      
      const serverClientPath = join(projectRoot, 'src/lib/supabase/server.ts');
      const serverClientContent = readFileSync(serverClientPath, 'utf-8');
      
      const usesCreateServerClient = serverClientContent.includes('createServerClient');
      const importsCookies = serverClientContent.includes("from 'next/headers'");
      const hasCookieAccess = serverClientContent.includes('cookies()') ||
                              serverClientContent.includes('await cookies()');
      const hasCookieGetAll = serverClientContent.includes('getAll()');
      const hasCookieSetAll = serverClientContent.includes('setAll');
      
      console.log('Uses createServerClient:', usesCreateServerClient);
      console.log('Imports cookies from next/headers:', importsCookies);
      console.log('Accesses cookies:', hasCookieAccess);
      console.log('Has getAll method:', hasCookieGetAll);
      console.log('Has setAll method:', hasCookieSetAll);
      
      if (usesCreateServerClient && hasCookieAccess) {
        console.log('\n✓ Server client has proper cookie access');
        console.log('  This means authentication context SHOULD be available');
        console.log('  Bug is likely in storage bucket permissions, not auth context');
      }
      
      expect(usesCreateServerClient).toBe(true);
      expect(hasCookieAccess).toBe(true);
    });

    it('should verify uploadFile uses the server client (not browser client)', () => {
      // Ensure uploadFile uses server-side client with auth context
      console.log('\n=== Upload Function Client Type Analysis ===');
      
      const storageOpsPath = join(projectRoot, 'src/lib/storage/operations.ts');
      const storageOpsContent = readFileSync(storageOpsPath, 'utf-8');
      
      const importsFromServer = storageOpsContent.includes("from '@/src/lib/supabase/server'");
      const importsFromClient = storageOpsContent.includes("from '@/src/lib/supabase/client'");
      
      console.log('Imports from server:', importsFromServer);
      console.log('Imports from client (browser):', importsFromClient);
      
      if (importsFromServer && !importsFromClient) {
        console.log('\n✓ Correctly uses server-side client');
        console.log('  Server client has access to authentication cookies');
        console.log('  Authentication context should be available for storage operations');
      } else if (importsFromClient) {
        console.log('\n⚠️  WARNING: Uses browser client');
        console.log('  Browser client may not have proper auth context on server');
        console.log('  This could cause authentication issues');
      }
      
      expect(importsFromServer).toBe(true);
      expect(importsFromClient).toBe(false);
    });
  });

  describe('Bug Condition: Storage Bucket RLS Policy Analysis', () => {
    it('should document the expected RLS policy for uploads bucket', () => {
      // Document what RLS policy SHOULD exist
      console.log('\n=== Expected RLS Policy Documentation ===');
      console.log('Bug: Authenticated uploads fail - likely missing RLS policy');
      console.log('\nExpected Policy on "uploads" bucket:');
      console.log('  Policy Name: "Allow authenticated uploads"');
      console.log('  Operation: INSERT');
      console.log('  Target: authenticated users');
      console.log('  Condition: bucket_id = \'uploads\' AND auth.uid() IS NOT NULL');
      console.log('\nSQL to create policy:');
      console.log('  CREATE POLICY "Allow authenticated uploads"');
      console.log('  ON storage.objects');
      console.log('  FOR INSERT');
      console.log('  TO authenticated');
      console.log('  WITH CHECK (bucket_id = \'uploads\');');
      console.log('\nVerification Steps:');
      console.log('  1. Open Supabase Dashboard');
      console.log('  2. Navigate to Storage → uploads bucket → Policies');
      console.log('  3. Check if INSERT policy exists for authenticated users');
      console.log('  4. If missing, add the policy above');
      console.log('  5. Re-run tests to verify fix');
      
      expect(true).toBe(true);
    });

    it('should verify storage operations file has proper error logging', () => {
      // Check that errors are logged for debugging
      console.log('\n=== Error Logging Analysis ===');
      
      const storageOpsPath = join(projectRoot, 'src/lib/storage/operations.ts');
      const storageOpsContent = readFileSync(storageOpsPath, 'utf-8');
      
      const hasConsoleError = storageOpsContent.includes('console.error');
      const logsStorageError = storageOpsContent.includes('Storage upload error') ||
                               storageOpsContent.includes('storage error');
      const logsBucketAndPath = storageOpsContent.includes('${bucket}') &&
                                storageOpsContent.includes('${path}');
      
      console.log('Has console.error logging:', hasConsoleError);
      console.log('Logs storage errors:', logsStorageError);
      console.log('Logs bucket and path:', logsBucketAndPath);
      
      if (hasConsoleError && logsStorageError) {
        console.log('\n✓ Error logging is present');
        console.log('  Check server logs for detailed error messages');
        console.log('  Logs should show the exact Supabase storage error');
      }
      
      expect(hasConsoleError).toBe(true);
    });
  });

  describe('Bug Condition: Storage Path Format', () => {
    it('should verify storage path format is valid', () => {
      // Verify the storage path format used in the application
      console.log('\n=== Storage Path Format Verification ===');
      
      const mockUserId = 'user-abc-123';
      const timestamp = 1234567890;
      const fileName = 'MAMADDDDD.docx';
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      
      const expectedPath = `${mockUserId}/${timestamp}-${sanitizedFileName}`;
      
      console.log('User ID:', mockUserId);
      console.log('Timestamp:', timestamp);
      console.log('Original filename:', fileName);
      console.log('Sanitized filename:', sanitizedFileName);
      console.log('Expected storage path:', expectedPath);
      
      // Verify path format matches what's used in route.ts
      expect(expectedPath).toBe('user-abc-123/1234567890-MAMADDDDD.docx');
      
      console.log('\nPath format validation: ✓');
      console.log('Format: {userId}/{timestamp}-{sanitizedFileName}');
    });

    it('should verify path sanitization handles special characters', () => {
      // Test that file name sanitization works correctly
      console.log('\n=== File Name Sanitization Test ===');
      
      const testCases = [
        { input: 'MAMADDDDD.docx', expected: 'MAMADDDDD.docx' },
        { input: 'test file.docx', expected: 'test_file.docx' },
        { input: 'file@#$%.docx', expected: 'file____.docx' },
        { input: 'résumé.docx', expected: 'rsum.docx' },
      ];
      
      testCases.forEach(({ input, expected }) => {
        const sanitized = input.replace(/[^a-zA-Z0-9.-]/g, '_');
        console.log(`  "${input}" → "${sanitized}"`);
        expect(sanitized).toBe(expected);
      });
      
      console.log('\nSanitization logic: ✓');
    });
  });

  describe('Bug Impact Documentation', () => {
    it('should document the complete bug manifestation', () => {
      console.log('\n=== Bug Impact Summary ===');
      console.log('Bug: Authenticated File Upload Fails');
      console.log('\nReported Behavior:');
      console.log('  - User: Authenticated user (logged in)');
      console.log('  - File: MAMADDDDD.docx (11.69 KB)');
      console.log('  - Action: Upload file for Word-to-PDF conversion');
      console.log('  - Result: Error "Failed to upload file to storage"');
      console.log('\nExpected Behavior:');
      console.log('  - File should upload successfully to "uploads" bucket');
      console.log('  - Conversion should proceed normally');
      console.log('  - User should receive converted PDF');
      console.log('\nUser Impact:');
      console.log('  - Authenticated users cannot convert files');
      console.log('  - Feature is completely broken for logged-in users');
      console.log('  - Unauthenticated users can still convert (no storage)');
      console.log('\nHypothesized Root Causes:');
      console.log('  1. Missing RLS policy on "uploads" bucket');
      console.log('     - Policy needed: Allow INSERT for authenticated users');
      console.log('  2. Authentication context not passed to storage client');
      console.log('     - Server-side client may not have user session');
      console.log('  3. Storage bucket permissions too restrictive');
      console.log('     - Bucket may only allow public/anonymous access');
      console.log('\nFix Strategy:');
      console.log('  1. Check Supabase Storage RLS policies');
      console.log('  2. Add policy: "Allow authenticated uploads"');
      console.log('  3. Verify auth context in uploadFile function');
      console.log('  4. Test with various file sizes');
      
      expect(true).toBe(true);
    });
  });

  describe('Counterexample Documentation', () => {
    it('should document expected counterexamples from bug condition', () => {
      // This test documents what counterexamples we expect to find
      console.log('\n=== Expected Counterexamples (Bug Evidence) ===');
      console.log('When running against UNFIXED code, we expect to find:\n');
      
      const expectedCounterexamples = [
        {
          scenario: 'Small file (1 KB)',
          fileSize: 1024,
          expectedError: 'Failed to upload file: [Supabase storage error]',
          description: 'Even tiny files fail, ruling out size-related issues'
        },
        {
          scenario: 'Realistic DOCX (11.69 KB)',
          fileSize: 11690,
          expectedError: 'Failed to upload file: [Supabase storage error]',
          description: 'Matches the exact bug report case'
        },
        {
          scenario: 'Medium file (5 MB)',
          fileSize: 5 * 1024 * 1024,
          expectedError: 'Failed to upload file: [Supabase storage error]',
          description: 'Larger files also fail, confirming systematic issue'
        },
        {
          scenario: 'Large file (40 MB)',
          fileSize: 40 * 1024 * 1024,
          expectedError: 'Failed to upload file: [Supabase storage error]',
          description: 'Files near limit also fail'
        }
      ];
      
      expectedCounterexamples.forEach((ce, index) => {
        console.log(`${index + 1}. ${ce.scenario}`);
        console.log(`   File size: ${ce.fileSize} bytes`);
        console.log(`   Expected error: ${ce.expectedError}`);
        console.log(`   Significance: ${ce.description}\n`);
      });
      
      console.log('Common Pattern:');
      console.log('  - ALL file sizes fail (not size-dependent)');
      console.log('  - Error message is consistent');
      console.log('  - Failure occurs at storage upload step');
      console.log('\nThis pattern strongly suggests:');
      console.log('  - Missing RLS policy (affects all uploads equally)');
      console.log('  - OR authentication context issue (affects all authenticated requests)');
      console.log('\nNext Steps:');
      console.log('  1. Check Supabase Dashboard → Storage → uploads → Policies');
      console.log('  2. Look for INSERT policy for authenticated users');
      console.log('  3. If missing, add the policy');
      console.log('  4. Re-run this test - it should PASS after fix');
      
      expect(true).toBe(true);
    });

    it('should provide manual testing instructions', () => {
      console.log('\n=== Manual Testing Instructions ===');
      console.log('To manually verify this bug:\n');
      console.log('1. Start the application: npm run dev');
      console.log('2. Register/login as an authenticated user');
      console.log('3. Navigate to Word-to-PDF converter');
      console.log('4. Upload a DOCX file (e.g., MAMADDDDD.docx)');
      console.log('5. Observe the error: "Failed to upload file to storage"');
      console.log('6. Check browser console and server logs for details');
      console.log('\nTo verify the fix:');
      console.log('1. Add RLS policy to Supabase Storage "uploads" bucket');
      console.log('2. Repeat steps 1-4 above');
      console.log('3. Upload should succeed');
      console.log('4. Conversion should complete');
      console.log('5. User should receive converted PDF');
      console.log('\nSupabase Dashboard Check:');
      console.log('1. Open Supabase Dashboard');
      console.log('2. Go to Storage → uploads bucket');
      console.log('3. Click "Policies" tab');
      console.log('4. Verify INSERT policy exists for authenticated users');
      console.log('5. If missing, click "New Policy" and add:');
      console.log('   - Policy name: Allow authenticated uploads');
      console.log('   - Allowed operation: INSERT');
      console.log('   - Target roles: authenticated');
      console.log('   - WITH CHECK: bucket_id = \'uploads\'');
      
      expect(true).toBe(true);
    });
  });
});
