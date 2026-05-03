import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { convertWordToPdf } from './wordToPdf';
import * as tempFiles from '../utils/tempFiles';

// Mock dependencies
vi.mock('mammoth');
vi.mock('html-pdf-node');
vi.mock('../utils/tempFiles');

describe('Word-to-PDF Converter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('convertWordToPdf', () => {
    it('should successfully convert DOCX to PDF through multi-step pipeline', async () => {
      // Mock file system operations
      vi.spyOn(fs, 'readFile').mockResolvedValue(Buffer.from('mock docx content'));
      vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      // Mock mammoth conversion
      const mammoth = await import('mammoth');
      vi.mocked(mammoth.convertToHtml).mockResolvedValue({
        value: '<p>Test content</p>',
        messages: []
      });

      // Mock html-pdf-node
      const htmlPdf = await import('html-pdf-node');
      vi.mocked(htmlPdf.generatePdf).mockResolvedValue(Buffer.from('mock pdf content'));

      // Mock temp file creation
      vi.mocked(tempFiles.createTempFile).mockResolvedValueOnce({
        path: '/tmp/intermediate-123.html',
        cleanup: vi.fn().mockResolvedValue(undefined)
      }).mockResolvedValueOnce({
        path: '/tmp/styled-456.html',
        cleanup: vi.fn().mockResolvedValue(undefined)
      });

      // Mock cleanup
      vi.mocked(tempFiles.cleanupTempFiles).mockResolvedValue(undefined);

      const result = await convertWordToPdf({
        inputPath: '/tmp/input.docx',
        outputPath: '/tmp/output.pdf',
        timeout: 120000
      });

      expect(result.success).toBe(true);
      expect(result.outputPath).toBe('/tmp/output.pdf');
      expect(result.error).toBeUndefined();
      expect(result.intermediateFiles?.htmlPath).toBe('/tmp/intermediate-123.html');
      expect(result.intermediateFiles?.styledHtmlPath).toBe('/tmp/styled-456.html');

      // Verify mammoth was called
      expect(mammoth.convertToHtml).toHaveBeenCalledWith({
        buffer: expect.any(Buffer)
      });

      // Verify html-pdf-node was called
      expect(htmlPdf.generatePdf).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('Test content')
        }),
        expect.objectContaining({
          format: 'A4'
        })
      );

      // Verify cleanup was called
      expect(tempFiles.cleanupTempFiles).toHaveBeenCalledWith([
        '/tmp/intermediate-123.html',
        '/tmp/styled-456.html'
      ]);
    });

    it('should handle mammoth conversion errors', async () => {
      vi.spyOn(fs, 'readFile').mockResolvedValue(Buffer.from('mock docx content'));

      const mammoth = await import('mammoth');
      vi.mocked(mammoth.convertToHtml).mockRejectedValue(new Error('Invalid DOCX format'));

      vi.mocked(tempFiles.cleanupTempFiles).mockResolvedValue(undefined);

      const result = await convertWordToPdf({
        inputPath: '/tmp/input.docx',
        outputPath: '/tmp/output.pdf'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid DOCX format');
      expect(result.outputPath).toBeUndefined();
    });

    it('should handle PDF generation errors', async () => {
      vi.spyOn(fs, 'readFile').mockResolvedValue(Buffer.from('mock docx content'));

      const mammoth = await import('mammoth');
      vi.mocked(mammoth.convertToHtml).mockResolvedValue({
        value: '<p>Test content</p>',
        messages: []
      });

      vi.mocked(tempFiles.createTempFile).mockResolvedValueOnce({
        path: '/tmp/intermediate-123.html',
        cleanup: vi.fn().mockResolvedValue(undefined)
      }).mockResolvedValueOnce({
        path: '/tmp/styled-456.html',
        cleanup: vi.fn().mockResolvedValue(undefined)
      });

      const htmlPdf = await import('html-pdf-node');
      vi.mocked(htmlPdf.generatePdf).mockRejectedValue(new Error('PDF generation failed'));

      vi.mocked(tempFiles.cleanupTempFiles).mockResolvedValue(undefined);

      const result = await convertWordToPdf({
        inputPath: '/tmp/input.docx',
        outputPath: '/tmp/output.pdf'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('PDF generation failed');

      // Verify cleanup was called for intermediate files
      expect(tempFiles.cleanupTempFiles).toHaveBeenCalledWith([
        '/tmp/intermediate-123.html',
        '/tmp/styled-456.html'
      ]);
    });

    it('should handle timeout errors', async () => {
      vi.spyOn(fs, 'readFile').mockResolvedValue(Buffer.from('mock docx content'));

      const mammoth = await import('mammoth');
      // Simulate a long-running operation
      vi.mocked(mammoth.convertToHtml).mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              value: '<p>Test content</p>',
              messages: []
            });
          }, 150000); // 150 seconds, exceeds default timeout
        });
      });

      vi.mocked(tempFiles.cleanupTempFiles).mockResolvedValue(undefined);

      const result = await convertWordToPdf({
        inputPath: '/tmp/input.docx',
        outputPath: '/tmp/output.pdf',
        timeout: 1000 // 1 second timeout for test
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Conversion timeout exceeded');
    });

    it('should clean up intermediate files on error', async () => {
      vi.spyOn(fs, 'readFile').mockResolvedValue(Buffer.from('mock docx content'));

      const mammoth = await import('mammoth');
      vi.mocked(mammoth.convertToHtml).mockResolvedValue({
        value: '<p>Test content</p>',
        messages: []
      });

      vi.mocked(tempFiles.createTempFile).mockResolvedValueOnce({
        path: '/tmp/intermediate-123.html',
        cleanup: vi.fn().mockResolvedValue(undefined)
      });

      // Simulate error during styled HTML creation
      vi.mocked(tempFiles.createTempFile).mockRejectedValueOnce(
        new Error('Failed to create temp file')
      );

      vi.mocked(tempFiles.cleanupTempFiles).mockResolvedValue(undefined);

      const result = await convertWordToPdf({
        inputPath: '/tmp/input.docx',
        outputPath: '/tmp/output.pdf'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create temp file');

      // Verify cleanup was called with the one file that was created
      expect(tempFiles.cleanupTempFiles).toHaveBeenCalledWith([
        '/tmp/intermediate-123.html'
      ]);
    });

    it('should use default timeout of 120 seconds', async () => {
      vi.spyOn(fs, 'readFile').mockResolvedValue(Buffer.from('mock docx content'));
      vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      const mammoth = await import('mammoth');
      vi.mocked(mammoth.convertToHtml).mockResolvedValue({
        value: '<p>Test content</p>',
        messages: []
      });

      const htmlPdf = await import('html-pdf-node');
      vi.mocked(htmlPdf.generatePdf).mockResolvedValue(Buffer.from('mock pdf content'));

      vi.mocked(tempFiles.createTempFile).mockResolvedValueOnce({
        path: '/tmp/intermediate-123.html',
        cleanup: vi.fn().mockResolvedValue(undefined)
      }).mockResolvedValueOnce({
        path: '/tmp/styled-456.html',
        cleanup: vi.fn().mockResolvedValue(undefined)
      });

      vi.mocked(tempFiles.cleanupTempFiles).mockResolvedValue(undefined);

      // Call without timeout parameter
      const result = await convertWordToPdf({
        inputPath: '/tmp/input.docx',
        outputPath: '/tmp/output.pdf'
      });

      expect(result.success).toBe(true);
    });

    it('should handle file read errors', async () => {
      vi.spyOn(fs, 'readFile').mockRejectedValue(new Error('File not found'));

      vi.mocked(tempFiles.cleanupTempFiles).mockResolvedValue(undefined);

      const result = await convertWordToPdf({
        inputPath: '/tmp/nonexistent.docx',
        outputPath: '/tmp/output.pdf'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('File not found');
    });

    it('should handle file write errors', async () => {
      vi.spyOn(fs, 'readFile').mockResolvedValue(Buffer.from('mock docx content'));
      vi.spyOn(fs, 'writeFile').mockRejectedValue(new Error('Permission denied'));

      const mammoth = await import('mammoth');
      vi.mocked(mammoth.convertToHtml).mockResolvedValue({
        value: '<p>Test content</p>',
        messages: []
      });

      const htmlPdf = await import('html-pdf-node');
      vi.mocked(htmlPdf.generatePdf).mockResolvedValue(Buffer.from('mock pdf content'));

      vi.mocked(tempFiles.createTempFile).mockResolvedValueOnce({
        path: '/tmp/intermediate-123.html',
        cleanup: vi.fn().mockResolvedValue(undefined)
      }).mockResolvedValueOnce({
        path: '/tmp/styled-456.html',
        cleanup: vi.fn().mockResolvedValue(undefined)
      });

      vi.mocked(tempFiles.cleanupTempFiles).mockResolvedValue(undefined);

      const result = await convertWordToPdf({
        inputPath: '/tmp/input.docx',
        outputPath: '/tmp/output.pdf'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');

      // Verify cleanup was called
      expect(tempFiles.cleanupTempFiles).toHaveBeenCalled();
    });
  });
});
