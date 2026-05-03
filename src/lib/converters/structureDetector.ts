/**
 * Structure Detection Utility for PDF-to-Word Conversion
 * 
 * This module analyzes extracted PDF text and detects document structure
 * including headings, paragraphs, text alignment, and tables.
 */

/**
 * Detected element type
 */
export type ElementType = 'heading' | 'paragraph' | 'table';

/**
 * Text alignment options
 */
export type TextAlignment = 'left' | 'center' | 'right' | 'justify';

/**
 * Formatting information for detected elements
 */
export interface ElementFormatting {
  bold?: boolean;
  italic?: boolean;
  fontSize?: number;
}

/**
 * Detected document element with type, content, alignment, and formatting
 */
export interface DetectedElement {
  type: ElementType;
  level?: number; // For headings (1-6)
  content: string;
  alignment?: TextAlignment;
  formatting?: ElementFormatting;
}

/**
 * Extracted text item from PDF with positioning and style information
 */
export interface ExtractedTextItem {
  text: string;
  x: number; // X coordinate (horizontal position)
  y: number; // Y coordinate (vertical position)
  width: number;
  height: number;
  fontSize?: number;
  fontName?: string;
  bold?: boolean;
  italic?: boolean;
}

/**
 * Parsed PDF data structure containing text items
 */
export interface ParsedPdfData {
  text: string; // Full text content
  items?: ExtractedTextItem[]; // Individual text items with positioning
  pages?: number; // Number of pages
}

/**
 * Detects document structure from extracted PDF text
 * 
 * Analyzes text patterns to identify:
 * - Headings based on font size differences (>= 2pt larger than body text)
 * - Paragraph boundaries based on line breaks and spacing
 * - Text alignment from positioning data (left, center, right, justify)
 * - Table structures from text alignment patterns
 * 
 * @param pdfData - Parsed PDF data with text and positioning information
 * @returns Array of detected elements with type, content, alignment, and formatting
 * 
 * @example
 * ```typescript
 * const pdfData = await extractPdfData('document.pdf');
 * const elements = detectStructure(pdfData);
 * 
 * elements.forEach(element => {
 *   if (element.type === 'heading') {
 *     console.log(`Heading ${element.level}: ${element.content}`);
 *   } else if (element.type === 'paragraph') {
 *     console.log(`Paragraph: ${element.content}`);
 *   }
 * });
 * ```
 */
export function detectStructure(pdfData: ParsedPdfData): DetectedElement[] {
  console.log('[INFO] Starting structure detection');
  
  const elements: DetectedElement[] = [];
  
  // If no items with positioning data, fall back to basic text parsing
  if (!pdfData.items || pdfData.items.length === 0) {
    console.log('[INFO] No positioning data available, using basic text parsing');
    return detectStructureFromPlainText(pdfData.text);
  }
  
  // Calculate body text font size (most common font size)
  const bodyFontSize = calculateBodyFontSize(pdfData.items);
  console.log(`[INFO] Detected body font size: ${bodyFontSize}pt`);
  
  // Group items into lines based on Y coordinate
  const lines = groupItemsIntoLines(pdfData.items);
  console.log(`[INFO] Grouped ${pdfData.items.length} items into ${lines.length} lines`);
  
  // Process each line to detect structure
  let currentParagraph: string[] = [];
  let currentParagraphAlignment: TextAlignment | undefined;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineText = line.map(item => item.text).join(' ').trim();
    
    if (lineText.length === 0) {
      // Empty line - end current paragraph if any
      if (currentParagraph.length > 0) {
        elements.push({
          type: 'paragraph',
          content: currentParagraph.join(' '),
          alignment: currentParagraphAlignment
        });
        currentParagraph = [];
        currentParagraphAlignment = undefined;
      }
      continue;
    }
    
    // Calculate line properties
    const lineFontSize = calculateLineFontSize(line);
    const lineAlignment = detectLineAlignment(line, pdfData.items);
    const isBold = line.some(item => item.bold);
    const isItalic = line.some(item => item.italic);
    
    // Check if this is a heading (font size >= 2pt larger than body text)
    const fontSizeDifference = lineFontSize - bodyFontSize;
    
    if (fontSizeDifference >= 2) {
      // This is a heading - end current paragraph first
      if (currentParagraph.length > 0) {
        elements.push({
          type: 'paragraph',
          content: currentParagraph.join(' '),
          alignment: currentParagraphAlignment
        });
        currentParagraph = [];
        currentParagraphAlignment = undefined;
      }
      
      // Determine heading level based on font size difference
      const headingLevel = determineHeadingLevel(fontSizeDifference);
      
      elements.push({
        type: 'heading',
        level: headingLevel,
        content: lineText,
        alignment: lineAlignment,
        formatting: {
          bold: isBold,
          italic: isItalic,
          fontSize: lineFontSize
        }
      });
      
      console.log(`[INFO] Detected heading level ${headingLevel}: "${lineText.substring(0, 50)}..."`);
    } else {
      // This is body text - check if it's part of current paragraph
      const nextLine = i < lines.length - 1 ? lines[i + 1] : null;
      const isEndOfParagraph = isLineEndOfParagraph(line, nextLine, pdfData.items);
      
      // Add to current paragraph
      currentParagraph.push(lineText);
      if (!currentParagraphAlignment) {
        currentParagraphAlignment = lineAlignment;
      }
      
      // If end of paragraph, create paragraph element
      if (isEndOfParagraph) {
        elements.push({
          type: 'paragraph',
          content: currentParagraph.join(' '),
          alignment: currentParagraphAlignment,
          formatting: {
            bold: isBold,
            italic: isItalic,
            fontSize: lineFontSize
          }
        });
        currentParagraph = [];
        currentParagraphAlignment = undefined;
      }
    }
  }
  
  // Add any remaining paragraph
  if (currentParagraph.length > 0) {
    elements.push({
      type: 'paragraph',
      content: currentParagraph.join(' '),
      alignment: currentParagraphAlignment
    });
  }
  
  // Detect table structures from alignment patterns
  const elementsWithTables = detectTableStructures(elements);
  
  console.log(`[INFO] Structure detection completed: ${elementsWithTables.length} elements detected`);
  console.log(`[INFO] - Headings: ${elementsWithTables.filter(e => e.type === 'heading').length}`);
  console.log(`[INFO] - Paragraphs: ${elementsWithTables.filter(e => e.type === 'paragraph').length}`);
  console.log(`[INFO] - Tables: ${elementsWithTables.filter(e => e.type === 'table').length}`);
  
  return elementsWithTables;
}

/**
 * Fallback structure detection from plain text without positioning data
 */
function detectStructureFromPlainText(text: string): DetectedElement[] {
  const elements: DetectedElement[] = [];
  const lines = text.split('\n');
  
  let currentParagraph: string[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.length === 0) {
      // Empty line - end current paragraph
      if (currentParagraph.length > 0) {
        elements.push({
          type: 'paragraph',
          content: currentParagraph.join(' ')
        });
        currentParagraph = [];
      }
      continue;
    }
    
    // Simple heuristic: short lines (< 50 chars) that are followed by empty line might be headings
    if (trimmedLine.length < 50 && trimmedLine.length > 0) {
      // Check if line looks like a heading (all caps, ends with colon, etc.)
      const looksLikeHeading = 
        trimmedLine === trimmedLine.toUpperCase() ||
        /^[A-Z][^.!?]*$/.test(trimmedLine) ||
        trimmedLine.endsWith(':');
      
      if (looksLikeHeading) {
        // End current paragraph
        if (currentParagraph.length > 0) {
          elements.push({
            type: 'paragraph',
            content: currentParagraph.join(' ')
          });
          currentParagraph = [];
        }
        
        // Add as heading
        elements.push({
          type: 'heading',
          level: 2, // Default to level 2
          content: trimmedLine
        });
        continue;
      }
    }
    
    // Add to current paragraph
    currentParagraph.push(trimmedLine);
  }
  
  // Add any remaining paragraph
  if (currentParagraph.length > 0) {
    elements.push({
      type: 'paragraph',
      content: currentParagraph.join(' ')
    });
  }
  
  return elements;
}

/**
 * Calculates the most common font size (body text font size)
 */
function calculateBodyFontSize(items: ExtractedTextItem[]): number {
  const fontSizes: { [size: number]: number } = {};
  
  // Count occurrences of each font size
  for (const item of items) {
    if (item.fontSize) {
      const size = Math.round(item.fontSize);
      fontSizes[size] = (fontSizes[size] || 0) + 1;
    }
  }
  
  // Find most common font size
  let maxCount = 0;
  let bodySize = 12; // Default to 12pt
  
  for (const [size, count] of Object.entries(fontSizes)) {
    if (count > maxCount) {
      maxCount = count;
      bodySize = parseInt(size);
    }
  }
  
  return bodySize;
}

/**
 * Groups text items into lines based on Y coordinate
 */
function groupItemsIntoLines(items: ExtractedTextItem[]): ExtractedTextItem[][] {
  if (items.length === 0) return [];
  
  // Sort items by Y coordinate (top to bottom) then X coordinate (left to right)
  const sortedItems = [...items].sort((a, b) => {
    const yDiff = a.y - b.y;
    if (Math.abs(yDiff) < 2) { // Items on same line (within 2 units)
      return a.x - b.x;
    }
    return yDiff;
  });
  
  const lines: ExtractedTextItem[][] = [];
  let currentLine: ExtractedTextItem[] = [sortedItems[0]];
  
  for (let i = 1; i < sortedItems.length; i++) {
    const item = sortedItems[i];
    const prevItem = sortedItems[i - 1];
    
    // Check if item is on the same line (Y coordinate within 2 units)
    if (Math.abs(item.y - prevItem.y) < 2) {
      currentLine.push(item);
    } else {
      // New line
      lines.push(currentLine);
      currentLine = [item];
    }
  }
  
  // Add last line
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  
  return lines;
}

/**
 * Calculates the average font size for a line
 */
function calculateLineFontSize(line: ExtractedTextItem[]): number {
  const fontSizes = line
    .map(item => item.fontSize)
    .filter((size): size is number => size !== undefined);
  
  if (fontSizes.length === 0) return 12; // Default
  
  const sum = fontSizes.reduce((acc, size) => acc + size, 0);
  return sum / fontSizes.length;
}

/**
 * Detects text alignment for a line based on positioning
 */
function detectLineAlignment(
  line: ExtractedTextItem[],
  allItems: ExtractedTextItem[]
): TextAlignment {
  if (line.length === 0) return 'left';
  
  // Calculate page width from all items
  const maxX = Math.max(...allItems.map(item => item.x + item.width));
  const minX = Math.min(...allItems.map(item => item.x));
  const pageWidth = maxX - minX;
  
  // Calculate line position
  const lineStartX = line[0].x;
  const lineEndX = line[line.length - 1].x + line[line.length - 1].width;
  const lineWidth = lineEndX - lineStartX;
  
  // Calculate margins
  const leftMargin = lineStartX - minX;
  const rightMargin = maxX - lineEndX;
  
  // Determine alignment based on margins
  const marginThreshold = pageWidth * 0.1; // 10% of page width
  
  // Center: both margins are roughly equal and significant
  if (Math.abs(leftMargin - rightMargin) < marginThreshold && leftMargin > marginThreshold) {
    return 'center';
  }
  
  // Right: right margin is small, left margin is large
  if (rightMargin < marginThreshold && leftMargin > marginThreshold) {
    return 'right';
  }
  
  // Justify: line width is close to page width (both margins small)
  if (leftMargin < marginThreshold && rightMargin < marginThreshold && lineWidth > pageWidth * 0.8) {
    return 'justify';
  }
  
  // Default to left alignment
  return 'left';
}

/**
 * Determines if a line is the end of a paragraph
 */
function isLineEndOfParagraph(
  line: ExtractedTextItem[],
  nextLine: ExtractedTextItem[] | null,
  allItems: ExtractedTextItem[]
): boolean {
  if (!nextLine) return true; // Last line is end of paragraph
  
  const lineText = line.map(item => item.text).join(' ').trim();
  
  // Check if line ends with sentence-ending punctuation
  if (/[.!?]$/.test(lineText)) {
    return true;
  }
  
  // Check vertical spacing between lines
  const lineY = line[0].y;
  const nextLineY = nextLine[0].y;
  const lineHeight = line[0].height || 12;
  const spacing = nextLineY - lineY;
  
  // If spacing is more than 1.5x line height, it's a paragraph break
  if (spacing > lineHeight * 1.5) {
    return true;
  }
  
  // Check if next line starts with capital letter (might be new paragraph)
  const nextLineText = nextLine.map(item => item.text).join(' ').trim();
  if (nextLineText.length > 0 && /^[A-Z]/.test(nextLineText)) {
    // Also check if current line doesn't end with comma or conjunction
    if (!/[,;:]$/.test(lineText) && !/\b(and|or|but|nor|yet|so)\s*$/.test(lineText)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Determines heading level based on font size difference from body text
 */
function determineHeadingLevel(fontSizeDifference: number): number {
  // H1: >= 8pt larger
  if (fontSizeDifference >= 8) return 1;
  
  // H2: >= 6pt larger
  if (fontSizeDifference >= 6) return 2;
  
  // H3: >= 4pt larger
  if (fontSizeDifference >= 4) return 3;
  
  // H4: >= 3pt larger
  if (fontSizeDifference >= 3) return 4;
  
  // H5: >= 2.5pt larger
  if (fontSizeDifference >= 2.5) return 5;
  
  // H6: >= 2pt larger
  return 6;
}

/**
 * Detects table structures from alignment patterns
 * 
 * Tables are identified by consecutive lines with similar alignment patterns
 * and consistent spacing between text items (columns).
 */
function detectTableStructures(elements: DetectedElement[]): DetectedElement[] {
  // For now, return elements as-is
  // Table detection from alignment patterns is complex and would require
  // analyzing multiple consecutive paragraphs with similar X-coordinate patterns
  // This is a placeholder for future enhancement
  
  console.log('[INFO] Table structure detection: Not implemented (placeholder)');
  
  return elements;
}
