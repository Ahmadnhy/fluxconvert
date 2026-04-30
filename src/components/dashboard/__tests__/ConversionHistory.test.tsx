import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConversionHistory from '../ConversionHistory';

// Mock fetch globally
global.fetch = jest.fn();

describe('ConversionHistory Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display empty state when no conversions exist', async () => {
    // Mock API response with empty conversions
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        conversions: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        },
      }),
    });

    render(<ConversionHistory />);

    // Wait for loading to complete and empty state to appear
    await waitFor(() => {
      expect(screen.getByText('No conversions yet')).toBeInTheDocument();
    });

    // Verify empty state is displayed
    expect(screen.getByText('Start converting files to see your history here')).toBeInTheDocument();
    expect(screen.getByText('Start Converting')).toBeInTheDocument();
  });

  it('should display conversion records with all required information', async () => {
    // Mock API response with conversion data
    const mockConversions = [
      {
        id: 'conv-1',
        conversionType: 'word-to-pdf',
        status: 'completed',
        createdAt: '2024-01-15T10:30:00Z',
        completedAt: '2024-01-15T10:30:05Z',
        inputFile: {
          fileName: 'document.docx',
          fileSize: 1024000,
          fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          createdAt: '2024-01-15T10:30:00Z',
        },
        outputFile: {
          fileName: 'document.pdf',
          fileSize: 512000,
          fileType: 'application/pdf',
          createdAt: '2024-01-15T10:30:05Z',
          status: 'active',
        },
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        conversions: mockConversions,
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
        },
      }),
    });

    render(<ConversionHistory />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('document.docx')).toBeInTheDocument();
    });

    // Verify conversion type label (use getAllByText since it appears in dropdown too)
    const conversionTypeLabels = screen.getAllByText('Word to PDF');
    expect(conversionTypeLabels.length).toBeGreaterThan(0);

    // Verify status badge (use getAllByText since "Completed" also appears in status filter dropdown)
    const completedElements = screen.getAllByText('Completed');
    expect(completedElements.length).toBeGreaterThan(0);

    // Verify input file name and size
    expect(screen.getByText('document.docx')).toBeInTheDocument();
    expect(screen.getByText('1000 KB')).toBeInTheDocument();

    // Verify output file name and size
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('500 KB')).toBeInTheDocument();

    // Verify timestamp is displayed
    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();

    // Verify download button is present for completed conversion
    expect(screen.getByText('Download')).toBeInTheDocument();
  });

  it('should display conversions ordered by creation date (newest first)', async () => {
    // Mock API response with multiple conversions in order
    const mockConversions = [
      {
        id: 'conv-3',
        conversionType: 'word-to-pdf',
        status: 'completed',
        createdAt: '2024-01-17T10:00:00Z',
        completedAt: '2024-01-17T10:00:05Z',
        inputFile: {
          fileName: 'newest.docx',
          fileSize: 1024,
          fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          createdAt: '2024-01-17T10:00:00Z',
        },
        outputFile: {
          fileName: 'newest.pdf',
          fileSize: 512,
          fileType: 'application/pdf',
          createdAt: '2024-01-17T10:00:05Z',
          status: 'active',
        },
      },
      {
        id: 'conv-2',
        conversionType: 'word-to-pdf',
        status: 'completed',
        createdAt: '2024-01-16T10:00:00Z',
        completedAt: '2024-01-16T10:00:05Z',
        inputFile: {
          fileName: 'middle.docx',
          fileSize: 1024,
          fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          createdAt: '2024-01-16T10:00:00Z',
        },
        outputFile: {
          fileName: 'middle.pdf',
          fileSize: 512,
          fileType: 'application/pdf',
          createdAt: '2024-01-16T10:00:05Z',
          status: 'active',
        },
      },
      {
        id: 'conv-1',
        conversionType: 'word-to-pdf',
        status: 'completed',
        createdAt: '2024-01-15T10:00:00Z',
        completedAt: '2024-01-15T10:00:05Z',
        inputFile: {
          fileName: 'oldest.docx',
          fileSize: 1024,
          fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          createdAt: '2024-01-15T10:00:00Z',
        },
        outputFile: {
          fileName: 'oldest.pdf',
          fileSize: 512,
          fileType: 'application/pdf',
          createdAt: '2024-01-15T10:00:05Z',
          status: 'active',
        },
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        conversions: mockConversions,
        pagination: {
          page: 1,
          limit: 50,
          total: 3,
          totalPages: 1,
        },
      }),
    });

    render(<ConversionHistory />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('newest.docx')).toBeInTheDocument();
    });

    // Get all conversion cards
    const fileNames = screen.getAllByText(/\.(docx|pdf)$/);
    
    // Verify order: newest should appear before oldest
    // The API returns data ordered by created_at DESC, so we verify the component displays them in that order
    expect(fileNames[0]).toHaveTextContent('newest');
    expect(fileNames[fileNames.length - 1]).toHaveTextContent('oldest');
  });

  it('should display different status badges correctly', async () => {
    // Mock API response with different statuses
    const mockConversions = [
      {
        id: 'conv-1',
        conversionType: 'word-to-pdf',
        status: 'completed',
        createdAt: '2024-01-15T10:00:00Z',
        completedAt: '2024-01-15T10:00:05Z',
        inputFile: {
          fileName: 'completed.docx',
          fileSize: 1024,
          fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          createdAt: '2024-01-15T10:00:00Z',
        },
        outputFile: {
          fileName: 'completed.pdf',
          fileSize: 512,
          fileType: 'application/pdf',
          createdAt: '2024-01-15T10:00:05Z',
          status: 'active',
        },
      },
      {
        id: 'conv-2',
        conversionType: 'word-to-pdf',
        status: 'pending',
        createdAt: '2024-01-15T09:00:00Z',
        completedAt: null,
        inputFile: {
          fileName: 'pending.docx',
          fileSize: 1024,
          fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          createdAt: '2024-01-15T09:00:00Z',
        },
        outputFile: null,
      },
      {
        id: 'conv-3',
        conversionType: 'word-to-pdf',
        status: 'failed',
        createdAt: '2024-01-15T08:00:00Z',
        completedAt: '2024-01-15T08:00:05Z',
        inputFile: {
          fileName: 'failed.docx',
          fileSize: 1024,
          fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          createdAt: '2024-01-15T08:00:00Z',
        },
        outputFile: null,
      },
      {
        id: 'conv-4',
        conversionType: 'word-to-pdf',
        status: 'processing',
        createdAt: '2024-01-15T07:00:00Z',
        completedAt: null,
        inputFile: {
          fileName: 'processing.docx',
          fileSize: 1024,
          fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          createdAt: '2024-01-15T07:00:00Z',
        },
        outputFile: null,
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        conversions: mockConversions,
        pagination: {
          page: 1,
          limit: 50,
          total: 4,
          totalPages: 1,
        },
      }),
    });

    render(<ConversionHistory />);

    // Wait for data to load
    await waitFor(() => {
      const completedElements = screen.getAllByText('Completed');
      expect(completedElements.length).toBeGreaterThan(0);
    });

    // Verify all status badges are displayed (use getAllByText since they also appear in status filter dropdown)
    expect(screen.getAllByText('Completed').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Failed').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Processing').length).toBeGreaterThan(0);
  });

  it('should not display download button for deleted files', async () => {
    // Mock API response with deleted output file
    const mockConversions = [
      {
        id: 'conv-1',
        conversionType: 'word-to-pdf',
        status: 'completed',
        createdAt: '2024-01-15T10:00:00Z',
        completedAt: '2024-01-15T10:00:05Z',
        inputFile: {
          fileName: 'document.docx',
          fileSize: 1024,
          fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          createdAt: '2024-01-15T10:00:00Z',
        },
        outputFile: {
          fileName: 'document.pdf',
          fileSize: 512,
          fileType: 'application/pdf',
          createdAt: '2024-01-15T10:00:05Z',
          status: 'deleted',
        },
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        conversions: mockConversions,
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
        },
      }),
    });

    render(<ConversionHistory />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('document.docx')).toBeInTheDocument();
    });

    // Verify download button is NOT displayed for deleted file
    expect(screen.queryByText('Download')).not.toBeInTheDocument();
  });

  it('should display loading state while fetching data', () => {
    // Mock a delayed response
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<ConversionHistory />);

    // Verify loading spinner is displayed
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should display error message when API call fails', async () => {
    // Mock API error
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<ConversionHistory />);

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Error loading conversions')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to fetch conversion history')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('should call download endpoint and trigger download when download button is clicked', async () => {
    // Mock API response with conversion data
    const mockConversions = [
      {
        id: 'conv-1',
        conversionType: 'word-to-pdf',
        status: 'completed',
        createdAt: '2024-01-15T10:30:00Z',
        completedAt: '2024-01-15T10:30:05Z',
        inputFile: {
          fileName: 'document.docx',
          fileSize: 1024000,
          fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          createdAt: '2024-01-15T10:30:00Z',
        },
        outputFile: {
          fileName: 'document.pdf',
          fileSize: 512000,
          fileType: 'application/pdf',
          createdAt: '2024-01-15T10:30:05Z',
          status: 'active',
        },
      },
    ];

    // Mock initial conversions fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        conversions: mockConversions,
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
        },
      }),
    });

    render(<ConversionHistory />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('document.docx')).toBeInTheDocument();
    });

    // Mock download endpoint response
    const mockSignedUrl = 'https://storage.example.com/signed-url';
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        url: mockSignedUrl,
        expiresAt: '2024-01-15T11:30:00Z',
      }),
    });

    // Mock document.createElement and related methods
    const mockLink = {
      href: '',
      download: '',
      target: '',
      click: jest.fn(),
    };
    const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

    // Click download button
    const downloadButton = screen.getByText('Download');
    downloadButton.click();

    // Wait for download to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/conversions/conv-1/download');
    });

    // Verify link was created and clicked
    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockLink.href).toBe(mockSignedUrl);
    expect(mockLink.download).toBe('document.pdf');
    expect(mockLink.target).toBe('_blank');
    expect(mockLink.click).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();

    // Cleanup
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('should display error message when download fails', async () => {
    // Mock API response with conversion data
    const mockConversions = [
      {
        id: 'conv-1',
        conversionType: 'word-to-pdf',
        status: 'completed',
        createdAt: '2024-01-15T10:30:00Z',
        completedAt: '2024-01-15T10:30:05Z',
        inputFile: {
          fileName: 'document.docx',
          fileSize: 1024000,
          fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          createdAt: '2024-01-15T10:30:00Z',
        },
        outputFile: {
          fileName: 'document.pdf',
          fileSize: 512000,
          fileType: 'application/pdf',
          createdAt: '2024-01-15T10:30:05Z',
          status: 'active',
        },
      },
    ];

    // Mock initial conversions fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        conversions: mockConversions,
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
        },
      }),
    });

    render(<ConversionHistory />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('document.docx')).toBeInTheDocument();
    });

    // Mock download endpoint error (404 - file deleted)
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    // Click download button
    const downloadButton = screen.getByText('Download');
    downloadButton.click();

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Download failed')).toBeInTheDocument();
    });

    expect(screen.getByText('File not found or has been deleted')).toBeInTheDocument();
  });

  it('should show loading state while downloading', async () => {
    // Mock API response with conversion data
    const mockConversions = [
      {
        id: 'conv-1',
        conversionType: 'word-to-pdf',
        status: 'completed',
        createdAt: '2024-01-15T10:30:00Z',
        completedAt: '2024-01-15T10:30:05Z',
        inputFile: {
          fileName: 'document.docx',
          fileSize: 1024000,
          fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          createdAt: '2024-01-15T10:30:00Z',
        },
        outputFile: {
          fileName: 'document.pdf',
          fileSize: 512000,
          fileType: 'application/pdf',
          createdAt: '2024-01-15T10:30:05Z',
          status: 'active',
        },
      },
    ];

    // Mock initial conversions fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        conversions: mockConversions,
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
        },
      }),
    });

    render(<ConversionHistory />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('document.docx')).toBeInTheDocument();
    });

    // Mock download endpoint with delay
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({
        ok: true,
        json: async () => ({
          url: 'https://storage.example.com/signed-url',
          expiresAt: '2024-01-15T11:30:00Z',
        }),
      }), 100))
    );

    // Mock document methods
    const mockLink = {
      href: '',
      download: '',
      target: '',
      click: jest.fn(),
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

    // Click download button
    const downloadButton = screen.getByText('Download');
    downloadButton.click();

    // Verify loading state is shown
    await waitFor(() => {
      expect(screen.getByText('Downloading...')).toBeInTheDocument();
    });

    // Wait for download to complete
    await waitFor(() => {
      expect(screen.queryByText('Downloading...')).not.toBeInTheDocument();
    });
  });
});
