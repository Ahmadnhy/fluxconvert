import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

/**
 * Page orientation options
 */
export type PageOrientation = 'portrait' | 'landscape';

/**
 * Page size options
 */
export type PageSizeMode = 'a4' | 'fit';

/**
 * Margin options
 */
export type MarginOption = 'none' | 'small' | 'big';

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
  /** Page orientation: 'portrait' or 'landscape' */
  orientation?: PageOrientation;
  /** Output PDF page size mode: 'fit' keeps original image dimensions, 'a4' fits to A4 */
  pageSize?: PageSizeMode;
  /** Margin option: 'none', 'small', or 'big' */
  margin?: MarginOption;
  /** Whether to merge all images into a single PDF file */
  mergeAll?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Result of JPG/PNG to PDF conversion
 */
export interface JpgToPdfResult {
  success: boolean;
  /** Single merged PDF buffer (when mergeAll is true or single image) */
  pdfBuffer?: Buffer;
  /** Multiple PDF buffers (when mergeAll is false and multiple images) */
  pdfBuffers?: { buffer: Buffer; fileName: string }[];
  pageCount?: number;
  error?: string;
}

// A4 dimensions in points (72 points per inch)
const A4_WIDTH_PT = 595.28;   // 210mm
const A4_HEIGHT_PT = 841.89;  // 297mm

/**
 * Get margin value in points based on option
 */
function getMarginPoints(option: MarginOption): number {
  switch (option) {
    case 'none':
      return 0;
    case 'small':
      return 36;  // 0.5 inch = ~12.7mm
    case 'big':
      return 72;  // 1 inch = ~25.4mm
    default:
      return 0;
  }
}

/**
 * Get page dimensions based on orientation
 */
function getPageDimensions(orientation: PageOrientation): { width: number; height: number } {
  if (orientation === 'landscape') {
    return { width: A4_HEIGHT_PT, height: A4_WIDTH_PT };
  }
  return { width: A4_WIDTH_PT, height: A4_HEIGHT_PT };
}

/**
 * Embed a single image into a PDF document page
 */
async function embedImageToPage(
  pdfDoc: PDFDocument,
  imageData: { buffer: Buffer; originalName: string; mimeType: string },
  options: {
    orientation: PageOrientation;
    pageSize: PageSizeMode;
    margin: MarginOption;
  }
): Promise<void> {
  const { buffer, mimeType } = imageData;
  const { orientation, pageSize, margin } = options;

  // Get image metadata using sharp
  const metadata = await sharp(buffer).metadata();
  const imgWidth = metadata.width || 800;
  const imgHeight = metadata.height || 600;

  // Process image - keep quality high for accurate conversion
  let processedBuffer: Buffer;
  let embedImage: Awaited<ReturnType<typeof pdfDoc.embedJpg>>;

  if (mimeType === 'image/png') {
    // Embed PNG directly for lossless quality
    processedBuffer = await sharp(buffer)
      .png({ quality: 100 })
      .toBuffer();
    embedImage = await pdfDoc.embedPng(processedBuffer);
  } else {
    // Optimize JPEG with high quality for accuracy
    processedBuffer = await sharp(buffer)
      .jpeg({ quality: 95, mozjpeg: true })
      .toBuffer();
    embedImage = await pdfDoc.embedJpg(processedBuffer);
  }

  // Calculate page dimensions and image placement
  let pageWidth: number;
  let pageHeight: number;
  let drawX: number;
  let drawY: number;
  let drawWidth: number;
  let drawHeight: number;

  if (pageSize === 'a4') {
    const dims = getPageDimensions(orientation);
    pageWidth = dims.width;
    pageHeight = dims.height;
    const marginPt = getMarginPoints(margin);

    // Calculate available space after margins
    const availableWidth = pageWidth - 2 * marginPt;
    const availableHeight = pageHeight - 2 * marginPt;

    if (availableWidth <= 0 || availableHeight <= 0) {
      // Fallback: no margin if the margin is too large
      const fallbackW = pageWidth;
      const fallbackH = pageHeight;
      const scaleX = fallbackW / imgWidth;
      const scaleY = fallbackH / imgHeight;
      const scale = Math.min(scaleX, scaleY);
      drawWidth = imgWidth * scale;
      drawHeight = imgHeight * scale;
      drawX = (pageWidth - drawWidth) / 2;
      drawY = (pageHeight - drawHeight) / 2;
    } else {
      // Scale image to fit available area, maintaining aspect ratio
      const scaleX = availableWidth / imgWidth;
      const scaleY = availableHeight / imgHeight;
      const scale = Math.min(scaleX, scaleY);

      drawWidth = imgWidth * scale;
      drawHeight = imgHeight * scale;

      // Center the image within the available area
      drawX = marginPt + (availableWidth - drawWidth) / 2;
      drawY = marginPt + (availableHeight - drawHeight) / 2;
    }
  } else {
    // 'fit' mode: page size matches image size (no margins needed)
    // In fit mode, orientation and margin are ignored — image fills the page exactly
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
}

/**
 * Convert one or more JPG/PNG images to PDF document(s)
 *
 * Supports:
 * - Page orientation (portrait / landscape)
 * - Page size (A4 / fit-to-image)
 * - Margins (none / small / big)
 * - Merge all images into one PDF or create separate PDFs
 *
 * Images are optimized using sharp before embedding for accurate conversion.
 *
 * @param options - Conversion options including image buffers and settings
 * @returns Promise resolving to conversion result with PDF buffer(s)
 *
 * @example
 * ```typescript
 * const result = await convertJpgToPdf({
 *   images: [
 *     { buffer: imgBuffer1, originalName: 'photo1.jpg', mimeType: 'image/jpeg' },
 *     { buffer: imgBuffer2, originalName: 'photo2.png', mimeType: 'image/png' },
 *   ],
 *   orientation: 'portrait',
 *   pageSize: 'a4',
 *   margin: 'small',
 *   mergeAll: true,
 * });
 * ```
 */
export async function convertJpgToPdf(options: JpgToPdfOptions): Promise<JpgToPdfResult> {
  const {
    images,
    orientation = 'portrait',
    pageSize = 'a4',
    margin = 'none',
    mergeAll = true,
    timeout = 60000,
  } = options;

  if (!images || images.length === 0) {
    return { success: false, error: 'No images provided' };
  }

  // Create a timeout promise
  const timeoutPromise = new Promise<JpgToPdfResult>((_, reject) => {
    setTimeout(() => reject(new Error('Conversion timed out')), timeout);
  });

  const conversionPromise = (async (): Promise<JpgToPdfResult> => {
    try {
      const embedOptions = { orientation, pageSize, margin };

      if (mergeAll || images.length === 1) {
        // Merge all images into a single PDF
        const pdfDoc = await PDFDocument.create();

        for (let i = 0; i < images.length; i++) {
          await embedImageToPage(pdfDoc, images[i], embedOptions);
          console.log(
            `[INFO] Embedded image ${i + 1}/${images.length}: ${images[i].originalName}`
          );
        }

        const pdfBytes = await pdfDoc.save();
        const pdfBuffer = Buffer.from(pdfBytes);

        console.log(
          `[INFO] JPG to PDF conversion completed: ${images.length} images → ${pdfBuffer.length} bytes`
        );

        return {
          success: true,
          pdfBuffer,
          pageCount: images.length,
        };
      } else {
        // Create separate PDF for each image
        const pdfBuffers: { buffer: Buffer; fileName: string }[] = [];

        for (let i = 0; i < images.length; i++) {
          const pdfDoc = await PDFDocument.create();
          await embedImageToPage(pdfDoc, images[i], embedOptions);

          const pdfBytes = await pdfDoc.save();
          const pdfBuffer = Buffer.from(pdfBytes);
          const fileName = images[i].originalName.replace(/\.(jpg|jpeg|png)$/i, '.pdf');

          pdfBuffers.push({ buffer: pdfBuffer, fileName });

          console.log(
            `[INFO] Created PDF ${i + 1}/${images.length}: ${fileName} (${pdfBuffer.length} bytes)`
          );
        }

        return {
          success: true,
          pdfBuffers,
          pageCount: images.length,
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during JPG to PDF conversion';
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
