import { 
  createConversionRecord, 
  ConversionRecordData, 
  updateConversionStatus, 
  UpdateConversionStatusData,
  getUserConversions,
  GetUserConversionsOptions
} from '../conversions';
import { createClient } from '@/src/lib/supabase/server';

// Mock the Supabase client
jest.mock('@/src/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('createConversionRecord', () => {
  let mockSupabase: any;
  let mockFrom: jest.Mock;
  let mockInsert: jest.Mock;
  let mockSelect: jest.Mock;
  let mockSingle: jest.Mock;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create mock chain
    mockSingle = jest.fn();
    mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
    mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });

    mockSupabase = {
      from: mockFrom,
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('successful conversion record creation', () => {
    it('should create a conversion record with all required fields', async () => {
      const mockConversionId = 'conversion-uuid-123';
      mockSingle.mockResolvedValue({
        data: { id: mockConversionId },
        error: null,
      });

      const data: ConversionRecordData = {
        user_id: 'user-uuid-123',
        input_file_id: 'file-uuid-456',
        conversion_type: 'word-to-pdf',
      };

      const result = await createConversionRecord(data);

      expect(result.id).toBe(mockConversionId);
      expect(result.error).toBeUndefined();
      expect(mockFrom).toHaveBeenCalledWith('conversions');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-uuid-123',
        input_file_id: 'file-uuid-456',
        output_file_id: null,
        conversion_type: 'word-to-pdf',
        status: 'pending',
        error_message: null,
        completed_at: null,
      });
      expect(mockSelect).toHaveBeenCalledWith('id');
      expect(mockSingle).toHaveBeenCalled();
    });

    it('should create a conversion record with null user_id for unauthenticated users', async () => {
      const mockConversionId = 'conversion-uuid-789';
      mockSingle.mockResolvedValue({
        data: { id: mockConversionId },
        error: null,
      });

      const data: ConversionRecordData = {
        user_id: null,
        input_file_id: 'file-uuid-456',
        conversion_type: 'word-to-pdf',
      };

      const result = await createConversionRecord(data);

      expect(result.id).toBe(mockConversionId);
      expect(result.error).toBeUndefined();
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: null,
        input_file_id: 'file-uuid-456',
        output_file_id: null,
        conversion_type: 'word-to-pdf',
        status: 'pending',
        error_message: null,
        completed_at: null,
      });
    });

    it('should create a conversion record with different conversion types', async () => {
      const mockConversionId = 'conversion-uuid-abc';
      mockSingle.mockResolvedValue({
        data: { id: mockConversionId },
        error: null,
      });

      const data: ConversionRecordData = {
        user_id: 'user-uuid-123',
        input_file_id: 'file-uuid-456',
        conversion_type: 'pdf-to-word',
      };

      const result = await createConversionRecord(data);

      expect(result.id).toBe(mockConversionId);
      expect(result.error).toBeUndefined();
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          conversion_type: 'pdf-to-word',
        })
      );
    });
  });

  describe('validation errors', () => {
    it('should return error when input_file_id is missing', async () => {
      const data = {
        user_id: 'user-uuid-123',
        input_file_id: '',
        conversion_type: 'word-to-pdf',
      };

      const result = await createConversionRecord(data);

      expect(result.id).toBe('');
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Missing required fields');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should return error when conversion_type is missing', async () => {
      const data = {
        user_id: 'user-uuid-123',
        input_file_id: 'file-uuid-456',
        conversion_type: '',
      };

      const result = await createConversionRecord(data);

      expect(result.id).toBe('');
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Missing required fields');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should return error when conversion_type is only whitespace', async () => {
      const data = {
        user_id: 'user-uuid-123',
        input_file_id: 'file-uuid-456',
        conversion_type: '   ',
      };

      const result = await createConversionRecord(data);

      expect(result.id).toBe('');
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Invalid conversion_type');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should return error when both required fields are missing', async () => {
      const data = {
        user_id: 'user-uuid-123',
        input_file_id: '',
        conversion_type: '',
      };

      const result = await createConversionRecord(data);

      expect(result.id).toBe('');
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Missing required fields');
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('database errors', () => {
    it('should handle database insert error', async () => {
      const dbError = { message: 'Database connection failed', code: 'DB_ERROR' };
      mockSingle.mockResolvedValue({
        data: null,
        error: dbError,
      });

      const data: ConversionRecordData = {
        user_id: 'user-uuid-123',
        input_file_id: 'file-uuid-456',
        conversion_type: 'word-to-pdf',
      };

      const result = await createConversionRecord(data);

      expect(result.id).toBe('');
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Failed to create conversion record');
      expect(result.error?.message).toContain('Database connection failed');
    });

    it('should handle missing ID in response', async () => {
      mockSingle.mockResolvedValue({
        data: {},
        error: null,
      });

      const data: ConversionRecordData = {
        user_id: 'user-uuid-123',
        input_file_id: 'file-uuid-456',
        conversion_type: 'word-to-pdf',
      };

      const result = await createConversionRecord(data);

      expect(result.id).toBe('');
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('No ID returned');
    });

    it('should handle null data in response', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const data: ConversionRecordData = {
        user_id: 'user-uuid-123',
        input_file_id: 'file-uuid-456',
        conversion_type: 'word-to-pdf',
      };

      const result = await createConversionRecord(data);

      expect(result.id).toBe('');
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('No ID returned');
    });

    it('should handle foreign key constraint violation', async () => {
      const dbError = {
        message: 'Foreign key constraint violation',
        code: '23503',
      };
      mockSingle.mockResolvedValue({
        data: null,
        error: dbError,
      });

      const data: ConversionRecordData = {
        user_id: 'user-uuid-123',
        input_file_id: 'non-existent-file-id',
        conversion_type: 'word-to-pdf',
      };

      const result = await createConversionRecord(data);

      expect(result.id).toBe('');
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Failed to create conversion record');
    });
  });

  describe('unexpected errors', () => {
    it('should handle unexpected exception during database operation', async () => {
      mockSingle.mockRejectedValue(new Error('Network timeout'));

      const data: ConversionRecordData = {
        user_id: 'user-uuid-123',
        input_file_id: 'file-uuid-456',
        conversion_type: 'word-to-pdf',
      };

      const result = await createConversionRecord(data);

      expect(result.id).toBe('');
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Network timeout');
    });

    it('should handle non-Error exceptions', async () => {
      mockSingle.mockRejectedValue('String error');

      const data: ConversionRecordData = {
        user_id: 'user-uuid-123',
        input_file_id: 'file-uuid-456',
        conversion_type: 'word-to-pdf',
      };

      const result = await createConversionRecord(data);

      expect(result.id).toBe('');
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Unknown error');
    });

    it('should handle createClient failure', async () => {
      (createClient as jest.Mock).mockRejectedValue(new Error('Failed to create Supabase client'));

      const data: ConversionRecordData = {
        user_id: 'user-uuid-123',
        input_file_id: 'file-uuid-456',
        conversion_type: 'word-to-pdf',
      };

      const result = await createConversionRecord(data);

      expect(result.id).toBe('');
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Failed to create Supabase client');
    });
  });

  describe('edge cases', () => {
    it('should handle very long conversion_type strings', async () => {
      const mockConversionId = 'conversion-uuid-long';
      mockSingle.mockResolvedValue({
        data: { id: mockConversionId },
        error: null,
      });

      const longConversionType = 'a'.repeat(255);
      const data: ConversionRecordData = {
        user_id: 'user-uuid-123',
        input_file_id: 'file-uuid-456',
        conversion_type: longConversionType,
      };

      const result = await createConversionRecord(data);

      expect(result.id).toBe(mockConversionId);
      expect(result.error).toBeUndefined();
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          conversion_type: longConversionType,
        })
      );
    });

    it('should handle special characters in conversion_type', async () => {
      const mockConversionId = 'conversion-uuid-special';
      mockSingle.mockResolvedValue({
        data: { id: mockConversionId },
        error: null,
      });

      const data: ConversionRecordData = {
        user_id: 'user-uuid-123',
        input_file_id: 'file-uuid-456',
        conversion_type: 'word-to-pdf_v2.0',
      };

      const result = await createConversionRecord(data);

      expect(result.id).toBe(mockConversionId);
      expect(result.error).toBeUndefined();
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          conversion_type: 'word-to-pdf_v2.0',
        })
      );
    });

    it('should handle UUID-like strings in input_file_id', async () => {
      const mockConversionId = 'conversion-uuid-uuid';
      mockSingle.mockResolvedValue({
        data: { id: mockConversionId },
        error: null,
      });

      const data: ConversionRecordData = {
        user_id: 'user-uuid-123',
        input_file_id: '550e8400-e29b-41d4-a716-446655440000',
        conversion_type: 'word-to-pdf',
      };

      const result = await createConversionRecord(data);

      expect(result.id).toBe(mockConversionId);
      expect(result.error).toBeUndefined();
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          input_file_id: '550e8400-e29b-41d4-a716-446655440000',
        })
      );
    });
  });
});


describe('updateConversionStatus', () => {
  let mockSupabase: any;
  let mockFrom: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockEq: jest.Mock;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create mock chain for update operations
    mockEq = jest.fn();
    mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    mockFrom = jest.fn().mockReturnValue({ update: mockUpdate });

    mockSupabase = {
      from: mockFrom,
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('successful status updates', () => {
    it('should update conversion status to completed with output_file_id', async () => {
      mockEq.mockResolvedValue({
        data: null,
        error: null,
      });

      const data: UpdateConversionStatusData = {
        conversion_id: 'conversion-uuid-123',
        status: 'completed',
        output_file_id: 'output-file-uuid-456',
      };

      const result = await updateConversionStatus(data);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockFrom).toHaveBeenCalledWith('conversions');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          output_file_id: 'output-file-uuid-456',
          completed_at: expect.any(String),
        })
      );
      expect(mockEq).toHaveBeenCalledWith('id', 'conversion-uuid-123');
    });

    it('should update conversion status to failed with error_message', async () => {
      mockEq.mockResolvedValue({
        data: null,
        error: null,
      });

      const data: UpdateConversionStatusData = {
        conversion_id: 'conversion-uuid-789',
        status: 'failed',
        error_message: 'Invalid file format',
      };

      const result = await updateConversionStatus(data);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockFrom).toHaveBeenCalledWith('conversions');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          error_message: 'Invalid file format',
          completed_at: expect.any(String),
        })
      );
      expect(mockEq).toHaveBeenCalledWith('id', 'conversion-uuid-789');
    });

    it('should update conversion status to completed without output_file_id', async () => {
      mockEq.mockResolvedValue({
        data: null,
        error: null,
      });

      const data: UpdateConversionStatusData = {
        conversion_id: 'conversion-uuid-abc',
        status: 'completed',
      };

      const result = await updateConversionStatus(data);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          completed_at: expect.any(String),
        })
      );
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.not.objectContaining({
          output_file_id: expect.anything(),
        })
      );
    });

    it('should update conversion status to failed without error_message', async () => {
      mockEq.mockResolvedValue({
        data: null,
        error: null,
      });

      const data: UpdateConversionStatusData = {
        conversion_id: 'conversion-uuid-def',
        status: 'failed',
      };

      const result = await updateConversionStatus(data);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          completed_at: expect.any(String),
        })
      );
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.not.objectContaining({
          error_message: expect.anything(),
        })
      );
    });

    it('should set completed_at timestamp when updating status', async () => {
      mockEq.mockResolvedValue({
        data: null,
        error: null,
      });

      const beforeTime = new Date();
      
      const data: UpdateConversionStatusData = {
        conversion_id: 'conversion-uuid-time',
        status: 'completed',
        output_file_id: 'output-file-uuid',
      };

      const result = await updateConversionStatus(data);

      const afterTime = new Date();

      expect(result.success).toBe(true);
      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.completed_at).toBeDefined();
      
      // Parse the ISO string back to Date for comparison
      const completedAt = new Date(updateCall.completed_at);
      expect(completedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(completedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('validation errors', () => {
    it('should return error when conversion_id is missing', async () => {
      const data = {
        conversion_id: '',
        status: 'completed' as const,
        output_file_id: 'output-file-uuid',
      };

      const result = await updateConversionStatus(data);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Missing required fields');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should return error when status is missing', async () => {
      const data = {
        conversion_id: 'conversion-uuid-123',
        status: '' as any,
      };

      const result = await updateConversionStatus(data);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Missing required fields');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should return error when status is invalid', async () => {
      const data = {
        conversion_id: 'conversion-uuid-123',
        status: 'pending' as any,
      };

      const result = await updateConversionStatus(data);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Invalid status');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should return error when conversion_id is only whitespace', async () => {
      const data = {
        conversion_id: '   ',
        status: 'completed' as const,
      };

      const result = await updateConversionStatus(data);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Invalid conversion_id');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should return error when both required fields are missing', async () => {
      const data = {
        conversion_id: '',
        status: '' as any,
      };

      const result = await updateConversionStatus(data);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Missing required fields');
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('database errors', () => {
    it('should handle database update error', async () => {
      const dbError = { message: 'Database connection failed', code: 'DB_ERROR' };
      mockEq.mockResolvedValue({
        data: null,
        error: dbError,
      });

      const data: UpdateConversionStatusData = {
        conversion_id: 'conversion-uuid-123',
        status: 'completed',
        output_file_id: 'output-file-uuid',
      };

      const result = await updateConversionStatus(data);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Failed to update conversion status');
      expect(result.error?.message).toContain('Database connection failed');
    });

    it('should handle foreign key constraint violation', async () => {
      const dbError = {
        message: 'Foreign key constraint violation',
        code: '23503',
      };
      mockEq.mockResolvedValue({
        data: null,
        error: dbError,
      });

      const data: UpdateConversionStatusData = {
        conversion_id: 'conversion-uuid-123',
        status: 'completed',
        output_file_id: 'non-existent-file-id',
      };

      const result = await updateConversionStatus(data);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Failed to update conversion status');
    });

    it('should handle non-existent conversion_id gracefully', async () => {
      mockEq.mockResolvedValue({
        data: null,
        error: null,
      });

      const data: UpdateConversionStatusData = {
        conversion_id: 'non-existent-uuid',
        status: 'completed',
      };

      const result = await updateConversionStatus(data);

      // Should succeed even if no rows were updated
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('unexpected errors', () => {
    it('should handle unexpected exception during database operation', async () => {
      mockEq.mockRejectedValue(new Error('Network timeout'));

      const data: UpdateConversionStatusData = {
        conversion_id: 'conversion-uuid-123',
        status: 'completed',
      };

      const result = await updateConversionStatus(data);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Network timeout');
    });

    it('should handle non-Error exceptions', async () => {
      mockEq.mockRejectedValue('String error');

      const data: UpdateConversionStatusData = {
        conversion_id: 'conversion-uuid-123',
        status: 'failed',
      };

      const result = await updateConversionStatus(data);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Unknown error');
    });

    it('should handle createClient failure', async () => {
      (createClient as jest.Mock).mockRejectedValue(new Error('Failed to create Supabase client'));

      const data: UpdateConversionStatusData = {
        conversion_id: 'conversion-uuid-123',
        status: 'completed',
      };

      const result = await updateConversionStatus(data);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Failed to create Supabase client');
    });
  });

  describe('edge cases', () => {
    it('should handle very long error_message strings', async () => {
      mockEq.mockResolvedValue({
        data: null,
        error: null,
      });

      const longErrorMessage = 'Error: ' + 'a'.repeat(1000);
      const data: UpdateConversionStatusData = {
        conversion_id: 'conversion-uuid-long',
        status: 'failed',
        error_message: longErrorMessage,
      };

      const result = await updateConversionStatus(data);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          error_message: longErrorMessage,
        })
      );
    });

    it('should handle special characters in error_message', async () => {
      mockEq.mockResolvedValue({
        data: null,
        error: null,
      });

      const data: UpdateConversionStatusData = {
        conversion_id: 'conversion-uuid-special',
        status: 'failed',
        error_message: 'Error: File "test.docx" contains invalid characters: <>&"\'',
      };

      const result = await updateConversionStatus(data);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          error_message: 'Error: File "test.docx" contains invalid characters: <>&"\'',
        })
      );
    });

    it('should handle UUID-like strings in conversion_id', async () => {
      mockEq.mockResolvedValue({
        data: null,
        error: null,
      });

      const data: UpdateConversionStatusData = {
        conversion_id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'completed',
        output_file_id: '660e8400-e29b-41d4-a716-446655440001',
      };

      const result = await updateConversionStatus(data);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockEq).toHaveBeenCalledWith('id', '550e8400-e29b-41d4-a716-446655440000');
    });

    it('should not include output_file_id when status is failed', async () => {
      mockEq.mockResolvedValue({
        data: null,
        error: null,
      });

      const data: UpdateConversionStatusData = {
        conversion_id: 'conversion-uuid-failed',
        status: 'failed',
        output_file_id: 'should-not-be-included',
        error_message: 'Conversion failed',
      };

      const result = await updateConversionStatus(data);

      expect(result.success).toBe(true);
      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.output_file_id).toBeUndefined();
      expect(updateCall.error_message).toBe('Conversion failed');
    });

    it('should not include error_message when status is completed', async () => {
      mockEq.mockResolvedValue({
        data: null,
        error: null,
      });

      const data: UpdateConversionStatusData = {
        conversion_id: 'conversion-uuid-completed',
        status: 'completed',
        output_file_id: 'output-file-uuid',
        error_message: 'should-not-be-included',
      };

      const result = await updateConversionStatus(data);

      expect(result.success).toBe(true);
      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.error_message).toBeUndefined();
      expect(updateCall.output_file_id).toBe('output-file-uuid');
    });
  });
});

