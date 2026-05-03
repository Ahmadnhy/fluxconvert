import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ConversionHistory from './ConversionHistory';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock Supabase client
vi.mock('@/src/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  })),
}));

// Mock fetch
global.fetch = vi.fn();

describe('ConversionHistory - PDF to Word Support', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display "PDF to Word" label for pdf-to-word conversion type', async () => {
    const mockConversions = {
      conversions: [
        {
          id: '1',
          conversionType: 'pdf-to-word',
          status: 'completed',
          createdAt: '2024-01-01T00:00:00Z',
          completedAt: '2024-01-01T00:01:00Z',
          inputFile: {
            fileName: 'document.pdf',
            fileSize: 1024000,
            fileType: 'application/pdf',
            createdAt: '2024-01-01T00:00:00Z',
          },
          outputFile: {
            fileName: 'document.docx',
            fileSize: 2048000,
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            createdAt: '2024-01-01T00:01:00Z',
            status: 'active',
          },
        },
      ],
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConversions,
    });

    render(<ConversionHistory />);

    await waitFor(() => {
      expect(screen.getByText('PDF to Word')).toBeInTheDocument();
    });
  });

  it('should include "PDF to Word" as a filter option', () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        conversions: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
      }),
    });

    render(<ConversionHistory />);

    // Find the PDF to Word option directly
    const pdfToWordOption = screen.getByRole('option', { name: 'PDF to Word' });
    expect(pdfToWordOption).toBeInTheDocument();
    expect(pdfToWordOption.getAttribute('value')).toBe('pdf-to-word');
  });

  it('should display input and output file names for pdf-to-word conversions', async () => {
    const mockConversions = {
      conversions: [
        {
          id: '1',
          conversionType: 'pdf-to-word',
          status: 'completed',
          createdAt: '2024-01-01T00:00:00Z',
          completedAt: '2024-01-01T00:01:00Z',
          inputFile: {
            fileName: 'report.pdf',
            fileSize: 1024000,
            fileType: 'application/pdf',
            createdAt: '2024-01-01T00:00:00Z',
          },
          outputFile: {
            fileName: 'report.docx',
            fileSize: 2048000,
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            createdAt: '2024-01-01T00:01:00Z',
            status: 'active',
          },
        },
      ],
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConversions,
    });

    render(<ConversionHistory />);

    await waitFor(() => {
      expect(screen.getByText('report.pdf')).toBeInTheDocument();
      expect(screen.getByText('report.docx')).toBeInTheDocument();
    });
  });

  it('should display conversion status for pdf-to-word conversions', async () => {
    const mockConversions = {
      conversions: [
        {
          id: '1',
          conversionType: 'pdf-to-word',
          status: 'completed',
          createdAt: '2024-01-01T00:00:00Z',
          completedAt: '2024-01-01T00:01:00Z',
          inputFile: {
            fileName: 'document.pdf',
            fileSize: 1024000,
            fileType: 'application/pdf',
            createdAt: '2024-01-01T00:00:00Z',
          },
          outputFile: {
            fileName: 'document.docx',
            fileSize: 2048000,
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            createdAt: '2024-01-01T00:01:00Z',
            status: 'active',
          },
        },
      ],
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConversions,
    });

    render(<ConversionHistory />);

    await waitFor(() => {
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  it('should display download button for completed pdf-to-word conversions', async () => {
    const mockConversions = {
      conversions: [
        {
          id: '1',
          conversionType: 'pdf-to-word',
          status: 'completed',
          createdAt: '2024-01-01T00:00:00Z',
          completedAt: '2024-01-01T00:01:00Z',
          inputFile: {
            fileName: 'document.pdf',
            fileSize: 1024000,
            fileType: 'application/pdf',
            createdAt: '2024-01-01T00:00:00Z',
          },
          outputFile: {
            fileName: 'document.docx',
            fileSize: 2048000,
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            createdAt: '2024-01-01T00:01:00Z',
            status: 'active',
          },
        },
      ],
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConversions,
    });

    render(<ConversionHistory />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
    });
  });
});

describe('ConversionHistory - Status Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display yellow badge with "Pending" label for pending status', async () => {
    const mockConversions = {
      conversions: [
        {
          id: '1',
          conversionType: 'word-to-pdf',
          status: 'pending',
          createdAt: '2024-01-01T00:00:00Z',
          completedAt: null,
          inputFile: {
            fileName: 'document.docx',
            fileSize: 1024000,
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            createdAt: '2024-01-01T00:00:00Z',
          },
          outputFile: null,
        },
      ],
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConversions,
    });

    render(<ConversionHistory />);

    await waitFor(() => {
      const badges = screen.getAllByText('Pending');
      // Find the badge (not the option in the dropdown)
      const badge = badges.find(el => el.tagName === 'SPAN');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-700');
    });
  });

  it('should display blue badge with "Processing" label for processing status', async () => {
    const mockConversions = {
      conversions: [
        {
          id: '1',
          conversionType: 'word-to-pdf',
          status: 'processing',
          createdAt: '2024-01-01T00:00:00Z',
          completedAt: null,
          inputFile: {
            fileName: 'document.docx',
            fileSize: 1024000,
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            createdAt: '2024-01-01T00:00:00Z',
          },
          outputFile: null,
        },
      ],
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConversions,
    });

    render(<ConversionHistory />);

    await waitFor(() => {
      const badges = screen.getAllByText('Processing');
      // Find the badge (not the option in the dropdown)
      const badge = badges.find(el => el.tagName === 'SPAN');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-700');
    });
  });

  it('should display green badge with "Completed" label for completed status', async () => {
    const mockConversions = {
      conversions: [
        {
          id: '1',
          conversionType: 'word-to-pdf',
          status: 'completed',
          createdAt: '2024-01-01T00:00:00Z',
          completedAt: '2024-01-01T00:01:00Z',
          inputFile: {
            fileName: 'document.docx',
            fileSize: 1024000,
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            createdAt: '2024-01-01T00:00:00Z',
          },
          outputFile: {
            fileName: 'document.pdf',
            fileSize: 2048000,
            fileType: 'application/pdf',
            createdAt: '2024-01-01T00:01:00Z',
            status: 'active',
          },
        },
      ],
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConversions,
    });

    render(<ConversionHistory />);

    await waitFor(() => {
      const badges = screen.getAllByText('Completed');
      // Find the badge (not the option in the dropdown)
      const badge = badges.find(el => el.tagName === 'SPAN');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-green-100', 'text-green-700');
    });
  });

  it('should display red badge with "Failed" label for failed status', async () => {
    const mockConversions = {
      conversions: [
        {
          id: '1',
          conversionType: 'word-to-pdf',
          status: 'failed',
          createdAt: '2024-01-01T00:00:00Z',
          completedAt: '2024-01-01T00:01:00Z',
          inputFile: {
            fileName: 'document.docx',
            fileSize: 1024000,
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            createdAt: '2024-01-01T00:00:00Z',
          },
          outputFile: null,
        },
      ],
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConversions,
    });

    render(<ConversionHistory />);

    await waitFor(() => {
      const badges = screen.getAllByText('Failed');
      // Find the badge (not the option in the dropdown)
      const badge = badges.find(el => el.tagName === 'SPAN');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-red-100', 'text-red-700');
    });
  });

  it('should display status directly from database without client-side manipulation', async () => {
    const mockConversions = {
      conversions: [
        {
          id: '1',
          conversionType: 'word-to-pdf',
          status: 'pending',
          createdAt: '2024-01-01T00:00:00Z',
          completedAt: null,
          inputFile: {
            fileName: 'document1.docx',
            fileSize: 1024000,
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            createdAt: '2024-01-01T00:00:00Z',
          },
          outputFile: null,
        },
        {
          id: '2',
          conversionType: 'pdf-to-word',
          status: 'processing',
          createdAt: '2024-01-01T00:00:00Z',
          completedAt: null,
          inputFile: {
            fileName: 'document2.pdf',
            fileSize: 1024000,
            fileType: 'application/pdf',
            createdAt: '2024-01-01T00:00:00Z',
          },
          outputFile: null,
        },
        {
          id: '3',
          conversionType: 'word-to-pdf',
          status: 'completed',
          createdAt: '2024-01-01T00:00:00Z',
          completedAt: '2024-01-01T00:01:00Z',
          inputFile: {
            fileName: 'document3.docx',
            fileSize: 1024000,
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            createdAt: '2024-01-01T00:00:00Z',
          },
          outputFile: {
            fileName: 'document3.pdf',
            fileSize: 2048000,
            fileType: 'application/pdf',
            createdAt: '2024-01-01T00:01:00Z',
            status: 'active',
          },
        },
        {
          id: '4',
          conversionType: 'pdf-to-word',
          status: 'failed',
          createdAt: '2024-01-01T00:00:00Z',
          completedAt: '2024-01-01T00:01:00Z',
          inputFile: {
            fileName: 'document4.pdf',
            fileSize: 1024000,
            fileType: 'application/pdf',
            createdAt: '2024-01-01T00:00:00Z',
          },
          outputFile: null,
        },
      ],
      pagination: {
        page: 1,
        limit: 50,
        total: 4,
        totalPages: 1,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConversions,
    });

    render(<ConversionHistory />);

    await waitFor(() => {
      // Verify all four status badges are displayed correctly
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });
  });

  it('should handle unknown status by defaulting to pending badge', async () => {
    const mockConversions = {
      conversions: [
        {
          id: '1',
          conversionType: 'word-to-pdf',
          status: 'unknown-status',
          createdAt: '2024-01-01T00:00:00Z',
          completedAt: null,
          inputFile: {
            fileName: 'document.docx',
            fileSize: 1024000,
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            createdAt: '2024-01-01T00:00:00Z',
          },
          outputFile: null,
        },
      ],
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConversions,
    });

    render(<ConversionHistory />);

    await waitFor(() => {
      // Should default to pending badge for unknown status
      const badges = screen.getAllByText('Pending');
      // Find the badge (not the option in the dropdown)
      const badge = badges.find(el => el.tagName === 'SPAN');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-700');
    });
  });
});

describe('ConversionHistory - Delete Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.confirm
    global.confirm = vi.fn();
  });

  it('should display delete button in top-right corner of each conversion entry', async () => {
    const mockConversions = {
      conversions: [
        {
          id: '1',
          conversionType: 'word-to-pdf',
          status: 'completed',
          createdAt: '2024-01-01T00:00:00Z',
          completedAt: '2024-01-01T00:01:00Z',
          inputFile: {
            fileName: 'document.docx',
            fileSize: 1024000,
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            createdAt: '2024-01-01T00:00:00Z',
          },
          outputFile: {
            fileName: 'document.pdf',
            fileSize: 2048000,
            fileType: 'application/pdf',
            createdAt: '2024-01-01T00:01:00Z',
            status: 'active',
          },
        },
      ],
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConversions,
    });

    render(<ConversionHistory />);

    await waitFor(() => {
      const deleteButton = screen.getByRole('button', { name: /delete conversion/i });
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).toHaveClass('text-red-600');
    });
  });

  it('should show confirmation dialog when delete button is clicked', async () => {
    const mockConversions = {
      conversions: [
        {
          id: '1',
          conversionType: 'word-to-pdf',
          status: 'completed',
          createdAt: '2024-01-01T00:00:00Z',
          completedAt: '2024-01-01T00:01:00Z',
          inputFile: {
            fileName: 'document.docx',
            fileSize: 1024000,
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            createdAt: '2024-01-01T00:00:00Z',
          },
          outputFile: {
            fileName: 'document.pdf',
            fileSize: 2048000,
            fileType: 'application/pdf',
            createdAt: '2024-01-01T00:01:00Z',
            status: 'active',
          },
        },
      ],
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConversions,
    });

    (global.confirm as any).mockReturnValue(false);

    render(<ConversionHistory />);

    await waitFor(() => {
      const deleteButton = screen.getByRole('button', { name: /delete conversion/i });
      deleteButton.click();
    });

    expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this conversion?');
  });

  it('should send DELETE request when user confirms deletion', async () => {
    const mockConversions = {
      conversions: [
        {
          id: '1',
          conversionType: 'word-to-pdf',
          status: 'completed',
          createdAt: '2024-01-01T00:00:00Z',
          completedAt: '2024-01-01T00:01:00Z',
          inputFile: {
            fileName: 'document.docx',
            fileSize: 1024000,
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            createdAt: '2024-01-01T00:00:00Z',
          },
          outputFile: {
            fileName: 'document.pdf',
            fileSize: 2048000,
            fileType: 'application/pdf',
            createdAt: '2024-01-01T00:01:00Z',
            status: 'active',
          },
        },
      ],
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
      },
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockConversions,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    (global.confirm as any).mockReturnValue(true);

    render(<ConversionHistory />);

    await waitFor(() => {
      const deleteButton = screen.getByRole('button', { name: /delete conversion/i });
      deleteButton.click();
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/conversions/1', {
        method: 'DELETE',
      });
    });
  });

  it('should remove entry from display without page refresh on successful deletion', async () => {
    const mockConversions = {
      conversions: [
        {
          id: '1',
          conversionType: 'word-to-pdf',
          status: 'completed',
          createdAt: '2024-01-01T00:00:00Z',
          completedAt: '2024-01-01T00:01:00Z',
          inputFile: {
            fileName: 'document.docx',
            fileSize: 1024000,
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            createdAt: '2024-01-01T00:00:00Z',
          },
          outputFile: {
            fileName: 'document.pdf',
            fileSize: 2048000,
            fileType: 'application/pdf',
            createdAt: '2024-01-01T00:01:00Z',
            status: 'active',
          },
        },
      ],
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
      },
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockConversions,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    (global.confirm as any).mockReturnValue(true);

    render(<ConversionHistory />);

    await waitFor(() => {
      expect(screen.getByText('document.docx')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /delete conversion/i });
    deleteButton.click();

    await waitFor(() => {
      expect(screen.queryByText('document.docx')).not.toBeInTheDocument();
    });
  });

  it('should display error message on deletion failure', async () => {
    const mockConversions = {
      conversions: [
        {
          id: '1',
          conversionType: 'word-to-pdf',
          status: 'completed',
          createdAt: '2024-01-01T00:00:00Z',
          completedAt: '2024-01-01T00:01:00Z',
          inputFile: {
            fileName: 'document.docx',
            fileSize: 1024000,
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            createdAt: '2024-01-01T00:00:00Z',
          },
          outputFile: {
            fileName: 'document.pdf',
            fileSize: 2048000,
            fileType: 'application/pdf',
            createdAt: '2024-01-01T00:01:00Z',
            status: 'active',
          },
        },
      ],
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
      },
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockConversions,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Failed to delete conversion' }),
      });

    (global.confirm as any).mockReturnValue(true);

    render(<ConversionHistory />);

    await waitFor(() => {
      const deleteButton = screen.getByRole('button', { name: /delete conversion/i });
      deleteButton.click();
    });

    await waitFor(() => {
      expect(screen.getByText('Delete failed')).toBeInTheDocument();
      expect(screen.getByText('Failed to delete conversion')).toBeInTheDocument();
    });
  });

  it('should show loading state during deletion', async () => {
    const mockConversions = {
      conversions: [
        {
          id: '1',
          conversionType: 'word-to-pdf',
          status: 'completed',
          createdAt: '2024-01-01T00:00:00Z',
          completedAt: '2024-01-01T00:01:00Z',
          inputFile: {
            fileName: 'document.docx',
            fileSize: 1024000,
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            createdAt: '2024-01-01T00:00:00Z',
          },
          outputFile: {
            fileName: 'document.pdf',
            fileSize: 2048000,
            fileType: 'application/pdf',
            createdAt: '2024-01-01T00:01:00Z',
            status: 'active',
          },
        },
      ],
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
      },
    };

    let resolveDelete: any;
    const deletePromise = new Promise((resolve) => {
      resolveDelete = resolve;
    });

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockConversions,
      })
      .mockReturnValueOnce(deletePromise);

    (global.confirm as any).mockReturnValue(true);

    render(<ConversionHistory />);

    await waitFor(() => {
      const deleteButton = screen.getByRole('button', { name: /delete conversion/i });
      deleteButton.click();
    });

    // Check for loading state (spinner icon)
    await waitFor(() => {
      const deleteButton = screen.getByRole('button', { name: /delete conversion/i });
      expect(deleteButton).toHaveClass('cursor-not-allowed');
    });

    // Resolve the delete request
    resolveDelete({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  it('should not send DELETE request when user cancels confirmation', async () => {
    const mockConversions = {
      conversions: [
        {
          id: '1',
          conversionType: 'word-to-pdf',
          status: 'completed',
          createdAt: '2024-01-01T00:00:00Z',
          completedAt: '2024-01-01T00:01:00Z',
          inputFile: {
            fileName: 'document.docx',
            fileSize: 1024000,
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            createdAt: '2024-01-01T00:00:00Z',
          },
          outputFile: {
            fileName: 'document.pdf',
            fileSize: 2048000,
            fileType: 'application/pdf',
            createdAt: '2024-01-01T00:01:00Z',
            status: 'active',
          },
        },
      ],
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConversions,
    });

    (global.confirm as any).mockReturnValue(false);

    render(<ConversionHistory />);

    await waitFor(() => {
      const deleteButton = screen.getByRole('button', { name: /delete conversion/i });
      deleteButton.click();
    });

    // Verify DELETE request was not sent (only initial fetch for conversions)
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(screen.getByText('document.docx')).toBeInTheDocument();
  });

  it('should display trash icon on delete button', async () => {
    const mockConversions = {
      conversions: [
        {
          id: '1',
          conversionType: 'word-to-pdf',
          status: 'completed',
          createdAt: '2024-01-01T00:00:00Z',
          completedAt: '2024-01-01T00:01:00Z',
          inputFile: {
            fileName: 'document.docx',
            fileSize: 1024000,
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            createdAt: '2024-01-01T00:00:00Z',
          },
          outputFile: {
            fileName: 'document.pdf',
            fileSize: 2048000,
            fileType: 'application/pdf',
            createdAt: '2024-01-01T00:01:00Z',
            status: 'active',
          },
        },
      ],
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConversions,
    });

    render(<ConversionHistory />);

    await waitFor(() => {
      const deleteButton = screen.getByRole('button', { name: /delete conversion/i });
      const svg = deleteButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });
});
