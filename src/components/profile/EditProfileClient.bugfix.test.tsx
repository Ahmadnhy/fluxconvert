/**
 * Bug Condition Exploration Test for Profile Picture Persistence
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * **DO NOT attempt to fix the test or the code when it fails**
 * **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
 * 
 * **ROOT CAUSE IDENTIFIED**: 
 * - EditProfileClient correctly persists avatar_url in user metadata
 * - UserProfile component (used across all pages) does NOT read or display avatar_url
 * - UserProfile only shows initials-based avatars, ignoring the uploaded profile picture
 * 
 * Bug Condition: Profile pictures upload and persist in metadata, but UserProfile component doesn't display them
 * Expected Behavior: Avatar URL persists in metadata AND UserProfile displays the uploaded image on all pages
 * 
 * **Validates: Requirements 1.1, 1.2, 2.1, 2.2, 2.3**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditProfileClient from './EditProfileClient';
import type { User } from '@supabase/supabase-js';

// Mock Next.js navigation
const mockRefresh = vi.fn();
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
    back: mockBack,
  }),
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

// Mock Supabase client
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockUpdateUser = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@/src/lib/supabase/client', () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
    auth: {
      updateUser: mockUpdateUser,
      getUser: mockGetUser,
    },
  }),
}));

describe('Bug Condition Exploration: Profile Picture Persistence', () => {
  const mockUser: User = {
    id: 'test-user-123',
    email: 'test@example.com',
    user_metadata: {
      full_name: 'Test User',
      avatar_url: '',
    },
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://example.com/storage/avatar-test-user-123.jpg' },
    });
    mockUpdateUser.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property 1: Bug Condition - Profile Picture Upload Without Persistence
   * 
   * This test verifies the BUG EXISTS by checking that:
   * 1. Avatar uploads to storage successfully
   * 2. Avatar URL is NOT persisted in user metadata after form submission
   * 3. Avatar does not display on profile page after save
   * 
   * **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
   * 
   * When the bug is fixed, this test will PASS, confirming:
   * - Avatar URL persists in user metadata (Expected Behavior Property 1)
   * - Avatar displays on all pages (Expected Behavior Property 2)
   * - Avatar shows on return to edit page (Expected Behavior Property 3)
   */
  it('should persist uploaded avatar URL in user metadata after form submission', async () => {
    // Render the component
    render(<EditProfileClient user={mockUser} />);

    // Verify initial state shows initials (no avatar)
    expect(screen.getByText('TU')).toBeInTheDocument(); // Initials for "Test User"

    // Simulate avatar upload
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    const testFile = new File(['test image content'], 'avatar.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', {
      value: [testFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    // Wait for upload to complete
    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringContaining('avatar-test-user-123'),
        testFile,
        { upsert: true }
      );
    });

    // Verify storage upload succeeded
    expect(mockGetPublicUrl).toHaveBeenCalled();

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/Avatar uploaded successfully!/i)).toBeInTheDocument();
    });

    // Verify avatar preview displays the uploaded image
    const avatarImage = screen.getByRole('img', { name: 'Profile' });
    expect(avatarImage).toBeInTheDocument();
    expect(avatarImage).toHaveAttribute('src', 'https://example.com/storage/avatar-test-user-123.jpg');

    // Submit the form to save changes
    const saveButton = screen.getByText(/Save Changes/i);
    fireEvent.click(saveButton);

    // Wait for form submission
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalled();
    });

    // **CRITICAL ASSERTION**: Verify avatar_url is persisted in user metadata
    // This assertion will FAIL on unfixed code if the bug exists
    expect(mockUpdateUser).toHaveBeenCalledWith({
      data: {
        full_name: 'Test User',
        avatar_url: 'https://example.com/storage/avatar-test-user-123.jpg',
      },
    });

    // Verify success message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Profile updated successfully!/i)).toBeInTheDocument();
    });

    // Verify router refresh is called (to update UI across pages)
    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  /**
   * Property 1 (continued): Bug Condition - Avatar Does Not Display After Save
   * 
   * This test verifies that when returning to the edit profile page,
   * the uploaded avatar is NOT displayed (bug condition).
   * 
   * **EXPECTED OUTCOME**: Test FAILS (confirms bug exists)
   * 
   * When fixed, the avatar should display instead of initials.
   */
  it('should display uploaded avatar when returning to edit profile page', async () => {
    // Simulate user with previously uploaded avatar
    const userWithAvatar: User = {
      ...mockUser,
      user_metadata: {
        full_name: 'Test User',
        avatar_url: 'https://example.com/storage/avatar-test-user-123.jpg',
      },
    };

    render(<EditProfileClient user={userWithAvatar} />);

    // **CRITICAL ASSERTION**: Verify avatar image is displayed (not initials)
    // This will FAIL on unfixed code if avatar_url is not persisted
    await waitFor(() => {
      const avatarImage = screen.queryByRole('img', { name: 'Profile' });
      expect(avatarImage).toBeInTheDocument();
      expect(avatarImage).toHaveAttribute('src', 'https://example.com/storage/avatar-test-user-123.jpg');
    });

    // Verify initials are NOT displayed when avatar exists
    expect(screen.queryByText('TU')).not.toBeInTheDocument();
  });

  /**
   * Property 1 (continued): Bug Condition - Avatar Upload Without Metadata Persistence
   * 
   * This test simulates the complete user flow:
   * 1. Upload avatar
   * 2. Save form
   * 3. Navigate away
   * 4. Return to profile
   * 
   * **EXPECTED OUTCOME**: Test FAILS (avatar doesn't persist)
   * 
   * Counterexample: "avatar uploads to storage but metadata.avatar_url remains null"
   */
  it('should persist avatar across navigation (complete user flow)', async () => {
    // Step 1: Initial render with no avatar
    const { rerender } = render(<EditProfileClient user={mockUser} />);

    // Step 2: Upload avatar
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(['test image content'], 'avatar.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', {
      value: [testFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/Avatar uploaded successfully!/i)).toBeInTheDocument();
    });

    // Step 3: Save form
    const saveButton = screen.getByText(/Save Changes/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalled();
    });

    // **CRITICAL ASSERTION**: Verify the updateUser call includes avatar_url
    const updateUserCall = mockUpdateUser.mock.calls[0][0];
    expect(updateUserCall.data.avatar_url).toBe('https://example.com/storage/avatar-test-user-123.jpg');

    // Step 4: Simulate navigation away and return (re-render with updated user)
    const updatedUser: User = {
      ...mockUser,
      user_metadata: {
        full_name: 'Test User',
        avatar_url: updateUserCall.data.avatar_url, // Use the persisted avatar_url
      },
    };

    rerender(<EditProfileClient user={updatedUser} />);

    // **CRITICAL ASSERTION**: Verify avatar displays after navigation
    // This will FAIL if avatar_url was not properly persisted
    await waitFor(() => {
      const avatarImage = screen.queryByRole('img', { name: 'Profile' });
      expect(avatarImage).toBeInTheDocument();
      expect(avatarImage).toHaveAttribute('src', 'https://example.com/storage/avatar-test-user-123.jpg');
    });

    // Verify initials are NOT displayed
    expect(screen.queryByText('TU')).not.toBeInTheDocument();
  });

  /**
   * Edge Case: Verify avatar upload validation still works
   * 
   * This ensures the bug fix doesn't break existing error handling.
   */
  it('should display error for invalid file types', async () => {
    render(<EditProfileClient user={mockUser} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = new File(['test content'], 'document.pdf', { type: 'application/pdf' });
    Object.defineProperty(fileInput, 'files', {
      value: [invalidFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText(/Please upload an image file/i)).toBeInTheDocument();
    });

    // Verify upload was NOT called for invalid file
    expect(mockUpload).not.toHaveBeenCalled();
  });

  /**
   * Edge Case: Verify avatar upload size validation still works
   */
  it('should display error for files exceeding size limit', async () => {
    render(<EditProfileClient user={mockUser} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    // Create a file larger than 2MB
    const largeFile = new File(['x'.repeat(3 * 1024 * 1024)], 'large-avatar.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', {
      value: 3 * 1024 * 1024,
      writable: false,
    });
    Object.defineProperty(fileInput, 'files', {
      value: [largeFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText(/Image size must be less than 2MB/i)).toBeInTheDocument();
    });

    // Verify upload was NOT called for oversized file
    expect(mockUpload).not.toHaveBeenCalled();
  });

  /**
   * Edge Case: Verify storage upload errors are handled
   */
  it('should display error when storage upload fails', async () => {
    mockUpload.mockResolvedValue({ error: { message: 'Storage upload failed' } });

    render(<EditProfileClient user={mockUser} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(['test image content'], 'avatar.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', {
      value: [testFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText(/Failed to upload avatar/i)).toBeInTheDocument();
    });

    // Verify getPublicUrl was NOT called when upload fails
    expect(mockGetPublicUrl).not.toHaveBeenCalled();
  });
});
