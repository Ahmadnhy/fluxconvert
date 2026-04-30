import { getUserConversions } from '../conversions';
import { createClient } from '@/src/lib/supabase/server';

// Mock the Supabase client
jest.mock('@/src/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('getUserConversions', () => {
  it('should return error when user_id is empty', async () => {
    const result = await getUserConversions('');

    expect(result.conversions).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('Invalid user_id');
  });

  it('should return error when user_id is only whitespace', async () => {
    const result = await getUserConversions('   ');

    expect(result.conversions).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('Invalid user_id');
  });

  it('should use default pagination values when no options provided', async () => {
    const result = await getUserConversions('');

    // Even though it errors, it should still return default pagination values
    expect(result.page).toBe(1);
    expect(result.limit).toBe(50);
  });

  it('should use custom pagination values', async () => {
    const result = await getUserConversions('', { page: 2, limit: 10 });

    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
  });

  it('should handle invalid page number by using default', async () => {
    const result = await getUserConversions('', { page: -1 });

    expect(result.page).toBe(1);
  });

  it('should handle invalid limit by using default', async () => {
    const result = await getUserConversions('', { limit: 0 });

    expect(result.limit).toBe(50);
  });

  it('should cap limit at 100', async () => {
    const result = await getUserConversions('', { limit: 200 });

    expect(result.limit).toBe(100);
  });

  it('should handle unexpected exception', async () => {
    (createClient as jest.Mock).mockRejectedValue(new Error('Network error'));

    const result = await getUserConversions('user-123');

    expect(result.conversions).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('Network error');
  });
});
