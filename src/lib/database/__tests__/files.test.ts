import { createFileRecord, FileRecordData } from '../files';
import { createClient } from '@/src/lib/supabase/server';

// Mock the Supabase server client
jest.mock('@/src/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('Database Files Operations', () => {
  let mockSupabase: any;
  let mockFrom: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock query chain
    mockFrom = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    // Create mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnValue(mockFrom),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('createFileRecord', () => {
    const validFileData: FileRecordData = {
      user_id: 'user-123-uuid',
      file_name: 'test-document.docx',
      file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      file_size: 1024000,
      storage_path: 'user-123-uuid/1234567890-test-document.docx',
      storage_bucket: 'uploads',
    };

    it('should successfully create a file record and return the file ID', async () => {
      const expectedId = 'file-uuid-123';
      mockFrom.single.mockResolvedValue({
        data: { id: expectedId },
        error: null,
      });

      const result = await createFileRecord(validFileData);

      expect(result.id).toBe(expectedId);
      expect(result.error).toBeUndefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('files');
      expect(mockFrom.insert).toHaveBeenCalledWith({
        user_id: validFileData.user_id,
        file_name: validFileData.file_name,
        file_type: validFileData.file_type,
        file_size: validFileData.file_size,
        storage_path: validFileData.storage_path,
        storage_bucket: validFileData.storage_bucket,
        status: 'active',
      });
      expect(mockFrom.select).toHaveBeenCalledWith('id');
      expect(mockFrom.single).toHaveBeenCalled();
    });

    it('should create a file record with null user_id for unauthenticated users', async () => {
      const expectedId = 'file-uuid-456';
      const unauthenticatedFileData: FileRecordData = {
        ...validFileData,
        user_id: null,
      };

      mockFrom.single.mockResolvedValue({
        data: { id: expectedId },
        error: null,
      });

      const result = await createFileRecord(unauthenticatedFileData);

      expect(result.id).toBe(expectedId);
      expect(result.error).toBeUndefined();
      expect(mockFrom.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: null,
        })
      );
    });

    it('should create a file record for converted bucket', async () => {
      const expectedId = 'file-uuid-789';
      const convertedFileData: FileRecordData = {
        ...validFileData,
        file_name: 'converted-document.pdf',
        file_type: 'application/pdf',
        storage_path: 'user-123-uuid/1234567890-converted-document.pdf',
        storage_bucket: 'converted',
      };

      mockFrom.single.mockResolvedValue({
        data: { id: expectedId },
        error: null,
      });

      const result = await createFileRecord(convertedFileData);

      expect(result.id).toBe(expectedId);
      expect(result.error).toBeUndefined();
      expect(mockFrom.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          storage_bucket: 'converted',
          file_type: 'application/pdf',
        })
      );
    });

    it('should handle large file sizes', async () => {
      const expectedId = 'file-uuid-large';
      const largeFileData: FileRecordData = {
        ...validFileData,
        file_size: 50 * 1024 * 1024, // 50 MB
      };

      mockFrom.single.mockResolvedValue({
        data: { id: expectedId },
        error: null,
      });

      const result = await createFileRecord(largeFileData);

      expect(result.id).toBe(expectedId);
      expect(result.error).toBeUndefined();
      expect(mockFrom.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          file_size: 50 * 1024 * 1024,
        })
      );
    });

    it('should handle file names with special characters', async () => {
      const expectedId = 'file-uuid-special';
      const specialFileData: FileRecordData = {
        ...validFileData,
        file_name: 'document with spaces & special (chars).docx',
      };

      mockFrom.single.mockResolvedValue({
        data: { id: expectedId },
        error: null,
      });

      const result = await createFileRecord(specialFileData);

      expect(result.id).toBe(expectedId);
      expect(result.error).toBeUndefined();
      expect(mockFrom.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          file_name: 'document with spaces & special (chars).docx',
        })
      );
    });

    it('should return an error when file_name is missing', async () => {
      const invalidData: FileRecordData = {
        ...validFileData,
        file_name: '',
      };

      const result = await createFileRecord(invalidData);

      expect(result.id).toBe('');
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Missing required fields');
      expect(mockFrom.insert).not.toHaveBeenCalled();
    });

    it('should return an error when file_type is missing', async () => {
      const invalidData: FileRecordData = {
        ...validFileData,
        file_type: '',
      };

      const result = await createFileRecord(invalidData);

      expect(result.id).toBe('');
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Missing required fields');
      expect(mockFrom.insert).not.toHaveBeenCalled();
    });

    it('should return an error when storage_path is missing', async () => {
      const invalidData: FileRecordData = {
        ...validFileData,
        storage_path: '',
      };

      const result = await createFileRecord(invalidData);

      expect(result.id).toBe('');
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Missing required fields');
      expect(mockFrom.insert).not.toHaveBeenCalled();
    });

    it('should return an error when storage_bucket is missing', async () => {
      const invalidData: FileRecordData = {
        ...validFileData,
        storage_bucket: '',
      };

      const result = await createFileRecord(invalidData);

      expect(result.id).toBe('');
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Missing required fields');
      expect(mockFrom.insert).not.toHaveBeenCalled();
    });

    it('should return an error when file_size is negative', async () => {
      const invalidData: FileRecordData = {
        ...validFileData,
        file_size: -100,
      };

      const result = await createFileRecord(invalidData);

      expect(result.id).toBe('');
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Invalid file_size');
      expect(mockFrom.insert).not.toHaveBeenCalled();
    });

    it('should return an error when file_size is not a number', async () => {
      const invalidData: any = {
        ...validFileData,
        file_size: 'not-a-number',
      };

      const result = await createFileRecord(invalidData);

      expect(result.id).toBe('');
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Invalid file_size');
      expect(mockFrom.insert).not.toHaveBeenCalled();
    });

    it('should accept file_size of zero', async () => {
      const expectedId = 'file-uuid-zero';
      const zeroSizeData: FileRecordData = {
        ...validFileData,
        file_size: 0,
      };

      mockFrom.single.mockResolvedValue({
        data: { id: expectedId },
        error: null,
      });

      const result = await createFileRecord(zeroSizeData);

      expect(result.id).toBe(expectedId);
      expect(result.error).toBeUndefined();
      expect(mockFrom.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          file_size: 0,
        })
      );
    });

    it('should return an error when database insert fails', async () => {
      const dbError = { message: 'Database connection failed', code: 'DB_ERROR' };
      mockFrom.single.mockResolvedValue({
        data: null,
        error: dbError,
      });

      const result = await createFileRecord(validFileData);

      expect(result.id).toBe('');
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Failed to create file record');
      expect(result.error?.message).toContain('Database connection failed');
    });

    it('should return an error when no ID is returned from database', async () => {
      mockFrom.single.mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await createFileRecord(validFileData);

      expect(result.id).toBe('');
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('No ID returned');
    });

    it('should return an error when data is null', async () => {
      mockFrom.single.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await createFileRecord(validFileData);

      expect(result.id).toBe('');
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('No ID returned');
    });

    it('should handle unexpected errors during database operation', async () => {
      mockFrom.single.mockRejectedValue(new Error('Network timeout'));

      const result = await createFileRecord(validFileData);

      expect(result.id).toBe('');
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Network timeout');
    });

    it('should handle non-Error exceptions', async () => {
      mockFrom.single.mockRejectedValue('String error');

      const result = await createFileRecord(validFileData);

      expect(result.id).toBe('');
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Unknown error creating file record');
    });

    it('should handle database constraint violations', async () => {
      const constraintError = {
        message: 'duplicate key value violates unique constraint',
        code: '23505',
      };
      mockFrom.single.mockResolvedValue({
        data: null,
        error: constraintError,
      });

      const result = await createFileRecord(validFileData);

      expect(result.id).toBe('');
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Failed to create file record');
      expect(result.error?.message).toContain('duplicate key value');
    });

    it('should handle foreign key constraint violations', async () => {
      const fkError = {
        message: 'insert or update on table "files" violates foreign key constraint',
        code: '23503',
      };
      mockFrom.single.mockResolvedValue({
        data: null,
        error: fkError,
      });

      const result = await createFileRecord(validFileData);

      expect(result.id).toBe('');
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Failed to create file record');
      expect(result.error?.message).toContain('foreign key constraint');
    });

    it('should handle various file types correctly', async () => {
      const fileTypes = [
        { type: 'application/pdf', name: 'document.pdf' },
        { type: 'image/jpeg', name: 'photo.jpg' },
        { type: 'image/png', name: 'screenshot.png' },
        { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', name: 'doc.docx' },
      ];

      for (const fileType of fileTypes) {
        const expectedId = `file-uuid-${fileType.name}`;
        const fileData: FileRecordData = {
          ...validFileData,
          file_name: fileType.name,
          file_type: fileType.type,
        };

        mockFrom.single.mockResolvedValue({
          data: { id: expectedId },
          error: null,
        });

        const result = await createFileRecord(fileData);

        expect(result.id).toBe(expectedId);
        expect(result.error).toBeUndefined();
        expect(mockFrom.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            file_name: fileType.name,
            file_type: fileType.type,
          })
        );
      }
    });

    it('should handle nested storage paths', async () => {
      const expectedId = 'file-uuid-nested';
      const nestedPathData: FileRecordData = {
        ...validFileData,
        storage_path: 'user-123-uuid/2024/01/15/document.docx',
      };

      mockFrom.single.mockResolvedValue({
        data: { id: expectedId },
        error: null,
      });

      const result = await createFileRecord(nestedPathData);

      expect(result.id).toBe(expectedId);
      expect(result.error).toBeUndefined();
      expect(mockFrom.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          storage_path: 'user-123-uuid/2024/01/15/document.docx',
        })
      );
    });

    it('should always set status to active', async () => {
      const expectedId = 'file-uuid-status';
      mockFrom.single.mockResolvedValue({
        data: { id: expectedId },
        error: null,
      });

      const result = await createFileRecord(validFileData);

      expect(result.id).toBe(expectedId);
      expect(result.error).toBeUndefined();
      expect(mockFrom.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
        })
      );
    });
  });
});
