/**
 * Bug Condition Exploration Test for Anonymous User RLS Policy Violation
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3**
 * 
 * This test explores the bug condition where anonymous users (auth.uid() IS NULL)
 * cannot upload files due to RLS policy violations. This test is EXPECTED TO FAIL
 * on unfixed code - failure confirms the bug exists.
 * 
 * CRITICAL: This test encodes the EXPECTED BEHAVIOR (anonymous uploads should succeed).
 * When this test PASSES after the fix, it confirms the bug is resolved.
 * 
 * DO NOT attempt to fix the test or code when it fails - document the failure.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { createClient } from '@supabase/supabase-js';
import { createFileRecord } from './files';

// Create an unauthenticated Supabase client for testing anonymous operations
function createAnonymousClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

describe('Bug Condition Exploration: Anonymous User RLS Policy Violation', () => {
  /**
   * Property 1: Bug Condition - Anonymous User File Upload
   * 
   * Tests that anonymous users can INSERT file records with user_id = NULL.
   * This property encodes the EXPECTED BEHAVIOR.
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: Test FAILS with RLS policy violation (error code 42501)
   * EXPECTED OUTCOME ON FIXED CODE: Test PASSES (anonymous uploads succeed)
   */
  it('Property 1: Anonymous user can insert file record with user_id = NULL', async () => {
    const supabase = createAnonymousClient();
    
    // Ensure we're not authenticated
    const { data: { user } } = await supabase.auth.getUser();
    expect(user).toBeNull();
    
    // Generate test file metadata
    const timestamp = Date.now();
    const testFileName = `test-${timestamp}.docx`;
    const testStoragePath = `anonymous/${timestamp}-${testFileName}`;
    
    // Attempt to INSERT file record with user_id = NULL (anonymous user)
    const { data, error } = await supabase
      .from('files')
      .insert({
        user_id: null, // Anonymous user
        file_name: testFileName,
        file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        file_size: 1024,
        storage_path: testStoragePath,
        storage_bucket: 'uploads',
        status: 'active',
      })
      .select('id')
      .single();
    
    // EXPECTED BEHAVIOR: INSERT should succeed
    // ON UNFIXED CODE: This will fail with RLS policy violation
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data?.id).toBeDefined();
    
    // Cleanup: Delete the test record if it was created
    if (data?.id) {
      await supabase.from('files').delete().eq('id', data.id);
    }
  }, 10000);
  
  /**
   * Property 1 (PBT): Anonymous user file uploads with various file types
   * 
   * Property-based test that generates random file metadata and verifies
   * anonymous users can insert file records for any valid file type.
   */
  it('Property 1 (PBT): Anonymous user can insert file records for various file types', async () => {
    const supabase = createAnonymousClient();
    
    // Ensure we're not authenticated
    const { data: { user } } = await supabase.auth.getUser();
    expect(user).toBeNull();
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          fileName: fc.stringMatching(/^[a-zA-Z0-9_-]+\.(docx|pdf|txt|jpg|png)$/),
          fileType: fc.constantFrom(
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/pdf',
            'text/plain',
            'image/jpeg',
            'image/png'
          ),
          fileSize: fc.integer({ min: 1, max: 50 * 1024 * 1024 }), // 1 byte to 50 MB
        }),
        async ({ fileName, fileType, fileSize }) => {
          const timestamp = Date.now();
          const storagePath = `anonymous/${timestamp}-${fileName}`;
          
          // Attempt to INSERT file record with user_id = NULL
          const { data, error } = await supabase
            .from('files')
            .insert({
              user_id: null, // Anonymous user
              file_name: fileName,
              file_type: fileType,
              file_size: fileSize,
              storage_path: storagePath,
              storage_bucket: 'uploads',
              status: 'active',
            })
            .select('id')
            .single();
          
          // EXPECTED BEHAVIOR: INSERT should succeed
          expect(error).toBeNull();
          expect(data).not.toBeNull();
          expect(data?.id).toBeDefined();
          
          // Cleanup
          if (data?.id) {
            await supabase.from('files').delete().eq('id', data.id);
          }
        }
      ),
      { numRuns: 10 } // Run 10 test cases
    );
  }, 30000);
  
  /**
   * Test: Anonymous storage upload to uploads/anonymous/* path
   * 
   * Tests that anonymous users can upload files to the storage bucket
   * at the anonymous/* path without authentication.
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: Test FAILS with storage policy violation
   * EXPECTED OUTCOME ON FIXED CODE: Test PASSES (storage upload succeeds)
   */
  it('Anonymous user can upload file to storage bucket (uploads/anonymous/*)', async () => {
    const supabase = createAnonymousClient();
    
    // Ensure we're not authenticated
    const { data: { user } } = await supabase.auth.getUser();
    expect(user).toBeNull();
    
    // Create test file data
    const timestamp = Date.now();
    const testFileName = `test-${timestamp}.docx`;
    const storagePath = `anonymous/${timestamp}-${testFileName}`;
    const testFileContent = Buffer.from('Test file content for anonymous upload');
    
    // Attempt to upload file to storage
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(storagePath, testFileContent, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: false,
      });
    
    // EXPECTED BEHAVIOR: Upload should succeed
    // ON UNFIXED CODE: This will fail with storage policy violation
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data?.path).toBe(storagePath);
    
    // Cleanup: Delete the uploaded file
    if (data?.path) {
      await supabase.storage.from('uploads').remove([data.path]);
    }
  }, 10000);
  
  /**
   * Test: Anonymous storage upload to converted/anonymous/* path
   * 
   * Tests that anonymous users can upload converted files to the storage bucket
   * at the anonymous/* path without authentication.
   */
  it('Anonymous user can upload converted file to storage bucket (converted/anonymous/*)', async () => {
    const supabase = createAnonymousClient();
    
    // Ensure we're not authenticated
    const { data: { user } } = await supabase.auth.getUser();
    expect(user).toBeNull();
    
    // Create test file data
    const timestamp = Date.now();
    const testFileName = `test-${timestamp}.pdf`;
    const storagePath = `anonymous/${timestamp}-${testFileName}`;
    const testFileContent = Buffer.from('Test PDF content for anonymous upload');
    
    // Attempt to upload file to storage
    const { data, error } = await supabase.storage
      .from('converted')
      .upload(storagePath, testFileContent, {
        contentType: 'application/pdf',
        upsert: false,
      });
    
    // EXPECTED BEHAVIOR: Upload should succeed
    // ON UNFIXED CODE: This will fail with storage policy violation
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data?.path).toBe(storagePath);
    
    // Cleanup: Delete the uploaded file
    if (data?.path) {
      await supabase.storage.from('converted').remove([data.path]);
    }
  }, 10000);
});
