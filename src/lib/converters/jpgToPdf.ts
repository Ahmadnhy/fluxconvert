import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

/**
 * Options for JPG/PNG to PDF conversion
 */
export interface JpgToPdfOptions {
  /** Array of image buffers to convert */
  images: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
  }[];
  /** Output PDF page size mode: 'fit' keeps original image dimensions, 'a4' fits to A4 */
  pageSize?: 'fit' | 'a4';
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Result of JPG/PNG to PDF conversion
 */
export interface JpgToPdfResult {
  success: boolean;
  pdfBuffer?: Buffer;
  pageCount?: number;
  error?: string;
}

// A4 dimensions in points (72 points per inch)
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const A4_MARGIN = 36; // 0.5 inch margin

/**
 * Convert one or more JPG/PNG images to a single PDF document
 * 
 * Each image becomes a single page in the PDF.
 * Images are optimized using sharp before embedding.
 * 
 * @param options - Conversion options including image buffers
 * @returns Promise resolving to conversion result with PDF buffer
 * 
 * @example
 * ```typescript
 * const result = await convertJpgToPdf({
 *   images: [
 *     { buffer: imgBuffer1, originalName: 'photo1.jpg', mimeType: 'image/jpeg' },
 *     { buffer: imgBuffer2, originalName: 'photo2.png', mimeType: 'image/png' },
 *   ],
 *   pageSize: 'a4',
 * });
 * ```
 */
export async function convertJpgToPdf(options: JpgToPdfOptions): Promise<JpgToPdfResult> {
  const { images, pageSize = 'fit', timeout = 60000 } = options;

  if (!images || images.length === 0) {
    return { success: false, error: 'No images provided' };
  }

  // Create a timeout promise
  const timeoutPromise = new Promise<JpgToPdfResult>((_, reject) => {
    setTimeout(() => reject(new Error('Conversion timed out')), timeout);
  });

  const conversionPromise = (async (): Promise<JpgToPdfResult> => {
    try {
      const pdfDoc = await PDFDocument.create();

      for (let i = 0; i < images.length; i++) {
        const { buffer, mimeType } = images[i];

        // Get image metadata using sharp
        const metadata = await sharp(buffer).metadata();
        const imgWidth = metadata.width || 800;
        const imgHeight = metadata.height || 600;

        // Convert to JPEG if PNG (for smaller PDF file size), or optimize JPEG
        let processedBuffer: Buffer;
        let embedImage: Awaited<ReturnType<typeof pdfDoc.embedJpg>>;

        if (mimeType === 'image/png') {
          // Embed PNG directly (pdf-lib supports PNG)
          processedBuffer = await sharp(buffer)
            .png({ quality: 90 })
            .toBuffer();
          embedImage = await pdfDoc.embedPng(processedBuffer);
        } else {
          // Optimize JPEG
          processedBuffer = await sharp(buffer)
            .jpeg({ quality: 90 })
            .toBuffer();
          embedImage = await pdfDoc.embedJpg(processedBuffer);
        }

        // Calculate page dimensions
        let pageWidth: number;
        let pageHeight: number;
        let drawX: number;
        let drawY: number;
        let drawWidth: number;
        let drawHeight: number;

        if (pageSize === 'a4') {
          pageWidth = A4_WIDTH;
          pageHeight = A4_HEIGHT;

          // Calculate scale to fit image within A4 with margins
          const availableWidth = A4_WIDTH - 2 * A4_MARGIN;
          const availableHeight = A4_HEIGHT - 2 * A4_MARGIN;

          const scaleX = availableWidth / imgWidth;
          const scaleY = availableHeight / imgHeight;
          const scale = Math.min(scaleX, scaleY, 1); // Don't scale up

          drawWidth = imgWidth * scale;
          drawHeight = imgHeight * scale;

          // Center the image on the page
          drawX = (pageWidth - drawWidth) / 2;
          drawY = (pageHeight - drawHeight) / 2;
        } else {
          // 'fit' mode: page size matches image size
          pageWidth = imgWidth;
          pageHeight = imgHeight;
          drawX = 0;
          drawY = 0;
          drawWidth = imgWidth;
          drawHeight = imgHeight;
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        page.drawImage(embedImage, {
          x: drawX,
          y: drawY,
          width: drawWidth,
          height: drawHeight,
        });

        console.log(`[INFO] Embedded image ${i + 1}/${images.length}: ${images[i].originalName} (${imgWidth}x${imgHeight})`);
      }

      const pdfBytes = await pdfDoc.save();
      const pdfBuffer = Buffer.from(pdfBytes);

      console.log(`[INFO] JPG to PDF conversion completed: ${images.length} images → ${pdfBuffer.length} bytes`);

      return {
        success: true,
        pdfBuffer,
        pageCount: images.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during JPG to PDF conversion';
      console.error('[ERROR] JPG to PDF conversion failed:', errorMessage);
      return { success: false, error: errorMessage };
    }
  })();

  try {
    return await Promise.race([conversionPromise, timeoutPromise]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Conversion timed out';
    return { success: false, error: errorMessage };
  }
}
