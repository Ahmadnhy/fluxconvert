/**
 * Bug Condition Exploration Test for UserProfile Avatar Display
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * **DO NOT attempt to fix the test or the code when it fails**
 * **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
 * 
 * **ROOT CAUSE**: UserProfile component does NOT read or display avatar_url from user metadata
 * - Component fetches full_name from user.user_metadata
 * - Component does NOT fetch avatar_url from user.user_metadata
 * - Component only displays initials-based avatars (hardcoded #5b8ba8 background)
 * - Uploaded profile pictures are ignored completely
 * 
 * Bug Condition: UserProfile displays initials instead of uploaded avatar image
 * Expected Behavior: UserProfile displays uploaded avatar when avatar_url exists in metadata
 * 
 * **Validates: Requirements 1.1, 1.2, 2.2**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import UserProfile from './UserProfile';

// Mock Next.js navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock ConfirmDialog component
vi.mock('@/src/components/ConfirmDialog', () => ({
  default: () => <div data-testid="confirm-dialog">Confirm Dialog</div>,
}));

// Mock Supabase client
const mockGetUser = vi.fn();
const mockSignOut = vi.fn();

vi.mock('@/src/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
      signOut: mockSignOut,
      getSession: async () => {
        try {
          const userResult = await mockGetUser();
          return {
            data: {
              session: userResult?.data?.user ? { user: userResult.data.user } : null,
            },
          };
        } catch (err) {
          throw err;
        }
      },
    },
  }),
}));

describe('Bug Condition Exploration: UserProfile Avatar Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignOut.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property 1: Bug Condition - UserProfile Does Not Display Uploaded Avatar
   * 
   * This test verifies the BUG EXISTS by checking that:
   * 1. User has avatar_url in metadata (uploaded profile picture)
   * 2. UserProfile component does NOT display the avatar image
   * 3. UserProfile component displays initials instead
   * 
   * **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
   * 
   * When the bug is fixed, this test will PASS, confirming:
   * - UserProfile reads avatar_url from user metadata
   * - UserProfile displays the uploaded avatar image
   * - Initials are NOT displayed when avatar exists
   * 
   * **Counterexample**: "User has avatar_url='https://example.com/avatar.jpg' but UserProfile shows 'TU' initials"
   */
  it('should display uploaded avatar image when avatar_url exists in user metadata', async () => {
    // Setup: User with uploaded avatar
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'test-user-123',
          email: 'test@example.com',
          user_metadata: {
            full_name: 'Test User',
            avatar_url: 'https://example.com/storage/avatar-test-user-123.jpg',
          },
        },
      },
    });

    render(<UserProfile userEmail="test@example.com" />);

    // Wait for user profile data to load
    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalled();
    });

    // **CRITICAL ASSERTION**: Verify avatar image is displayed
    // This will FAIL on unfixed code because UserProfile doesn't read avatar_url
    await waitFor(() => {
      const avatarImage = screen.queryByRole('img', { name: /profile|avatar/i });
      expect(avatarImage).toBeInTheDocument();
      expect(avatarImage).toHaveAttribute('src', 'https://example.com/storage/avatar-test-user-123.jpg');
    });

    // Verify initials are NOT displayed when avatar exists
    const initialsElement = screen.queryByText('TU');
    expect(initialsElement).not.toBeInTheDocument();
  });

  /**
   * Property 1 (continued): Bug Condition - UserProfile Shows Initials Instead of Avatar
   * 
   * This test verifies that UserProfile currently shows initials even when avatar_url exists.
   * 
   * **EXPECTED OUTCOME**: Test FAILS (confirms bug exists)
   * 
   * When fixed, UserProfile should display the avatar image, not initials.
   */
  it('should NOT display initials when user has uploaded avatar', async () => {
    // Setup: User with uploaded avatar
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'test-user-123',
          email: 'test@example.com',
          user_metadata: {
            full_name: 'Test User',
            avatar_url: 'https://example.com/storage/avatar-test-user-123.jpg',
          },
        },
      },
    });

    render(<UserProfile userEmail="test@example.com" />);

    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalled();
    });

    // **CRITICAL ASSERTION**: Verify initials are NOT displayed
    // This will FAIL on unfixed code because UserProfile always shows initials
    await waitFor(() => {
      const initialsDiv = screen.queryByText('TU');
      expect(initialsDiv).not.toBeInTheDocument();
    });

    // Verify avatar image IS displayed instead
    const avatarImage = screen.queryByRole('img', { name: /profile|avatar/i });
    expect(avatarImage).toBeInTheDocument();
  });

  /**
   * Property 1 (continued): Bug Condition - Avatar Not Displayed in Dropdown
   * 
   * This test verifies that the dropdown profile button also doesn't display the avatar.
   * 
   * **EXPECTED OUTCOME**: Test FAILS (confirms bug exists in dropdown too)
   */
  it('should display avatar in profile dropdown button', async () => {
    // Setup: User with uploaded avatar
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'test-user-123',
          email: 'test@example.com',
          user_metadata: {
            full_name: 'Test User',
            avatar_url: 'https://example.com/storage/avatar-test-user-123.jpg',
          },
        },
      },
    });

    render(<UserProfile userEmail="test@example.com" />);

    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalled();
    });

    // **CRITICAL ASSERTION**: Verify avatar image is displayed in the button
    // This will FAIL on unfixed code because the button only shows initials
    await waitFor(() => {
      const avatarImage = screen.queryByRole('img', { name: /profile|avatar/i });
      expect(avatarImage).toBeInTheDocument();
      expect(avatarImage).toHaveAttribute('src', 'https://example.com/storage/avatar-test-user-123.jpg');
    });
  });

  /**
   * Preservation Test: Verify initials display when NO avatar exists
   * 
   * This ensures the bug fix doesn't break the existing initials functionality.
   * This test should PASS on both unfixed and fixed code.
   */
  it('should display initials when user has NO avatar_url', async () => {
    // Setup: User without avatar
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'test-user-123',
          email: 'test@example.com',
          user_metadata: {
            full_name: 'Test User',
            // No avatar_url
          },
        },
      },
    });

    render(<UserProfile userEmail="test@example.com" />);

    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalled();
    });

    // Verify initials ARE displayed when no avatar exists
    await waitFor(() => {
      expect(screen.getByText('TU')).toBeInTheDocument();
    });

    // Verify no avatar image is displayed
    const avatarImage = screen.queryByRole('img', { name: /profile|avatar/i });
    expect(avatarImage).not.toBeInTheDocument();
  });

  /**
   * Preservation Test: Verify initials display for user with empty avatar_url
   */
  it('should display initials when avatar_url is empty string', async () => {
    // Setup: User with empty avatar_url
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'test-user-123',
          email: 'test@example.com',
          user_metadata: {
            full_name: 'Test User',
            avatar_url: '', // Empty string
          },
        },
      },
    });

    render(<UserProfile userEmail="test@example.com" />);

    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalled();
    });

    // Verify initials ARE displayed when avatar_url is empty
    await waitFor(() => {
      expect(screen.getByText('TU')).toBeInTheDocument();
    });

    // Verify no avatar image is displayed
    const avatarImage = screen.queryByRole('img', { name: /profile|avatar/i });
    expect(avatarImage).not.toBeInTheDocument();
  });

  /**
   * Preservation Test: Verify user name display still works
   */
  it('should display user full name correctly', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'test-user-123',
          email: 'test@example.com',
          user_metadata: {
            full_name: 'John Doe',
            avatar_url: 'https://example.com/storage/avatar.jpg',
          },
        },
      },
    });

    render(<UserProfile userEmail="test@example.com" />);

    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalled();
    });

    // Verify user name is displayed
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  /**
   * Preservation Test: Verify email fallback for initials still works
   */
  it('should use email for initials when no full_name exists', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'test-user-123',
          email: 'john.doe@example.com',
          user_metadata: {
            // No full_name
          },
        },
      },
    });

    render(<UserProfile userEmail="john.doe@example.com" />);

    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalled();
    });

    // Verify initials from email are displayed
    await waitFor(() => {
      expect(screen.getByText('JO')).toBeInTheDocument(); // "jo" from "john.doe"
    });
  });
});
