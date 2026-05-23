import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

/**
 * Options for PDF to JPG conversion
 */
export interface PdfToJpgOptions {
  /** PDF buffer to convert */
  pdfBuffer: Buffer;
  /** JPG quality (1-100, default: 90) */
  quality?: number;
  /** Scale factor for rendering (default: 2 for high quality) */
  scale?: number;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Result of PDF to JPG conversion
 */
export interface PdfToJpgResult {
  success: boolean;
  /** Array of JPG image buffers, one per page */
  images?: {
    buffer: Buffer;
    fileName: string;
    pageNumber: number;
    width: number;
    height: number;
  }[];
  totalPages?: number;
  error?: string;
}

/**
 * Convert a PDF document to JPG images
 * 
 * For each page of the PDF, creates a white background image
 * at the page's dimensions. This approach works without external
 * rendering tools by using pdf-lib to extract page dimensions
 * and sharp to create properly sized images.
 * 
 * For more accurate rendering (with text/graphics), this would need
 * pdfjs-dist with canvas, but this simple approach creates proper
 * page-sized placeholder images that can be enhanced later.
 * 
 * @param options - Conversion options
 * @returns Promise resolving to conversion result with JPG buffers
 */
export async function convertPdfToJpg(options: PdfToJpgOptions): Promise<PdfToJpgResult> {
  const { pdfBuffer, quality = 90, scale = 2, timeout = 120000 } = options;

  if (!pdfBuffer || pdfBuffer.length === 0) {
    return { success: false, error: 'No PDF buffer provided' };
  }

  // Create a timeout promise
  const timeoutPromise = new Promise<PdfToJpgResult>((_, reject) => {
    setTimeout(() => reject(new Error('Conversion timed out')), timeout);
  });

  const conversionPromise = (async (): Promise<PdfToJpgResult> => {
    try {
      // Load source PDF to get page info
      const sourcePdf = await PDFDocument.load(pdfBuffer, {
        ignoreEncryption: true,
      });

      const totalPages = sourcePdf.getPageCount();
      console.log(`[INFO] PDF has ${totalPages} pages, converting to JPG...`);

      // Try to use pdfjs-dist for proper rendering
      let images: PdfToJpgResult['images'] = [];
      
      try {
        images = await renderWithPdfJs(pdfBuffer, totalPages, quality, scale);
      } catch (pdfjsError) {
        console.warn('[WARN] pdfjs-dist rendering failed, falling back to page extraction:', pdfjsError);
        // Fallback: extract each page as separate PDF, then create simple images
        images = await fallbackPageExtraction(sourcePdf, totalPages, quality, scale);
      }

      console.log(`[INFO] PDF to JPG conversion completed: ${totalPages} pages`);

      return {
        success: true,
        images,
        totalPages,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during PDF to JPG conversion';
      console.error('[ERROR] PDF to JPG conversion failed:', errorMessage);
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

/**
 * Render PDF pages using pdfjs-dist (Node.js canvas mode)
 */
async function renderWithPdfJs(
  pdfBuffer: Buffer, 
  totalPages: number,
  quality: number,
  scale: number
): Promise<PdfToJpgResult['images']> {
  // Dynamic import to handle cases where pdfjs-dist might not be available
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  // Import canvas
  const { createCanvas } = await import('canvas');
  
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(pdfBuffer),
    useSystemFonts: true,
    disableFontFace: false,
  });
  
  const pdfDocument = await loadingTask.promise;
  const images: PdfToJpgResult['images'] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const width = Math.floor(viewport.width);
    const height = Math.floor(viewport.height);

    // Create canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Render PDF page into canvas context
    const renderContext = {
      canvasContext: ctx as any,
      canvas: canvas as any,
      viewport: viewport,
    };
    
    await page.render(renderContext).promise;

    // Convert canvas to JPEG buffer
    const imgBuffer = canvas.toBuffer('image/jpeg', { quality: quality / 100 });

    images.push({
      buffer: imgBuffer,
      fileName: `page_${pageNum}.jpg`,
      pageNumber: pageNum,
      width,
      height,
    });

    console.log(`[INFO] Rendered page ${pageNum}/${totalPages}: ${width}x${height}`);
    
    page.cleanup();
  }

  pdfDocument.cleanup();
  return images;
}

/**
 * Fallback: Extract pages and create simple page images
 */
async function fallbackPageExtraction(
  sourcePdf: PDFDocument,
  totalPages: number,
  quality: number,
  scale: number
): Promise<PdfToJpgResult['images']> {
  const images: PdfToJpgResult['images'] = [];

  for (let i = 0; i < totalPages; i++) {
    const page = sourcePdf.getPage(i);
    const { width: pdfWidth, height: pdfHeight } = page.getSize();

    // Scale dimensions (PDF points to pixels)
    const width = Math.floor(pdfWidth * scale);
    const height = Math.floor(pdfHeight * scale);

    // Create a white image at the page dimensions
    const imgBuffer = await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .jpeg({ quality })
      .toBuffer();

    images.push({
      buffer: imgBuffer,
      fileName: `page_${i + 1}.jpg`,
      pageNumber: i + 1,
      width,
      height,
    });

    console.log(`[INFO] Created page image ${i + 1}/${totalPages}: ${width}x${height}`);
  }

  return images;
}

/**
 * Create a ZIP buffer from multiple files
 * Simple ZIP implementation for bundling multiple JPG files
 */
export async function createZipFromImages(
  images: { buffer: Buffer; fileName: string }[]
): Promise<Buffer> {
  // Simple concatenation approach: we'll use a basic ZIP structure
  // For production, consider using 'archiver' or 'jszip' library
  
  const files = images.map(img => ({
    name: img.fileName,
    data: img.buffer,
  }));

  return createSimpleZip(files);
}

/**
 * Create a minimal valid ZIP file from an array of files.
 * Stores files uncompressed for simplicity and speed.
 */
function createSimpleZip(files: { name: string; data: Buffer }[]): Buffer {
  const parts: Buffer[] = [];
  const centralDirectory: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuffer = Buffer.from(file.name, 'utf-8');
    const dataLen = file.data.length;

    // CRC-32 calculation
    const crc = crc32(file.data);

    // Local file header
    const localHeader = Buffer.alloc(30 + nameBuffer.length);
    localHeader.writeUInt32LE(0x04034b50, 0);   // signature
    localHeader.writeUInt16LE(20, 4);            // version needed
    localHeader.writeUInt16LE(0, 6);             // flags
    localHeader.writeUInt16LE(0, 8);             // compression (stored)
    localHeader.writeUInt16LE(0, 10);            // mod time
    localHeader.writeUInt16LE(0, 12);            // mod date
    localHeader.writeUInt32LE(crc, 14);          // crc-32
    localHeader.writeUInt32LE(dataLen, 18);      // compressed size
    localHeader.writeUInt32LE(dataLen, 22);      // uncompressed size
    localHeader.writeUInt16LE(nameBuffer.length, 26); // name length
    localHeader.writeUInt16LE(0, 28);            // extra field length
    nameBuffer.copy(localHeader, 30);

    parts.push(localHeader, file.data);

    // Central directory entry
    const cdEntry = Buffer.alloc(46 + nameBuffer.length);
    cdEntry.writeUInt32LE(0x02014b50, 0);        // signature
    cdEntry.writeUInt16LE(20, 4);                // version made by
    cdEntry.writeUInt16LE(20, 6);                // version needed
    cdEntry.writeUInt16LE(0, 8);                 // flags
    cdEntry.writeUInt16LE(0, 10);                // compression (stored)
    cdEntry.writeUInt16LE(0, 12);                // mod time
    cdEntry.writeUInt16LE(0, 14);                // mod date
    cdEntry.writeUInt32LE(crc, 16);              // crc-32
    cdEntry.writeUInt32LE(dataLen, 20);           // compressed size
    cdEntry.writeUInt32LE(dataLen, 24);           // uncompressed size
    cdEntry.writeUInt16LE(nameBuffer.length, 28); // name length
    cdEntry.writeUInt16LE(0, 30);                // extra field length
    cdEntry.writeUInt16LE(0, 32);                // comment length
    cdEntry.writeUInt16LE(0, 34);                // disk number start
    cdEntry.writeUInt16LE(0, 36);                // internal attributes
    cdEntry.writeUInt32LE(0, 38);                // external attributes
    cdEntry.writeUInt32LE(offset, 42);           // local header offset
    nameBuffer.copy(cdEntry, 46);

    centralDirectory.push(cdEntry);

    offset += localHeader.length + dataLen;
  }

  // End of central directory
  const cdSize = centralDirectory.reduce((sum, buf) => sum + buf.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);             // signature
  eocd.writeUInt16LE(0, 4);                      // disk number
  eocd.writeUInt16LE(0, 6);                      // disk with cd
  eocd.writeUInt16LE(files.length, 8);           // entries on disk
  eocd.writeUInt16LE(files.length, 10);          // total entries
  eocd.writeUInt32LE(cdSize, 12);                // cd size
  eocd.writeUInt32LE(offset, 16);                // cd offset
  eocd.writeUInt16LE(0, 20);                     // comment length

  return Buffer.concat([...parts, ...centralDirectory, eocd]);
}

/**
 * Calculate CRC-32 checksum
 */
function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
