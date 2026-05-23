import { PDFDocument } from 'pdf-lib';

/**
 * Options for merging multiple PDF files
 */
export interface MergePdfOptions {
  /** Array of PDF buffers to merge (in order) */
  pdfBuffers: {
    buffer: Buffer;
    originalName: string;
  }[];
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Result of PDF merge operation
 */
export interface MergePdfResult {
  success: boolean;
  pdfBuffer?: Buffer;
  totalPages?: number;
  error?: string;
}

/**
 * Merge multiple PDF documents into a single PDF
 * 
 * Uses pdf-lib to load each PDF, copy all pages, and combine them
 * into a new PDF document in the specified order.
 * 
 * @param options - Merge options including PDF buffers
 * @returns Promise resolving to merge result with combined PDF buffer
 * 
 * @example
 * ```typescript
 * const result = await mergePdfs({
 *   pdfBuffers: [
 *     { buffer: pdf1Buffer, originalName: 'doc1.pdf' },
 *     { buffer: pdf2Buffer, originalName: 'doc2.pdf' },
 *   ],
 * });
 * ```
 */
export async function mergePdfs(options: MergePdfOptions): Promise<MergePdfResult> {
  const { pdfBuffers, timeout = 120000 } = options;

  if (!pdfBuffers || pdfBuffers.length === 0) {
    return { success: false, error: 'No PDF files provided' };
  }

  if (pdfBuffers.length < 2) {
    return { success: false, error: 'At least 2 PDF files are required for merging' };
  }

  // Create a timeout promise
  const timeoutPromise = new Promise<MergePdfResult>((_, reject) => {
    setTimeout(() => reject(new Error('Merge operation timed out')), timeout);
  });

  const mergePromise = (async (): Promise<MergePdfResult> => {
    try {
      const mergedPdf = await PDFDocument.create();
      let totalPages = 0;

      for (let i = 0; i < pdfBuffers.length; i++) {
        const { buffer, originalName } = pdfBuffers[i];

        try {
          const sourcePdf = await PDFDocument.load(buffer, { 
            ignoreEncryption: true 
          });

          const pageCount = sourcePdf.getPageCount();
          const pageIndices = Array.from({ length: pageCount }, (_, idx) => idx);

          const copiedPages = await mergedPdf.copyPages(sourcePdf, pageIndices);

          copiedPages.forEach((page) => {
            mergedPdf.addPage(page);
          });

          totalPages += pageCount;

          console.log(`[INFO] Merged PDF ${i + 1}/${pdfBuffers.length}: ${originalName} (${pageCount} pages)`);
        } catch (loadError) {
          const errorMsg = loadError instanceof Error ? loadError.message : 'Unknown error';
          console.error(`[ERROR] Failed to load PDF ${originalName}:`, errorMsg);
          return {
            success: false,
            error: `Failed to load PDF "${originalName}": ${errorMsg}. Please ensure it is a valid PDF file.`,
          };
        }
      }

      const pdfBytes = await mergedPdf.save();
      const pdfBuffer = Buffer.from(pdfBytes);

      console.log(`[INFO] PDF merge completed: ${pdfBuffers.length} files → ${totalPages} pages, ${pdfBuffer.length} bytes`);

      return {
        success: true,
        pdfBuffer,
        totalPages,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during PDF merge';
      console.error('[ERROR] PDF merge failed:', errorMessage);
      return { success: false, error: errorMessage };
    }
  })();

  try {
    return await Promise.race([mergePromise, timeoutPromise]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Merge operation timed out';
    return { success: false, error: errorMessage };
  }
}
