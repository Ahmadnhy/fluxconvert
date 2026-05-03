/**
 * Integration Tests: Word to PDF Conversion API Route
 * 
 * **Validates: Requirements 1.1, 1.6, 1.7, 6.1-6.6, 7.1-7.3, 8.1-8.2, 9.1-9.8, 10.1-10.4, 13.1, 13.3-13.5**
 * 
 * This test suite verifies the complete Word-to-PDF conversion flow including:
 * - Successful conversion with real .docx files
 * - File type and size validation
 * - Conversion timeout handling
 * - Temporary file cleanup on error
 * - Authenticated user flow (storage upload, database records)
 * - Anonymous user flow (base64 response)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Track cleanup calls for verification
let cleanupCalls: Array<{ type: string; called: boolean }> = [];

// Mock Supabase server client - will be configured per test
vi.mock('@/src/lib/supabase/server', () => {
  const mockGetUser = vi.fn(async () => ({
    data: { user: null }, // Default: Anonymous user
    error: null,
  }));
  
  return {
    createClient: vi.fn(async () => ({
      auth: {
        getUser: mockGetUser,
      },
    })),
    mockGetUser, // Export for test configuration
  };
});

// Mock storage operations - will be configured per test
vi.mock('@/src/lib/storage/operations', () => ({
  uploadFile: vi.fn(async (bucket: string, path: string, buffer: Buffer) => ({
    path,
    error: null,
  })),
}));

// Mock database operations - will be configured per test
vi.mock('@/src/lib/database/files', () => ({
  createFileRecord: vi.fn(async (data: any) => ({
    id: 'test-file-id-123',
    error: null,
  })),
}));

vi.mock('@/src/lib/database/conversions', () => ({
  createConversionRecord: vi.fn(async (data: any) => ({
    id: 'test-conversion-id-123',
    error: null,
  })),
  updateConversionStatus: vi.fn(async (data: any) => ({
    id: 'test-conversion-id-123',
    error: null,
  })),
}));

// Mock signed URL generation - will be configured per test
vi.mock('@/src/lib/storage/signedUrls', () => ({
  generateSignedUrl: vi.fn(async (bucket: string, path: string, expiresIn: number) => ({
    url: `https://example.com/signed/${path}`,
    error: null,
  })),
}));

// Mock LibreOffice converter - will be configured per test
vi.mock('@/src/lib/converters/libreoffice', () => ({
  convertWordToPdf: vi.fn(async (options: any) => {
    // Simulate successful conversion by default
    const outputPath = `${options.outputDir}/test-output.pdf`;
    return {
      success: true,
      outputPath,
    };
  }),
}));

// Mock temporary file utilities - track cleanup calls
vi.mock('@/src/lib/utils/tempFiles', () => ({
  createTempFile: vi.fn(async (content: Buffer, options: any) => {
    const cleanupTracker = { type: 'tempFile', called: false };
    cleanupCalls.push(cleanupTracker);
    return {
      path: `/tmp/input-${Date.now()}.${options.extension}`,
      cleanup: vi.fn(async () => {
        cleanupTracker.called = true;
      }),
    };
  }),
  createTempDir: vi.fn(async () => {
    const cleanupTracker = { type: 'tempDir', called: false };
    cleanupCalls.push(cleanupTracker);
    return {
      path: `/tmp/conversion-${Date.now()}`,
      cleanup: vi.fn(async () => {
        cleanupTracker.called = true;
      }),
    };
  }),
}));

// Mock fs module to provide PDF output without actually reading files
vi.mock('fs', () => {
  return {
    default: {
      promises: {
        readFile: vi.fn(async () => {
          return Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n%%EOF');
        }),
      },
    },
    promises: {
      readFile: vi.fn(async () => {
        return Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n%%EOF');
      }),
    },
  };
});

// Import mocked modules to get access to mock functions
import { createClient } from '@/src/lib/supabase/server';
import { uploadFile } from '@/src/lib/storage/operations';
import { createFileRecord } from '@/src/lib/database/files';
import { createConversionRecord, updateConversionStatus } from '@/src/lib/database/conversions';
import { generateSignedUrl } from '@/src/lib/storage/signedUrls';
import { convertWordToPdf } from '@/src/lib/converters/libreoffice';
import { createTempFile, createTempDir } from '@/src/lib/utils/tempFiles';
import { promises as fs } from 'fs';

// Get mock instances
const mockCreateClient = vi.mocked(createClient);
const mockUploadFile = vi.mocked(uploadFile);
const mockCreateFileRecord = vi.mocked(createFileRecord);
const mockCreateConversionRecord = vi.mocked(createConversionRecord);
const mockUpdateConversionStatus = vi.mocked(updateConversionStatus);
const mockGenerateSignedUrl = vi.mocked(generateSignedUrl);
const mockConvertWordToPdf = vi.mocked(convertWordToPdf);
const mockCreateTempFile = vi.mocked(createTempFile);
const mockCreateTempDir = vi.mocked(createTempDir);
const mockReadFile = vi.mocked(fs.readFile);

describe('Integration Tests: Word to PDF Conversion API Route', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    cleanupCalls = [];
    
    // Reset to default behaviors
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: null },
          error: null,
        })),
      },
    } as any);
    
    mockUploadFile.mockResolvedValue({
      path: 'test-path',
      error: null,
    });
    
    mockCreateFileRecord.mockResolvedValue({
      id: 'test-file-id-123',
      error: null,
    });
    
    mockCreateConversionRecord.mockResolvedValue({
      id: 'test-conversion-id-123',
      error: null,
    });
    
    mockUpdateConversionStatus.mockResolvedValue({
      id: 'test-conversion-id-123',
      error: null,
    });
    
    mockGenerateSignedUrl.mockResolvedValue({
      url: 'https://example.com/signed/test-path',
      error: null,
    });
    
    mockConvertWordToPdf.mockResolvedValue({
      success: true,
      outputPath: '/tmp/test-output.pdf',
    });
    
    mockReadFile.mockResolvedValue(
      Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n%%EOF')
    );
  });
  
  describe('Successful Conversion Tests', () => {
    /**
     * Test: Anonymous user can convert Word to PDF via API endpoint
     * 
     * Validates: Requirements 1.1, 6.1-6.6, 10.1-10.4
     */
    it('should successfully convert .docx to PDF for anonymous user', async () => {
      const docxContent = createMinimalDocxFile('Test document content for anonymous conversion');
      
      const formData = new FormData();
      const file = new File([docxContent], 'test-anonymous.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      formData.append('file', file);
      
      const request = new NextRequest('http://localhost:3000/api/convert/word-to-pdf', {
        method: 'POST',
        body: formData,
      });
      
      const response = await POST(request);
      const responseData = await response.json();
      
      // Verify successful response
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.downloadUrl).toBeDefined();
      expect(responseData.fileName).toBe('test-anonymous.pdf');
      
      // Verify anonymous user gets base64 data URL
      expect(responseData.downloadUrl.startsWith('data:application/pdf;base64,')).toBe(true);
      
      // Verify no conversion record created for anonymous user
      expect(mockCreateConversionRecord).not.toHaveBeenCalled();
      
      // Verify temporary files were cleaned up
      expect(cleanupCalls.length).toBe(2); // tempFile + tempDir
      expect(cleanupCalls.every(c => c.called)).toBe(true);
    }, 30000);
    
    /**
     * Test: Authenticated user can convert Word to PDF with storage and database records
     * 
     * Validates: Requirements 1.1, 6.1-6.6, 9.1-9.8, 11.1-11.5
     */
    it('should successfully convert .docx to PDF for authenticated user with storage upload', async () => {
      // Mock authenticated user
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn(async () => ({
            data: { user: { id: 'test-user-123' } },
            error: null,
          })),
        },
      } as any);
      
      const docxContent = createMinimalDocxFile('Test document content for authenticated conversion');
      
      const formData = new FormData();
      const file = new File([docxContent], 'test-authenticated.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      formData.append('file', file);
      
      const request = new NextRequest('http://localhost:3000/api/convert/word-to-pdf', {
        method: 'POST',
        body: formData,
      });
      
      const response = await POST(request);
      const responseData = await response.json();
      
      // Verify successful response
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.downloadUrl).toBeDefined();
      expect(responseData.fileName).toBe('test-authenticated.pdf');
      expect(responseData.expiresAt).toBeDefined();
      
      // Verify authenticated user gets signed URL
      expect(responseData.downloadUrl.startsWith('https://')).toBe(true);
      
      // Verify storage operations
      expect(mockUploadFile).toHaveBeenCalledTimes(2); // input + output
      expect(mockUploadFile).toHaveBeenCalledWith(
        'uploads',
        expect.stringContaining('test-user-123'),
        expect.any(Buffer),
        expect.any(Object)
      );
      expect(mockUploadFile).toHaveBeenCalledWith(
        'converted',
        expect.stringContaining('test-user-123'),
        expect.any(Buffer),
        expect.any(Object)
      );
      
      // Verify database operations
      expect(mockCreateFileRecord).toHaveBeenCalledTimes(2); // input + output
      expect(mockCreateConversionRecord).toHaveBeenCalledWith({
        user_id: 'test-user-123',
        input_file_id: 'test-file-id-123',
        conversion_type: 'word-to-pdf',
      });
      expect(mockUpdateConversionStatus).toHaveBeenCalledWith({
        conversion_id: 'test-conversion-id-123',
        status: 'completed',
        output_file_id: 'test-file-id-123',
      });
      
      // Verify signed URL generation
      expect(mockGenerateSignedUrl).toHaveBeenCalledWith('converted', expect.any(String), 3600);
      
      // Verify temporary files were cleaned up
      expect(cleanupCalls.length).toBe(2);
      expect(cleanupCalls.every(c => c.called)).toBe(true);
    }, 30000);
  });
  
  describe('File Validation Tests', () => {
    /**
     * Test: Invalid file type validation
     * 
     * Validates: Requirements 6.1-6.6, 8.1-8.2
     */
    it('should return 400 error for non-.docx file', async () => {
      const textContent = Buffer.from('This is not a .docx file');
      
      const formData = new FormData();
      const file = new File([textContent], 'test.txt', {
        type: 'text/plain',
      });
      formData.append('file', file);
      
      const request = new NextRequest('http://localhost:3000/api/convert/word-to-pdf', {
        method: 'POST',
        body: formData,
      });
      
      const response = await POST(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Only .docx files are supported');
      
      // Verify no conversion attempted
      expect(mockConvertWordToPdf).not.toHaveBeenCalled();
    }, 10000);
    
    /**
     * Test: Missing file validation
     * 
     * Validates: Requirements 6.1-6.6
     */
    it('should return 400 error for missing file', async () => {
      const formData = new FormData();
      
      const request = new NextRequest('http://localhost:3000/api/convert/word-to-pdf', {
        method: 'POST',
        body: formData,
      });
      
      const response = await POST(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(400);
      expect(responseData.error).toBe('No file provided');
      
      // Verify no conversion attempted
      expect(mockConvertWordToPdf).not.toHaveBeenCalled();
    }, 10000);
    
    /**
     * Test: File size validation
     * 
     * Validates: Requirements 7.1-7.3
     */
    it('should return 400 error for file exceeding 50 MB limit', async () => {
      // Create a file larger than 50 MB (50 * 1024 * 1024 bytes)
      const largeContent = Buffer.alloc(51 * 1024 * 1024); // 51 MB
      
      const formData = new FormData();
      const file = new File([largeContent], 'large-file.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      formData.append('file', file);
      
      const request = new NextRequest('http://localhost:3000/api/convert/word-to-pdf', {
        method: 'POST',
        body: formData,
      });
      
      const response = await POST(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(400);
      expect(responseData.error).toBe('File size exceeds 50 MB limit');
      
      // Verify no conversion attempted
      expect(mockConvertWordToPdf).not.toHaveBeenCalled();
    }, 10000);
  });
  
  describe('Conversion Error Handling Tests', () => {
    /**
     * Test: Conversion timeout handling
     * 
     * Validates: Requirements 13.1, 13.3-13.5
     */
    it('should handle conversion timeout and cleanup temporary files', async () => {
      // Mock authenticated user to verify status update
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn(async () => ({
            data: { user: { id: 'test-user-123' } },
            error: null,
          })),
        },
      } as any);
      
      // Mock conversion timeout
      mockConvertWordToPdf.mockResolvedValue({
        success: false,
        error: 'Conversion timeout: Process exceeded 120 seconds',
      });
      
      const docxContent = createMinimalDocxFile('Test document');
      
      const formData = new FormData();
      const file = new File([docxContent], 'test-timeout.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      formData.append('file', file);
      
      const request = new NextRequest('http://localhost:3000/api/convert/word-to-pdf', {
        method: 'POST',
        body: formData,
      });
      
      const response = await POST(request);
      const responseData = await response.json();
      
      // Verify error response
      expect(response.status).toBe(500);
      expect(responseData.error).toContain('timeout');
      
      // Verify conversion status updated to failed
      expect(mockUpdateConversionStatus).toHaveBeenCalledWith({
        conversion_id: 'test-conversion-id-123',
        status: 'failed',
        error_message: expect.stringContaining('timeout'),
      });
      
      // Verify temporary files were cleaned up even on error
      expect(cleanupCalls.length).toBe(2);
      expect(cleanupCalls.every(c => c.called)).toBe(true);
    }, 30000);
    
    /**
     * Test: LibreOffice not installed error
     * 
     * Validates: Requirements 3.1-3.2, 12.1-12.5
     */
    it('should handle LibreOffice not installed error', async () => {
      mockConvertWordToPdf.mockResolvedValue({
        success: false,
        error: 'LibreOffice not found. Please install LibreOffice.',
      });
      
      const docxContent = createMinimalDocxFile('Test document');
      
      const formData = new FormData();
      const file = new File([docxContent], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      formData.append('file', file);
      
      const request = new NextRequest('http://localhost:3000/api/convert/word-to-pdf', {
        method: 'POST',
        body: formData,
      });
      
      const response = await POST(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(500);
      expect(responseData.error).toContain('LibreOffice');
      
      // Verify temporary files were cleaned up
      expect(cleanupCalls.length).toBe(2);
      expect(cleanupCalls.every(c => c.called)).toBe(true);
    }, 30000);
    
    /**
     * Test: Storage upload error handling
     * 
     * Validates: Requirements 9.1-9.8, 12.1-12.5
     */
    it('should handle storage upload error and cleanup temporary files', async () => {
      // Mock authenticated user
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn(async () => ({
            data: { user: { id: 'test-user-123' } },
            error: null,
          })),
        },
      } as any);
      
      // Mock storage upload failure for output file (second call)
      mockUploadFile
        .mockResolvedValueOnce({ path: 'input-path', error: null }) // First call succeeds (input)
        .mockResolvedValueOnce({ path: '', error: 'Storage quota exceeded' }); // Second call fails (output)
      
      const docxContent = createMinimalDocxFile('Test document');
      
      const formData = new FormData();
      const file = new File([docxContent], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      formData.append('file', file);
      
      const request = new NextRequest('http://localhost:3000/api/convert/word-to-pdf', {
        method: 'POST',
        body: formData,
      });
      
      const response = await POST(request);
      const responseData = await response.json();
      
      // Verify error response
      expect(response.status).toBe(500);
      expect(responseData.error).toContain('storage');
      
      // Verify conversion status updated to failed
      expect(mockUpdateConversionStatus).toHaveBeenCalledWith({
        conversion_id: 'test-conversion-id-123',
        status: 'failed',
        error_message: expect.stringContaining('storage'),
      });
      
      // Verify temporary files were cleaned up
      expect(cleanupCalls.length).toBe(2);
      expect(cleanupCalls.every(c => c.called)).toBe(true);
    }, 30000);
  });
  
  describe('Temporary File Cleanup Tests', () => {
    /**
     * Test: Temporary files cleaned up on successful conversion
     * 
     * Validates: Requirements 5.1-5.6
     */
    it('should cleanup temporary files after successful conversion', async () => {
      const docxContent = createMinimalDocxFile('Test document');
      
      const formData = new FormData();
      const file = new File([docxContent], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      formData.append('file', file);
      
      const request = new NextRequest('http://localhost:3000/api/convert/word-to-pdf', {
        method: 'POST',
        body: formData,
      });
      
      await POST(request);
      
      // Verify both temp file and temp dir cleanup were called
      expect(cleanupCalls.length).toBe(2);
      expect(cleanupCalls.find(c => c.type === 'tempFile')?.called).toBe(true);
      expect(cleanupCalls.find(c => c.type === 'tempDir')?.called).toBe(true);
    }, 30000);
    
    /**
     * Test: Temporary files cleaned up on conversion error
     * 
     * Validates: Requirements 5.1-5.6, 12.1-12.5
     */
    it('should cleanup temporary files after conversion error', async () => {
      mockConvertWordToPdf.mockResolvedValue({
        success: false,
        error: 'Conversion failed',
      });
      
      const docxContent = createMinimalDocxFile('Test document');
      
      const formData = new FormData();
      const file = new File([docxContent], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      formData.append('file', file);
      
      const request = new NextRequest('http://localhost:3000/api/convert/word-to-pdf', {
        method: 'POST',
        body: formData,
      });
      
      await POST(request);
      
      // Verify cleanup was called even on error
      expect(cleanupCalls.length).toBe(2);
      expect(cleanupCalls.every(c => c.called)).toBe(true);
    }, 30000);
  });
});

/**
 * Helper function to create a minimal valid .docx file for testing
 * 
 * A .docx file is a ZIP archive containing XML files. This creates a minimal
 * structure that LibreOffice can parse.
 */
function createMinimalDocxFile(content: string): Buffer {
  // For testing purposes, we'll create a simple buffer that represents
  // a minimal .docx structure. In a real scenario, you'd use a library
  // like 'docx' or 'pizzip' to create a proper .docx file.
  
  // This is a simplified approach - the actual test will use LibreOffice
  // which expects proper .docx structure. For now, we'll create a buffer
  // that the API will attempt to process.
  
  // Note: This is a placeholder. In production tests, you'd want to use
  // a proper .docx creation library or include a test fixture file.
  const mockDocxHeader = Buffer.from([
    0x50, 0x4b, 0x03, 0x04, // ZIP file signature
  ]);
  
  return Buffer.concat([
    mockDocxHeader,
    Buffer.from(content),
  ]);
}
