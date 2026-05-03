/**
 * Integration Test: DELETE /api/conversions/:id
 * 
 * **Validates: Requirements 17.8, 17.9, 17.10**
 * 
 * This integration test verifies that authenticated users can delete their own
 * conversion records, and that proper authorization checks are enforced.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DELETE } from './route';
import { NextRequest } from 'next/server';

// Mock Supabase server client
const mockGetUser = vi.fn();
const mockSelect = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/src/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

describe('DELETE /api/conversions/:id', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  /**
   * Test: Authenticated user can delete their own conversion
   * 
   * Verifies that a user who owns a conversion can successfully delete it.
   */
  it('should successfully delete conversion owned by authenticated user', async () => {
    const userId = 'test-user-123';
    const conversionId = 'test-conversion-456';

    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    // Mock conversion fetch - user owns this conversion
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: conversionId,
        user_id: userId,
      },
      error: null,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
      single: mockSingle,
    });

    // Mock successful deletion
    const mockDeleteEq = vi.fn().mockResolvedValue({
      error: null,
    });

    mockDelete.mockReturnValue({
      eq: mockDeleteEq,
    });

    mockFrom.mockReturnValue({
      select: mockSelect,
      delete: mockDelete,
    });

    // Create request
    const request = new NextRequest(`http://localhost:3000/api/conversions/${conversionId}`, {
      method: 'DELETE',
    });

    // Call DELETE handler
    const response = await DELETE(request, {
      params: Promise.resolve({ id: conversionId }),
    });

    const responseData = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);

    // Verify database calls
    expect(mockFrom).toHaveBeenCalledWith('conversions');
    expect(mockSelect).toHaveBeenCalledWith('id, user_id');
    expect(mockEq).toHaveBeenCalledWith('id', conversionId);
    expect(mockDelete).toHaveBeenCalled();
    expect(mockDeleteEq).toHaveBeenCalledWith('id', conversionId);
  });

  /**
   * Test: Unauthenticated user receives 401 error
   * 
   * Verifies that the endpoint requires authentication.
   */
  it('should return 401 for unauthenticated user', async () => {
    const conversionId = 'test-conversion-456';

    // Mock unauthenticated user
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    // Create request
    const request = new NextRequest(`http://localhost:3000/api/conversions/${conversionId}`, {
      method: 'DELETE',
    });

    // Call DELETE handler
    const response = await DELETE(request, {
      params: Promise.resolve({ id: conversionId }),
    });

    const responseData = await response.json();

    // Verify response
    expect(response.status).toBe(401);
    expect(responseData.error).toBe('Unauthorized');

    // Verify no database calls were made
    expect(mockFrom).not.toHaveBeenCalled();
  });

  /**
   * Test: User cannot delete another user's conversion (403 Forbidden)
   * 
   * Verifies that authorization checks prevent users from deleting
   * conversions they don't own.
   */
  it('should return 403 when user does not own the conversion', async () => {
    const userId = 'test-user-123';
    const otherUserId = 'other-user-789';
    const conversionId = 'test-conversion-456';

    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    // Mock conversion fetch - owned by different user
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: conversionId,
        user_id: otherUserId, // Different user owns this
      },
      error: null,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
      single: mockSingle,
    });

    mockFrom.mockReturnValue({
      select: mockSelect,
      delete: mockDelete,
    });

    // Create request
    const request = new NextRequest(`http://localhost:3000/api/conversions/${conversionId}`, {
      method: 'DELETE',
    });

    // Call DELETE handler
    const response = await DELETE(request, {
      params: Promise.resolve({ id: conversionId }),
    });

    const responseData = await response.json();

    // Verify response
    expect(response.status).toBe(403);
    expect(responseData.error).toBe('Forbidden: You do not own this conversion');

    // Verify delete was NOT called
    expect(mockDelete).not.toHaveBeenCalled();
  });

  /**
   * Test: Non-existent conversion returns 404
   * 
   * Verifies that attempting to delete a non-existent conversion
   * returns a 404 error.
   */
  it('should return 404 when conversion does not exist', async () => {
    const userId = 'test-user-123';
    const conversionId = 'non-existent-conversion';

    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    // Mock conversion fetch - not found
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'Not found' },
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
      single: mockSingle,
    });

    mockFrom.mockReturnValue({
      select: mockSelect,
      delete: mockDelete,
    });

    // Create request
    const request = new NextRequest(`http://localhost:3000/api/conversions/${conversionId}`, {
      method: 'DELETE',
    });

    // Call DELETE handler
    const response = await DELETE(request, {
      params: Promise.resolve({ id: conversionId }),
    });

    const responseData = await response.json();

    // Verify response
    expect(response.status).toBe(404);
    expect(responseData.error).toBe('Conversion not found');

    // Verify delete was NOT called
    expect(mockDelete).not.toHaveBeenCalled();
  });

  /**
   * Test: Invalid conversion ID returns 400
   * 
   * Verifies that invalid conversion IDs are rejected.
   */
  it('should return 400 for invalid conversion ID', async () => {
    const userId = 'test-user-123';

    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    // Create request with empty ID
    const request = new NextRequest('http://localhost:3000/api/conversions/', {
      method: 'DELETE',
    });

    // Call DELETE handler with empty ID
    const response = await DELETE(request, {
      params: Promise.resolve({ id: '' }),
    });

    const responseData = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(responseData.error).toBe('Invalid conversion ID');

    // Verify no database calls were made
    expect(mockFrom).not.toHaveBeenCalled();
  });

  /**
   * Test: Database error during deletion returns 500
   * 
   * Verifies that database errors are handled gracefully.
   */
  it('should return 500 when database deletion fails', async () => {
    const userId = 'test-user-123';
    const conversionId = 'test-conversion-456';

    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    // Mock conversion fetch - user owns this conversion
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: conversionId,
        user_id: userId,
      },
      error: null,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
      single: mockSingle,
    });

    // Mock failed deletion
    const mockDeleteEq = vi.fn().mockResolvedValue({
      error: { message: 'Database connection failed' },
    });

    mockDelete.mockReturnValue({
      eq: mockDeleteEq,
    });

    mockFrom.mockReturnValue({
      select: mockSelect,
      delete: mockDelete,
    });

    // Create request
    const request = new NextRequest(`http://localhost:3000/api/conversions/${conversionId}`, {
      method: 'DELETE',
    });

    // Call DELETE handler
    const response = await DELETE(request, {
      params: Promise.resolve({ id: conversionId }),
    });

    const responseData = await response.json();

    // Verify response
    expect(response.status).toBe(500);
    expect(responseData.error).toBe('Failed to delete conversion record');
  });
});
