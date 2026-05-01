/**
 * Bug Condition Exploration Test: Anonymous User Upload Failure
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3**
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * DO NOT attempt to fix the test or the code when it fails
 * 
 * This test encodes the expected behavior - it will validate the fix when it passes after implementation
 * 
 * GOAL: Surface counterexamples that demonstrate anonymous uploads fail
 * 
 * Bug Condition: Anonymous users (user_id = null) cannot upload files due to storage policies
 * Expected Behavior: Anonymous users should be able to upload to anonymous/{timestamp}-{filename} paths
 * 
 * EXPECTED OUTCOME: Test FAILS with authorization errors (this is correct - it proves the bug exists)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createServerClient } from '@supabase/ssr';

describe('Bug: Anonymous User Upload Failure', () => {
  const projectRoot = join(__dirname, '../..');
  
  beforeAll(() => {
    console.log('\n=== Bug: Anonymous Upload Authorization Failure - Exploration ===');
    console.log('This test explores the bug condition where anonymous users cannot upload files');
    console.log('EXPECTED OUTCOME: Tests FAIL on unfixed code (proves bug exists)\n');
  });

  describe('Bug Condition: Anonymous Upload to Uploads Bucket', () => {
    it('should verify anonymous users can upload files to uploads bucket (expected behavior)', async () => {
      // This test encodes the EXPECTED behavior after the fix
      // On UNFIXED code: This will FAIL with authorization error
      // On FIXED code: This will PASS (anonymous uploads succeed)
      
      console.log('\n=== Bug Condition: Anonymous Upload to Uploads Bucket ===');
      
      // Create anonymous Supabase client (no authentication)
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return []; },
            setAll() {},
          },
        }
      );

      // Verify we're anonymous (no user session)
      const { data: { user } } = await supabase.auth.getUser();
      console.log('User session:', user ? 'authenticated' : 'anonymous');
      expect(user).toBeNull();

      // Attempt to upload a test file to uploads bucket
      const timestamp = Date.now();
      const testFileName = 'test-document.docx';
      const testPath = `anonymous/${timestamp}-${testFileName}`;
      const testContent = Buffer.from('Test DOCX content');

      console.log('Attempting anonymous upload to:', testPath);
      console.log('Bucket: uploads');
      console.log('File size:', testContent.length, 'bytes');

      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(testPath, testContent, {
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          upsert: false,
        });

      if (error) {
        console.log('\n⚠️  BUG DETECTED - Anonymous Upload Failed:');
        console.log('  Error message:', error.message);
        console.log('  Error details:', JSON.stringify(error, null, 2));
        console.log('\nRoot Cause:');
        console.log('  Storage policies only allow "authenticated" role to INSERT');
        console.log('  Anonymous users use "anon" role which is not granted INSERT permission');
        console.log('\nExpected Behavior After Fix:');
        console.log('  Anonymous users should be able to upload to anonymous/* paths');
        console.log('  Storage policy should allow "anon" role to INSERT with path restriction');
      } else {
        console.log('✓ Anonymous upload succeeded');
        console.log('  Uploaded path:', data.path);
        
        // Clean up test file
        await supabase.storage.from('uploads').remove([testPath]);
      }

      // ASSERTION: Anonymous upload should succeed
      // On UNFIXED code: This will FAIL (expected - proves bug exists)
      // On FIXED code: This will PASS (confirms bug is fixed)
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.path).toBe(testPath);
    });

    it('should verify anonymous users can upload files to converted bucket (expected behavior)', async () => {
      // Test anonymous upload to converted bucket (for PDF output)
      console.log('\n=== Bug Condition: Anonymous Upload to Converted Bucket ===');
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return []; },
            setAll() {},
          },
        }
      );

      // Verify anonymous
      const { data: { user } } = await supabase.auth.getUser();
      expect(user).toBeNull();

      // Attempt to upload to converted bucket
      const timestamp = Date.now();
      const testFileName = 'test-output.pdf';
      const testPath = `anonymous/${timestamp}-${testFileName}`;
      const testContent = Buffer.from('Test PDF content');

      console.log('Attempting anonymous upload to:', testPath);
      console.log('Bucket: converted');
      console.log('File size:', testContent.length, 'bytes');

      const { data, error } = await supabase.storage
        .from('converted')
        .upload(testPath, testContent, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (error) {
        console.log('\n⚠️  BUG DETECTED - Anonymous Upload to Converted Failed:');
        console.log('  Error message:', error.message);
        console.log('  Error details:', JSON.stringify(error, null, 2));
        console.log('\nRoot Cause:');
        console.log('  Storage policies only allow "authenticated" role to INSERT to converted bucket');
        console.log('  Anonymous conversions cannot save output files');
      } else {
        console.log('✓ Anonymous upload to converted succeeded');
        console.log('  Uploaded path:', data.path);
        
        // Clean up
        await supabase.storage.from('converted').remove([testPath]);
      }

      // ASSERTION: Anonymous upload to converted should succeed
      // On UNFIXED code: This will FAIL (expected - proves bug exists)
      // On FIXED code: This will PASS (confirms bug is fixed)
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.path).toBe(testPath);
    });
  });

  describe('Bug Condition: Storage Path Pattern Validation', () => {
    it('should verify anonymous path pattern matches expected format', () => {
      // Verify the path pattern used for anonymous uploads
      console.log('\n=== Anonymous Path Pattern Verification ===');
      
      const timestamp = 1234567890;
      const fileName = 'document.docx';
      const expectedPath = `anonymous/${timestamp}-${fileName}`;
      
      console.log('Timestamp:', timestamp);
      console.log('Filename:', fileName);
      console.log('Expected path:', expectedPath);
      console.log('Path pattern: anonymous/{timestamp}-{filename}');
      
      expect(expectedPath).toBe('anonymous/1234567890-document.docx');
      
      console.log('✓ Path pattern validated');
    });

    it('should verify path sanitization for anonymous uploads', () => {
      // Test file name sanitization for anonymous uploads
      console.log('\n=== File Name Sanitization for Anonymous Uploads ===');
      
      const testCases = [
        { input: 'document.docx', expected: 'document.docx' },
        { input: 'my file.docx', expected: 'my_file.docx' },
        { input: 'file@#$%.docx', expected: 'file____.docx' },
        { input: 'résumé.docx', expected: 'rsum.docx' },
      ];
      
      testCases.forEach(({ input, expected }) => {
        const sanitized = input.replace(/[^a-zA-Z0-9.-]/g, '_');
        console.log(`  "${input}" → "${sanitized}"`);
        expect(sanitized).toBe(expected);
      });
      
      console.log('\n✓ Sanitization logic validated');
    });
  });

  describe('Bug Condition: Route Handler Anonymous Support', () => {
    it('should verify word-to-pdf route supports anonymous users', () => {
      // Verify the route handler has logic for anonymous users
      console.log('\n=== Route Handler Anonymous Support Analysis ===');
      
      const routePath = join(projectRoot, 'app/api/convert/word-to-pdf/route.ts');
      const routeContent = readFileSync(routePath, 'utf-8');
      
      const hasUserIdCheck = routeContent.includes('user?.id || null') || 
                             routeContent.includes('userId = user?.id || null');
      const hasAnonymousPath = routeContent.includes('anonymous/');
      const hasConditionalPath = routeContent.includes('userId') && 
                                 routeContent.includes('?') && 
                                 routeContent.includes('anonymous');
      
      console.log('Has user ID null check:', hasUserIdCheck);
      console.log('Has anonymous path pattern:', hasAnonymousPath);
      console.log('Has conditional path logic:', hasConditionalPath);
      
      if (hasUserIdCheck && hasAnonymousPath) {
        console.log('\n✓ Route handler supports anonymous users');
        console.log('  Code checks for null user and uses anonymous/ path');
        console.log('  Bug is in storage policies, not application code');
      }
      
      expect(hasUserIdCheck).toBe(true);
      expect(hasAnonymousPath).toBe(true);
    });

    it('should verify uploadFile function is used for anonymous uploads', () => {
      // Verify uploadFile is called for both authenticated and anonymous users
      console.log('\n=== Upload Function Usage Analysis ===');
      
      const routePath = join(projectRoot, 'app/api/convert/word-to-pdf/route.ts');
      const routeContent = readFileSync(routePath, 'utf-8');
      
      const importsUploadFile = routeContent.includes("from '@/src/lib/storage/operations'");
      const callsUploadFile = routeContent.includes('await uploadFile(');
      const uploadsToUploads = routeContent.includes("'uploads'");
      const uploadsToConverted = routeContent.includes("'converted'");
      
      console.log('Imports uploadFile:', importsUploadFile);
      console.log('Calls uploadFile:', callsUploadFile);
      console.log('Uploads to "uploads" bucket:', uploadsToUploads);
      console.log('Uploads to "converted" bucket:', uploadsToConverted);
      
      expect(importsUploadFile).toBe(true);
      expect(callsUploadFile).toBe(true);
      
      console.log('✓ Route uses uploadFile for storage operations');
    });
  });

  describe('Bug Condition: Storage Client Authentication Context', () => {
    it('should verify uploadFile uses server client with proper auth context', () => {
      // Verify uploadFile creates server client that respects anonymous context
      console.log('\n=== Storage Operations Client Analysis ===');
      
      const storageOpsPath = join(projectRoot, 'src/lib/storage/operations.ts');
      const storageOpsContent = readFileSync(storageOpsPath, 'utf-8');
      
      const importsCreateClient = storageOpsContent.includes("from '@/src/lib/supabase/server'");
      const callsCreateClient = storageOpsContent.includes('await createClient()');
      const usesStorageFrom = storageOpsContent.includes('.storage.from(');
      
      console.log('Imports createClient from server:', importsCreateClient);
      console.log('Calls createClient:', callsCreateClient);
      console.log('Uses storage.from():', usesStorageFrom);
      
      if (importsCreateClient && callsCreateClient) {
        console.log('\n✓ uploadFile uses server-side client');
        console.log('  Server client respects authentication context (or lack thereof)');
        console.log('  Anonymous requests will use "anon" role');
        console.log('  Authenticated requests will use "authenticated" role');
      }
      
      expect(importsCreateClient).toBe(true);
      expect(callsCreateClient).toBe(true);
    });

    it('should verify server client supports anonymous requests', () => {
      // Verify server client can handle requests without authentication
      console.log('\n=== Server Client Anonymous Support ===');
      
      const serverClientPath = join(projectRoot, 'src/lib/supabase/server.ts');
      const serverClientContent = readFileSync(serverClientPath, 'utf-8');
      
      const usesAnonKey = serverClientContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');
      const usesCreateServerClient = serverClientContent.includes('createServerClient');
      const hasCookieAccess = serverClientContent.includes('cookies()');
      
      console.log('Uses ANON_KEY:', usesAnonKey);
      console.log('Uses createServerClient:', usesCreateServerClient);
      console.log('Has cookie access:', hasCookieAccess);
      
      if (usesAnonKey && usesCreateServerClient) {
        console.log('\n✓ Server client supports anonymous requests');
        console.log('  Uses ANON_KEY which grants "anon" role');
        console.log('  When no auth cookies present, requests use "anon" role');
        console.log('  Bug is that storage policies do not allow "anon" role to INSERT');
      }
      
      expect(usesAnonKey).toBe(true);
      expect(usesCreateServerClient).toBe(true);
    });
  });

  describe('Bug Condition: Storage Policy Analysis', () => {
    it('should document current storage policies and missing anonymous permissions', () => {
      // Document the current state of storage policies
      console.log('\n=== Current Storage Policy Analysis ===');
      
      const policyPath = join(projectRoot, 'supabase/migrations/002_add_storage_policies.sql');
      const policyContent = readFileSync(policyPath, 'utf-8');
      
      const hasAuthenticatedInsert = policyContent.includes('TO authenticated') && 
                                     policyContent.includes('FOR INSERT');
      const hasAnonInsert = policyContent.includes('TO anon') && 
                           policyContent.includes('FOR INSERT');
      
      console.log('Current Policies:');
      console.log('  - Authenticated INSERT to uploads:', hasAuthenticatedInsert);
      console.log('  - Anonymous INSERT to uploads:', hasAnonInsert);
      
      if (hasAuthenticatedInsert && !hasAnonInsert) {
        console.log('\n⚠️  BUG ROOT CAUSE IDENTIFIED:');
        console.log('  Storage policies only allow "authenticated" role to INSERT');
        console.log('  Missing: Policy to allow "anon" role to INSERT to anonymous/* paths');
        console.log('\nRequired Fix:');
        console.log('  Add policy: "Allow anonymous uploads"');
        console.log('  Target: anon role');
        console.log('  Operation: INSERT');
        console.log('  Condition: bucket_id = \'uploads\' AND path starts with \'anonymous/\'');
      }
      
      expect(hasAuthenticatedInsert).toBe(true);
      // This assertion will FAIL on unfixed code (expected)
      expect(hasAnonInsert).toBe(true);
    });

    it('should document expected storage policies for anonymous users', () => {
      // Document what policies SHOULD exist after fix
      console.log('\n=== Expected Storage Policies After Fix ===');
      console.log('\nPolicy 1: Allow anonymous uploads to uploads bucket');
      console.log('  CREATE POLICY "Allow anonymous uploads"');
      console.log('  ON storage.objects');
      console.log('  FOR INSERT');
      console.log('  TO anon');
      console.log('  WITH CHECK (');
      console.log('    bucket_id = \'uploads\'');
      console.log('    AND (storage.foldername(name))[1] = \'anonymous\'');
      console.log('  );');
      
      console.log('\nPolicy 2: Allow anonymous uploads to converted bucket');
      console.log('  CREATE POLICY "Allow anonymous uploads to converted"');
      console.log('  ON storage.objects');
      console.log('  FOR INSERT');
      console.log('  TO anon');
      console.log('  WITH CHECK (');
      console.log('    bucket_id = \'converted\'');
      console.log('    AND (storage.foldername(name))[1] = \'anonymous\'');
      console.log('  );');
      
      console.log('\nPolicy 3: Allow anonymous read from converted bucket');
      console.log('  CREATE POLICY "Allow anonymous read from converted"');
      console.log('  ON storage.objects');
      console.log('  FOR SELECT');
      console.log('  TO anon');
      console.log('  USING (');
      console.log('    bucket_id = \'converted\'');
      console.log('    AND (storage.foldername(name))[1] = \'anonymous\'');
      console.log('  );');
      
      console.log('\nSecurity Notes:');
      console.log('  - Anonymous users can only upload to anonymous/* paths');
      console.log('  - Anonymous users cannot DELETE or UPDATE files');
      console.log('  - Anonymous users cannot access authenticated user files');
      console.log('  - Path-based restriction prevents cross-user access');
      
      expect(true).toBe(true);
    });
  });

  describe('Property-Based Test: Anonymous Upload Failure Across File Sizes', () => {
    it('should verify anonymous uploads fail for all file sizes (bug evidence)', async () => {
      // Property: For all file sizes, anonymous uploads should fail on unfixed code
      // This demonstrates the bug is systematic, not size-dependent
      
      console.log('\n=== Property: Anonymous Upload Failure is Size-Independent ===');
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return []; },
            setAll() {},
          },
        }
      );

      // Test with various file sizes
      const testSizes = [
        { size: 1024, label: '1 KB' },
        { size: 10 * 1024, label: '10 KB' },
        { size: 100 * 1024, label: '100 KB' },
        { size: 1024 * 1024, label: '1 MB' },
      ];

      console.log('Testing anonymous uploads with different file sizes:\n');

      for (const { size, label } of testSizes) {
        const timestamp = Date.now();
        const testPath = `anonymous/${timestamp}-test-${size}.docx`;
        const testContent = Buffer.alloc(size, 'x');

        console.log(`Testing ${label} file...`);
        
        const { data, error } = await supabase.storage
          .from('uploads')
          .upload(testPath, testContent, {
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            upsert: false,
          });

        if (error) {
          console.log(`  ✗ Failed: ${error.message}`);
        } else {
          console.log(`  ✓ Succeeded: ${data.path}`);
          // Clean up
          await supabase.storage.from('uploads').remove([testPath]);
        }

        // On UNFIXED code: All sizes should fail (proves systematic bug)
        // On FIXED code: All sizes should succeed (proves fix works)
        expect(error).toBeNull();
      }

      console.log('\nPattern Analysis:');
      console.log('  If all sizes fail: Bug is in storage policies (not size-related)');
      console.log('  If all sizes succeed: Fix is working correctly');
    });
  });

  describe('Bug Impact Documentation', () => {
    it('should document the complete bug manifestation and impact', () => {
      console.log('\n=== Bug Impact Summary ===');
      console.log('Bug: Anonymous User Upload Failure');
      console.log('\nReported Behavior:');
      console.log('  - User: Anonymous (not logged in)');
      console.log('  - Action: Upload Word document for conversion');
      console.log('  - Result: Error "Failed to upload file to storage"');
      console.log('  - Location: /word-to-pdf page');
      
      console.log('\nExpected Behavior:');
      console.log('  - Anonymous users should be able to upload files');
      console.log('  - Files should be stored in anonymous/{timestamp}-{filename} paths');
      console.log('  - Conversion should complete and return download URL');
      console.log('  - No authentication required for basic conversion');
      
      console.log('\nUser Impact:');
      console.log('  - Anonymous users cannot use Word to PDF converter');
      console.log('  - Feature requires login, reducing accessibility');
      console.log('  - Users must create account for simple conversion');
      console.log('  - Reduces user experience and conversion rate');
      
      console.log('\nRoot Cause:');
      console.log('  - Storage policies only allow "authenticated" role to INSERT');
      console.log('  - Anonymous requests use "anon" role (via ANON_KEY)');
      console.log('  - "anon" role is not granted INSERT permission on storage buckets');
      console.log('  - Application code supports anonymous users, but storage layer blocks them');
      
      console.log('\nFix Strategy:');
      console.log('  1. Add storage policy: Allow "anon" role to INSERT to uploads bucket');
      console.log('  2. Add storage policy: Allow "anon" role to INSERT to converted bucket');
      console.log('  3. Add storage policy: Allow "anon" role to SELECT from converted bucket');
      console.log('  4. Restrict anonymous uploads to anonymous/* paths only');
      console.log('  5. Verify authenticated user behavior is unchanged');
      
      console.log('\nSecurity Considerations:');
      console.log('  - Anonymous uploads restricted to anonymous/* folder');
      console.log('  - Anonymous users cannot DELETE or UPDATE files');
      console.log('  - Anonymous users cannot access authenticated user files');
      console.log('  - Path-based policies prevent cross-user access');
      console.log('  - No regression to authenticated user security');
      
      expect(true).toBe(true);
    });

    it('should provide manual testing instructions', () => {
      console.log('\n=== Manual Testing Instructions ===');
      console.log('To manually verify this bug:\n');
      console.log('1. Open application in incognito/private browser window');
      console.log('2. Navigate to /word-to-pdf (do NOT log in)');
      console.log('3. Upload a .docx file');
      console.log('4. Observe error: "Failed to upload file to storage"');
      console.log('5. Check browser console for detailed error');
      
      console.log('\nTo verify the fix:');
      console.log('1. Apply storage policy changes (add anon role policies)');
      console.log('2. Open application in incognito window');
      console.log('3. Navigate to /word-to-pdf (stay anonymous)');
      console.log('4. Upload a .docx file');
      console.log('5. Upload should succeed');
      console.log('6. Conversion should complete');
      console.log('7. Download URL should be provided');
      
      console.log('\nSupabase Dashboard Verification:');
      console.log('1. Open Supabase Dashboard');
      console.log('2. Go to Storage → uploads bucket → Policies');
      console.log('3. Verify INSERT policy exists for "anon" role');
      console.log('4. Verify policy restricts to anonymous/* paths');
      console.log('5. Repeat for converted bucket');
      
      expect(true).toBe(true);
    });
  });

  describe('Counterexample Documentation', () => {
    it('should document expected counterexamples from bug condition', () => {
      console.log('\n=== Expected Counterexamples (Bug Evidence) ===');
      console.log('When running against UNFIXED code, we expect to find:\n');
      
      const expectedCounterexamples = [
        {
          scenario: 'Anonymous upload to uploads bucket',
          operation: 'INSERT to storage.objects',
          expectedError: 'new row violates row-level security policy',
          description: 'Storage policy blocks anon role from INSERT'
        },
        {
          scenario: 'Anonymous upload to converted bucket',
          operation: 'INSERT to storage.objects',
          expectedError: 'new row violates row-level security policy',
          description: 'Conversion output cannot be saved for anonymous users'
        },
        {
          scenario: 'Anonymous end-to-end conversion',
          operation: 'Full Word to PDF conversion',
          expectedError: 'Failed to upload file to storage',
          description: 'Conversion fails at upload step, never reaches conversion logic'
        },
        {
          scenario: 'Anonymous file of any size',
          operation: 'INSERT with various file sizes',
          expectedError: 'Authorization error (size-independent)',
          description: 'All file sizes fail equally, confirming policy issue'
        }
      ];
      
      expectedCounterexamples.forEach((ce, index) => {
        console.log(`${index + 1}. ${ce.scenario}`);
        console.log(`   Operation: ${ce.operation}`);
        console.log(`   Expected error: ${ce.expectedError}`);
        console.log(`   Significance: ${ce.description}\n`);
      });
      
      console.log('Common Pattern:');
      console.log('  - ALL anonymous operations fail (not operation-specific)');
      console.log('  - Error is authorization/policy related');
      console.log('  - Failure occurs at storage layer, not application layer');
      console.log('  - Application code is correct, storage policies are restrictive');
      
      console.log('\nThis pattern strongly suggests:');
      console.log('  - Missing storage policies for "anon" role');
      console.log('  - Policies exist for "authenticated" but not "anon"');
      console.log('  - Fix requires adding policies, not changing application code');
      
      expect(true).toBe(true);
    });
  });
});
