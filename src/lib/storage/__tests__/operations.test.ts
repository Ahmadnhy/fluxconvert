import { uploadFile, deleteFile } from '../operations';
import { createClient } from '@/src/lib/supabase/server';

// Mock the Supabase server client
jest.mock('@/src/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('Storage Operations', () => {
  let mockSupabase: any;
  let mockStorage: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock storage object
    mockStorage = {
      from: jest.fn().mockReturnThis(),
      upload: jest.fn(),
      remove: jest.fn(),
    };

    // Create mock Supabase client
    mockSupabase = {
      storage: mockStorage,
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('uploadFile', () => {
    const testBucket = 'uploads';
    const testPath = 'user-123/test-file.docx';
    const testFile = new File(['test content'], 'test-file.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    it('should successfully upload a file and return the storage path', async () => {
      const expectedPath = 'user-123/test-file.docx';
      mockStorage.upload.mockResolvedValue({
        data: { path: expectedPath },
        error: null,
      });

      const result = await uploadFile(testBucket, testPath, testFile);

      expect(result.path).toBe(expectedPath);
      expect(result.error).toBeUndefined();
      expect(mockStorage.from).toHaveBeenCalledWith(testBucket);
      expect(mockStorage.upload).toHaveBeenCalledWith(
        testPath,
        testFile,
        expect.objectContaining({
          cacheControl: '3600',
          upsert: false,
        })
      );
    });

    it('should upload a file with custom content type', async () => {
      const expectedPath = 'user-123/test-file.docx';
      mockStorage.upload.mockResolvedValue({
        data: { path: expectedPath },
        error: null,
      });

      const customContentType = 'application/pdf';
      const result = await uploadFile(testBucket, testPath, testFile, {
        contentType: customContentType,
      });

      expect(result.path).toBe(expectedPath);
      expect(result.error).toBeUndefined();
      expect(mockStorage.upload).toHaveBeenCalledWith(
        testPath,
        testFile,
        expect.objectContaining({
          contentType: customContentType,
          cacheControl: '3600',
          upsert: false,
        })
      );
    });

    it('should upload a file with custom cache control', async () => {
      const expectedPath = 'user-123/test-file.docx';
      mockStorage.upload.mockResolvedValue({
        data: { path: expectedPath },
        error: null,
      });

      const customCacheControl = '7200';
      const result = await uploadFile(testBucket, testPath, testFile, {
        cacheControl: customCacheControl,
      });

      expect(result.path).toBe(expectedPath);
      expect(result.error).toBeUndefined();
      expect(mockStorage.upload).toHaveBeenCalledWith(
        testPath,
        testFile,
        expect.objectContaining({
          cacheControl: customCacheControl,
          upsert: false,
        })
      );
    });

    it('should upload a file with upsert enabled', async () => {
      const expectedPath = 'user-123/test-file.docx';
      mockStorage.upload.mockResolvedValue({
        data: { path: expectedPath },
        error: null,
      });

      const result = await uploadFile(testBucket, testPath, testFile, {
        upsert: true,
      });

      expect(result.path).toBe(expectedPath);
      expect(result.error).toBeUndefined();
      expect(mockStorage.upload).toHaveBeenCalledWith(
        testPath,
        testFile,
        expect.objectContaining({
          upsert: true,
        })
      );
    });

    it('should handle Buffer input by converting to ArrayBuffer', async () => {
      const expectedPath = 'user-123/test-file.docx';
      mockStorage.upload.mockResolvedValue({
        data: { path: expectedPath },
        error: null,
      });

      const buffer = Buffer.from('test content');
      const result = await uploadFile(testBucket, testPath, buffer);

      expect(result.path).toBe(expectedPath);
      expect(result.error).toBeUndefined();
      expect(mockStorage.from).toHaveBeenCalledWith(testBucket);
      expect(mockStorage.upload).toHaveBeenCalled();
    });

    it('should handle Blob input', async () => {
      const expectedPath = 'user-123/test-file.docx';
      mockStorage.upload.mockResolvedValue({
        data: { path: expectedPath },
        error: null,
      });

      const blob = new Blob(['test content'], { type: 'application/pdf' });
      const result = await uploadFile(testBucket, testPath, blob);

      expect(result.path).toBe(expectedPath);
      expect(result.error).toBeUndefined();
      expect(mockStorage.upload).toHaveBeenCalledWith(
        testPath,
        blob,
        expect.any(Object)
      );
    });

    it('should handle ArrayBuffer input', async () => {
      const expectedPath = 'user-123/test-file.docx';
      mockStorage.upload.mockResolvedValue({
        data: { path: expectedPath },
        error: null,
      });

      const arrayBuffer = new ArrayBuffer(8);
      const result = await uploadFile(testBucket, testPath, arrayBuffer);

      expect(result.path).toBe(expectedPath);
      expect(result.error).toBeUndefined();
      expect(mockStorage.upload).toHaveBeenCalledWith(
        testPath,
        arrayBuffer,
        expect.any(Object)
      );
    });

    it('should return an error when upload fails', async () => {
      const uploadError = { message: 'Storage quota exceeded' };
      mockStorage.upload.mockResolvedValue({
        data: null,
        error: uploadError,
      });

      const result = await uploadFile(testBucket, testPath, testFile);

      expect(result.path).toBe('');
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Failed to upload file');
      expect(result.error?.message).toContain('Storage quota exceeded');
    });

    it('should handle unexpected errors during upload', async () => {
      mockStorage.upload.mockRejectedValue(new Error('Network error'));

      const result = await uploadFile(testBucket, testPath, testFile);

      expect(result.path).toBe('');
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Network error');
    });

    it('should handle non-Error exceptions', async () => {
      mockStorage.upload.mockRejectedValue('String error');

      const result = await uploadFile(testBucket, testPath, testFile);

      expect(result.path).toBe('');
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Unknown error during file upload');
    });

    it('should upload to the converted bucket', async () => {
      const convertedBucket = 'converted';
      const expectedPath = 'user-123/converted-file.pdf';
      mockStorage.upload.mockResolvedValue({
        data: { path: expectedPath },
        error: null,
      });

      const result = await uploadFile(convertedBucket, testPath, testFile);

      expect(result.path).toBe(expectedPath);
      expect(result.error).toBeUndefined();
      expect(mockStorage.from).toHaveBeenCalledWith(convertedBucket);
    });

    it('should handle file paths with special characters', async () => {
      const specialPath = 'user-123/file with spaces & special.docx';
      const expectedPath = 'user-123/file with spaces & special.docx';
      mockStorage.upload.mockResolvedValue({
        data: { path: expectedPath },
        error: null,
      });

      const result = await uploadFile(testBucket, specialPath, testFile);

      expect(result.path).toBe(expectedPath);
      expect(result.error).toBeUndefined();
      expect(mockStorage.upload).toHaveBeenCalledWith(
        specialPath,
        testFile,
        expect.any(Object)
      );
    });
  });

  describe('deleteFile', () => {
    const testBucket = 'uploads';
    const testPath = 'user-123/test-file.docx';

    it('should successfully delete a file and return success', async () => {
      mockStorage.remove.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await deleteFile(testBucket, testPath);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockStorage.from).toHaveBeenCalledWith(testBucket);
      expect(mockStorage.remove).toHaveBeenCalledWith([testPath]);
    });

    it('should delete a file from the converted bucket', async () => {
      const convertedBucket = 'converted';
      mockStorage.remove.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await deleteFile(convertedBucket, testPath);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockStorage.from).toHaveBeenCalledWith(convertedBucket);
      expect(mockStorage.remove).toHaveBeenCalledWith([testPath]);
    });

    it('should handle file paths with special characters', async () => {
      const specialPath = 'user-123/file with spaces & special.docx';
      mockStorage.remove.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await deleteFile(testBucket, specialPath);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockStorage.remove).toHaveBeenCalledWith([specialPath]);
    });

    it('should return an error when deletion fails', async () => {
      const deleteError = { message: 'File not found' };
      mockStorage.remove.mockResolvedValue({
        data: null,
        error: deleteError,
      });

      const result = await deleteFile(testBucket, testPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Failed to delete file');
      expect(result.error?.message).toContain('File not found');
    });

    it('should handle permission errors', async () => {
      const permissionError = { message: 'Permission denied' };
      mockStorage.remove.mockResolvedValue({
        data: null,
        error: permissionError,
      });

      const result = await deleteFile(testBucket, testPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Failed to delete file');
      expect(result.error?.message).toContain('Permission denied');
    });

    it('should handle unexpected errors during deletion', async () => {
      mockStorage.remove.mockRejectedValue(new Error('Network error'));

      const result = await deleteFile(testBucket, testPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Network error');
    });

    it('should handle non-Error exceptions', async () => {
      mockStorage.remove.mockRejectedValue('String error');

      const result = await deleteFile(testBucket, testPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Unknown error during file deletion');
    });

    it('should handle deletion of nested file paths', async () => {
      const nestedPath = 'user-123/2024/01/15/document.pdf';
      mockStorage.remove.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await deleteFile(testBucket, nestedPath);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockStorage.remove).toHaveBeenCalledWith([nestedPath]);
    });

    it('should handle deletion when file does not exist', async () => {
      const notFoundError = { message: 'Object not found' };
      mockStorage.remove.mockResolvedValue({
        data: null,
        error: notFoundError,
      });

      const result = await deleteFile(testBucket, testPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Failed to delete file');
      expect(result.error?.message).toContain('Object not found');
    });
  });
});
