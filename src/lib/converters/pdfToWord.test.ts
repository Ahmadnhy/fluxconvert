import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { convertPdfToWord } from './pdfToWord';
import * as structureDetector from './structureDetector';
import * as tempFiles from '../utils/tempFiles';

// Mock dependencies
vi.mock('pdf-parse');
vi.mock('docx');
vi.mock('./structureDetector');
vi.mock('../utils/tempFiles');

describe('PDF-to-Word Converter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('convertPdfToWord', () => {
    it('should successfully convert PDF to DOCX through multi-step pipeline', async () => {
      // Mock file system operations
      vi.spyOn(fs, 'readFile').mockResolvedValue(Buffer.from('mock pdf content'));
      vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      // Mock pdf-parse
      const pdfParse = (await import('pdf-parse')).default;
      vi.mocked(pdfParse).mockResolvedValue({
        numpages: 2,
        numrender: 2,
        info: {},
        metadata: null,
        text: 'Sample PDF text content\nWith multiple lines',
        version: '1.0'
      });

      // Mock structure detection
      vi.mocked(structureDetector.detectStructure).mockReturnValue([
        {
          type: 'heading',
          level: 1,
          content: 'Sample Heading',
          alignment: 'left'
        },
        {
          type: 'paragraph',
          content: 'Sample paragraph content',
          alignment: 'left'
        }
      ]);

      // Mock docx library
      const docx = await import('docx');
      const mockBuffer = Buffer.from('mock docx content');
      vi.mocked(docx.Packer.toBuffer).mockResolvedValue(mockBuffer);

      const result = await convertPdfToWord({
        inputPath: '/tmp/input.pdf',
        outputPath: '/tmp/output.docx',
        timeout: 120000
      });

      expect(result.success).toBe(true);
      expect(result.outputPath).toBe('/tmp/output.docx');
      expect(result.error).toBeUndefined();
      expect(result.detectedStructure).toEqual({
        headings: 1,
        paragraphs: 1,
        tables: 0
      });

      // Verify pdf-parse was called
      expect(pdfParse).toHaveBeenCalledWith(expect.any(Buffer));

      // Verify structure detection was called
      expect(structureDetector.detectStructure).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.any(String),
          pages: 2
        })
      );

      // Verify docx generation was called
      expect(docx.Packer.toBuffer).toHaveBeenCalled();

      // Verify file was written
      expect(fs.writeFile).toHaveBeenCalledWith('/tmp/output.docx', mockBuffer);
    });

    it('should handle PDF parsing errors', async () => {
      vi.spyOn(fs, 'readFile').mockResolvedValue(Buffer.from('mock pdf content'));

      const pdfParse = (await import('pdf-parse')).default;
      vi.mocked(pdfParse).mockRejectedValue(new Error('Invalid PDF format'));

      const result = await convertPdfToWord({
        inputPath: '/tmp/input.pdf',
        outputPath: '/tmp/output.docx'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid PDF format');
      expect(result.outputPath).toBeUndefined();
    });

    it('should handle structure detection errors', async () => {
      vi.spyOn(fs, 'readFile').mockResolvedValue(Buffer.from('mock pdf content'));

      const pdfParse = (await import('pdf-parse')).default;
      vi.mocked(pdfParse).mockResolvedValue({
        numpages: 1,
        numrender: 1,
        info: {},
        metadata: null,
        text: 'Sample text',
        version: '1.0'
      });

      vi.mocked(structureDetector.detectStructure).mockImplementation(() => {
        throw new Error('Structure detection failed');
      });

      const result = await convertPdfToWord({
        inputPath: '/tmp/input.pdf',
        outputPath: '/tmp/output.docx'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Structure detection failed');
    });

    it('should handle DOCX generation errors', async () => {
      vi.spyOn(fs, 'readFile').mockResolvedValue(Buffer.from('mock pdf content'));

      const pdfParse = (await import('pdf-parse')).default;
      vi.mocked(pdfParse).mockResolvedValue({
        numpages: 1,
        numrender: 1,
        info: {},
        metadata: null,
        text: 'Sample text',
        version: '1.0'
      });

      vi.mocked(structureDetector.detectStructure).mockReturnValue([
        {
          type: 'paragraph',
          content: 'Sample content',
          alignment: 'left'
        }
      ]);

      const docx = await import('docx');
      vi.mocked(docx.Packer.toBuffer).mockRejectedValue(new Error('DOCX generation failed'));

      const result = await convertPdfToWord({
        inputPath: '/tmp/input.pdf',
        outputPath: '/tmp/output.docx'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('DOCX generation failed');
    });

    it('should handle timeout errors', async () => {
      vi.spyOn(fs, 'readFile').mockResolvedValue(Buffer.from('mock pdf content'));

      const pdfParse = (await import('pdf-parse')).default;
      // Simulate a long-running operation
      vi.mocked(pdfParse).mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              numpages: 1,
              numrender: 1,
              info: {},
              metadata: null,
              text: 'Sample text',
              version: '1.0'
            });
          }, 150000); // 150 seconds, exceeds default timeout
        });
      });

      const result = await convertPdfToWord({
        inputPath: '/tmp/input.pdf',
        outputPath: '/tmp/output.docx',
        timeout: 1000 // 1 second timeout for test
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Conversion timeout exceeded');
    });

    it('should use default timeout of 120 seconds', async () => {
      vi.spyOn(fs, 'readFile').mockResolvedValue(Buffer.from('mock pdf content'));
      vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      const pdfParse = (await import('pdf-parse')).default;
      vi.mocked(pdfParse).mockResolvedValue({
        numpages: 1,
        numrender: 1,
        info: {},
        metadata: null,
        text: 'Sample text',
        version: '1.0'
      });

      vi.mocked(structureDetector.detectStructure).mockReturnValue([
        {
          type: 'paragraph',
          content: 'Sample content',
          alignment: 'left'
        }
      ]);

      const docx = await import('docx');
      vi.mocked(docx.Packer.toBuffer).mockResolvedValue(Buffer.from('mock docx'));

      // Call without timeout parameter
      const result = await convertPdfToWord({
        inputPath: '/tmp/input.pdf',
        outputPath: '/tmp/output.docx'
      });

      expect(result.success).toBe(true);
    });

    it('should handle file read errors', async () => {
      vi.spyOn(fs, 'readFile').mockRejectedValue(new Error('File not found'));

      const result = await convertPdfToWord({
        inputPath: '/tmp/nonexistent.pdf',
        outputPath: '/tmp/output.docx'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('File not found');
    });

    it('should handle file write errors', async () => {
      vi.spyOn(fs, 'readFile').mockResolvedValue(Buffer.from('mock pdf content'));
      vi.spyOn(fs, 'writeFile').mockRejectedValue(new Error('Permission denied'));

      const pdfParse = (await import('pdf-parse')).default;
      vi.mocked(pdfParse).mockResolvedValue({
        numpages: 1,
        numrender: 1,
        info: {},
        metadata: null,
        text: 'Sample text',
        version: '1.0'
      });

      vi.mocked(structureDetector.detectStructure).mockReturnValue([
        {
          type: 'paragraph',
          content: 'Sample content',
          alignment: 'left'
        }
      ]);

      const docx = await import('docx');
      vi.mocked(docx.Packer.toBuffer).mockResolvedValue(Buffer.from('mock docx'));

      const result = await convertPdfToWord({
        inputPath: '/tmp/input.pdf',
        outputPath: '/tmp/output.docx'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
    });

    it('should correctly count detected structure types', async () => {
      vi.spyOn(fs, 'readFile').mockResolvedValue(Buffer.from('mock pdf content'));
      vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      const pdfParse = (await import('pdf-parse')).default;
      vi.mocked(pdfParse).mockResolvedValue({
        numpages: 3,
        numrender: 3,
        info: {},
        metadata: null,
        text: 'Multi-page document',
        version: '1.0'
      });

      // Mock multiple structure types
      vi.mocked(structureDetector.detectStructure).mockReturnValue([
        { type: 'heading', level: 1, content: 'Heading 1', alignment: 'left' },
        { type: 'heading', level: 2, content: 'Heading 2', alignment: 'left' },
        { type: 'paragraph', content: 'Paragraph 1', alignment: 'left' },
        { type: 'paragraph', content: 'Paragraph 2', alignment: 'justify' },
        { type: 'paragraph', content: 'Paragraph 3', alignment: 'center' },
        { type: 'table', content: 'Table data', alignment: 'left' }
      ]);

      const docx = await import('docx');
      vi.mocked(docx.Packer.toBuffer).mockResolvedValue(Buffer.from('mock docx'));

      const result = await convertPdfToWord({
        inputPath: '/tmp/input.pdf',
        outputPath: '/tmp/output.docx'
      });

      expect(result.success).toBe(true);
      expect(result.detectedStructure).toEqual({
        headings: 2,
        paragraphs: 3,
        tables: 1
      });
    });

    it('should handle empty PDF documents', async () => {
      vi.spyOn(fs, 'readFile').mockResolvedValue(Buffer.from('mock pdf content'));
      vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      const pdfParse = (await import('pdf-parse')).default;
      vi.mocked(pdfParse).mockResolvedValue({
        numpages: 1,
        numrender: 1,
        info: {},
        metadata: null,
        text: '',
        version: '1.0'
      });

      // Empty structure
      vi.mocked(structureDetector.detectStructure).mockReturnValue([]);

      const docx = await import('docx');
      vi.mocked(docx.Packer.toBuffer).mockResolvedValue(Buffer.from('mock docx'));

      const result = await convertPdfToWord({
        inputPath: '/tmp/empty.pdf',
        outputPath: '/tmp/output.docx'
      });

      expect(result.success).toBe(true);
      expect(result.detectedStructure).toEqual({
        headings: 0,
        paragraphs: 0,
        tables: 0
      });
    });

    it('should handle advanced positioning option', async () => {
      vi.spyOn(fs, 'readFile').mockResolvedValue(Buffer.from('mock pdf content'));
      vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      const pdfParse = (await import('pdf-parse')).default;
      vi.mocked(pdfParse).mockResolvedValue({
        numpages: 1,
        numrender: 1,
        info: {},
        metadata: null,
        text: 'Sample text',
        version: '1.0'
      });

      vi.mocked(structureDetector.detectStructure).mockReturnValue([
        {
          type: 'paragraph',
          content: 'Sample content',
          alignment: 'left'
        }
      ]);

      const docx = await import('docx');
      vi.mocked(docx.Packer.toBuffer).mockResolvedValue(Buffer.from('mock docx'));

      const result = await convertPdfToWord({
        inputPath: '/tmp/input.pdf',
        outputPath: '/tmp/output.docx',
        useAdvancedPositioning: true
      });

      expect(result.success).toBe(true);
      // Advanced positioning is not yet implemented, but should not cause errors
    });

    it('should handle various heading levels', async () => {
      vi.spyOn(fs, 'readFile').mockResolvedValue(Buffer.from('mock pdf content'));
      vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      const pdfParse = (await import('pdf-parse')).default;
      vi.mocked(pdfParse).mockResolvedValue({
        numpages: 1,
        numrender: 1,
        info: {},
        metadata: null,
        text: 'Document with headings',
        version: '1.0'
      });

      // Test all heading levels
      vi.mocked(structureDetector.detectStructure).mockReturnValue([
        { type: 'heading', level: 1, content: 'H1', alignment: 'left' },
        { type: 'heading', level: 2, content: 'H2', alignment: 'left' },
        { type: 'heading', level: 3, content: 'H3', alignment: 'left' },
        { type: 'heading', level: 4, content: 'H4', alignment: 'left' },
        { type: 'heading', level: 5, content: 'H5', alignment: 'left' },
        { type: 'heading', level: 6, content: 'H6', alignment: 'left' }
      ]);

      const docx = await import('docx');
      vi.mocked(docx.Packer.toBuffer).mockResolvedValue(Buffer.from('mock docx'));

      const result = await convertPdfToWord({
        inputPath: '/tmp/input.pdf',
        outputPath: '/tmp/output.docx'
      });

      expect(result.success).toBe(true);
      expect(result.detectedStructure?.headings).toBe(6);
    });

    it('should handle various text alignments', async () => {
      vi.spyOn(fs, 'readFile').mockResolvedValue(Buffer.from('mock pdf content'));
      vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      const pdfParse = (await import('pdf-parse')).default;
      vi.mocked(pdfParse).mockResolvedValue({
        numpages: 1,
        numrender: 1,
        info: {},
        metadata: null,
        text: 'Document with alignments',
        version: '1.0'
      });

      // Test all alignment types
      vi.mocked(structureDetector.detectStructure).mockReturnValue([
        { type: 'paragraph', content: 'Left aligned', alignment: 'left' },
        { type: 'paragraph', content: 'Center aligned', alignment: 'center' },
        { type: 'paragraph', content: 'Right aligned', alignment: 'right' },
        { type: 'paragraph', content: 'Justified', alignment: 'justify' }
      ]);

      const docx = await import('docx');
      vi.mocked(docx.Packer.toBuffer).mockResolvedValue(Buffer.from('mock docx'));

      const result = await convertPdfToWord({
        inputPath: '/tmp/input.pdf',
        outputPath: '/tmp/output.docx'
      });

      expect(result.success).toBe(true);
      expect(result.detectedStructure?.paragraphs).toBe(4);
    });

    it('should handle elements with formatting', async () => {
      vi.spyOn(fs, 'readFile').mockResolvedValue(Buffer.from('mock pdf content'));
      vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      const pdfParse = (await import('pdf-parse')).default;
      vi.mocked(pdfParse).mockResolvedValue({
        numpages: 1,
        numrender: 1,
        info: {},
        metadata: null,
        text: 'Formatted text',
        version: '1.0'
      });

      // Test formatting options
      vi.mocked(structureDetector.detectStructure).mockReturnValue([
        {
          type: 'paragraph',
          content: 'Bold text',
          alignment: 'left',
          formatting: { bold: true }
        },
        {
          type: 'paragraph',
          content: 'Italic text',
          alignment: 'left',
          formatting: { italic: true }
        },
        {
          type: 'paragraph',
          content: 'Sized text',
          alignment: 'left',
          formatting: { fontSize: 14 }
        }
      ]);

      const docx = await import('docx');
      vi.mocked(docx.Packer.toBuffer).mockResolvedValue(Buffer.from('mock docx'));

      const result = await convertPdfToWord({
        inputPath: '/tmp/input.pdf',
        outputPath: '/tmp/output.docx'
      });

      expect(result.success).toBe(true);
      expect(result.detectedStructure?.paragraphs).toBe(3);
    });
  });
});
