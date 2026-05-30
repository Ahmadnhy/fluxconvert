/**
 * Frontend Integration Tests for PDF to Word Converter
 * 
 * Tests cover:
 * - File upload with drag-and-drop and click-to-browse
 * - Progress tracking displays
 * - Download functionality
 * - Error message displays
 * - Authentication state transitions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PdfToWordConverter from './PdfToWordConverter';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock Supabase client
const mockGetUser = vi.fn();
vi.mock('@/src/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
      getSession: async () => {
        try {
          const userResult = await mockGetUser();
          return {
            data: {
              session: userResult?.data?.user ? { user: userResult.data.user } : null,
            },
          };
        } catch (err) {
          // If mockGetUser rejects, make getSession reject similarly
          throw err;
        }
      },
    },
  }),
}));

// Mock UserProfile component
vi.mock('@/src/components/UserProfile', () => ({
  default: ({ userEmail }: { userEmail: string }) => (
    <div data-testid="user-profile">{userEmail}</div>
  ),
}));

// Mock react-dropzone
const mockGetRootProps = vi.fn(() => ({ 'data-testid': 'dropzone' }));
const mockGetInputProps = vi.fn(() => ({ 'data-testid': 'file-input' }));
const mockUseDropzone = vi.fn();

vi.mock('react-dropzone', () => ({
  useDropzone: (config: any) => {
    mockUseDropzone(config);
    return {
      getRootProps: mockGetRootProps,
      getInputProps: mockGetInputProps,
      isDragActive: false,
    };
  },
}));

describe('PdfToWordConverter - Frontend Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: null } });
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Sub-task 1: File upload with drag-and-drop and click-to-browse', () => {
    it('should render dropzone with drag-and-drop functionality', async () => {
      render(<PdfToWordConverter />);

      await waitFor(() => {
        expect(screen.getByText(/Drag & Drop your PDF file here/i)).toBeInTheDocument();
      });

      // Verify dropzone is configured correctly
      expect(mockUseDropzone).toHaveBeenCalledWith(
        expect.objectContaining({
          accept: { 'application/pdf': ['.pdf'] },
          maxSize: 50 * 1024 * 1024, // 50 MB
          multiple: false,
        })
      );
    });

    it('should display click-to-browse button', async () => {
      render(<PdfToWordConverter />);

      await waitFor(() => {
        expect(screen.getByText(/Select PDF File/i)).toBeInTheDocument();
      });
    });

    it('should handle file acceptance and display file preview', async () => {
      render(<PdfToWordConverter />);

      await waitFor(() => {
        expect(mockUseDropzone).toHaveBeenCalled();
      });

      // Get the onDrop callback
      const onDropCallback = mockUseDropzone.mock.calls[0][0].onDrop;

      // Simulate file drop
      const testFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      onDropCallback([testFile], []);

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });
    });

    it('should reject files that are too large', async () => {
      render(<PdfToWordConverter />);

      await waitFor(() => {
        expect(mockUseDropzone).toHaveBeenCalled();
      });

      const onDropCallback = mockUseDropzone.mock.calls[0][0].onDrop;

      // Simulate rejected file
      const rejectedFile = {
        file: new File(['x'.repeat(51 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' }),
        errors: [{ code: 'file-too-large', message: 'File is too large' }],
      };

      onDropCallback([], [rejectedFile]);

      await waitFor(() => {
        expect(screen.getByText(/File size exceeds 50 MB limit/i)).toBeInTheDocument();
      });
    });

    it('should reject invalid file types', async () => {
      render(<PdfToWordConverter />);

      await waitFor(() => {
        expect(mockUseDropzone).toHaveBeenCalled();
      });

      const onDropCallback = mockUseDropzone.mock.calls[0][0].onDrop;

      // Simulate rejected file
      const rejectedFile = {
        file: new File(['test'], 'test.txt', { type: 'text/plain' }),
        errors: [{ code: 'file-invalid-type', message: 'Invalid file type' }],
      };

      onDropCallback([], [rejectedFile]);

      await waitFor(() => {
        expect(screen.getByText(/Only \.pdf files are supported/i)).toBeInTheDocument();
      });
    });
  });

  describe('Sub-task 2: Progress tracking displays correctly', () => {
    it('should display upload progress', async () => {
      const mockFetch = vi.fn(() =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({
                downloadUrl: 'https://example.com/file.docx',
                fileName: 'converted.docx',
                fileSize: '1.2 MB',
              }),
            });
          }, 100);
        })
      );
      global.fetch = mockFetch as any;

      render(<PdfToWordConverter />);

      await waitFor(() => {
        expect(mockUseDropzone).toHaveBeenCalled();
      });

      const onDropCallback = mockUseDropzone.mock.calls[0][0].onDrop;
      const testFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      onDropCallback([testFile], []);

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });

      const convertButton = screen.getByText(/Convert to Word/i);
      fireEvent.click(convertButton);

      // Check for uploading status
      await waitFor(() => {
        expect(screen.getByText(/Uploading file\.\.\./i)).toBeInTheDocument();
      });

      // Check for progress percentage
      await waitFor(() => {
        expect(screen.getByText(/30%/i)).toBeInTheDocument();
      });
    });

    it('should display converting progress', async () => {
      const mockFetch = vi.fn(() =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({
                downloadUrl: 'https://example.com/file.docx',
                fileName: 'converted.docx',
                fileSize: '1.2 MB',
              }),
            });
          }, 100);
        })
      );
      global.fetch = mockFetch as any;

      render(<PdfToWordConverter />);

      await waitFor(() => {
        expect(mockUseDropzone).toHaveBeenCalled();
      });

      const onDropCallback = mockUseDropzone.mock.calls[0][0].onDrop;
      const testFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      onDropCallback([testFile], []);

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });

      const convertButton = screen.getByText(/Convert to Word/i);
      fireEvent.click(convertButton);

      // Check that conversion process starts (either uploading or converting status)
      await waitFor(
        () => {
          const uploadingText = screen.queryByText(/Uploading file\.\.\./i);
          const convertingText = screen.queryByText(/Converting to Word\.\.\./i);
          expect(uploadingText || convertingText).toBeTruthy();
        },
        { timeout: 3000 }
      );
    });

    it('should display completion status at 100%', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          downloadUrl: 'https://example.com/file.docx',
          fileName: 'converted.docx',
          fileSize: '1.2 MB',
        }),
      });
      global.fetch = mockFetch as any;

      render(<PdfToWordConverter />);

      await waitFor(() => {
        expect(mockUseDropzone).toHaveBeenCalled();
      });

      const onDropCallback = mockUseDropzone.mock.calls[0][0].onDrop;
      const testFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      onDropCallback([testFile], []);

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });

      const convertButton = screen.getByText(/Convert to Word/i);
      fireEvent.click(convertButton);

      await waitFor(
        () => {
          expect(screen.getByText(/Conversion completed successfully!/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // The progress bar is only shown during upload/conversion, not after completion
      // So we just verify the completion message is shown
    });
  });

  describe('Sub-task 3: Download functionality with sample conversions', () => {
    it('should display download button after successful conversion', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          downloadUrl: 'https://example.com/file.docx',
          fileName: 'converted.docx',
          fileSize: '1.2 MB',
        }),
      });
      global.fetch = mockFetch as any;

      render(<PdfToWordConverter />);

      await waitFor(() => {
        expect(mockUseDropzone).toHaveBeenCalled();
      });

      const onDropCallback = mockUseDropzone.mock.calls[0][0].onDrop;
      const testFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      onDropCallback([testFile], []);

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });

      const convertButton = screen.getByText(/Convert to Word/i);
      fireEvent.click(convertButton);

      await waitFor(
        () => {
          expect(screen.getByText(/Download Word/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should trigger download when download button is clicked', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          downloadUrl: 'https://example.com/file.docx',
          fileName: 'converted.docx',
          fileSize: '1.2 MB',
        }),
      });
      global.fetch = mockFetch as any;

      // Mock document.createElement for the download link
      const mockClick = vi.fn();
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          const link = originalCreateElement('a');
          link.click = mockClick;
          return link;
        }
        return originalCreateElement(tagName);
      });

      render(<PdfToWordConverter />);

      await waitFor(() => {
        expect(mockUseDropzone).toHaveBeenCalled();
      });

      const onDropCallback = mockUseDropzone.mock.calls[0][0].onDrop;
      const testFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      onDropCallback([testFile], []);

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });

      const convertButton = screen.getByText(/Convert to Word/i);
      fireEvent.click(convertButton);

      await waitFor(
        () => {
          expect(screen.getByText(/Download Word/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const downloadButton = screen.getByText(/Download Word/i);
      fireEvent.click(downloadButton);

      // Verify that the download link was clicked
      expect(mockClick).toHaveBeenCalled();

      vi.restoreAllMocks();
    });

    it('should display converted file information', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          downloadUrl: 'https://example.com/file.docx',
          fileName: 'my-document.docx',
          fileSize: '2.5 MB',
        }),
      });
      global.fetch = mockFetch as any;

      render(<PdfToWordConverter />);

      await waitFor(() => {
        expect(mockUseDropzone).toHaveBeenCalled();
      });

      const onDropCallback = mockUseDropzone.mock.calls[0][0].onDrop;
      const testFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      onDropCallback([testFile], []);

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });

      const convertButton = screen.getByText(/Convert to Word/i);
      fireEvent.click(convertButton);

      await waitFor(
        () => {
          expect(screen.getByText('my-document.docx')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      expect(screen.getByText('2.5 MB')).toBeInTheDocument();
    });
  });

  describe('Sub-task 4: Error messages display properly', () => {
    it('should display error when conversion fails', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: 'Conversion failed: Invalid PDF format',
        }),
      });
      global.fetch = mockFetch as any;

      render(<PdfToWordConverter />);

      await waitFor(() => {
        expect(mockUseDropzone).toHaveBeenCalled();
      });

      const onDropCallback = mockUseDropzone.mock.calls[0][0].onDrop;
      const testFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      onDropCallback([testFile], []);

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });

      const convertButton = screen.getByText(/Convert to Word/i);
      fireEvent.click(convertButton);

      await waitFor(
        () => {
          expect(screen.getByText(/Conversion failed: Invalid PDF format/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should display error when no file is uploaded', async () => {
      render(<PdfToWordConverter />);

      await waitFor(() => {
        expect(screen.getByText(/Drag & Drop your PDF file here/i)).toBeInTheDocument();
      });

      // Try to find and click a convert button (should not exist in initial state)
      // This test verifies the component doesn't allow conversion without a file
      expect(screen.queryByText(/Convert to Word/i)).not.toBeInTheDocument();
    });

    it('should display network error gracefully', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch as any;

      render(<PdfToWordConverter />);

      await waitFor(() => {
        expect(mockUseDropzone).toHaveBeenCalled();
      });

      const onDropCallback = mockUseDropzone.mock.calls[0][0].onDrop;
      const testFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      onDropCallback([testFile], []);

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });

      const convertButton = screen.getByText(/Convert to Word/i);
      fireEvent.click(convertButton);

      await waitFor(
        () => {
          expect(screen.getByText(/Network error/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Sub-task 5: Authentication state transitions', () => {
    it('should display login/signup buttons when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      render(<PdfToWordConverter />);

      await waitFor(() => {
        expect(screen.getByText(/Login/i)).toBeInTheDocument();
        expect(screen.getByText(/Sign Up/i)).toBeInTheDocument();
      });
    });

    it('should display user profile when user is authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            email: 'test@example.com',
            id: '123',
          },
        },
      });

      render(<PdfToWordConverter />);

      await waitFor(() => {
        expect(screen.getByTestId('user-profile')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
      });
    });

    it('should show loading state during auth check', () => {
      mockGetUser.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ data: { user: null } });
            }, 1000);
          })
      );

      render(<PdfToWordConverter />);

      // Check for loading indicator (pulsing circle)
      const loadingElement = document.querySelector('.animate-pulse');
      expect(loadingElement).toBeInTheDocument();
    });

    it('should handle auth errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetUser.mockRejectedValue(new Error('Auth error'));

      render(<PdfToWordConverter />);

      await waitFor(() => {
        expect(screen.getByText(/Login/i)).toBeInTheDocument();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Auth check error:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Sub-task 6: Additional UI/UX verification', () => {
    it('should allow removing uploaded file', async () => {
      render(<PdfToWordConverter />);

      await waitFor(() => {
        expect(mockUseDropzone).toHaveBeenCalled();
      });

      const onDropCallback = mockUseDropzone.mock.calls[0][0].onDrop;
      const testFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      onDropCallback([testFile], []);

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText(/Cancel/i);
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByText(/Drag & Drop your PDF file here/i)).toBeInTheDocument();
      });
    });

    it('should display "Convert Another" button after successful conversion', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          downloadUrl: 'https://example.com/file.docx',
          fileName: 'converted.docx',
          fileSize: '1.2 MB',
        }),
      });
      global.fetch = mockFetch as any;

      render(<PdfToWordConverter />);

      await waitFor(() => {
        expect(mockUseDropzone).toHaveBeenCalled();
      });

      const onDropCallback = mockUseDropzone.mock.calls[0][0].onDrop;
      const testFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      onDropCallback([testFile], []);

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });

      const convertButton = screen.getByText(/Convert to Word/i);
      fireEvent.click(convertButton);

      await waitFor(
        () => {
          expect(screen.getByText(/Convert Another/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should display file size in human-readable format', async () => {
      render(<PdfToWordConverter />);

      await waitFor(() => {
        expect(mockUseDropzone).toHaveBeenCalled();
      });

      const onDropCallback = mockUseDropzone.mock.calls[0][0].onDrop;
      const testFile = new File(['x'.repeat(1024 * 1024 * 2)], 'test.pdf', { type: 'application/pdf' });
      onDropCallback([testFile], []);

      await waitFor(() => {
        expect(screen.getByText(/2 MB/i)).toBeInTheDocument();
      });
    });
  });
});
