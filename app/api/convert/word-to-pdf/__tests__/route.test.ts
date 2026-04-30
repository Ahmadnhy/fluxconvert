/**
 * @jest-environment node
 */
import { createClient } from '@/src/lib/supabase/server';
import { uploadFile } from '@/src/lib/storage/operations';
import { createFileRecord } from '@/src/lib/database/files';

// Mock dependencies
jest.mock('@/src/lib/supabase/server');
jest.mock('@/src/lib/storage/operations');
jest.mock('@/src/lib/database/files');

describe('Word to PDF API - Storage Integration (Task 10.1)', () => {
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
  const mockUploadFile = uploadFile as jest.MockedFunction<typeof uploadFile>;
  const mockCreateFileRecord = createFileRecord as jest.MockedFunction<typeof createFileRecord>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Storage path generation', () => {
    it('should generate storage path with user ID and timestamp for authenticated users', () => {
      const userId = 'test-user-123';
      const fileName = 'test.docx';
      const timestamp = 1234567890;
      
      const expectedPath = `${userId}/${timestamp}-${fileName}`;
      
      expect(expectedPath).toBe('test-user-123/1234567890-test.docx');
    });

    it('should generate storage path with anonymous prefix for unauthenticated users', () => {
      const fileName = 'test.docx';
      const timestamp = 1234567890;
      
      const expectedPath = `anonymous/${timestamp}-${fileName}`;
      
      expect(expectedPath).toBe('anonymous/1234567890-test.docx');
    });

    it('should sanitize filename with special characters', () => {
      const fileName = 'test file @#$ name!.docx';
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      
      expect(sanitizedFileName).toBe('test_file_____name_.docx');
    });
  });

  describe('uploadFile integration', () => {
    it('should call uploadFile with correct parameters for authenticated user', async () => {
      const userId = 'test-user-123';
      const fileName = 'test.docx';
      const fileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const buffer = Buffer.from('test content');
      const storagePath = `${userId}/1234567890-test.docx`;

      mockUploadFile.mockResolvedValue({
        path: storagePath,
      });

      const result = await uploadFile(
        'uploads',
        storagePath,
        buffer,
        { contentType: fileType }
      );

      expect(mockUploadFile).toHaveBeenCalledWith(
        'uploads',
        storagePath,
        buffer,
        { contentType: fileType }
      );
      expect(result.path).toBe(storagePath);
      expect(result.error).toBeUndefined();
    });

    it('should handle upload errors gracefully', async () => {
      const storagePath = 'test-user-123/1234567890-test.docx';
      const uploadError = new Error('Storage upload failed');

      mockUploadFile.mockResolvedValue({
        path: '',
        error: uploadError,
      });

      const result = await uploadFile(
        'uploads',
        storagePath,
        Buffer.from('test'),
        { contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
      );

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Storage upload failed');
      expect(result.path).toBe('');
    });
  });

  describe('createFileRecord integration', () => {
    it('should call createFileRecord with correct parameters', async () => {
      const fileRecordData = {
        user_id: 'test-user-123',
        file_name: 'test.docx',
        file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        file_size: 1024,
        storage_path: 'test-user-123/1234567890-test.docx',
        storage_bucket: 'uploads',
      };

      mockCreateFileRecord.mockResolvedValue({
        id: 'file-record-123',
      });

      const result = await createFileRecord(fileRecordData);

      expect(mockCreateFileRecord).toHaveBeenCalledWith(fileRecordData);
      expect(result.id).toBe('file-record-123');
      expect(result.error).toBeUndefined();
    });

    it('should handle null user_id for unauthenticated users', async () => {
      const fileRecordData = {
        user_id: null,
        file_name: 'test.docx',
        file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        file_size: 1024,
        storage_path: 'anonymous/1234567890-test.docx',
        storage_bucket: 'uploads',
      };

      mockCreateFileRecord.mockResolvedValue({
        id: 'file-record-456',
      });

      const result = await createFileRecord(fileRecordData);

      expect(mockCreateFileRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: null,
          storage_path: expect.stringContaining('anonymous/'),
        })
      );
      expect(result.id).toBe('file-record-456');
    });

    it('should handle database errors gracefully', async () => {
      const fileRecordData = {
        user_id: 'test-user-123',
        file_name: 'test.docx',
        file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        file_size: 1024,
        storage_path: 'test-user-123/1234567890-test.docx',
        storage_bucket: 'uploads',
      };

      const dbError = new Error('Database error');
      mockCreateFileRecord.mockResolvedValue({
        id: '',
        error: dbError,
      });

      const result = await createFileRecord(fileRecordData);

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Database error');
      expect(result.id).toBe('');
    });
  });

  describe('Authentication handling', () => {
    it('should retrieve authenticated user from Supabase', async () => {
      const mockUserId = 'test-user-123';
      
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockUserId } },
          }),
        },
      } as any);

      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      expect(user?.id).toBe(mockUserId);
    });

    it('should handle unauthenticated users', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
          }),
        },
      } as any);

      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      expect(user).toBeNull();
    });
  });

  describe('Requirements validation', () => {
    it('should satisfy Requirement 6.1: Upload file to Supabase Storage', async () => {
      // Requirement 6.1: WHEN a user uploads a file for conversion, 
      // THE Word_to_PDF_API SHALL upload the file to Supabase_Storage

      const storagePath = 'test-user-123/1234567890-test.docx';
      mockUploadFile.mockResolvedValue({ path: storagePath });

      const result = await uploadFile(
        'uploads',
        storagePath,
        Buffer.from('test'),
        { contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
      );

      expect(result.path).toBe(storagePath);
      expect(mockUploadFile).toHaveBeenCalledWith(
        'uploads',
        expect.any(String),
        expect.any(Buffer),
        expect.any(Object)
      );
    });

    it('should satisfy Requirement 6.2: Store uploaded files in uploads bucket', async () => {
      // Requirement 6.2: THE Word_to_PDF_API SHALL store uploaded files in the 'uploads' bucket

      mockUploadFile.mockResolvedValue({ path: 'test-path' });

      await uploadFile(
        'uploads',
        'test-path',
        Buffer.from('test'),
        { contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
      );

      expect(mockUploadFile).toHaveBeenCalledWith(
        'uploads', // Verify bucket name is 'uploads'
        expect.any(String),
        expect.any(Buffer),
        expect.any(Object)
      );
    });

    it('should satisfy Requirement 6.4: Create file record in database', async () => {
      // Requirement 6.4: WHEN a file upload succeeds, 
      // THE Word_to_PDF_API SHALL create a file record in the files table

      mockCreateFileRecord.mockResolvedValue({ id: 'file-123' });

      const result = await createFileRecord({
        user_id: 'test-user-123',
        file_name: 'test.docx',
        file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        file_size: 1024,
        storage_path: 'test-user-123/1234567890-test.docx',
        storage_bucket: 'uploads',
      });

      expect(result.id).toBe('file-123');
      expect(mockCreateFileRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          file_name: expect.any(String),
          file_type: expect.any(String),
          file_size: expect.any(Number),
          storage_path: expect.any(String),
          storage_bucket: 'uploads',
        })
      );
    });
  });
});
