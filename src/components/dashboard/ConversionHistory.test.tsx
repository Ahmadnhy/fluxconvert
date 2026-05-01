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
