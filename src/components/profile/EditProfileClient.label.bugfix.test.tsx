/**
 * Bug Condition Exploration Test for Incorrect Label Text
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * **DO NOT attempt to fix the test or the code when it fails**
 * **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
 * 
 * Bug Condition: The "Full Name" input field label displays incorrect or placeholder text
 * Expected Behavior: Label displays "Full Name" (Property 4 from design)
 * 
 * **Validates: Requirements 1.3, 2.4**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditProfileClient from './EditProfileClient';
import type { User } from '@supabase/supabase-js';
import * as fc from 'fast-check';

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
    },
  }),
}));

describe('Bug Condition Exploration: Incorrect Full Name Label Text', () => {
  const mockUser: User = {
    id: 'test-user-123',
    email: 'test@example.com',
    user_metadata: {
      full_name: 'Test User',
    },
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 1: Bug Condition - Incorrect Full Name Label Text
   * 
   * This test verifies the BUG EXISTS by checking that:
   * - The "Full Name" input field label displays incorrect or placeholder text
   * - The label does NOT display "Full Name" as expected
   * 
   * **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
   * 
   * When the bug is fixed, this test will PASS, confirming:
   * - Label displays "Full Name" (Expected Behavior Property 4)
   * 
   * **Counterexample**: "label shows 'Name' instead of 'Full Name'"
   */
  it('should display "Full Name" as the label text for the name input field', () => {
    render(<EditProfileClient user={mockUser} />);

    // Find the input field by its id
    const fullNameInput = screen.getByRole('textbox', { name: /full name/i });
    expect(fullNameInput).toBeInTheDocument();
    expect(fullNameInput).toHaveAttribute('id', 'fullName');

    // **CRITICAL ASSERTION**: Verify the label displays "Full Name"
    // This will FAIL on unfixed code if the label text is incorrect
    const label = screen.getByLabelText(/full name/i);
    expect(label).toBeInTheDocument();

    // Verify the label element itself contains the correct text
    const labelElement = document.querySelector('label[for="fullName"]');
    expect(labelElement).toBeInTheDocument();
    expect(labelElement?.textContent?.trim()).toBe('Full Name');
  });

  /**
   * Property 1 (continued): Bug Condition - Label Text Verification Across User States
   * 
   * This property-based test verifies that the label displays "Full Name"
   * regardless of the user's metadata state (different names, no name, etc.)
   * 
   * **EXPECTED OUTCOME**: Test FAILS (confirms bug exists across all user states)
   * 
   * **Scoped PBT Approach**: Test the concrete scenario where user views edit profile form
   * with various user metadata configurations
   */
  it('should display "Full Name" label for all user metadata configurations', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary user metadata
        fc.record({
          full_name: fc.option(fc.string(), { nil: undefined }),
          name: fc.option(fc.string(), { nil: undefined }),
          avatar_url: fc.option(fc.webUrl(), { nil: undefined }),
        }),
        (userMetadata) => {
          // Create a user with the generated metadata
          const testUser: User = {
            id: 'test-user-123',
            email: 'test@example.com',
            user_metadata: userMetadata,
            app_metadata: {},
            aud: 'authenticated',
            created_at: '2024-01-01T00:00:00Z',
          };

          // Render the component
          const { unmount } = render(<EditProfileClient user={testUser} />);

          // **CRITICAL ASSERTION**: Verify label displays "Full Name" regardless of user state
          const labelElement = document.querySelector('label[for="fullName"]');
          expect(labelElement).toBeInTheDocument();
          expect(labelElement?.textContent?.trim()).toBe('Full Name');

          // Verify the label is properly associated with the input
          const fullNameInput = document.querySelector('#fullName');
          expect(fullNameInput).toBeInTheDocument();
          expect(labelElement?.getAttribute('for')).toBe('fullName');

          // Clean up
          unmount();
        }
      ),
      { numRuns: 50 } // Run 50 test cases with different user metadata
    );
  });

  /**
   * Property 1 (continued): Bug Condition - Label Accessibility
   * 
   * This test verifies that the label is properly associated with the input field
   * for accessibility purposes, in addition to displaying the correct text.
   * 
   * **EXPECTED OUTCOME**: Test FAILS if label text is incorrect
   */
  it('should have proper label-input association for accessibility', () => {
    render(<EditProfileClient user={mockUser} />);

    // Verify the label element exists and has correct attributes
    const labelElement = document.querySelector('label[for="fullName"]');
    expect(labelElement).toBeInTheDocument();
    expect(labelElement?.getAttribute('for')).toBe('fullName');

    // **CRITICAL ASSERTION**: Verify label text is "Full Name"
    expect(labelElement?.textContent?.trim()).toBe('Full Name');

    // Verify the input can be found by the label text
    const inputByLabel = screen.getByLabelText(/full name/i);
    expect(inputByLabel).toBeInTheDocument();
    expect(inputByLabel).toHaveAttribute('id', 'fullName');
  });

  /**
   * Property 1 (continued): Bug Condition - Label Text Does Not Match Placeholder
   * 
   * This test verifies that the label text is distinct from the placeholder text
   * and displays the correct "Full Name" label.
   * 
   * **EXPECTED OUTCOME**: Test FAILS if label shows placeholder text instead of "Full Name"
   */
  it('should display "Full Name" label distinct from placeholder text', () => {
    render(<EditProfileClient user={mockUser} />);

    // Get the input element
    const fullNameInput = screen.getByRole('textbox', { name: /full name/i });
    expect(fullNameInput).toBeInTheDocument();

    // Verify placeholder text (should be different from label)
    expect(fullNameInput).toHaveAttribute('placeholder', 'Enter your full name');

    // **CRITICAL ASSERTION**: Verify label text is "Full Name", not placeholder text
    const labelElement = document.querySelector('label[for="fullName"]');
    expect(labelElement?.textContent?.trim()).toBe('Full Name');
    expect(labelElement?.textContent?.trim()).not.toBe('Enter your full name');
    expect(labelElement?.textContent?.trim()).not.toBe('Name');
    expect(labelElement?.textContent?.trim()).not.toBe('');
  });

  /**
   * Edge Case: Verify other form labels are not affected
   * 
   * This ensures the bug is specific to the "Full Name" label
   * and doesn't affect other form elements.
   */
  it('should display correct labels for all form fields', () => {
    render(<EditProfileClient user={mockUser} />);

    // Verify "Profile Picture" label
    const profilePictureLabel = screen.getByText('Profile Picture');
    expect(profilePictureLabel).toBeInTheDocument();

    // **CRITICAL ASSERTION**: Verify "Full Name" label
    const fullNameLabel = document.querySelector('label[for="fullName"]');
    expect(fullNameLabel?.textContent?.trim()).toBe('Full Name');

    // Verify "Email Address" label
    const emailLabel = document.querySelector('label[for="email"]');
    expect(emailLabel?.textContent?.trim()).toBe('Email Address');
  });
});
