/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { createClient } from '@/src/lib/supabase/server';
import { generateSignedUrl } from '@/src/lib/storage/signedUrls';

// Mock dependencies
jest.mock('@/src/lib/supabase/server');
jest.mock('@/src/lib/storage/signedUrls');

describe('GET /api/conversions/[id]/download', () => {
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
  const mockGenerateSignedUrl = generateSignedUrl as jest.MockedFunction<typeof generateSignedUrl>;

  const mockUserId = 'test-user-123';
  const mockConversionId = 'conversion-123';
  const mockOutputFileId = 'output-file-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (conversionId: string) => {
    return new NextRequest(`http://localhost:3000/api/conversions/${conversionId}/download`);
  };

  const createMockParams = (id: string) => {
    return Promise.resolve({ id });
  };

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Mock unauthenticated user
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      } as any);

      const request = createMockRequest(mockConversionId);
      const params = createMockParams(mockConversionId);

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when authentication fails', async () => {
      // Mock authentication error
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Auth failed'),
          }),
        },
      } as any);

      const request = createMockRequest(mockConversionId);
      const params = createMockParams(mockConversionId);

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Conversion Ownership', () => {
    it('should return 404 when conversion does not exist', async () => {
      // Mock authenticated user
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockUserId } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            }),
          }),
        }),
      } as any);

      const request = createMockRequest(mockConversionId);
      const params = createMockParams(mockConversionId);

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Conversion not found');
    });

    it('should return 403 when user does not own the conversion', async () => {
      const otherUserId = 'other-user-456';

      // Mock authenticated user
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockUserId } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: mockConversionId,
                  user_id: otherUserId, // Different user
                  status: 'completed',
                  output_file: {
                    id: mockOutputFileId,
                    file_name: 'output.pdf',
                    storage_path: 'path/to/output.pdf',
                    storage_bucket: 'converted',
                    status: 'active',
                  },
                },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const request = createMockRequest(mockConversionId);
      const params = createMockParams(mockConversionId);

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden: You do not own this conversion');
    });
  });

  describe('File Status Validation', () => {
    it('should return 404 when conversion has no output file', async () => {
      // Mock authenticated user with conversion that has no output file
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockUserId } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: mockConversionId,
                  user_id: mockUserId,
                  status: 'pending',
                  output_file: null, // No output file yet
                },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const request = createMockRequest(mockConversionId);
      const params = createMockParams(mockConversionId);

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Conversion has no output file');
    });

    it('should return 404 when file has been deleted', async () => {
      // Mock authenticated user with deleted file
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockUserId } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: mockConversionId,
                  user_id: mockUserId,
                  status: 'completed',
                  output_file: {
                    id: mockOutputFileId,
                    file_name: 'output.pdf',
                    storage_path: 'path/to/output.pdf',
                    storage_bucket: 'converted',
                    status: 'deleted', // File has been deleted
                  },
                },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const request = createMockRequest(mockConversionId);
      const params = createMockParams(mockConversionId);

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('File has been deleted');
    });
  });

  describe('Signed URL Generation', () => {
    it('should generate signed URL with 1-hour expiration for active file', async () => {
      const mockSignedUrl = 'https://storage.example.com/signed-url';

      // Mock authenticated user with active file
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockUserId } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: mockConversionId,
                  user_id: mockUserId,
                  status: 'completed',
                  output_file: {
                    id: mockOutputFileId,
                    file_name: 'output.pdf',
                    storage_path: 'user-123/output.pdf',
                    storage_bucket: 'converted',
                    status: 'active',
                  },
                },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      // Mock signed URL generation
      mockGenerateSignedUrl.mockResolvedValue({
        url: mockSignedUrl,
      });

      const request = createMockRequest(mockConversionId);
      const params = createMockParams(mockConversionId);

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.url).toBe(mockSignedUrl);
      expect(data.expiresAt).toBeDefined();
      
      // Verify signed URL was generated with correct parameters
      expect(mockGenerateSignedUrl).toHaveBeenCalledWith(
        'converted',
        'user-123/output.pdf',
        3600 // 1 hour in seconds
      );

      // Verify expiresAt is approximately 1 hour from now
      const expiresAt = new Date(data.expiresAt);
      const now = new Date();
      const diffInSeconds = (expiresAt.getTime() - now.getTime()) / 1000;
      expect(diffInSeconds).toBeGreaterThan(3590); // Allow 10 second margin
      expect(diffInSeconds).toBeLessThan(3610);
    });

    it('should return 500 when signed URL generation fails', async () => {
      // Mock authenticated user with active file
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockUserId } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: mockConversionId,
                  user_id: mockUserId,
                  status: 'completed',
                  output_file: {
                    id: mockOutputFileId,
                    file_name: 'output.pdf',
                    storage_path: 'user-123/output.pdf',
                    storage_bucket: 'converted',
                    status: 'active',
                  },
                },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      // Mock signed URL generation failure
      mockGenerateSignedUrl.mockResolvedValue({
        url: '',
        error: new Error('Storage error'),
      });

      const request = createMockRequest(mockConversionId);
      const params = createMockParams(mockConversionId);

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to generate download URL');
    });
  });

  describe('Requirements Validation', () => {
    it('should satisfy Requirement 7.5: Generate fresh signed URL upon user request', async () => {
      // Requirement 7.5: WHEN a Signed_URL expires, 
      // THE Application SHALL generate a new Signed_URL upon user request

      const mockSignedUrl = 'https://storage.example.com/fresh-signed-url';

      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockUserId } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: mockConversionId,
                  user_id: mockUserId,
                  status: 'completed',
                  output_file: {
                    id: mockOutputFileId,
                    file_name: 'output.pdf',
                    storage_path: 'user-123/output.pdf',
                    storage_bucket: 'converted',
                    status: 'active',
                  },
                },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      mockGenerateSignedUrl.mockResolvedValue({
        url: mockSignedUrl,
      });

      const request = createMockRequest(mockConversionId);
      const params = createMockParams(mockConversionId);

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.url).toBe(mockSignedUrl);
      expect(mockGenerateSignedUrl).toHaveBeenCalled();
    });

    it('should satisfy Requirement 12.4: Provide download link if file still exists', async () => {
      // Requirement 12.4: WHEN a user clicks on a conversion record, 
      // THE Application SHALL provide a download link if the file still exists

      const mockSignedUrl = 'https://storage.example.com/download-url';

      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockUserId } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: mockConversionId,
                  user_id: mockUserId,
                  status: 'completed',
                  output_file: {
                    id: mockOutputFileId,
                    file_name: 'output.pdf',
                    storage_path: 'user-123/output.pdf',
                    storage_bucket: 'converted',
                    status: 'active', // File still exists
                  },
                },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      mockGenerateSignedUrl.mockResolvedValue({
        url: mockSignedUrl,
      });

      const request = createMockRequest(mockConversionId);
      const params = createMockParams(mockConversionId);

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.url).toBeDefined();
      expect(data.expiresAt).toBeDefined();
    });

    it('should require authentication (Requirement 7.5)', async () => {
      // Verify that unauthenticated users cannot access the endpoint
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      } as any);

      const request = createMockRequest(mockConversionId);
      const params = createMockParams(mockConversionId);

      const response = await GET(request, { params });

      expect(response.status).toBe(401);
    });

    it('should verify user owns the conversion (Requirement 7.5)', async () => {
      // Verify that users can only access their own conversions
      const otherUserId = 'other-user-456';

      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockUserId } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: mockConversionId,
                  user_id: otherUserId,
                  status: 'completed',
                  output_file: {
                    id: mockOutputFileId,
                    file_name: 'output.pdf',
                    storage_path: 'path/to/output.pdf',
                    storage_bucket: 'converted',
                    status: 'active',
                  },
                },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const request = createMockRequest(mockConversionId);
      const params = createMockParams(mockConversionId);

      const response = await GET(request, { params });

      expect(response.status).toBe(403);
    });

    it('should check if file still exists (Requirement 12.4)', async () => {
      // Verify that deleted files return 404
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockUserId } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: mockConversionId,
                  user_id: mockUserId,
                  status: 'completed',
                  output_file: {
                    id: mockOutputFileId,
                    file_name: 'output.pdf',
                    storage_path: 'path/to/output.pdf',
                    storage_bucket: 'converted',
                    status: 'deleted', // File has been deleted
                  },
                },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const request = createMockRequest(mockConversionId);
      const params = createMockParams(mockConversionId);

      const response = await GET(request, { params });

      expect(response.status).toBe(404);
      expect((await response.json()).error).toBe('File has been deleted');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing conversion ID', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockUserId } },
            error: null,
          }),
        },
      } as any);

      const request = createMockRequest('');
      const params = createMockParams('');

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Conversion ID is required');
    });

    it('should handle unexpected errors gracefully', async () => {
      mockCreateClient.mockRejectedValue(new Error('Unexpected error'));

      const request = createMockRequest(mockConversionId);
      const params = createMockParams(mockConversionId);

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });
});
