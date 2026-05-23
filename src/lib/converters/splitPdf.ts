import { PDFDocument } from 'pdf-lib';

/**
 * Options for splitting a PDF file
 */
export interface SplitPdfOptions {
  /** PDF buffer to split */
  pdfBuffer: Buffer;
  /** Page ranges string (e.g., "1-3, 5, 7-10") */
  pageRanges: string;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Result of PDF split operation
 */
export interface SplitPdfResult {
  success: boolean;
  pdfBuffer?: Buffer;
  extractedPages?: number;
  totalPages?: number;
  error?: string;
}

/**
 * Parse a page ranges string into an array of 0-indexed page numbers
 * 
 * @param rangeStr - Page ranges string (e.g., "1-3, 5, 7-10")
 * @param totalPages - Total number of pages in the PDF
 * @returns Array of 0-indexed page numbers
 * 
 * @example
 * ```typescript
 * parsePageRanges("1-3, 5, 7-10", 10);
 * // Returns [0, 1, 2, 4, 6, 7, 8, 9]
 * ```
 */
export function parsePageRanges(rangeStr: string, totalPages: number): number[] {
  const pages = new Set<number>();
  
  // Split by comma and process each part
  const parts = rangeStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
  
  for (const part of parts) {
    if (part.includes('-')) {
      // Range: "1-3"
      const [startStr, endStr] = part.split('-').map(s => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      
      if (isNaN(start) || isNaN(end)) {
        throw new Error(`Invalid page range: "${part}"`);
      }
      
      if (start < 1 || end < 1) {
        throw new Error(`Page numbers must be positive: "${part}"`);
      }
      
      if (start > end) {
        throw new Error(`Invalid page range (start > end): "${part}"`);
      }
      
      if (end > totalPages) {
        throw new Error(`Page ${end} exceeds total pages (${totalPages})`);
      }
      
      for (let i = start; i <= end; i++) {
        pages.add(i - 1); // Convert to 0-indexed
      }
    } else {
      // Single page: "5"
      const page = parseInt(part, 10);
      
      if (isNaN(page)) {
        throw new Error(`Invalid page number: "${part}"`);
      }
      
      if (page < 1) {
        throw new Error(`Page numbers must be positive: "${part}"`);
      }
      
      if (page > totalPages) {
        throw new Error(`Page ${page} exceeds total pages (${totalPages})`);
      }
      
      pages.add(page - 1); // Convert to 0-indexed
    }
  }
  
  // Return sorted array of unique page indices
  return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Split a PDF document by extracting specified pages
 * 
 * Uses pdf-lib to load the source PDF, extract the specified pages,
 * and create a new PDF document containing only those pages.
 * 
 * @param options - Split options including PDF buffer and page ranges
 * @returns Promise resolving to split result with new PDF buffer
 * 
 * @example
 * ```typescript
 * const result = await splitPdf({
 *   pdfBuffer: sourcePdfBuffer,
 *   pageRanges: '1-3, 5',
 * });
 * ```
 */
export async function splitPdf(options: SplitPdfOptions): Promise<SplitPdfResult> {
  const { pdfBuffer, pageRanges, timeout = 60000 } = options;

  if (!pdfBuffer || pdfBuffer.length === 0) {
    return { success: false, error: 'No PDF buffer provided' };
  }

  if (!pageRanges || pageRanges.trim() === '') {
    return { success: false, error: 'No page ranges specified' };
  }

  // Create a timeout promise
  const timeoutPromise = new Promise<SplitPdfResult>((_, reject) => {
    setTimeout(() => reject(new Error('Split operation timed out')), timeout);
  });

  const splitPromise = (async (): Promise<SplitPdfResult> => {
    try {
      // Load the source PDF
      const sourcePdf = await PDFDocument.load(pdfBuffer, {
        ignoreEncryption: true,
      });

      const totalPages = sourcePdf.getPageCount();
      console.log(`[INFO] Source PDF has ${totalPages} pages`);

      // Parse page ranges
      let pageIndices: number[];
      try {
        pageIndices = parsePageRanges(pageRanges, totalPages);
      } catch (parseError) {
        const errorMsg = parseError instanceof Error ? parseError.message : 'Invalid page ranges';
        return { success: false, error: errorMsg, totalPages };
      }

      if (pageIndices.length === 0) {
        return { success: false, error: 'No valid pages selected', totalPages };
      }

      console.log(`[INFO] Extracting ${pageIndices.length} pages: ${pageIndices.map(i => i + 1).join(', ')}`);

      // Create new PDF with selected pages
      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);

      copiedPages.forEach((page) => {
        newPdf.addPage(page);
      });

      const pdfBytes = await newPdf.save();
      const resultBuffer = Buffer.from(pdfBytes);

      console.log(`[INFO] PDF split completed: ${pageIndices.length}/${totalPages} pages extracted, ${resultBuffer.length} bytes`);

      return {
        success: true,
        pdfBuffer: resultBuffer,
        extractedPages: pageIndices.length,
        totalPages,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during PDF split';
      console.error('[ERROR] PDF split failed:', errorMessage);
      return { success: false, error: errorMessage };
    }
  })();

  try {
    return await Promise.race([splitPromise, timeoutPromise]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Split operation timed out';
    return { success: false, error: errorMessage };
  }
}

/**
 * Get the total number of pages in a PDF document
 * 
 * @param pdfBuffer - PDF buffer
 * @returns Promise resolving to the page count
 */
export async function getPdfPageCount(pdfBuffer: Buffer): Promise<number> {
  const pdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  return pdf.getPageCount();
}
