import { generateSignedUrl } from '../signedUrls';
import { createClient } from '@/src/lib/supabase/server';

// Mock the Supabase server client
jest.mock('@/src/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('Signed URL Generation', () => {
  let mockSupabase: any;
  let mockStorage: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock storage object
    mockStorage = {
      from: jest.fn().mockReturnThis(),
      createSignedUrl: jest.fn(),
    };

    // Create mock Supabase client
    mockSupabase = {
      storage: mockStorage,
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('generateSignedUrl', () => {
    const testBucket = 'converted';
    const testPath = 'user-123/converted-file.pdf';

    it('should successfully generate a signed URL with default expiration', async () => {
      const expectedUrl = 'https://example.supabase.co/storage/v1/object/sign/converted/user-123/converted-file.pdf?token=abc123';
      mockStorage.createSignedUrl.mockResolvedValue({
        data: { signedUrl: expectedUrl },
        error: null,
      });

      const result = await generateSignedUrl(testBucket, testPath);

      expect(result.url).toBe(expectedUrl);
      expect(result.error).toBeUndefined();
      expect(mockStorage.from).toHaveBeenCalledWith(testBucket);
      expect(mockStorage.createSignedUrl).toHaveBeenCalledWith(testPath, 3600);
    });

    it('should generate a signed URL with custom expiration time', async () => {
      const expectedUrl = 'https://example.supabase.co/storage/v1/object/sign/converted/user-123/converted-file.pdf?token=xyz789';
      const customExpiration = 7200; // 2 hours
      mockStorage.createSignedUrl.mockResolvedValue({
        data: { signedUrl: expectedUrl },
        error: null,
      });

      const result = await generateSignedUrl(testBucket, testPath, customExpiration);

      expect(result.url).toBe(expectedUrl);
      expect(result.error).toBeUndefined();
      expect(mockStorage.createSignedUrl).toHaveBeenCalledWith(testPath, customExpiration);
    });

    it('should generate a signed URL for uploads bucket', async () => {
      const uploadsBucket = 'uploads';
      const uploadsPath = 'user-456/input-file.docx';
      const expectedUrl = 'https://example.supabase.co/storage/v1/object/sign/uploads/user-456/input-file.docx?token=def456';
      mockStorage.createSignedUrl.mockResolvedValue({
        data: { signedUrl: expectedUrl },
        error: null,
      });

      const result = await generateSignedUrl(uploadsBucket, uploadsPath);

      expect(result.url).toBe(expectedUrl);
      expect(result.error).toBeUndefined();
      expect(mockStorage.from).toHaveBeenCalledWith(uploadsBucket);
      expect(mockStorage.createSignedUrl).toHaveBeenCalledWith(uploadsPath, 3600);
    });

    it('should handle file paths with special characters', async () => {
      const specialPath = 'user-123/file with spaces & special.pdf';
      const expectedUrl = 'https://example.supabase.co/storage/v1/object/sign/converted/user-123/file%20with%20spaces%20%26%20special.pdf?token=ghi789';
      mockStorage.createSignedUrl.mockResolvedValue({
        data: { signedUrl: expectedUrl },
        error: null,
      });

      const result = await generateSignedUrl(testBucket, specialPath);

      expect(result.url).toBe(expectedUrl);
      expect(result.error).toBeUndefined();
      expect(mockStorage.createSignedUrl).toHaveBeenCalledWith(specialPath, 3600);
    });

    it('should handle nested file paths', async () => {
      const nestedPath = 'user-123/2024/01/15/document.pdf';
      const expectedUrl = 'https://example.supabase.co/storage/v1/object/sign/converted/user-123/2024/01/15/document.pdf?token=jkl012';
      mockStorage.createSignedUrl.mockResolvedValue({
        data: { signedUrl: expectedUrl },
        error: null,
      });

      const result = await generateSignedUrl(testBucket, nestedPath);

      expect(result.url).toBe(expectedUrl);
      expect(result.error).toBeUndefined();
      expect(mockStorage.createSignedUrl).toHaveBeenCalledWith(nestedPath, 3600);
    });

    it('should handle short expiration times', async () => {
      const expectedUrl = 'https://example.supabase.co/storage/v1/object/sign/converted/user-123/converted-file.pdf?token=short123';
      const shortExpiration = 60; // 1 minute
      mockStorage.createSignedUrl.mockResolvedValue({
        data: { signedUrl: expectedUrl },
        error: null,
      });

      const result = await generateSignedUrl(testBucket, testPath, shortExpiration);

      expect(result.url).toBe(expectedUrl);
      expect(result.error).toBeUndefined();
      expect(mockStorage.createSignedUrl).toHaveBeenCalledWith(testPath, shortExpiration);
    });

    it('should handle long expiration times', async () => {
      const expectedUrl = 'https://example.supabase.co/storage/v1/object/sign/converted/user-123/converted-file.pdf?token=long456';
      const longExpiration = 86400; // 24 hours
      mockStorage.createSignedUrl.mockResolvedValue({
        data: { signedUrl: expectedUrl },
        error: null,
      });

      const result = await generateSignedUrl(testBucket, testPath, longExpiration);

      expect(result.url).toBe(expectedUrl);
      expect(result.error).toBeUndefined();
      expect(mockStorage.createSignedUrl).toHaveBeenCalledWith(testPath, longExpiration);
    });

    it('should return an error when file does not exist', async () => {
      const notFoundError = { message: 'Object not found' };
      mockStorage.createSignedUrl.mockResolvedValue({
        data: null,
        error: notFoundError,
      });

      const result = await generateSignedUrl(testBucket, testPath);

      expect(result.url).toBe('');
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Failed to generate signed URL');
      expect(result.error?.message).toContain('Object not found');
    });

    it('should return an error when permission is denied', async () => {
      const permissionError = { message: 'Permission denied' };
      mockStorage.createSignedUrl.mockResolvedValue({
        data: null,
        error: permissionError,
      });

      const result = await generateSignedUrl(testBucket, testPath);

      expect(result.url).toBe('');
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Failed to generate signed URL');
      expect(result.error?.message).toContain('Permission denied');
    });

    it('should return an error when bucket does not exist', async () => {
      const bucketError = { message: 'Bucket not found' };
      mockStorage.createSignedUrl.mockResolvedValue({
        data: null,
        error: bucketError,
      });

      const result = await generateSignedUrl('nonexistent-bucket', testPath);

      expect(result.url).toBe('');
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Failed to generate signed URL');
      expect(result.error?.message).toContain('Bucket not found');
    });

    it('should return an error when no signed URL is returned', async () => {
      mockStorage.createSignedUrl.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await generateSignedUrl(testBucket, testPath);

      expect(result.url).toBe('');
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('No signed URL returned from storage');
    });

    it('should return an error when data is missing signedUrl property', async () => {
      mockStorage.createSignedUrl.mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await generateSignedUrl(testBucket, testPath);

      expect(result.url).toBe('');
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('No signed URL returned from storage');
    });

    it('should handle unexpected errors during URL generation', async () => {
      mockStorage.createSignedUrl.mockRejectedValue(new Error('Network error'));

      const result = await generateSignedUrl(testBucket, testPath);

      expect(result.url).toBe('');
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Network error');
    });

    it('should handle non-Error exceptions', async () => {
      mockStorage.createSignedUrl.mockRejectedValue('String error');

      const result = await generateSignedUrl(testBucket, testPath);

      expect(result.url).toBe('');
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Unknown error generating signed URL');
    });

    it('should handle storage service unavailable errors', async () => {
      const serviceError = { message: 'Service temporarily unavailable' };
      mockStorage.createSignedUrl.mockResolvedValue({
        data: null,
        error: serviceError,
      });

      const result = await generateSignedUrl(testBucket, testPath);

      expect(result.url).toBe('');
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Failed to generate signed URL');
      expect(result.error?.message).toContain('Service temporarily unavailable');
    });

    it('should handle file paths with unicode characters', async () => {
      const unicodePath = 'user-123/文档.pdf';
      const expectedUrl = 'https://example.supabase.co/storage/v1/object/sign/converted/user-123/%E6%96%87%E6%A1%A3.pdf?token=unicode123';
      mockStorage.createSignedUrl.mockResolvedValue({
        data: { signedUrl: expectedUrl },
        error: null,
      });

      const result = await generateSignedUrl(testBucket, unicodePath);

      expect(result.url).toBe(expectedUrl);
      expect(result.error).toBeUndefined();
      expect(mockStorage.createSignedUrl).toHaveBeenCalledWith(unicodePath, 3600);
    });

    it('should handle zero expiration time', async () => {
      const expectedUrl = 'https://example.supabase.co/storage/v1/object/sign/converted/user-123/converted-file.pdf?token=zero123';
      const zeroExpiration = 0;
      mockStorage.createSignedUrl.mockResolvedValue({
        data: { signedUrl: expectedUrl },
        error: null,
      });

      const result = await generateSignedUrl(testBucket, testPath, zeroExpiration);

      expect(result.url).toBe(expectedUrl);
      expect(result.error).toBeUndefined();
      expect(mockStorage.createSignedUrl).toHaveBeenCalledWith(testPath, zeroExpiration);
    });
  });
});
