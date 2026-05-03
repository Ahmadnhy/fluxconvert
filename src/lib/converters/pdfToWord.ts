import { promises as fs } from 'fs';
import pdfParse from 'pdf-parse';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { detectStructure, DetectedElement, ParsedPdfData, ExtractedTextItem } from './structureDetector';
import { cleanupTempFiles } from '../utils/tempFiles';

/**
 * Options for PDF-to-Word conversion
 */
export interface PdfToWordConversionOptions {
  inputPath: string;
  outputPath: string;
  useAdvancedPositioning?: boolean; // Use pdfjs-dist for advanced positioning (not implemented yet)
  timeout?: number; // milliseconds, default 120000 (120 seconds)
}

/**
 * Result of PDF-to-Word conversion
 */
export interface PdfToWordConversionResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  detectedStructure?: {
    headings: number;
    paragraphs: number;
    tables: number;
  };
}

/**
 * Converts a PDF document to Word (.docx) using a multi-step pipeline:
 * 1. PDF → Extract Text (using pdf-parse)
 * 2. Auto Detect Structure (using structure detection utility)
 * 3. Generate DOCX (using docx library)
 * 
 * @param options - Conversion options including input/output paths and timeout
 * @returns Promise resolving to conversion result with success status and output path
 * 
 * @example
 * ```typescript
 * const result = await convertPdfToWord({
 *   inputPath: '/tmp/input.pdf',
 *   outputPath: '/tmp/output.docx',
 *   timeout: 120000
 * });
 * 
 * if (result.success) {
 *   console.log('DOCX generated at:', result.outputPath);
 *   console.log('Detected structure:', result.detectedStructure);
 * } else {
 *   console.error('Conversion failed:', result.error);
 * }
 * ```
 */
export async function convertPdfToWord(
  options: PdfToWordConversionOptions
): Promise<PdfToWordConversionResult> {
  const { inputPath, outputPath, useAdvancedPositioning = false, timeout = 120000 } = options;
  
  try {
    console.log('[INFO] PDF-to-Word conversion started');
    console.log(`[INFO] Input: ${inputPath}`);
    console.log(`[INFO] Output: ${outputPath}`);
    console.log(`[INFO] Timeout: ${timeout}ms`);
    console.log(`[INFO] Advanced positioning: ${useAdvancedPositioning}`);
    
    // Create AbortController for timeout mechanism
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, timeout);
    
    try {
      // Execute the conversion pipeline with timeout
      const result = await Promise.race([
        executePipeline(inputPath, outputPath, useAdvancedPositioning),
        new Promise<PdfToWordConversionResult>((_, reject) => {
          abortController.signal.addEventListener('abort', () => {
            reject(new Error('Conversion timeout exceeded'));
          });
        })
      ]);
      
      clearTimeout(timeoutId);
      return result;
      
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
    
  } catch (error) {
    console.error('[ERROR] PDF-to-Word conversion failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown conversion error'
    };
  }
}

/**
 * Executes the three-step conversion pipeline
 */
async function executePipeline(
  inputPath: string,
  outputPath: string,
  useAdvancedPositioning: boolean
): Promise<PdfToWordConversionResult> {
  
  // Step 1: PDF Text Extraction using pdf-parse
  console.log('[INFO] PDF-to-Word: Step 1 - PDF text extraction started');
  const step1Start = Date.now();
  
  const pdfBuffer = await fs.readFile(inputPath);
  const pdfData = await pdfParse(pdfBuffer);
  
  console.log(`[INFO] PDF parsed: ${pdfData.numpages} page(s), ${pdfData.text.length} characters`);
  
  // Extract text items with positioning data if available
  const parsedPdfData: ParsedPdfData = {
    text: pdfData.text,
    pages: pdfData.numpages,
    items: extractTextItems(pdfData)
  };
  
  const step1Duration = Date.now() - step1Start;
  console.log(`[INFO] PDF-to-Word: Step 1 completed in ${step1Duration}ms`);
  
  // Step 2: Structure Detection
  console.log('[INFO] PDF-to-Word: Step 2 - Structure detection started');
  const step2Start = Date.now();
  
  const detectedElements = detectStructure(parsedPdfData);
  
  const step2Duration = Date.now() - step2Start;
  console.log(`[INFO] PDF-to-Word: Step 2 completed in ${step2Duration}ms`);
  
  // Count detected structure types
  const headingCount = detectedElements.filter(e => e.type === 'heading').length;
  const paragraphCount = detectedElements.filter(e => e.type === 'paragraph').length;
  const tableCount = detectedElements.filter(e => e.type === 'table').length;
  
  console.log(`[INFO] Detected structure: ${headingCount} heading(s), ${paragraphCount} paragraph(s), ${tableCount} table(s)`);
  
  // Step 3: DOCX Generation using docx library
  console.log('[INFO] PDF-to-Word: Step 3 - DOCX generation started');
  const step3Start = Date.now();
  
  const docxBuffer = await generateDocx(detectedElements);
  
  // Write DOCX to output path
  await fs.writeFile(outputPath, docxBuffer);
  
  const step3Duration = Date.now() - step3Start;
  console.log(`[INFO] PDF-to-Word: Step 3 completed in ${step3Duration}ms`);
  console.log(`[INFO] DOCX file created: ${outputPath}`);
  
  const totalDuration = step1Duration + step2Duration + step3Duration;
  console.log(`[INFO] PDF-to-Word conversion completed successfully in ${totalDuration}ms`);
  
  return {
    success: true,
    outputPath,
    detectedStructure: {
      headings: headingCount,
      paragraphs: paragraphCount,
      tables: tableCount
    }
  };
}

/**
 * Extracts text items with positioning data from pdf-parse output
 * 
 * Note: pdf-parse doesn't provide detailed positioning data by default.
 * This function attempts to extract what's available from the internal structure.
 * For advanced positioning, pdfjs-dist would be needed (future enhancement).
 */
function extractTextItems(pdfData: any): ExtractedTextItem[] | undefined {
  // pdf-parse doesn't expose detailed text item positioning in its public API
  // The internal structure is not documented and may change
  // For now, we return undefined to fall back to plain text parsing
  
  // Future enhancement: Use pdfjs-dist for advanced text positioning
  // This would require additional implementation
  
  console.log('[INFO] Using basic text extraction (no positioning data available)');
  return undefined;
}

/**
 * Generates DOCX document from detected elements using docx library
 */
async function generateDocx(elements: DetectedElement[]): Promise<Buffer> {
  console.log(`[INFO] Generating DOCX from ${elements.length} detected element(s)`);
  
  // Convert detected elements to docx paragraphs
  const paragraphs: Paragraph[] = [];
  
  for (const element of elements) {
    if (element.type === 'heading') {
      // Create heading paragraph
      const headingLevel = mapHeadingLevel(element.level || 1);
      const alignment = mapAlignment(element.alignment);
      
      const textRuns: TextRun[] = [];
      
      // Apply formatting if available
      const textRun = new TextRun({
        text: element.content,
        bold: element.formatting?.bold,
        italics: element.formatting?.italic,
        size: element.formatting?.fontSize ? element.formatting.fontSize * 2 : undefined // docx uses half-points
      });
      
      textRuns.push(textRun);
      
      paragraphs.push(
        new Paragraph({
          text: element.content,
          heading: headingLevel,
          alignment: alignment
        })
      );
      
    } else if (element.type === 'paragraph') {
      // Create regular paragraph
      const alignment = mapAlignment(element.alignment);
      
      const textRun = new TextRun({
        text: element.content,
        bold: element.formatting?.bold,
        italics: element.formatting?.italic,
        size: element.formatting?.fontSize ? element.formatting.fontSize * 2 : undefined
      });
      
      paragraphs.push(
        new Paragraph({
          children: [textRun],
          alignment: alignment
        })
      );
      
    } else if (element.type === 'table') {
      // Table support is complex and would require parsing table structure
      // For now, treat tables as paragraphs
      // Future enhancement: Implement proper table generation
      
      console.log('[INFO] Table detected but rendered as paragraph (table support not yet implemented)');
      
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: element.content })],
          alignment: mapAlignment(element.alignment)
        })
      );
    }
  }
  
  // If no elements detected, create a single paragraph with a message
  if (paragraphs.length === 0) {
    console.log('[WARN] No elements detected, creating empty document');
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: 'No content could be extracted from the PDF.' })]
      })
    );
  }
  
  // Create the document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs
      }
    ]
  });
  
  // Generate buffer
  const buffer = await Packer.toBuffer(doc);
  
  console.log(`[INFO] DOCX generated successfully, size: ${buffer.length} bytes`);
  
  return buffer;
}

/**
 * Maps heading level (1-6) to docx HeadingLevel enum
 */
function mapHeadingLevel(level: number): typeof HeadingLevel[keyof typeof HeadingLevel] {
  switch (level) {
    case 1:
      return HeadingLevel.HEADING_1;
    case 2:
      return HeadingLevel.HEADING_2;
    case 3:
      return HeadingLevel.HEADING_3;
    case 4:
      return HeadingLevel.HEADING_4;
    case 5:
      return HeadingLevel.HEADING_5;
    case 6:
      return HeadingLevel.HEADING_6;
    default:
      return HeadingLevel.HEADING_1;
  }
}

/**
 * Maps text alignment to docx AlignmentType enum
 */
function mapAlignment(alignment?: 'left' | 'center' | 'right' | 'justify'): typeof AlignmentType[keyof typeof AlignmentType] {
  switch (alignment) {
    case 'center':
      return AlignmentType.CENTER;
    case 'right':
      return AlignmentType.RIGHT;
    case 'justify':
      return AlignmentType.JUSTIFIED;
    case 'left':
    default:
      return AlignmentType.LEFT;
  }
}
