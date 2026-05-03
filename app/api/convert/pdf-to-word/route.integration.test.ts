/**
 * Integration Test: Verify pdf-parse import fix works with actual module
 * 
 * This test verifies that the dynamic import fix properly resolves the pdf-parse
 * function from the actual module (not mocked), confirming the ESM/CJS compatibility
 * issue is resolved.
 */

import { describe, it, expect } from 'vitest';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

describe('PDF Parse Import Fix - Integration Test', () => {
  it('should successfully import and use pdf-parse with dynamic import', async () => {
    // This mimics the fix implemented in route.ts
    // pdf-parse v1 uses a simple function API
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = pdfParseModule.default || pdfParseModule;
    
    console.log('Detailed module inspection:');
    console.log(`  pdfParse type: ${typeof pdfParse}`);
    console.log(`  pdfParse constructor name: ${pdfParse?.constructor?.name}`);
    console.log(`  pdfParse.name: ${pdfParse?.name}`);
    
    // Verify pdfParse is a function
    expect(typeof pdfParse).toBe('function');
    
    // Create a test PDF buffer
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    page.drawText('Integration test content', {
      x: 50,
      y: 350,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);
    
    // Parse the PDF using the simple function API (matching route.ts implementation)
    const textResult = await pdfParse(buffer);
    
    // Verify parsing succeeded
    expect(textResult).toBeDefined();
    expect(textResult.text).toBeDefined();
    expect(typeof textResult.text).toBe('string');
    expect(textResult.text.length).toBeGreaterThan(0);
    
    console.log('✓ Dynamic import successfully resolved pdfParse function');
    console.log(`✓ Extracted text: "${textResult.text.trim()}"`);
  }, 30000);
  
  it('should verify the actual module structure matches our fix', async () => {
    // Import the module to inspect its structure
    // pdf-parse v1 exports a function as default
    const pdfParseModule = await import('pdf-parse');
    
    console.log('Module structure:');
    console.log(`  Type: ${typeof pdfParseModule}`);
    console.log(`  Has .default: ${pdfParseModule.default !== undefined}`);
    console.log(`  .default type: ${typeof pdfParseModule.default}`);
    
    // Verify our fix logic works correctly
    const pdfParse = pdfParseModule.default || pdfParseModule;
    
    expect(typeof pdfParse).toBe('function');
    expect(pdfParse).toBe(pdfParseModule.default);
    
    console.log('✓ Module structure matches expected pattern');
    console.log('✓ Fix logic correctly resolves to .default property');
  }, 10000);
});
