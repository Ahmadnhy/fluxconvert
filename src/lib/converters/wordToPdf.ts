import { promises as fs } from 'fs';
import mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import htmlPdf from 'html-pdf-node';
import { createTempFile, cleanupTempFiles } from '../utils/tempFiles';

/**
 * Options for Word-to-PDF conversion
 */
export interface WordToPdfConversionOptions {
  inputPath: string;
  outputPath: string;
  timeout?: number; // milliseconds, default 120000 (120 seconds)
}

/**
 * Result of Word-to-PDF conversion
 */
export interface WordToPdfConversionResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  intermediateFiles?: {
    htmlPath?: string;
    styledHtmlPath?: string;
  };
}

/**
 * Converts a Word document (.docx) to PDF using a multi-step pipeline:
 * 1. DOCX → HTML (using mammoth.js)
 * 2. HTML Structure Enhancement (using cheerio for auto-detection)
 * 3. HTML → PDF (using html-pdf-node)
 * 
 * @param options - Conversion options including input/output paths and timeout
 * @returns Promise resolving to conversion result with success status and output path
 * 
 * @example
 * ```typescript
 * const result = await convertWordToPdf({
 *   inputPath: '/tmp/input.docx',
 *   outputPath: '/tmp/output.pdf',
 *   timeout: 120000
 * });
 * 
 * if (result.success) {
 *   console.log('PDF generated at:', result.outputPath);
 * } else {
 *   console.error('Conversion failed:', result.error);
 * }
 * ```
 */
export async function convertWordToPdf(
  options: WordToPdfConversionOptions
): Promise<WordToPdfConversionResult> {
  const { inputPath, outputPath, timeout = 120000 } = options;
  
  const intermediateFiles: string[] = [];
  let htmlPath: string | undefined;
  let styledHtmlPath: string | undefined;
  
  try {
    console.log('[INFO] Word-to-PDF conversion started');
    console.log(`[INFO] Input: ${inputPath}`);
    console.log(`[INFO] Output: ${outputPath}`);
    console.log(`[INFO] Timeout: ${timeout}ms`);
    
    // Create AbortController for timeout mechanism
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, timeout);
    
    try {
      // Execute the conversion pipeline with timeout
      const result = await Promise.race([
        executePipeline(inputPath, outputPath, intermediateFiles),
        new Promise<WordToPdfConversionResult>((_, reject) => {
          abortController.signal.addEventListener('abort', () => {
            reject(new Error('Conversion timeout exceeded'));
          });
        })
      ]);
      
      clearTimeout(timeoutId);
      
      // Store intermediate file paths for response
      if (intermediateFiles.length >= 2) {
        htmlPath = intermediateFiles[0];
        styledHtmlPath = intermediateFiles[1];
      }
      
      return result;
      
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
    
  } catch (error) {
    console.error('[ERROR] Word-to-PDF conversion failed:', error);
    
    // Clean up intermediate files on error
    if (intermediateFiles.length > 0) {
      console.log(`[INFO] Cleaning up ${intermediateFiles.length} intermediate file(s) after error`);
      await cleanupTempFiles(intermediateFiles);
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown conversion error',
      intermediateFiles: {
        htmlPath,
        styledHtmlPath
      }
    };
  }
}

/**
 * Executes the three-step conversion pipeline
 */
async function executePipeline(
  inputPath: string,
  outputPath: string,
  intermediateFiles: string[]
): Promise<WordToPdfConversionResult> {
  
  // Step 1: DOCX → HTML using mammoth.js
  console.log('[INFO] Word-to-PDF: Step 1 - DOCX→HTML conversion started');
  const step1Start = Date.now();
  
  const docxBuffer = await fs.readFile(inputPath);
  const htmlResult = await mammoth.convertToHtml({ buffer: docxBuffer });
  const htmlContent = htmlResult.value;
  
  if (htmlResult.messages.length > 0) {
    console.log('[INFO] Mammoth conversion messages:', htmlResult.messages);
  }
  
  // Write HTML to temporary file
  const htmlTempFile = await createTempFile(
    Buffer.from(htmlContent, 'utf-8'),
    { prefix: 'intermediate', extension: 'html' }
  );
  intermediateFiles.push(htmlTempFile.path);
  
  const step1Duration = Date.now() - step1Start;
  console.log(`[INFO] Word-to-PDF: Step 1 completed in ${step1Duration}ms`);
  console.log(`[INFO] HTML file created: ${htmlTempFile.path}`);
  
  // Step 2: HTML Structure Enhancement using cheerio
  console.log('[INFO] Word-to-PDF: Step 2 - HTML structure enhancement started');
  const step2Start = Date.now();
  
  const styledHtml = enhanceHtmlStructure(htmlContent);
  
  // Write styled HTML to temporary file
  const styledHtmlTempFile = await createTempFile(
    Buffer.from(styledHtml, 'utf-8'),
    { prefix: 'styled', extension: 'html' }
  );
  intermediateFiles.push(styledHtmlTempFile.path);
  
  const step2Duration = Date.now() - step2Start;
  console.log(`[INFO] Word-to-PDF: Step 2 completed in ${step2Duration}ms`);
  console.log(`[INFO] Styled HTML file created: ${styledHtmlTempFile.path}`);
  
  // Step 3: HTML → PDF using html-pdf-node
  console.log('[INFO] Word-to-PDF: Step 3 - HTML→PDF conversion started');
  const step3Start = Date.now();
  
  const pdfBuffer = await generatePdf(styledHtml);
  
  // Write PDF to output path
  await fs.writeFile(outputPath, pdfBuffer);
  
  const step3Duration = Date.now() - step3Start;
  console.log(`[INFO] Word-to-PDF: Step 3 completed in ${step3Duration}ms`);
  console.log(`[INFO] PDF file created: ${outputPath}`);
  
  const totalDuration = step1Duration + step2Duration + step3Duration;
  console.log(`[INFO] Word-to-PDF conversion completed successfully in ${totalDuration}ms`);
  
  // Clean up intermediate files after successful conversion
  console.log(`[INFO] Cleaning up ${intermediateFiles.length} intermediate file(s)`);
  await cleanupTempFiles(intermediateFiles);
  
  return {
    success: true,
    outputPath,
    intermediateFiles: {
      htmlPath: intermediateFiles[0],
      styledHtmlPath: intermediateFiles[1]
    }
  };
}

/**
 * Enhances HTML structure using cheerio for better PDF rendering
 * - Detects headings based on font size patterns
 * - Identifies table structures and applies proper markup
 * - Detects text alignment from style attributes
 * - Applies CSS styling for better PDF rendering
 */
function enhanceHtmlStructure(html: string): string {
  const $ = cheerio.load(html);
  
  console.log('[INFO] Analyzing HTML structure for enhancement');
  
  // Detect and enhance headings based on font size
  $('p, span, div').each((_, element) => {
    const $el = $(element);
    const style = $el.attr('style') || '';
    
    // Extract font size from style attribute
    const fontSizeMatch = style.match(/font-size:\s*(\d+(?:\.\d+)?)(pt|px|em)/i);
    if (fontSizeMatch) {
      const fontSize = parseFloat(fontSizeMatch[1]);
      const unit = fontSizeMatch[2].toLowerCase();
      
      // Convert to points for consistent comparison
      let fontSizeInPt = fontSize;
      if (unit === 'px') {
        fontSizeInPt = fontSize * 0.75; // 1px ≈ 0.75pt
      } else if (unit === 'em') {
        fontSizeInPt = fontSize * 12; // Assuming base font size of 12pt
      }
      
      // Detect heading levels based on font size
      // H1: >= 20pt, H2: >= 16pt, H3: >= 14pt
      if (fontSizeInPt >= 20) {
        $el.replaceWith(`<h1 style="${style}">${$el.html()}</h1>`);
      } else if (fontSizeInPt >= 16) {
        $el.replaceWith(`<h2 style="${style}">${$el.html()}</h2>`);
      } else if (fontSizeInPt >= 14) {
        $el.replaceWith(`<h3 style="${style}">${$el.html()}</h3>`);
      }
    }
  });
  
  // Detect and enhance text alignment
  $('p, h1, h2, h3, h4, h5, h6, div').each((_, element) => {
    const $el = $(element);
    const style = $el.attr('style') || '';
    
    // Check for text-align in style
    if (!style.includes('text-align')) {
      // Check for alignment classes or attributes
      const className = $el.attr('class') || '';
      if (className.includes('center') || className.includes('Centre')) {
        $el.attr('style', `${style}; text-align: center;`);
      } else if (className.includes('right')) {
        $el.attr('style', `${style}; text-align: right;`);
      } else if (className.includes('justify')) {
        $el.attr('style', `${style}; text-align: justify;`);
      }
    }
  });
  
  // Enhance table structures
  $('table').each((_, element) => {
    const $table = $(element);
    
    // Add table styling for better PDF rendering
    const existingStyle = $table.attr('style') || '';
    $table.attr('style', `${existingStyle}; border-collapse: collapse; width: 100%;`);
    
    // Style table cells
    $table.find('td, th').each((_, cell) => {
      const $cell = $(cell);
      const cellStyle = $cell.attr('style') || '';
      $cell.attr('style', `${cellStyle}; border: 1px solid #ddd; padding: 8px;`);
    });
    
    // Style table headers
    $table.find('th').each((_, header) => {
      const $header = $(header);
      const headerStyle = $header.attr('style') || '';
      $header.attr('style', `${headerStyle}; background-color: #f2f2f2; font-weight: bold;`);
    });
  });
  
  // Wrap content in a styled HTML document for better PDF rendering
  const styledHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      margin: 40px;
      color: #333;
    }
    h1 {
      font-size: 20pt;
      font-weight: bold;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    h2 {
      font-size: 16pt;
      font-weight: bold;
      margin-top: 16px;
      margin-bottom: 8px;
    }
    h3 {
      font-size: 14pt;
      font-weight: bold;
      margin-top: 14px;
      margin-bottom: 7px;
    }
    p {
      margin-top: 0;
      margin-bottom: 10px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-top: 10px;
      margin-bottom: 10px;
    }
    td, th {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    strong, b {
      font-weight: bold;
    }
    em, i {
      font-style: italic;
    }
    u {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  ${$.html()}
</body>
</html>
  `.trim();
  
  console.log('[INFO] HTML structure enhancement completed');
  
  return styledHtml;
}

/**
 * Generates PDF from HTML using html-pdf-node
 */
async function generatePdf(html: string): Promise<Buffer> {
  const file = { content: html };
  
  const options = {
    format: 'A4',
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm'
    },
    printBackground: true,
    preferCSSPageSize: false
  };
  
  console.log('[INFO] Generating PDF with html-pdf-node');
  
  // html-pdf-node returns a Buffer
  const pdfBuffer = await htmlPdf.generatePdf(file, options);
  
  console.log(`[INFO] PDF generated successfully, size: ${pdfBuffer.length} bytes`);
  
  return pdfBuffer;
}
